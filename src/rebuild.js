import { features, prefersReducedMotion, watchMedia, now, requestFrame, cancelFrame } from "./compat.js";
import { createElement } from "./dom.js";
import { SWARM_COLORS, cursorShapeSVG, CURSOR_HOTSPOTS } from "./swarm.js";

const SVGNS = "http://www.w3.org/2000/svg";

export const REBUILD_DEFAULTS = {
  selector: "[data-ca-rebuild]",
  once: false,
  threshold: 0.12,
  duration: 640,
  agents: 2,
  color: "#0d99ff",
  colors: null,
  label: true,
  stagger: 90,
  maxConcurrent: 2,
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
    throw new TypeError("Rebuild option color must be a CSS colour string");
  }
  if (config.colors !== null && (!Array.isArray(config.colors) || config.colors.length === 0)) {
    throw new TypeError("Rebuild option colors must be a non-empty array");
  }
  config.duration = Math.max(120, Number(config.duration) || REBUILD_DEFAULTS.duration);
  config.stagger = Math.max(0, Number(config.stagger) || 0);
  config.agents = Math.min(3, Math.max(1, Math.round(Number(config.agents) || 1)));
  config.maxConcurrent = Math.max(1, Math.round(Number(config.maxConcurrent) || 1));
  return config;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

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
      const job = this.queue.shift();
      this.start(job.element);
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
    const build = {
      element,
      rect,
      start: Math.max(now(), this.lastStart + this.config.stagger),
      added: false,
      cursors: [],
      rectEl: null,
      label: null,
    };
    this.lastStart = build.start;
    const color = this.config.color;
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
    for (let index = 0; index < this.config.agents; index++) {
      build.cursors.push(this.makeCursor(rect, index));
    }
    if (this.config.label) {
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

  tick() {
    this.frame = 0;
    const t = now();
    let active = false;
    for (const [element, build] of this.builds) {
      if (build.added) continue;
      const progress = Math.min(1, Math.max(0, (t - build.start) / this.config.duration));
      const eased = easeInOut(progress);
      const rect = build.rect;
      const growX = rect.left + rect.width * eased;
      const growY = rect.top + rect.height * eased;
      build.rectEl.setAttribute("width", String(Math.max(0, growX - rect.left)));
      build.rectEl.setAttribute("height", String(Math.max(0, growY - rect.top)));
      build.rectEl.setAttribute("fill-opacity", String(0.06 * eased));
      const lead = build.cursors[0];
      if (lead) {
        lead.element.style.transform = `translate3d(${Math.round(growX)}px,${Math.round(growY)}px,0)`;
      }
      for (let index = 1; index < build.cursors.length; index++) {
        const cursor = build.cursors[index];
        const x = cursor.fromX + (cursor.toX - cursor.fromX) * eased;
        const y = cursor.fromY + (cursor.toY - cursor.fromY) * eased;
        cursor.element.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
      }
      if (build.label) build.label.style.opacity = String(eased);
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
      const p = Math.min(1, (now() - start) / 260);
      for (const cursor of build.cursors) {
        const x = cursor.toX + (cursor.outX - cursor.toX) * p;
        const y = cursor.toY + (cursor.outY - cursor.toY) * p;
        cursor.element.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
        cursor.element.style.opacity = String(1 - p);
      }
      build.rectEl.setAttribute("fill-opacity", String(0.06 * (1 - p)));
      build.rectEl.setAttribute("stroke-opacity", String(1 - p));
      if (build.label) build.label.style.opacity = String(1 - p);
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
