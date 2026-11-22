import { features, prefersReducedMotion, watchMedia, now, requestFrame, cancelFrame } from "./compat.js";
import { createElement } from "./dom.js";
import { SWARM_COLORS, cursorShapeSVG, CURSOR_HOTSPOTS } from "./swarm.js";

const SVGNS = "http://www.w3.org/2000/svg";
const MEDIA = "img,svg,video,canvas,picture,iframe";

export const REBUILD_DEFAULTS = {
  selector: "[data-ca-rebuild]",
  once: false,
  threshold: 0.12,
  duration: 520,
  agents: 2,
  color: "#0d99ff",
  autoDark: "#111111",
  autoLight: "#ffdc58",
  colors: null,
  label: true,
  labelMinArea: 7000,
  stagger: 90,
  maxConcurrent: 2,
  typeText: true,
  typeSelector: null,
  charDelay: 16,
  maxTypeDuration: 1600,
  pen: true,
  revealClass: "ca-built",
  rootMargin: "0px",
  respectReducedMotion: true,
};

function resolveOptions(options) {
  const input = options === undefined ? {} : options;
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Rebuild options must be an object");
  }
  for (const key of Object.keys(input)) {
    if (!(key in REBUILD_DEFAULTS)) throw new RangeError(`Unknown rebuild option "${key}"`);
  }
  const config = { ...REBUILD_DEFAULTS, ...input };
  if (typeof config.selector !== "string" || config.selector.length === 0) {
    throw new TypeError("Rebuild option selector must be a non-empty string");
  }
  if (typeof config.threshold !== "number" || config.threshold < 0 || config.threshold > 1) {
    throw new RangeError("Rebuild option threshold must be a number between 0 and 1");
  }
  if (typeof config.color !== "string" || config.color.length === 0) {
    throw new TypeError("Rebuild option color must be a CSS colour string or \"auto\"");
  }
  if (typeof config.autoDark !== "string" || typeof config.autoLight !== "string") {
    throw new TypeError("Rebuild options autoDark and autoLight must be CSS colour strings");
  }
  if (config.typeSelector !== null && (typeof config.typeSelector !== "string" || config.typeSelector.length === 0)) {
    throw new TypeError("Rebuild option typeSelector must be null or a non-empty string");
  }
  if (config.colors !== null && (!Array.isArray(config.colors) || config.colors.length === 0)) {
    throw new TypeError("Rebuild option colors must be a non-empty array");
  }
  config.labelMinArea = Math.max(0, Number(config.labelMinArea) || 0);
  config.duration = Math.max(120, Number(config.duration) || REBUILD_DEFAULTS.duration);
  config.stagger = Math.max(0, Number(config.stagger) || 0);
  config.charDelay = Math.max(4, Number(config.charDelay) || REBUILD_DEFAULTS.charDelay);
  config.maxTypeDuration = Math.max(200, Number(config.maxTypeDuration) || REBUILD_DEFAULTS.maxTypeDuration);
  config.agents = Math.min(3, Math.max(1, Math.round(Number(config.agents) || 1)));
  config.maxConcurrent = Math.max(1, Math.round(Number(config.maxConcurrent) || 1));
  return config;
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function parseColor(value) {
  const match = value && value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
}

function backgroundLuminance(element) {
  const view = element.ownerDocument && element.ownerDocument.defaultView;
  if (!view || typeof view.getComputedStyle !== "function") return 1;
  let node = element;
  while (node && node.nodeType === 1) {
    let value = null;
    try {
      value = view.getComputedStyle(node).backgroundColor;
    } catch (error) {
      value = null;
    }
    const parsed = parseColor(value);
    if (parsed && parsed.a > 0.1) {
      return (0.2126 * parsed.r + 0.7152 * parsed.g + 0.0722 * parsed.b) / 255;
    }
    node = node.parentElement;
  }
  return 1;
}

function collectText(root, selector, typeSelector, out, active) {
  for (let child = root.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 3) {
      if (active && child.nodeValue && child.nodeValue.trim()) out.push({ node: child, text: child.nodeValue });
    } else if (child.nodeType === 1) {
      const tag = child.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "noscript" || tag === "svg") continue;
      if (child.classList.contains("ca-typing-caret")) continue;
      if (child !== root && typeof child.matches === "function" && child.matches(selector)) continue;
      let next = active;
      if (typeSelector && typeof child.matches === "function" && child.matches(typeSelector)) next = true;
      collectText(child, selector, typeSelector, out, next);
    }
  }
  return out;
}

export class Rebuild {
  constructor(options) {
    this.config = resolveOptions(options);
    this.palette = this.config.colors ? this.config.colors.slice() : SWARM_COLORS.slice();
    this.items = new Set();
    this.builds = new Map();
    this.queue = [];
    this.lastStart = 0;
    this.observer = null;
    this.frame = 0;
    this.reduced = this.config.respectReducedMotion && prefersReducedMotion();
    this.releaseMedia = watchMedia("(prefers-reduced-motion: reduce)", () => {
      this.reduced = this.config.respectReducedMotion && prefersReducedMotion();
      if (this.reduced) for (const element of this.items) this.finish(element);
    });
    this.layer = createElement("div", "ca-rebuild-layer", document.body);
    this.svg = document.createElementNS(SVGNS, "svg");
    this.svg.setAttribute("class", "ca-rebuild-outline");
    this.layer.appendChild(this.svg);
    if (features.intersectionObserver()) {
      this.observer = new window.IntersectionObserver((entries) => this.handle(entries), {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold,
      });
    }
    this.scan();
    this.wake();
  }

  scan() {
    const found = document.querySelectorAll(this.config.selector);
    for (let index = 0; index < found.length; index++) {
      const element = found[index];
      if (this.items.has(element)) continue;
      this.items.add(element);
      if (!this.observer || this.reduced) this.finish(element);
      else this.observer.observe(element);
    }
    for (const element of [...this.items]) {
      if (element.isConnected) continue;
      if (this.observer) this.observer.unobserve(element);
      this.dequeue(element);
      this.abort(element);
      this.items.delete(element);
    }
  }

  handle(entries) {
    for (const entry of entries) {
      const element = entry.target;
      if (!this.items.has(element)) continue;
      if (this.reduced) {
        this.finish(element);
        continue;
      }
      if (entry.isIntersecting && entry.intersectionRatio >= this.config.threshold - 0.001) {
        this.begin(element);
      } else if (!entry.isIntersecting) {
        this.reset(element);
      }
    }
  }

  begin(element) {
    if (this.builds.has(element) || element.classList.contains(this.config.revealClass)) return;
    if (this.queue.some((job) => job.element === element)) return;
    this.queue.push({ element });
    this.pump();
  }

  pump() {
    while (this.queue.length > 0 && this.builds.size < this.config.maxConcurrent) {
      this.start(this.queue.shift().element);
    }
  }

  dequeue(element) {
    this.queue = this.queue.filter((job) => job.element !== element);
  }

  start(element) {
    const rect = element.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) {
      this.finish(element);
      return;
    }
    const color = this.config.color === "auto"
      ? backgroundLuminance(element) < 0.45
        ? this.config.autoLight
        : this.config.autoDark
      : this.config.color;
    const build = {
      element,
      rect,
      color,
      phase: "box",
      start: Math.max(now(), this.lastStart + this.config.stagger),
      phaseStart: 0,
      typeDuration: 0,
      charIndex: 0,
      textNodes: this.config.typeText
        ? collectText(element, this.config.selector, this.config.typeSelector, [], this.config.typeSelector === null)
        : [],
      media: this.collectMedia(element),
      caret: null,
      cursors: [],
      rectEl: null,
      label: null,
      penLine: null,
      penCursor: null,
      finished: false,
    };
    build.typeDuration = clamp(build.textNodes.reduce((sum, entry) => sum + entry.text.length, 0) * this.config.charDelay, 260, this.config.maxTypeDuration);
    this.lastStart = build.start;
    for (const entry of build.textNodes) entry.node.nodeValue = "";
    for (const media of build.media) media.classList.add("ca-build-media");
    const rectEl = document.createElementNS(SVGNS, "rect");
    rectEl.setAttribute("rx", "4");
    rectEl.style.fill = color;
    rectEl.style.stroke = color;
    rectEl.setAttribute("fill-opacity", "0");
    rectEl.setAttribute("x", String(rect.left));
    rectEl.setAttribute("y", String(rect.top));
    rectEl.setAttribute("width", "0");
    rectEl.setAttribute("height", "0");
    this.svg.appendChild(rectEl);
    build.rectEl = rectEl;
    for (let index = 0; index < this.config.agents; index++) build.cursors.push(this.makeCursor(rect, index));
    if (this.config.label && rect.width * rect.height >= this.config.labelMinArea) {
      const label = createElement("div", "ca-rebuild-label", this.layer);
      label.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
      label.style.background = color;
      label.style.opacity = "0";
      label.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
      label.style.top = `${Math.round(rect.top + rect.height + 8)}px`;
      build.label = label;
    }
    this.builds.set(element, build);
    this.wake();
  }

  collectMedia(element) {
    const list = element.querySelectorAll(MEDIA);
    const media = [];
    for (let index = 0; index < list.length; index++) {
      const item = list[index];
      if (typeof item.closest === "function" && item.closest(this.config.selector) !== element) continue;
      media.push(item);
    }
    return media;
  }

  makeCursor(rect, index) {
    const color = this.palette[(Math.random() * this.palette.length) | 0];
    const shape = index === 0 ? "cross" : index === 1 ? "arrow" : "pen";
    const element = createElement("div", "ca-rebuild-cursor", this.layer);
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("width", "28");
    svg.setAttribute("height", "28");
    svg.setAttribute("viewBox", "0 0 28 28");
    svg.innerHTML = cursorShapeSVG(shape, color);
    const [hx, hy] = CURSOR_HOTSPOTS[shape];
    svg.style.transform = `translate(${-hx}px,${-hy}px)`;
    element.appendChild(svg);
    const corner = index % 2 === 0 ? 1 : -1;
    return {
      element,
      fromX: corner > 0 ? rect.left - 60 : rect.right + 60,
      fromY: corner > 0 ? rect.top - 50 : rect.bottom + 50,
      toX: corner > 0 ? rect.right : rect.left,
      toY: corner > 0 ? rect.bottom : rect.top,
      outX: corner > 0 ? rect.right + 70 : rect.left - 70,
      outY: corner > 0 ? rect.bottom + 60 : rect.top - 60,
    };
  }

  ensureCaret(build) {
    if (build.caret) return;
    build.caret = createElement("span", "ca-typing-caret");
  }

  type(build, progress) {
    this.ensureCaret(build);
    const total = build.textNodes.reduce((sum, entry) => sum + entry.text.length, 0);
    build.charIndex = Math.min(total, Math.round(total * progress));
    let remaining = build.charIndex;
    let last = null;
    for (const entry of build.textNodes) {
      if (remaining <= 0) {
        entry.node.nodeValue = "";
        continue;
      }
      const take = Math.min(entry.text.length, remaining);
      entry.node.nodeValue = entry.text.slice(0, take);
      remaining -= take;
      if (take > 0) last = entry.node;
    }
    if (last && last.parentNode) last.parentNode.insertBefore(build.caret, last.nextSibling);
  }

  revealMedia(build) {
    for (const media of build.media) media.classList.remove("ca-build-media");
  }

  pen(build, progress) {
    if (!build.penTarget) {
      let best = null;
      let area = 0;
      for (const item of build.media) {
        const box = item.getBoundingClientRect();
        const next = box.width * box.height;
        if (box.width > 4 && box.height > 4 && next > area) {
          best = item;
          area = next;
        }
      }
      if (!best) return false;
      build.penTarget = best;
    }
    const target = build.penTarget;
    if (!build.penLine) {
      const box = target.getBoundingClientRect();
      const line = document.createElementNS(SVGNS, "line");
      line.style.stroke = build.color;
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("x1", String(box.left));
      line.setAttribute("y1", String(box.top));
      line.setAttribute("x2", String(box.right));
      line.setAttribute("y2", String(box.bottom));
      const length = Math.hypot(box.width, box.height);
      line.setAttribute("stroke-dasharray", String(length));
      line.setAttribute("stroke-dashoffset", String(length));
      this.svg.appendChild(line);
      build.penLine = line;
      const color = this.palette[(Math.random() * this.palette.length) | 0];
      const cursor = createElement("div", "ca-rebuild-cursor", this.layer);
      const svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("width", "28");
      svg.setAttribute("height", "28");
      svg.setAttribute("viewBox", "0 0 28 28");
      svg.innerHTML = cursorShapeSVG("pen", color);
      svg.style.transform = `translate(${-CURSOR_HOTSPOTS.pen[0]}px,${-CURSOR_HOTSPOTS.pen[1]}px)`;
      cursor.appendChild(svg);
      build.penCursor = cursor;
      build.penBox = box;
      build.penLength = length;
    }
    const x = build.penBox.left + (build.penBox.right - build.penBox.left) * progress;
    const y = build.penBox.top + (build.penBox.bottom - build.penBox.top) * progress;
    build.penCursor.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
    build.penLine.setAttribute("stroke-dashoffset", String(build.penLength * (1 - progress)));
    return true;
  }

  tick() {
    this.frame = 0;
    const t = now();
    let active = false;
    for (const [element, build] of this.builds) {
      if (build.finished) continue;
      if (build.phase === "box") {
        const progress = clamp((t - build.start) / this.config.duration, 0, 1);
        const eased = easeInOut(progress);
        const rect = build.rect;
        const growX = rect.left + rect.width * eased;
        const growY = rect.top + rect.height * eased;
        build.rectEl.setAttribute("width", String(Math.max(0, growX - rect.left)));
        build.rectEl.setAttribute("height", String(Math.max(0, growY - rect.top)));
        build.rectEl.setAttribute("fill-opacity", String(0.06 * eased));
        const lead = build.cursors[0];
        if (lead) lead.element.style.transform = `translate3d(${Math.round(growX)}px,${Math.round(growY)}px,0)`;
        for (let index = 1; index < build.cursors.length; index++) {
          const cursor = build.cursors[index];
          const x = cursor.fromX + (cursor.toX - cursor.fromX) * eased;
          const y = cursor.fromY + (cursor.toY - cursor.fromY) * eased;
          cursor.element.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
        }
        if (build.label) build.label.style.opacity = String(eased);
        if (progress >= 1) {
          element.classList.add(this.config.revealClass);
          if (build.textNodes.length > 0) {
            build.phase = "type";
            build.phaseStart = t;
          } else {
            build.phase = this.config.pen && build.media.length > 0 ? "pen" : "exit";
            build.phaseStart = t;
          }
        }
        active = true;
      } else if (build.phase === "type") {
        const progress = clamp((t - build.phaseStart) / build.typeDuration, 0, 1);
        this.type(build, progress);
        if (progress >= 1) {
          if (build.caret) {
            build.caret.remove();
            build.caret = null;
          }
          build.phase = this.config.pen && build.media.length > 0 ? "pen" : "exit";
          build.phaseStart = t;
        }
        active = true;
      } else if (build.phase === "pen") {
        const progress = clamp((t - build.phaseStart) / 320, 0, 1);
        const drew = this.pen(build, progress);
        if (!drew) {
          this.revealMedia(build);
          build.phase = "exit";
          build.phaseStart = t;
        } else if (progress >= 1) {
          this.revealMedia(build);
          if (build.penCursor) build.penCursor.style.opacity = "0";
          build.phase = "exit";
          build.phaseStart = t;
        }
        active = true;
      } else if (build.phase === "exit") {
        const progress = clamp((t - build.phaseStart) / 260, 0, 1);
        for (const cursor of build.cursors) {
          const x = cursor.toX + (cursor.outX - cursor.toX) * progress;
          const y = cursor.toY + (cursor.outY - cursor.toY) * progress;
          cursor.element.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
          cursor.element.style.opacity = String(1 - progress);
        }
        build.rectEl.setAttribute("fill-opacity", String(0.06 * (1 - progress)));
        build.rectEl.setAttribute("stroke-opacity", String(1 - progress));
        if (build.penLine) build.penLine.setAttribute("stroke-opacity", String(1 - progress));
        if (build.label) build.label.style.opacity = String(1 - progress);
        if (progress >= 1) {
          build.finished = true;
          this.clearBuild(build);
        }
        active = true;
      }
    }
    if (active) this.wake();
  }

  clearBuild(build) {
    for (const cursor of build.cursors) cursor.element.remove();
    if (build.caret) build.caret.remove();
    if (build.label) build.label.remove();
    if (build.rectEl) build.rectEl.remove();
    if (build.penLine) build.penLine.remove();
    if (build.penCursor) build.penCursor.remove();
    for (const entry of build.textNodes) entry.node.nodeValue = entry.text;
    this.revealMedia(build);
    this.builds.delete(build.element);
    this.pump();
  }

  abort(element) {
    const build = this.builds.get(element);
    if (build) this.clearBuild(build);
  }

  finish(element) {
    this.dequeue(element);
    this.abort(element);
    element.classList.add(this.config.revealClass);
  }

  reset(element) {
    this.dequeue(element);
    this.abort(element);
    if (this.config.once) return;
    element.classList.remove(this.config.revealClass);
  }

  wake() {
    if (!this.frame) this.frame = requestFrame(() => this.tick());
  }

  refresh() {
    this.scan();
    this.wake();
  }

  destroy() {
    if (this.observer) this.observer.disconnect();
    this.observer = null;
    if (this.releaseMedia) this.releaseMedia();
    this.releaseMedia = null;
    if (this.frame) cancelFrame(this.frame);
    this.frame = 0;
    for (const build of [...this.builds.values()]) this.clearBuild(build);
    for (const element of this.items) element.classList.remove(this.config.revealClass);
    this.items.clear();
    this.queue = [];
    this.layer.remove();
  }
}
