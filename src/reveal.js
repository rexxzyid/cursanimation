import { REVEAL_ANIMATIONS } from "./config.js";
import { features, prefersReducedMotion, watchMedia } from "./compat.js";

export const REVEAL_DEFAULTS = {
  selector: "[data-ca-reveal]",
  once: false,
  threshold: 0.12,
  animation: "fade-up",
  duration: 700,
  delay: 0,
  stagger: 70,
  distance: 28,
  rootMargin: "0px",
  root: null,
  respectReducedMotion: true,
};

function resolveOptions(options) {
  const input = options === undefined ? {} : options;
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Reveal options must be an object");
  }
  for (const key of Object.keys(input)) {
    if (!(key in REVEAL_DEFAULTS)) throw new RangeError(`Unknown reveal option "${key}"`);
  }
  const config = { ...REVEAL_DEFAULTS, ...input };
  if (!REVEAL_ANIMATIONS.includes(config.animation)) {
    throw new RangeError(
      `Invalid reveal animation "${config.animation}". Expected one of: ${REVEAL_ANIMATIONS.join(", ")}`
    );
  }
  if (typeof config.selector !== "string" || config.selector.length === 0) {
    throw new TypeError("Reveal option selector must be a non-empty string");
  }
  const thresholds = Array.isArray(config.threshold) ? config.threshold : [config.threshold];
  if (thresholds.length === 0 || thresholds.some((value) => typeof value !== "number" || value < 0 || value > 1)) {
    throw new RangeError("Reveal option threshold must be a number between 0 and 1");
  }
  config.thresholds = thresholds;
  return config;
}

function numberAttribute(element, name) {
  const raw = element.getAttribute(name);
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export class Reveal {
  constructor(options) {
    this.config = resolveOptions(options);
    this.items = new Set();
    this.observer = null;
    this.reduced = this.config.respectReducedMotion && prefersReducedMotion();
    this.releaseMedia = watchMedia("(prefers-reduced-motion: reduce)", () => {
      this.reduced = this.config.respectReducedMotion && prefersReducedMotion();
      if (this.reduced) for (const element of this.items) element.classList.add("ca-in");
    });
    this.minimum = Math.min(...this.config.thresholds);
    if (features.intersectionObserver()) {
      this.observer = new window.IntersectionObserver((entries) => this.handle(entries), {
        root: this.config.root,
        rootMargin: this.config.rootMargin,
        threshold: this.config.thresholds.length === 1 ? this.config.thresholds[0] : this.config.thresholds,
      });
    }
    this.scan();
  }

  animationFor(element) {
    const requested = element.getAttribute("data-ca-reveal");
    return REVEAL_ANIMATIONS.includes(requested) ? requested : this.config.animation;
  }

  delayFor(element) {
    const own = numberAttribute(element, "data-ca-delay");
    if (own !== null) return own;
    const parent = element.parentElement;
    if (parent && parent.hasAttribute("data-ca-stagger")) {
      const step = numberAttribute(parent, "data-ca-stagger");
      const siblings = Array.prototype.filter.call(parent.children, (child) =>
        child.matches(this.config.selector)
      );
      return this.config.delay + siblings.indexOf(element) * (step === null ? this.config.stagger : step);
    }
    return this.config.delay;
  }

  prepare(element) {
    const config = this.config;
    element.classList.add("ca-reveal");
    element.setAttribute("data-ca-anim", this.animationFor(element));
    const duration = numberAttribute(element, "data-ca-duration");
    element.style.setProperty("--ca-reveal-duration", `${duration === null ? config.duration : duration}ms`);
    element.style.setProperty("--ca-reveal-distance", `${config.distance}px`);
    element.style.setProperty("--ca-delay", `${this.delayFor(element)}ms`);
  }

  scan() {
    const found = document.querySelectorAll(this.config.selector);
    const current = new Set();
    for (let index = 0; index < found.length; index++) {
      const element = found[index];
      current.add(element);
      const known = this.items.has(element);
      this.prepare(element);
      if (known) continue;
      this.items.add(element);
      if (!this.observer || this.reduced) element.classList.add("ca-in");
      else this.observer.observe(element);
    }
    for (const element of [...this.items]) {
      if (current.has(element) && element.isConnected) continue;
      if (this.observer) this.observer.unobserve(element);
      this.release(element);
      this.items.delete(element);
    }
  }

  isVisible(entry) {
    if (!entry.isIntersecting) return false;
    return this.minimum === 0 || entry.intersectionRatio >= this.minimum - 0.001;
  }

  handle(entries) {
    for (const entry of entries) {
      const element = entry.target;
      if (!this.items.has(element)) continue;
      const visible = this.reduced || this.isVisible(entry);
      if (visible) {
        element.style.setProperty("--ca-delay", `${this.delayFor(element)}ms`);
        element.classList.add("ca-in");
        if (this.config.once && this.observer) this.observer.unobserve(element);
      } else if (!this.config.once) {
        element.style.setProperty("--ca-delay", "0ms");
        element.classList.remove("ca-in");
      }
    }
  }

  release(element) {
    element.classList.remove("ca-reveal", "ca-in");
    element.removeAttribute("data-ca-anim");
    element.style.removeProperty("--ca-reveal-duration");
    element.style.removeProperty("--ca-reveal-distance");
    element.style.removeProperty("--ca-delay");
  }

  refresh() {
    this.scan();
  }

  destroy() {
    if (this.observer) this.observer.disconnect();
    this.observer = null;
    if (this.releaseMedia) this.releaseMedia();
    this.releaseMedia = null;
    for (const element of this.items) this.release(element);
    this.items.clear();
  }
}
