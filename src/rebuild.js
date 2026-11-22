import { features, prefersReducedMotion, watchMedia, now, requestFrame, cancelFrame } from "./compat.js";
import { createElement } from "./dom.js";
import { SWARM_COLORS, cursorShapeSVG, CURSOR_HOTSPOTS } from "./swarm.js";

const SVGNS = "http://www.w3.org/2000/svg";
const SHAPES = ["arrow", "cross", "pen", "ibeam"];

export const REBUILD_DEFAULTS = {
  selector: "[data-ca-rebuild]",
  once: false,
  threshold: 0.1,
  duration: 700,
  agents: 2,
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
  config.duration = Math.max(120, Number(config.duration) || REBUILD_DEFAULTS.duration);
  config.agents = Math.min(4, Math.max(1, Math.round(Number(config.agents) || 1)));
  return config;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export class Rebuild {
  constructor(options) {
    this.config = resolveOptions(options);
    this.items = new Set();
    this.builds = new Map();
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
    const rect = element.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) {
      this.finish(element);
      return;
    }
    const build = {
      element,
      rect,
      start: 0,
      added: false,
      cursors: [],
      rectEl: null,
      label: null,
    };
    const ns = SVGNS;
    const rectEl = document.createElementNS(ns, "rect");
    rectEl.setAttribute("rx", "4");
    rectEl.setAttribute("stroke-dasharray", "0");
    rectEl.setAttribute("stroke-dashoffset", "0");
    this.svg.appendChild(rectEl);
    build.rectEl = rectEl;
    const count = this.config.agents;
    for (let index = 0; index < count; index++) {
      build.cursors.push(this.makeCursor(rect, index, count));
    }
    if (this.config.agents > 0) {
      const label = createElement("div", "ca-rebuild-label", this.layer);
      label.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
      build.label = label;
    }
    build.start = now();
    this.builds.set(element, build);
    this.wake();
  }

  makeCursor(rect, index, count) {
    const color = SWARM_COLORS[(Math.random() * SWARM_COLORS.length) | 0];
    const shape = index === 0 ? "cross" : SHAPES[(Math.random() * SHAPES.length) | 0];
    const element = createElement("div", "ca-rebuild-cursor", this.layer);
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("width", "28");
    svg.setAttribute("height", "28");
    svg.setAttribute("viewBox", "0 0 28 28");
    svg.innerHTML = cursorShapeSVG(shape, color);
    const [hx, hy] = CURSOR_HOTSPOTS[shape];
    svg.style.transform = `translate(${-hx}px,${-hy}px)`;
    element.appendChild(svg);
    const side = index % 2 === 0 ? -1 : 1;
    const spread = count > 1 ? index / (count - 1) : 0;
    return {
      element,
      fromX: side < 0 ? rect.left - 120 - index * 30 : rect.right + 120 + index * 30,
      fromY: rect.top - 80 + spread * (rect.height + 160),
      toX: side < 0 ? rect.left : rect.right,
      toY: side < 0 ? rect.top : rect.bottom,
      outX: side < 0 ? rect.left - 160 - index * 20 : rect.right + 160 + index * 20,
      outY: side < 0 ? rect.top - 120 : rect.bottom + 120,
    };
  }

  tick() {
    this.frame = 0;
    const t = now();
    let active = false;
    for (const [element, build] of this.builds) {
      if (build.added) continue;
      const progress = Math.min(1, (t - build.start) / this.config.duration);
      const eased = easeOut(progress);
      for (const cursor of build.cursors) {
        const x = cursor.fromX + (cursor.toX - cursor.fromX) * eased;
        const y = cursor.fromY + (cursor.toY - cursor.fromY) * eased;
        cursor.element.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
      }
      const rect = build.rect;
      const width = rect.width * eased;
      const height = rect.height * eased;
      build.rectEl.setAttribute("x", String(rect.left));
      build.rectEl.setAttribute("y", String(rect.top));
      build.rectEl.setAttribute("width", String(width));
      build.rectEl.setAttribute("height", String(height));
      const perimeter = 2 * (rect.width + rect.height);
      build.rectEl.setAttribute("stroke-dasharray", String(perimeter));
      build.rectEl.setAttribute("stroke-dashoffset", String(perimeter * (1 - eased)));
      if (build.label) {
        build.label.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
        build.label.style.top = `${Math.round(rect.top + rect.height + 8)}px`;
        build.label.style.opacity = String(eased);
      }
      if (progress >= 1 && !build.added) {
        build.added = true;
        element.classList.add(this.config.revealClass);
        this.scheduleExit(build);
      }
      active = true;
    }
    if (active) this.wake();
  }

  scheduleExit(build) {
    const start = now();
    const step = () => {
      if (!this.builds.has(build.element)) return;
      const p = Math.min(1, (now() - start) / 320);
      for (const cursor of build.cursors) {
        const x = cursor.toX + (cursor.outX - cursor.toX) * p;
        const y = cursor.toY + (cursor.outY - cursor.toY) * p;
        cursor.element.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
        cursor.element.style.opacity = String(1 - p);
      }
      if (build.label) build.label.style.opacity = String(1 - p);
      build.rectEl.style.opacity = String(1 - p);
      if (p < 1) requestFrame(step);
      else this.clearBuild(build);
    };
    requestFrame(step);
  }

  clearBuild(build) {
    for (const cursor of build.cursors) cursor.element.remove();
    if (build.label) build.label.remove();
    if (build.rectEl) build.rectEl.remove();
    this.builds.delete(build.element);
  }

  abort(element) {
    const build = this.builds.get(element);
    if (build) this.clearBuild(build);
  }

  finish(element) {
    this.abort(element);
    element.classList.add(this.config.revealClass);
  }

  reset(element) {
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
    this.layer.remove();
  }
}
