/*! CursAnimation v1.5.3 | MIT | RexxHayanasi | https://cursanimation.rexxhayanasi.cv */
var CursAnimationBundle = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default,
    destroy: () => destroy,
    disable: () => disable,
    enable: () => enable,
    getOptions: () => getOptions,
    init: () => init,
    rebuild: () => rebuild,
    refresh: () => refresh,
    reveal: () => reveal,
    setCursor: () => setCursor,
    setOptions: () => setOptions,
    version: () => version
  });

  // src/config.js
  var CURSOR_TYPES = ["default", "circle", "dot", "ring", "crosshair", "minimal", "image"];
  var MOVEMENTS = ["instant", "smooth", "delayed", "elastic"];
  var TRAIL_STYLES = ["dots", "gradient", "neon"];
  var PARTICLE_SHAPES = ["dot", "sparkle", "mixed"];
  var TOUCH_MODES = ["off", "tap"];
  var REVEAL_ANIMATIONS = [
    "fade",
    "fade-up",
    "fade-down",
    "fade-left",
    "fade-right",
    "zoom-in",
    "scale-up",
    "blur-in"
  ];
  var DEFAULTS = {
    cursor: "default",
    imageUrl: "",
    imageSize: 32,
    imageHotspot: [0, 0],
    color: "#7c5cff",
    color2: "#22d3ee",
    size: 32,
    movement: "smooth",
    speed: 0.25,
    elastic: { stiffness: 0.12, damping: 0.78 },
    magnetic: { enabled: false, radius: 90, strength: 0.4 },
    swarm: { enabled: false, count: 18, radius: 150, size: 26, speed: 1, avoid: 52, hideCursor: true },
    glow: false,
    neon: false,
    motionBlur: false,
    trail: { enabled: false, length: 14, style: "dots", size: 0.6 },
    particles: {
      enabled: false,
      density: 4,
      size: 6,
      lifetime: 800,
      gravity: 0.04,
      shape: "dot",
      max: 120
    },
    hoverEffects: true,
    hoverScale: 1.8,
    clickEffects: { enabled: true, ripple: true, particles: true, count: 12 },
    dragEffects: true,
    hideNativeCursor: true,
    touch: "off",
    respectReducedMotion: true,
    zIndex: 2147483e3,
    selectors: {
      link: "a[href]",
      button: "button, [role=button], summary, input[type=button], input[type=submit], input[type=reset]",
      text: "p, h1, h2, h3, h4, h5, h6, li, blockquote, label, figcaption, textarea, input:not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=range])",
      ignore: "[data-ca-ignore]"
    }
  };
  var TOGGLED = ["trail", "particles", "clickEffects", "magnetic", "swarm"];
  var NESTED = ["elastic", "selectors", ...TOGGLED];
  var isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  function oneOf(name, value, list) {
    if (!list.includes(value)) {
      throw new RangeError(`Invalid ${name} "${value}". Expected one of: ${list.join(", ")}`);
    }
    return value;
  }
  function bounded(name, value, min, max) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new TypeError(`Option ${name} must be a number`);
    }
    return Math.min(max, Math.max(min, value));
  }
  function text(name, value) {
    if (typeof value !== "string") throw new TypeError(`Option ${name} must be a string`);
    return value;
  }
  function flag(name, value) {
    if (typeof value !== "boolean") throw new TypeError(`Option ${name} must be a boolean`);
    return value;
  }
  function validate(config) {
    const c = config;
    oneOf("cursor", c.cursor, CURSOR_TYPES);
    oneOf("movement", c.movement, MOVEMENTS);
    oneOf("touch", c.touch, TOUCH_MODES);
    oneOf("trail.style", c.trail.style, TRAIL_STYLES);
    oneOf("particles.shape", c.particles.shape, PARTICLE_SHAPES);
    text("color", c.color);
    text("color2", c.color2);
    text("imageUrl", c.imageUrl);
    c.size = bounded("size", c.size, 6, 160);
    c.imageSize = bounded("imageSize", c.imageSize, 8, 256);
    c.speed = bounded("speed", c.speed, 0.02, 1);
    c.hoverScale = bounded("hoverScale", c.hoverScale, 0.5, 4);
    c.zIndex = bounded("zIndex", c.zIndex, 0, 2147483647);
    c.elastic.stiffness = bounded("elastic.stiffness", c.elastic.stiffness, 0.01, 0.6);
    c.elastic.damping = bounded("elastic.damping", c.elastic.damping, 0.3, 0.98);
    c.magnetic.radius = bounded("magnetic.radius", c.magnetic.radius, 10, 400);
    c.magnetic.strength = bounded("magnetic.strength", c.magnetic.strength, 0, 1);
    c.swarm.count = Math.round(bounded("swarm.count", c.swarm.count, 2, 64));
    c.swarm.radius = bounded("swarm.radius", c.swarm.radius, 40, 500);
    c.swarm.size = bounded("swarm.size", c.swarm.size, 10, 64);
    c.swarm.speed = bounded("swarm.speed", c.swarm.speed, 0.2, 3);
    c.swarm.avoid = bounded("swarm.avoid", c.swarm.avoid, 0, 200);
    flag("swarm.hideCursor", c.swarm.hideCursor);
    c.trail.length = Math.round(bounded("trail.length", c.trail.length, 2, 40));
    c.trail.size = bounded("trail.size", c.trail.size, 0.1, 2);
    c.particles.density = bounded("particles.density", c.particles.density, 1, 10);
    c.particles.size = bounded("particles.size", c.particles.size, 2, 32);
    c.particles.lifetime = bounded("particles.lifetime", c.particles.lifetime, 100, 4e3);
    c.particles.gravity = bounded("particles.gravity", c.particles.gravity, -0.5, 0.5);
    c.particles.max = Math.round(bounded("particles.max", c.particles.max, 8, 400));
    c.clickEffects.count = Math.round(bounded("clickEffects.count", c.clickEffects.count, 1, 60));
    flag("glow", c.glow);
    flag("neon", c.neon);
    flag("motionBlur", c.motionBlur);
    flag("hoverEffects", c.hoverEffects);
    flag("dragEffects", c.dragEffects);
    flag("hideNativeCursor", c.hideNativeCursor);
    flag("respectReducedMotion", c.respectReducedMotion);
    if (!Array.isArray(c.imageHotspot) || c.imageHotspot.length !== 2 || c.imageHotspot.some((n) => typeof n !== "number")) {
      throw new TypeError("Option imageHotspot must be an array of two numbers");
    }
    if (c.cursor === "image" && !c.imageUrl) {
      throw new TypeError('Cursor "image" requires the imageUrl option');
    }
    return c;
  }
  function mergeOptions(base, input) {
    const source = input === void 0 ? {} : input;
    if (!isObject(source)) throw new TypeError("Options must be an object");
    const next = { ...base, imageHotspot: [...base.imageHotspot] };
    for (const key of NESTED) next[key] = { ...base[key] };
    for (const key of Object.keys(source)) {
      if (!(key in DEFAULTS)) throw new RangeError(`Unknown option "${key}"`);
      const value = source[key];
      if (TOGGLED.includes(key)) {
        if (typeof value === "boolean") next[key].enabled = value;
        else if (isObject(value)) next[key] = { ...next[key], enabled: true, ...value };
        else throw new TypeError(`Option ${key} must be a boolean or an object`);
      } else if (NESTED.includes(key)) {
        if (!isObject(value)) throw new TypeError(`Option ${key} must be an object`);
        next[key] = { ...next[key], ...value };
      } else {
        next[key] = Array.isArray(value) ? [...value] : value;
      }
    }
    return validate(next);
  }
  function cloneConfig(config) {
    const copy = { ...config, imageHotspot: [...config.imageHotspot] };
    for (const key of NESTED) copy[key] = { ...config[key] };
    return copy;
  }
  function effectiveConfig(config, reducedMotion) {
    if (!reducedMotion || !config.respectReducedMotion) return config;
    return {
      ...config,
      movement: "instant",
      motionBlur: false,
      trail: { ...config.trail, enabled: false },
      particles: { ...config.particles, enabled: false },
      clickEffects: { ...config.clickEffects, ripple: false, particles: false },
      magnetic: { ...config.magnetic, enabled: false },
      swarm: { ...config.swarm, enabled: false }
    };
  }

  // src/compat.js
  var hasDOM = () => typeof window !== "undefined" && typeof document !== "undefined";
  var now = () => {
    const clock = typeof window !== "undefined" && window.performance ? window.performance : null;
    return clock && typeof clock.now === "function" ? clock.now() : Date.now();
  };
  var features = {
    pointerEvents: () => hasDOM() && "PointerEvent" in window,
    intersectionObserver: () => hasDOM() && "IntersectionObserver" in window,
    matchMedia: () => hasDOM() && typeof window.matchMedia === "function",
    colorMix: () => hasDOM() && typeof window.CSS !== "undefined" && typeof window.CSS.supports === "function" && window.CSS.supports("color", "color-mix(in srgb, red, blue)")
  };
  function matches(query) {
    return features.matchMedia() && window.matchMedia(query).matches;
  }
  var prefersReducedMotion = () => matches("(prefers-reduced-motion: reduce)");
  function watchMedia(query, callback) {
    if (!features.matchMedia()) return () => {
    };
    const list = window.matchMedia(query);
    if (typeof list.addEventListener === "function") {
      list.addEventListener("change", callback);
      return () => list.removeEventListener("change", callback);
    }
    if (typeof list.addListener === "function") {
      list.addListener(callback);
      return () => list.removeListener(callback);
    }
    return () => {
    };
  }
  function requestFrame(callback) {
    if (typeof window.requestAnimationFrame === "function") return window.requestAnimationFrame(callback);
    return window.setTimeout(() => callback(now()), 16);
  }
  function cancelFrame(id) {
    if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(id);
    else window.clearTimeout(id);
  }

  // src/loop.js
  function createLoop(step) {
    let id = 0;
    let last = 0;
    const frame = (time) => {
      id = 0;
      const dt = last ? Math.min(64, Math.max(1, time - last)) : 16.667;
      last = time;
      if (step(dt) === false) {
        last = 0;
        return;
      }
      id = requestFrame(frame);
    };
    return {
      wake() {
        if (!id) id = requestFrame(frame);
      },
      stop() {
        if (id) cancelFrame(id);
        id = 0;
        last = 0;
      },
      isRunning() {
        return id !== 0;
      }
    };
  }

  // src/dom.js
  function createElement(tag, className, parent) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (parent) parent.appendChild(element);
    return element;
  }
  function closestMatch(target, selector) {
    if (!target || typeof target.closest !== "function") return null;
    return target.closest(selector);
  }

  // src/input.js
  var TOUCH_GUARD_MS = 700;
  function bindInput(handlers) {
    const releases = [];
    let lastTouch = -Infinity;
    const on = (target, type, listener, options) => {
      target.addEventListener(type, listener, options);
      releases.push(() => target.removeEventListener(type, listener, options));
    };
    const read = (event, type) => ({
      x: event.clientX,
      y: event.clientY,
      type,
      target: event.target,
      button: event.button
    });
    const passive = { passive: true };
    if (features.pointerEvents()) {
      on(document, "pointermove", (event) => handlers.move(read(event, event.pointerType || "mouse")), passive);
      on(document, "pointerdown", (event) => handlers.down(read(event, event.pointerType || "mouse")), passive);
      on(document, "pointerup", (event) => handlers.up(read(event, event.pointerType || "mouse")), passive);
      on(document, "pointercancel", (event) => handlers.up(read(event, event.pointerType || "mouse")), passive);
    } else {
      const fromMouse = () => now() - lastTouch > TOUCH_GUARD_MS;
      on(document, "mousemove", (event) => fromMouse() && handlers.move(read(event, "mouse")), passive);
      on(document, "mousedown", (event) => fromMouse() && handlers.down(read(event, "mouse")), passive);
      on(document, "mouseup", (event) => fromMouse() && handlers.up(read(event, "mouse")), passive);
      on(
        document,
        "touchstart",
        (event) => {
          const touch = event.touches && event.touches[0];
          if (!touch) return;
          lastTouch = now();
          const point = { x: touch.clientX, y: touch.clientY, type: "touch", target: event.target, button: 0 };
          handlers.move(point);
          handlers.down(point);
        },
        passive
      );
      on(
        document,
        "touchend",
        () => {
          lastTouch = now();
          handlers.up({ x: 0, y: 0, type: "touch", target: null, button: 0 });
        },
        passive
      );
    }
    on(document, "mouseout", (event) => {
      if (!event.relatedTarget) handlers.leave();
    }, passive);
    on(window, "blur", () => handlers.leave(), passive);
    return () => {
      for (const release of releases) release();
      releases.length = 0;
    };
  }

  // src/cursor.js
  var LAYOUT = {
    default: { head: true, body: true, headScale: 0.2 },
    circle: { head: false, body: true, headScale: 0 },
    dot: { head: true, body: false, headScale: 0.45 },
    ring: { head: false, body: true, headScale: 0 },
    crosshair: { head: true, body: false, headScale: 0.9 },
    minimal: { head: true, body: false, headScale: 0.14 },
    image: { head: true, body: false, headScale: 0 }
  };
  var STRETCH_BLOCKED = ["image", "crosshair"];
  function createState() {
    return { x: 0, y: 0, vx: 0, vy: 0 };
  }
  function advance(state, targetX, targetY, config, frames) {
    switch (config.movement) {
      case "instant":
        state.x = targetX;
        state.y = targetY;
        state.vx = 0;
        state.vy = 0;
        return;
      case "elastic": {
        const damping = Math.pow(config.elastic.damping, frames);
        state.vx = (state.vx + (targetX - state.x) * config.elastic.stiffness * frames) * damping;
        state.vy = (state.vy + (targetY - state.y) * config.elastic.stiffness * frames) * damping;
        state.x += state.vx * frames;
        state.y += state.vy * frames;
        return;
      }
      default: {
        const base = config.movement === "delayed" ? config.speed * 0.35 : config.speed;
        const factor = 1 - Math.pow(1 - base, frames);
        state.x += (targetX - state.x) * factor;
        state.y += (targetY - state.y) * factor;
      }
    }
  }
  function settle(state, targetX, targetY) {
    if (Math.abs(targetX - state.x) < 0.1 && Math.abs(targetY - state.y) < 0.1 && Math.abs(state.vx) < 0.05 && Math.abs(state.vy) < 0.05) {
      state.x = targetX;
      state.y = targetY;
      state.vx = 0;
      state.vy = 0;
    }
  }
  var Cursor = class {
    constructor(root) {
      this.head = createElement("div", "ca-head", root);
      this.headInner = createElement("span", "ca-head-inner", this.head);
      this.body = createElement("div", "ca-body", root);
      this.bodyInner = createElement("span", "ca-body-inner", this.body);
      this.image = null;
      this.imageUrl = "";
      this.headState = createState();
      this.bodyState = createState();
      this.layout = LAYOUT.default;
      this.type = "default";
      this.sourceX = 0;
      this.sourceY = 0;
      this.travelled = 0;
      this.renderedHead = "";
      this.renderedBody = "";
    }
    configure(config) {
      this.type = config.cursor;
      this.layout = LAYOUT[config.cursor];
      const headSize = config.cursor === "image" ? config.imageSize : Math.max(4, Math.round(config.size * this.layout.headScale));
      this.head.style.width = `${headSize}px`;
      this.head.style.height = `${headSize}px`;
      if (config.cursor === "image") {
        this.head.style.margin = `${-config.imageHotspot[1]}px 0 0 ${-config.imageHotspot[0]}px`;
        this.syncImage(config.imageUrl);
      } else {
        this.head.style.margin = "";
        this.syncImage("");
      }
      this.head.style.display = this.layout.head ? "" : "none";
      this.body.style.display = this.layout.body ? "" : "none";
      this.renderedHead = "";
      this.renderedBody = "";
    }
    syncImage(url) {
      if (!url) {
        if (this.image) {
          this.image.remove();
          this.image = null;
          this.imageUrl = "";
        }
        return;
      }
      if (!this.image) {
        this.image = createElement("img", "", this.headInner);
        this.image.alt = "";
        this.image.draggable = false;
      }
      if (this.imageUrl !== url) {
        this.image.src = url;
        this.imageUrl = url;
      }
    }
    snap(x, y) {
      for (const state of [this.headState, this.bodyState]) {
        state.x = x;
        state.y = y;
        state.vx = 0;
        state.vy = 0;
      }
      this.sourceX = x;
      this.sourceY = y;
      this.renderedHead = "";
      this.renderedBody = "";
    }
    update(pointerX, pointerY, pulledX, pulledY, frames, config) {
      const head = this.headState;
      const body = this.bodyState;
      const leader = this.layout.body ? body : head;
      const previousX = leader.x;
      const previousY = leader.y;
      if (this.layout.body) {
        head.x = pointerX;
        head.y = pointerY;
        advance(body, pulledX, pulledY, config, frames);
        settle(body, pulledX, pulledY);
      } else {
        advance(head, pulledX, pulledY, config, frames);
        settle(head, pulledX, pulledY);
      }
      const source = this.layout.head ? head : body;
      const dx = source.x - this.sourceX;
      const dy = source.y - this.sourceY;
      this.travelled = Math.hypot(dx, dy);
      this.sourceX = source.x;
      this.sourceY = source.y;
      const leaderDx = leader.x - previousX;
      const leaderDy = leader.y - previousY;
      const speed = Math.hypot(leaderDx, leaderDy) / Math.max(frames, 0.01);
      let stretch = "";
      if (config.motionBlur && !STRETCH_BLOCKED.includes(this.type) && speed > 1.5) {
        const amount = Math.min(1 + speed * 0.03, 1.9);
        stretch = ` rotate(${Math.atan2(leaderDy, leaderDx).toFixed(3)}rad) scale(${amount.toFixed(3)},${(1 / Math.sqrt(amount)).toFixed(3)})`;
      }
      if (this.layout.head) {
        const value = `translate3d(${head.x.toFixed(2)}px,${head.y.toFixed(2)}px,0)${this.layout.body ? "" : stretch}`;
        if (value !== this.renderedHead) {
          this.head.style.transform = value;
          this.renderedHead = value;
        }
      }
      if (this.layout.body) {
        const value = `translate3d(${body.x.toFixed(2)}px,${body.y.toFixed(2)}px,0)${stretch}`;
        if (value !== this.renderedBody) {
          this.body.style.transform = value;
          this.renderedBody = value;
        }
      }
      return Math.abs(pulledX - leader.x) > 0.1 || Math.abs(pulledY - leader.y) > 0.1 || Math.abs(leader.vx) > 0.05 || Math.abs(leader.vy) > 0.05;
    }
    destroy() {
      this.head.remove();
      this.body.remove();
      this.image = null;
    }
  };

  // src/trail.js
  var Trail = class {
    constructor(root) {
      this.layer = createElement("div", "ca-trail", root);
      this.nodes = [];
      this.points = [];
      this.rendered = [];
      this.enabled = false;
      this.visible = false;
      this.style = "dots";
      this.length = 0;
    }
    configure(config) {
      const trail = config.trail;
      this.enabled = trail.enabled;
      const desired = trail.enabled ? trail.length : 0;
      const restyle = this.style !== trail.style || this.length !== desired;
      this.style = trail.style;
      while (this.nodes.length > desired) {
        this.nodes.pop().remove();
        this.points.pop();
        this.rendered.pop();
      }
      while (this.nodes.length < desired) {
        const node = createElement("span", "ca-trail-dot", this.layer);
        const last = this.points[this.points.length - 1];
        this.nodes.push(node);
        this.points.push({ x: last ? last.x : 0, y: last ? last.y : 0 });
        this.rendered.push("");
      }
      this.length = desired;
      if (restyle) this.paint();
      if (!this.enabled) this.setVisible(false);
    }
    paint() {
      const total = this.nodes.length;
      const mixable = this.style === "gradient" && features.colorMix();
      for (let index = 0; index < total; index++) {
        const node = this.nodes[index];
        if (mixable) {
          const share = total > 1 ? Math.round(100 * (1 - index / (total - 1))) : 100;
          node.style.background = `color-mix(in srgb, var(--ca-color) ${share}%, var(--ca-color2))`;
        } else {
          node.style.background = "";
        }
        this.rendered[index] = "";
      }
    }
    snap(x, y) {
      for (const point of this.points) {
        point.x = x;
        point.y = y;
      }
    }
    setVisible(visible) {
      if (this.visible === visible) return;
      this.visible = visible;
      this.layer.style.opacity = visible ? "1" : "0";
    }
    update(x, y, moving, frames) {
      if (!this.enabled || this.nodes.length === 0) return false;
      this.setVisible(moving);
      const total = this.nodes.length;
      const follow = 1 - Math.pow(0.55, frames);
      let travelling = false;
      for (let index = 0; index < total; index++) {
        const point = this.points[index];
        const anchorX = index === 0 ? x : this.points[index - 1].x;
        const anchorY = index === 0 ? y : this.points[index - 1].y;
        const gapX = anchorX - point.x;
        const gapY = anchorY - point.y;
        point.x += gapX * follow;
        point.y += gapY * follow;
        if (Math.abs(gapX) > 0.05 || Math.abs(gapY) > 0.05) travelling = true;
        const falloff = 1 - index / total;
        const value = `translate3d(${point.x.toFixed(2)}px,${point.y.toFixed(2)}px,0) scale(${falloff.toFixed(3)})`;
        if (value !== this.rendered[index]) {
          this.nodes[index].style.transform = value;
          this.nodes[index].style.opacity = (falloff * 0.9).toFixed(3);
          this.rendered[index] = value;
        }
      }
      return travelling || moving;
    }
    destroy() {
      this.layer.remove();
      this.nodes = [];
      this.points = [];
      this.rendered = [];
    }
  };

  // src/particles.js
  var RING_LIMIT = 8;
  var FRAME = 16.667;
  var easeOut = (t) => 1 - Math.pow(1 - t, 3);
  var Particles = class {
    constructor(root) {
      this.layer = createElement("div", "ca-fx", root);
      this.pool = [];
      this.rings = [];
      this.live = 0;
      this.liveRings = 0;
      this.config = null;
      this.accumulator = 0;
    }
    configure(config) {
      this.config = config.particles;
      while (this.pool.length > this.config.max) {
        const particle = this.pool.pop();
        if (particle.active) this.live--;
        particle.element.remove();
      }
    }
    acquire() {
      for (const particle2 of this.pool) if (!particle2.active) return particle2;
      if (this.pool.length >= this.config.max) return null;
      const particle = {
        element: createElement("span", "ca-particle", this.layer),
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        age: 0,
        life: 1,
        scale: 1,
        rotation: 0,
        spin: 0
      };
      this.pool.push(particle);
      return particle;
    }
    spawn(x, y, speed, angle) {
      const particle = this.acquire();
      if (!particle) return;
      const settings = this.config;
      const velocity = speed * (0.5 + Math.random() * 0.8);
      const shape = settings.shape === "mixed" ? Math.random() < 0.5 ? "sparkle" : "dot" : settings.shape;
      particle.active = true;
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * velocity;
      particle.vy = Math.sin(angle) * velocity;
      particle.age = 0;
      particle.life = settings.lifetime * (0.7 + Math.random() * 0.6);
      particle.scale = 0.6 + Math.random() * 0.8;
      particle.rotation = Math.random() * 360;
      particle.spin = (Math.random() - 0.5) * 10;
      particle.element.setAttribute("data-ca-shape", shape);
      particle.element.setAttribute("data-ca-tone", Math.random() < 0.5 ? "a" : "b");
      this.live++;
    }
    burst(x, y, count) {
      for (let index = 0; index < count; index++) {
        const angle = Math.PI * 2 * index / count + Math.random() * 0.5;
        this.spawn(x, y, 2 + Math.random() * 3.5, angle);
      }
    }
    trail(x, y, distance) {
      this.accumulator += distance * this.config.density * 0.025;
      let budget = 3;
      while (this.accumulator >= 1 && budget > 0) {
        this.spawn(x, y, 0.9, Math.random() * Math.PI * 2);
        this.accumulator -= 1;
        budget--;
      }
      if (this.accumulator > 3) this.accumulator = 3;
    }
    ripple(x, y) {
      let ring = this.rings.find((item) => !item.active);
      if (!ring) {
        if (this.rings.length >= RING_LIMIT) return;
        ring = { element: createElement("span", "ca-ring", this.layer), active: false, x: 0, y: 0, age: 0 };
        this.rings.push(ring);
      }
      ring.active = true;
      ring.x = x;
      ring.y = y;
      ring.age = 0;
      this.liveRings++;
    }
    update(dt) {
      if (this.live === 0 && this.liveRings === 0) return false;
      const frames = dt / FRAME;
      const gravity = this.config.gravity;
      for (const particle of this.pool) {
        if (!particle.active) continue;
        particle.age += dt;
        const progress = particle.age / particle.life;
        if (progress >= 1) {
          particle.active = false;
          particle.element.style.opacity = "0";
          this.live--;
          continue;
        }
        particle.vy += gravity * frames;
        particle.vx *= Math.pow(0.985, frames);
        particle.x += particle.vx * frames;
        particle.y += particle.vy * frames;
        particle.rotation += particle.spin * frames;
        const scale = particle.scale * (1 - progress * 0.6);
        particle.element.style.transform = `translate3d(${particle.x.toFixed(2)}px,${particle.y.toFixed(2)}px,0) rotate(${particle.rotation.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        particle.element.style.opacity = (1 - progress).toFixed(3);
      }
      for (const ring of this.rings) {
        if (!ring.active) continue;
        ring.age += dt;
        const progress = ring.age / 520;
        if (progress >= 1) {
          ring.active = false;
          ring.element.style.opacity = "0";
          this.liveRings--;
          continue;
        }
        const scale = 0.15 + 0.85 * easeOut(progress);
        ring.element.style.transform = `translate3d(${ring.x.toFixed(2)}px,${ring.y.toFixed(2)}px,0) scale(${scale.toFixed(3)})`;
        ring.element.style.opacity = ((1 - progress) * 0.8).toFixed(3);
      }
      return this.live > 0 || this.liveRings > 0;
    }
    clear() {
      for (const particle of this.pool) {
        particle.active = false;
        particle.element.style.opacity = "0";
      }
      for (const ring of this.rings) {
        ring.active = false;
        ring.element.style.opacity = "0";
      }
      this.live = 0;
      this.liveRings = 0;
      this.accumulator = 0;
    }
    destroy() {
      this.layer.remove();
      this.pool = [];
      this.rings = [];
      this.live = 0;
      this.liveRings = 0;
    }
  };

  // src/swarm.js
  var SVGNS = "http://www.w3.org/2000/svg";
  var COLORS = [
    "#F24E1E",
    "#A259FF",
    "#1ABCFE",
    "#0ACF83",
    "#FF7262",
    "#FFC700",
    "#9747FF",
    "#E8467C",
    "#14AE5C",
    "#0D99FF",
    "#FF8A00",
    "#00B5CE"
  ];
  var ARROW_D = "M4.6 3.9 C4.2 3.1 4.9 2.4 5.7 2.8 L20.6 9.4 C21.5 9.8 21.4 11.1 20.4 11.3 L13.9 12.9 C13.4 13 13 13.4 12.9 13.9 L11.3 20.4 C11.1 21.4 9.8 21.5 9.4 20.6 Z";
  var HOT = { arrow: [5, 3.5], cross: [12, 12], pen: [3, 3], ibeam: [12, 12] };
  var rand = (a, b) => a + Math.random() * (b - a);
  var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function shapeSVG(shape, color) {
    const stroke = 'stroke="#fff" stroke-width="1.5" stroke-linejoin="round"';
    switch (shape) {
      case "cross":
        return `<g stroke-linecap="round"><path d="M12 3.5 V20.5 M3.5 12 H20.5" stroke="#fff" stroke-width="3.6"/><path d="M12 3.5 V20.5 M3.5 12 H20.5" stroke="${color}" stroke-width="1.5"/></g>`;
      case "pen":
        return `<path d="M17.4 10.6 L20.6 13.8 L13.8 20.6 L10.6 17.4 Z" fill="${color}" ${stroke}/><path d="M3 3 L13.1 6.3 L17.4 10.6 L10.6 17.4 L6.3 13.1 Z" fill="${color}" ${stroke}/><path d="M3.6 3.6 L8.9 8.9" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/><circle cx="10.2" cy="10.2" r="1.75" fill="none" stroke="#fff" stroke-width="1.2"/>`;
      case "ibeam":
        return `<g fill="none" stroke-linecap="round"><path d="M8.5 4.5 H10.5 Q12 4.5 12 6 Q12 4.5 13.5 4.5 H15.5 M12 6 V18 M8.5 19.5 H10.5 Q12 19.5 12 18 Q12 19.5 13.5 19.5 H15.5" stroke="#fff" stroke-width="3.6"/><path d="M8.5 4.5 H10.5 Q12 4.5 12 6 Q12 4.5 13.5 4.5 H15.5 M12 6 V18 M8.5 19.5 H10.5 Q12 19.5 12 18 Q12 19.5 13.5 19.5 H15.5" stroke="${color}" stroke-width="1.5"/></g>`;
      default:
        return `<path d="${ARROW_D}" fill="${color}" ${stroke}/>`;
    }
  }
  var Swarm = class {
    constructor(root) {
      this.layer = createElement("div", "ca-swarm", root);
      this.items = [];
      this.time = 0;
      this.config = null;
    }
    configure(config) {
      this.config = config.swarm;
      if (!this.config.enabled) this.clear();
    }
    make(x, y, index) {
      const color = COLORS[index % COLORS.length];
      const shape = index % 7 === 0 ? "cross" : index % 11 === 0 ? "pen" : index % 5 === 0 ? "ibeam" : "arrow";
      const element = createElement("div", "ca-swarm-item", this.layer);
      const svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("width", "28");
      svg.setAttribute("height", "28");
      svg.setAttribute("viewBox", "0 0 28 28");
      svg.innerHTML = shapeSVG(shape, color);
      const [hx, hy] = HOT[shape];
      svg.style.transform = `translate(${-hx}px,${-hy}px)`;
      element.appendChild(svg);
      const fast = Math.random() < 0.25;
      return {
        element,
        x,
        y,
        vx: 0,
        vy: 0,
        color,
        speed: fast ? rand(1e3, 1500) : rand(320, 760),
        force: fast ? rand(3500, 6e3) : rand(750, 1800),
        spin: fast ? rand(2.2, 3.4) : rand(0.8, 1.8),
        curl: rand(-1, 1),
        orbit: rand(70, 170)
      };
    }
    resize(size, x, y) {
      const count = Math.round(size.count);
      while (this.items.length < count) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(40, size.radius * (0.55 + Math.random() * 0.5));
        this.items.push(this.make(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, this.items.length));
      }
      while (this.items.length > count) {
        const item = this.items.pop();
        item.element.remove();
      }
    }
    update(px, py, frames, config) {
      const size = config.swarm;
      const dt = Math.min(0.064, Math.max(1e-3, frames * 0.016667));
      this.time += dt * size.speed;
      this.resize(size, px, py);
      const list = this.items;
      const time = this.time;
      const R = size.radius * (1 + 0.18 * Math.sin(time * 0.55));
      const swirl = Math.tanh(Math.cos(time * 0.11) * 3);
      const want = [];
      for (let index = 0; index < list.length; index++) {
        const c = list[index];
        const dx = c.x - px;
        const dy = c.y - py;
        const d = Math.hypot(dx, dy) || 0.01;
        const nx = dx / d;
        const ny = dy / d;
        const ang = Math.atan2(dy, dx);
        const off = (c.orbit - 120) * 0.55;
        const rr = R * (1 + 0.3 * Math.sin(3 * ang + time * 0.7)) + off;
        const tang = 300 * (0.7 + c.spin * 0.2) * swirl;
        const rad = clamp((rr - d) * 4, -2600, 1400);
        const far = Math.min(1, Math.max(0, (d - rr) / 600));
        want.push([-ny * tang + nx * rad - ny * c.curl * 400 * far, nx * tang + ny * rad + nx * c.curl * 400 * far]);
      }
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        let ax = 0;
        let ay = 0;
        let weight = 0;
        for (let j = 0; j < list.length; j++) {
          if (j === i) continue;
          const other = list[j];
          const d = Math.hypot(other.x - c.x, other.y - c.y);
          if (d > 90) continue;
          const w = 1 - d / 90;
          ax += other.vx * w;
          ay += other.vy * w;
          weight += w;
        }
        let [fx, fy] = want[i];
        if (weight > 0) {
          fx = fx * 0.7 + ax / weight * 0.3;
          fy = fy * 0.7 + ay / weight * 0.3;
        }
        const dist = Math.max(0, Math.hypot(c.x - px, c.y - py) - 180);
        const maxV = c.speed * (1.3 + Math.min(3.2, dist / 90));
        const speed = Math.hypot(fx, fy);
        if (speed > maxV) {
          fx *= maxV / speed;
          fy *= maxV / speed;
        }
        let gx = (fx - c.vx) * 6;
        let gy = (fy - c.vy) * 6;
        const maxF = c.force * (1.4 + Math.min(5, dist / 50));
        const force = Math.hypot(gx, gy);
        if (force > maxF) {
          gx *= maxF / force;
          gy *= maxF / force;
        }
        c.vx += gx * dt;
        c.vy += gy * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
      }
      const avoid = size.avoid;
      for (const c of list) {
        const dx = c.x - px;
        const dy = c.y - py;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d >= avoid) continue;
        const nx = dx / d;
        const ny = dy / d;
        c.x = px + nx * avoid;
        c.y = py + ny * avoid;
        const rel = c.vx * nx + c.vy * ny;
        if (rel < 0) {
          c.vx -= nx * rel * 1.6;
          c.vy -= ny * rel * 1.6;
        }
        c.vx += nx * 260;
        c.vy += ny * 260;
      }
      for (const c of list) {
        c.element.style.transform = `translate3d(${Math.round(c.x * 10) / 10}px,${Math.round(c.y * 10) / 10}px,0)`;
      }
      return true;
    }
    clear() {
      for (const item of this.items) item.element.remove();
      this.items = [];
      this.time = 0;
    }
    destroy() {
      this.clear();
      this.layer.remove();
    }
  };
  var SWARM_COLORS = COLORS;
  var cursorShapeSVG = shapeSVG;
  var CURSOR_HOTSPOTS = HOT;

  // src/engine.js
  var NATIVE_CLASS = "ca-hide-native";
  var MOVING_WINDOW_MS = 140;
  var DRAG_THRESHOLD = 4;
  var RECT_INTERVAL_MS = 150;
  var RECT_LIMIT = 400;
  var Engine = class {
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
        lastMove: -Infinity
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
        swarm: new Swarm(root)
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
      this.parts.swarm.configure(eff);
      root.setAttribute("data-ca-swarm", String(eff.swarm.enabled));
      root.setAttribute("data-ca-swarm-hide", String(eff.swarm.enabled && eff.swarm.hideCursor));
      this.rectsDirty = true;
      this.syncNative();
      this.syncState();
      if (this.enabled) this.loop.wake();
    }
    syncNative() {
      const hide = this.enabled && this.config.hideNativeCursor && this.pointer.mouseSeen && this.pointer.has;
      document.documentElement.classList.toggle(NATIVE_CLASS, hide);
    }
    enable() {
      if (!this.root || this.enabled) return;
      this.enabled = true;
      this.releaseInput = bindInput({
        move: (event) => this.onMove(event),
        down: (event) => this.onDown(event),
        up: (event) => this.onUp(event),
        leave: () => this.onLeave()
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
        this.parts.swarm.destroy();
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
      if (event.button !== void 0 && event.button > 0) return;
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
          cy: box.top + box.height / 2
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
        if (eff.swarm.enabled) {
          this.parts.swarm.update(pointer.x, pointer.y, frames, eff);
          active = true;
        }
      }
      const trailActive = this.parts.trail.update(cursor.sourceX, cursor.sourceY, moving && pointer.has, frames);
      if (eff.particles.enabled && moving && pointer.has) {
        this.parts.fx.trail(cursor.sourceX, cursor.sourceY, cursor.travelled);
      }
      const fxActive = this.parts.fx.update(dt);
      return active || trailActive || fxActive || moving;
    }
  };

  // src/reveal.js
  var REVEAL_DEFAULTS = {
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
    respectReducedMotion: true
  };
  function resolveOptions(options) {
    const input = options === void 0 ? {} : options;
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
  var Reveal = class {
    constructor(options) {
      this.config = resolveOptions(options);
      this.items = /* @__PURE__ */ new Set();
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
          threshold: this.config.thresholds.length === 1 ? this.config.thresholds[0] : this.config.thresholds
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
        const siblings = Array.prototype.filter.call(
          parent.children,
          (child) => child.matches(this.config.selector)
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
      const current = /* @__PURE__ */ new Set();
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
      return this.minimum === 0 || entry.intersectionRatio >= this.minimum - 1e-3;
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
  };

  // src/rebuild.js
  var SVGNS2 = "http://www.w3.org/2000/svg";
  var MEDIA = "img,svg,video,canvas,picture,iframe";
  var REBUILD_DEFAULTS = {
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
    labelMinArea: 7e3,
    stagger: 90,
    maxConcurrent: 2,
    typeText: true,
    typeSelector: null,
    charDelay: 16,
    maxTypeDuration: 1600,
    pen: true,
    revealClass: "ca-built",
    rootMargin: "0px",
    respectReducedMotion: true
  };
  function resolveOptions2(options) {
    const input = options === void 0 ? {} : options;
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
      throw new TypeError('Rebuild option color must be a CSS colour string or "auto"');
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
  var easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  var clamp2 = (v, a, b) => Math.max(a, Math.min(b, v));
  function scrollOffsets() {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft || 0,
      y: window.pageYOffset || document.documentElement.scrollTop || 0
    };
  }
  function toDocRect(rect) {
    const offset = scrollOffsets();
    const left = rect.left + offset.x;
    const top = rect.top + offset.y;
    return {
      left,
      top,
      right: left + rect.width,
      bottom: top + rect.height,
      width: rect.width,
      height: rect.height
    };
  }
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
  var Rebuild = class {
    constructor(options) {
      this.config = resolveOptions2(options);
      this.palette = this.config.colors ? this.config.colors.slice() : SWARM_COLORS.slice();
      this.items = /* @__PURE__ */ new Set();
      this.builds = /* @__PURE__ */ new Map();
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
      this.svg = document.createElementNS(SVGNS2, "svg");
      this.svg.setAttribute("class", "ca-rebuild-outline");
      this.layer.appendChild(this.svg);
      this.sizeCanvas();
      if (features.intersectionObserver()) {
        this.observer = new window.IntersectionObserver((entries) => this.handle(entries), {
          rootMargin: this.config.rootMargin,
          threshold: this.config.threshold
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
        if (entry.isIntersecting && entry.intersectionRatio >= this.config.threshold - 1e-3) {
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
      const viewport = element.getBoundingClientRect();
      if (viewport.width < 4 || viewport.height < 4) {
        this.finish(element);
        return;
      }
      const rect = toDocRect(viewport);
      this.sizeCanvas();
      const color = this.config.color === "auto" ? backgroundLuminance(element) < 0.45 ? this.config.autoLight : this.config.autoDark : this.config.color;
      const build = {
        element,
        rect,
        color,
        phase: "box",
        start: Math.max(now(), this.lastStart + this.config.stagger),
        phaseStart: 0,
        typeDuration: 0,
        charIndex: 0,
        textNodes: this.config.typeText ? collectText(element, this.config.selector, this.config.typeSelector, [], this.config.typeSelector === null) : [],
        media: this.collectMedia(element),
        caret: null,
        cursors: [],
        rectEl: null,
        label: null,
        penRect: null,
        penCursor: null,
        finished: false,
        minHeight: element.style.minHeight
      };
      build.typeDuration = clamp2(build.textNodes.reduce((sum, entry) => sum + entry.text.length, 0) * this.config.charDelay, 260, this.config.maxTypeDuration);
      this.lastStart = build.start;
      element.style.minHeight = `${Math.round(viewport.height)}px`;
      for (const entry of build.textNodes) entry.node.nodeValue = "";
      for (const media of build.media) {
        media.classList.add("ca-build-anim", "ca-build-media");
      }
      const rectEl = document.createElementNS(SVGNS2, "rect");
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
        label.textContent = `${Math.round(rect.width)} \xD7 ${Math.round(rect.height)}`;
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
      const color = this.palette[Math.random() * this.palette.length | 0];
      const shape = index === 0 ? "cross" : index === 1 ? "arrow" : "pen";
      const element = createElement("div", "ca-rebuild-cursor", this.layer);
      const svg = document.createElementNS(SVGNS2, "svg");
      svg.setAttribute("width", "28");
      svg.setAttribute("height", "28");
      svg.setAttribute("viewBox", "0 0 28 28");
      svg.innerHTML = cursorShapeSVG(shape, color);
      const [hx, hy] = CURSOR_HOTSPOTS[shape];
      svg.style.transform = `translate(${-hx}px,${-hy}px)`;
      element.appendChild(svg);
      return {
        element,
        toX: rect.right - index * 20,
        toY: rect.bottom - index * 14,
        outX: rect.right + 70,
        outY: rect.bottom + 60
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
    pointOnRect(box, distance) {
      const w = box.width;
      const h = box.height;
      const perimeter = 2 * (w + h);
      let d = (distance % perimeter + perimeter) % perimeter;
      if (d <= w) return { x: box.left + d, y: box.top };
      d -= w;
      if (d <= h) return { x: box.right, y: box.top + d };
      d -= h;
      if (d <= w) return { x: box.right - d, y: box.bottom };
      d -= w;
      return { x: box.left, y: box.bottom - d };
    }
    pen(build, progress) {
      if (!build.penTarget) {
        let best = null;
        let area = 0;
        for (const item of build.media) {
          const box = toDocRect(item.getBoundingClientRect());
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
      if (!build.penRect) {
        const box = toDocRect(target.getBoundingClientRect());
        const perimeter = 2 * (box.width + box.height);
        const rectEl = document.createElementNS(SVGNS2, "rect");
        rectEl.style.stroke = build.color;
        rectEl.style.fill = "none";
        rectEl.setAttribute("stroke-width", "1.5");
        rectEl.setAttribute("x", String(box.left));
        rectEl.setAttribute("y", String(box.top));
        rectEl.setAttribute("width", String(box.width));
        rectEl.setAttribute("height", String(box.height));
        rectEl.setAttribute("stroke-dasharray", String(perimeter));
        rectEl.setAttribute("stroke-dashoffset", String(perimeter));
        this.svg.appendChild(rectEl);
        build.penRect = rectEl;
        const color = this.palette[Math.random() * this.palette.length | 0];
        const cursor = createElement("div", "ca-rebuild-cursor", this.layer);
        const svg = document.createElementNS(SVGNS2, "svg");
        svg.setAttribute("width", "28");
        svg.setAttribute("height", "28");
        svg.setAttribute("viewBox", "0 0 28 28");
        svg.innerHTML = cursorShapeSVG("pen", color);
        svg.style.transform = `translate(${-CURSOR_HOTSPOTS.pen[0]}px,${-CURSOR_HOTSPOTS.pen[1]}px)`;
        cursor.appendChild(svg);
        build.penCursor = cursor;
        build.penBox = box;
        build.penPerimeter = perimeter;
      }
      const point = this.pointOnRect(build.penBox, progress * build.penPerimeter);
      build.penCursor.style.transform = `translate3d(${Math.round(point.x)}px,${Math.round(point.y)}px,0)`;
      build.penRect.setAttribute("stroke-dashoffset", String(build.penPerimeter * (1 - progress)));
      return true;
    }
    tick() {
      this.frame = 0;
      const t = now();
      let active = false;
      for (const [element, build] of this.builds) {
        if (build.finished) continue;
        if (build.phase === "box") {
          const progress = clamp2((t - build.start) / this.config.duration, 0, 1);
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
            const x = growX - index * 20;
            const y = growY - index * 14;
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
          const progress = clamp2((t - build.phaseStart) / build.typeDuration, 0, 1);
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
          const progress = clamp2((t - build.phaseStart) / 320, 0, 1);
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
          const progress = clamp2((t - build.phaseStart) / 380, 0, 1);
          for (const cursor of build.cursors) {
            const x = cursor.toX + (cursor.outX - cursor.toX) * progress;
            const y = cursor.toY + (cursor.outY - cursor.toY) * progress;
            cursor.element.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
            cursor.element.style.opacity = String(1 - progress);
          }
          build.rectEl.setAttribute("fill-opacity", String(0.06 * (1 - progress)));
          build.rectEl.setAttribute("stroke-opacity", String(1 - progress));
          if (build.penRect) build.penRect.setAttribute("stroke-opacity", String(1 - progress));
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
      if (build.penRect) build.penRect.remove();
      if (build.penCursor) build.penCursor.remove();
      for (const entry of build.textNodes) entry.node.nodeValue = entry.text;
      build.element.style.minHeight = build.minHeight;
      for (const media of build.media) media.classList.remove("ca-build-media", "ca-build-anim");
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
    sizeCanvas() {
      const width = Math.max(document.documentElement.scrollWidth, window.innerWidth || 0);
      const height = Math.max(document.documentElement.scrollHeight, window.innerHeight || 0);
      this.svg.setAttribute("width", String(width));
      this.svg.setAttribute("height", String(height));
    }
    refresh() {
      this.sizeCanvas();
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
  };

  // src/version.js
  var version = "1.5.3";

  // src/index.js
  var engine = new Engine();
  var revealers = /* @__PURE__ */ new Set();
  var rebuilders = /* @__PURE__ */ new Set();
  function requireStarted() {
    if (!engine.started) {
      throw new Error("CursAnimation is not initialised. Call CursAnimation.init() first.");
    }
  }
  var CursAnimation = {
    version,
    init(options) {
      if (!hasDOM()) return CursAnimation;
      engine.start(options);
      return CursAnimation;
    },
    destroy() {
      if (hasDOM()) engine.destroy();
      return CursAnimation;
    },
    enable() {
      if (!hasDOM()) return CursAnimation;
      requireStarted();
      engine.enable();
      engine.apply();
      return CursAnimation;
    },
    disable() {
      if (!hasDOM()) return CursAnimation;
      requireStarted();
      engine.disable();
      return CursAnimation;
    },
    setCursor(type) {
      return CursAnimation.setOptions({ cursor: type });
    },
    setOptions(options) {
      if (!hasDOM()) return CursAnimation;
      requireStarted();
      engine.setOptions(options);
      return CursAnimation;
    },
    getOptions() {
      if (!hasDOM() || !engine.started) return null;
      return engine.getOptions();
    },
    isEnabled() {
      return engine.enabled;
    },
    isSupported() {
      return hasDOM() && typeof document.createElement === "function";
    },
    reveal(options) {
      if (!hasDOM()) {
        return { refresh() {
        }, destroy() {
        } };
      }
      const instance = new Reveal(options);
      revealers.add(instance);
      return {
        refresh: () => instance.refresh(),
        destroy: () => {
          instance.destroy();
          revealers.delete(instance);
        }
      };
    },
    rebuild(options) {
      if (!hasDOM()) {
        return { refresh() {
        }, destroy() {
        } };
      }
      const instance = new Rebuild(options);
      rebuilders.add(instance);
      return {
        refresh: () => instance.refresh(),
        destroy: () => {
          instance.destroy();
          rebuilders.delete(instance);
        }
      };
    },
    refresh() {
      if (!hasDOM()) return CursAnimation;
      engine.refresh();
      for (const instance of revealers) instance.refresh();
      for (const instance of rebuilders) instance.refresh();
      return CursAnimation;
    },
    capabilities() {
      return {
        pointerEvents: features.pointerEvents(),
        intersectionObserver: features.intersectionObserver(),
        matchMedia: features.matchMedia(),
        colorMix: features.colorMix(),
        reducedMotion: hasDOM() && prefersReducedMotion()
      };
    }
  };
  var init = CursAnimation.init;
  var destroy = CursAnimation.destroy;
  var enable = CursAnimation.enable;
  var disable = CursAnimation.disable;
  var setCursor = CursAnimation.setCursor;
  var setOptions = CursAnimation.setOptions;
  var getOptions = CursAnimation.getOptions;
  var reveal = CursAnimation.reveal;
  var rebuild = CursAnimation.rebuild;
  var refresh = CursAnimation.refresh;
  var index_default = CursAnimation;
  return __toCommonJS(index_exports);
})();
if(typeof window!=="undefined"){window.CursAnimation=CursAnimationBundle.default;}
//# sourceMappingURL=cursanimation.js.map
