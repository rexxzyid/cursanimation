import { DEFAULTS, mergeOptions, cloneConfig, effectiveConfig } from "./config.js";
import { hasDOM, now, prefersReducedMotion, watchMedia } from "./compat.js";
import { createLoop } from "./loop.js";
import { createElement, closestMatch } from "./dom.js";
import { bindInput } from "./input.js";
import { Cursor } from "./cursor.js";
import { Trail } from "./trail.js";
import { Particles } from "./particles.js";

const NATIVE_CLASS = "ca-hide-native";
const MOVING_WINDOW_MS = 140;
const DRAG_THRESHOLD = 4;
const RECT_INTERVAL_MS = 150;
const RECT_LIMIT = 400;

export class Engine {
  constructor() {
    this.config = null;
    this.effective = null;
    this.started = false;
    this.enabled = false;
    this.root = null;
    this.parts = null;
    this.loop = createLoop((dt) => this.tick(dt));
    this.releaseInput = null;
    this.releaseMedia = null;
    this.releaseListeners = [];
    this.pendingBuild = null;
    this.reducedMotion = false;
    this.rects = [];
    this.rectsDirty = true;
    this.rectsBuiltAt = 0;
    this.resetPointer();
  }

  resetPointer() {
    this.pointer = {
      x: 0,
      y: 0,
      has: false,
      mouseSeen: false,
      down: false,
      dragging: false,
      startX: 0,
      startY: 0,
      lastMove: -Infinity,
    };
    this.hoverTarget = null;
    this.hoverKind = "idle";
    this.pullX = 0;
    this.pullY = 0;
  }

  start(options) {
    this.destroy();
    this.config = mergeOptions(DEFAULTS, options);
    this.started = true;
    if (document.body) this.build();
    else {
      this.pendingBuild = () => {
        this.pendingBuild = null;
        document.removeEventListener("DOMContentLoaded", wait);
        this.build();
      };
      const wait = () => this.pendingBuild && this.pendingBuild();
      document.addEventListener("DOMContentLoaded", wait);
      this.releaseListeners.push(() => document.removeEventListener("DOMContentLoaded", wait));
    }
  }

  build() {
    if (!this.started || this.root) return;
    const root = createElement("div", "ca-root", document.body);
    root.setAttribute("aria-hidden", "true");
    root.setAttribute("data-ca-visible", "false");
    root.setAttribute("data-ca-state", "idle");
    this.root = root;
    this.parts = {
      trail: new Trail(root),
      fx: new Particles(root),
      cursor: new Cursor(root),
    };
    this.releaseMedia = watchMedia("(prefers-reduced-motion: reduce)", () => this.apply());
    this.apply();
    this.enable();
  }

  apply() {
    if (!this.root) return;
    this.reducedMotion = prefersReducedMotion();
    const eff = effectiveConfig(this.config, this.reducedMotion);
    this.effective = eff;
    const root = this.root;
    root.setAttribute("data-ca-style", eff.cursor);
    root.setAttribute("data-ca-trail", eff.trail.style);
    root.setAttribute("data-ca-glow", String(eff.glow));
    root.setAttribute("data-ca-neon", String(eff.neon));
    root.classList.toggle("ca-reduced", this.reducedMotion && this.config.respectReducedMotion);
    root.style.zIndex = String(eff.zIndex);
    root.style.setProperty("--ca-color", eff.color);
    root.style.setProperty("--ca-color2", eff.color2);
    root.style.setProperty("--ca-size", `${eff.size}px`);
    root.style.setProperty("--ca-hover-scale", String(eff.hoverScale));
    root.style.setProperty("--ca-trail-size", `${Math.max(3, eff.size * eff.trail.size * 0.5)}px`);
    root.style.setProperty("--ca-particle-size", `${eff.particles.size}px`);
    root.style.setProperty("--ca-ripple-size", `${Math.round(eff.size * 1.8)}px`);
    this.parts.cursor.configure(eff);
    this.parts.trail.configure(eff);
    this.parts.fx.configure(eff);
    this.rectsDirty = true;
    this.syncNative();
    this.syncState();
    if (this.enabled) this.loop.wake();
  }

  syncNative() {
    const hide =
      this.enabled && this.config.hideNativeCursor && this.pointer.mouseSeen && this.pointer.has;
    document.documentElement.classList.toggle(NATIVE_CLASS, hide);
  }

  enable() {
    if (!this.root || this.enabled) return;
    this.enabled = true;
    this.releaseInput = bindInput({
      move: (event) => this.onMove(event),
      down: (event) => this.onDown(event),
      up: (event) => this.onUp(event),
      leave: () => this.onLeave(),
    });
    const dirty = () => {
      this.rectsDirty = true;
    };
    const visibility = () => {
      if (document.hidden) this.loop.stop();
      else this.loop.wake();
    };
    window.addEventListener("resize", dirty, { passive: true });
    document.addEventListener("scroll", dirty, { passive: true, capture: true });
    document.addEventListener("visibilitychange", visibility);
    this.releaseEnabled = () => {
      window.removeEventListener("resize", dirty, { passive: true });
      document.removeEventListener("scroll", dirty, { passive: true, capture: true });
      document.removeEventListener("visibilitychange", visibility);
    };
    this.syncNative();
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    if (this.releaseInput) this.releaseInput();
    if (this.releaseEnabled) this.releaseEnabled();
    this.releaseInput = null;
    this.releaseEnabled = null;
    this.loop.stop();
    this.parts.fx.clear();
    this.parts.trail.setVisible(false);
    this.root.setAttribute("data-ca-visible", "false");
    this.root.removeAttribute("data-ca-pressed");
    this.pointer.has = false;
    this.pointer.down = false;
    this.pointer.dragging = false;
    this.pointer.mouseSeen = false;
    this.hoverTarget = null;
    this.hoverKind = "idle";
    this.syncState();
    this.syncNative();
  }

  setOptions(options) {
    this.config = mergeOptions(this.config, options);
    this.hoverTarget = null;
    this.apply();
  }

  getOptions() {
    return cloneConfig(this.config);
  }

  destroy() {
    this.started = false;
    this.disable();
    for (const release of this.releaseListeners) release();
    this.releaseListeners = [];
    this.pendingBuild = null;
    if (this.releaseMedia) this.releaseMedia();
    this.releaseMedia = null;
    this.loop.stop();
    if (this.parts) {
      this.parts.cursor.destroy();
      this.parts.trail.destroy();
      this.parts.fx.destroy();
      this.parts = null;
    }
    if (this.root) this.root.remove();
    this.root = null;
    if (hasDOM()) document.documentElement.classList.remove(NATIVE_CLASS);
    this.config = null;
    this.effective = null;
    this.rects = [];
    this.rectsDirty = true;
    this.resetPointer();
  }

  wake() {
    this.loop.wake();
  }

  onMove(event) {
    if (event.type === "touch") {
      this.hideForTouch();
      return;
    }
    const pointer = this.pointer;
    pointer.x = event.x;
    pointer.y = event.y;
    pointer.lastMove = now();
    pointer.mouseSeen = true;
    if (!pointer.has) {
      pointer.has = true;
      this.parts.cursor.snap(event.x, event.y);
      this.parts.trail.snap(event.x, event.y);
      this.root.setAttribute("data-ca-visible", "true");
      this.syncNative();
    }
    if (pointer.down && !pointer.dragging && this.effective.dragEffects) {
      if (Math.hypot(event.x - pointer.startX, event.y - pointer.startY) > DRAG_THRESHOLD) {
        pointer.dragging = true;
        this.syncState();
      }
    }
    if (event.target !== this.hoverTarget) {
      this.hoverTarget = event.target;
      this.hoverKind = this.classify(event.target);
      this.syncState();
    }
    this.wake();
  }

  onDown(event) {
    const touch = event.type === "touch";
    if (touch) {
      if (this.config.touch === "tap") this.tapEffects(event.x, event.y);
      this.hideForTouch();
      return;
    }
    if (event.button !== undefined && event.button > 0) return;
    const pointer = this.pointer;
    pointer.down = true;
    pointer.dragging = false;
    pointer.startX = event.x;
    pointer.startY = event.y;
    this.root.setAttribute("data-ca-pressed", "true");
    this.clickEffects(event.x, event.y);
    this.syncState();
    this.wake();
  }

  onUp() {
    const pointer = this.pointer;
    if (!pointer.down && !pointer.dragging) return;
    pointer.down = false;
    pointer.dragging = false;
    this.root.removeAttribute("data-ca-pressed");
    this.syncState();
    this.wake();
  }

  onLeave() {
    const pointer = this.pointer;
    pointer.has = false;
    pointer.down = false;
    pointer.dragging = false;
    this.hoverTarget = null;
    this.hoverKind = "idle";
    this.root.setAttribute("data-ca-visible", "false");
    this.root.removeAttribute("data-ca-pressed");
    this.syncState();
    this.syncNative();
  }

  hideForTouch() {
    this.pointer.has = false;
    this.pointer.mouseSeen = false;
    this.root.setAttribute("data-ca-visible", "false");
    this.syncNative();
  }

  tapEffects(x, y) {
    const effects = this.effective.clickEffects;
    if (!effects.enabled) return;
    if (effects.ripple) this.parts.fx.ripple(x, y);
    if (effects.particles) this.parts.fx.burst(x, y, effects.count);
    this.wake();
  }

  clickEffects(x, y) {
    const effects = this.effective.clickEffects;
    if (!effects.enabled) return;
    if (effects.ripple) this.parts.fx.ripple(x, y);
    if (effects.particles) this.parts.fx.burst(x, y, effects.count);
  }

  classify(target) {
    const selectors = this.config.selectors;
    if (!target || typeof target.closest !== "function") return "idle";
    if (closestMatch(target, selectors.ignore)) return "idle";
    const forced = closestMatch(target, "[data-ca-hover]");
    if (forced) {
      const value = forced.getAttribute("data-ca-hover");
      return ["link", "button", "text"].includes(value) ? value : "idle";
    }
    if (closestMatch(target, selectors.button)) return "button";
    if (closestMatch(target, selectors.link)) return "link";
    if (closestMatch(target, selectors.text)) return "text";
    return "idle";
  }

  syncState() {
    if (!this.root) return;
    const eff = this.effective || this.config;
    let state = "idle";
    if (this.pointer.dragging && eff.dragEffects) state = "drag";
    else if (eff.hoverEffects) state = this.hoverKind;
    if (this.root.getAttribute("data-ca-state") !== state) this.root.setAttribute("data-ca-state", state);
  }

  collectRects() {
    const magnetic = this.config.selectors;
    const selector = `${magnetic.link}, ${magnetic.button}, [data-ca-magnetic]`;
    const list = document.querySelectorAll(selector);
    const width = window.innerWidth || document.documentElement.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight;
    const rects = [];
    for (let index = 0; index < list.length && rects.length < RECT_LIMIT; index++) {
      const element = list[index];
      if (closestMatch(element, magnetic.ignore)) continue;
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      if (box.bottom < 0 || box.right < 0 || box.top > height || box.left > width) continue;
      rects.push({
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        cx: box.left + box.width / 2,
        cy: box.top + box.height / 2,
      });
    }
    this.rects = rects;
    this.rectsDirty = false;
    this.rectsBuiltAt = now();
  }

  pull(x, y) {
    const settings = this.effective.magnetic;
    this.pullX = x;
    this.pullY = y;
    if (this.rectsDirty && now() - this.rectsBuiltAt > RECT_INTERVAL_MS) this.collectRects();
    let nearest = null;
    let best = settings.radius;
    for (const rect of this.rects) {
      const dx = Math.max(rect.left - x, 0, x - rect.right);
      const dy = Math.max(rect.top - y, 0, y - rect.bottom);
      const distance = Math.hypot(dx, dy);
      if (distance < best) {
        best = distance;
        nearest = rect;
      }
    }
    if (nearest) {
      const strength = settings.strength * (1 - best / settings.radius);
      this.pullX = x + (nearest.cx - x) * strength;
      this.pullY = y + (nearest.cy - y) * strength;
    }
  }

  refresh() {
    if (!this.root) return;
    this.hoverTarget = null;
    this.rectsDirty = true;
    this.rectsBuiltAt = 0;
    this.wake();
  }

  tick(dt) {
    if (!this.parts || !this.enabled) return false;
    const eff = this.effective;
    const pointer = this.pointer;
    const frames = dt / 16.667;
    const moving = now() - pointer.lastMove < MOVING_WINDOW_MS;
    this.pullX = pointer.x;
    this.pullY = pointer.y;
    if (eff.magnetic.enabled && pointer.has) this.pull(pointer.x, pointer.y);
    const cursor = this.parts.cursor;
    let active = false;
    if (pointer.has) {
      active = cursor.update(pointer.x, pointer.y, this.pullX, this.pullY, frames, eff);
    }
    const trailActive = this.parts.trail.update(cursor.sourceX, cursor.sourceY, moving && pointer.has, frames);
    if (eff.particles.enabled && moving && pointer.has) {
      this.parts.fx.trail(cursor.sourceX, cursor.sourceY, cursor.travelled);
    }
    const fxActive = this.parts.fx.update(dt);
    return active || trailActive || fxActive || moving;
  }
}
