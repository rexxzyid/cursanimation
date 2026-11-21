export const CURSOR_TYPES = ["default", "circle", "dot", "ring", "crosshair", "minimal", "image"];
export const MOVEMENTS = ["instant", "smooth", "delayed", "elastic"];
export const TRAIL_STYLES = ["dots", "gradient", "neon"];
export const PARTICLE_SHAPES = ["dot", "sparkle", "mixed"];
export const TOUCH_MODES = ["off", "tap"];
export const REVEAL_ANIMATIONS = [
  "fade",
  "fade-up",
  "fade-down",
  "fade-left",
  "fade-right",
  "zoom-in",
  "scale-up",
  "blur-in",
];

export const DEFAULTS = {
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
    max: 120,
  },
  hoverEffects: true,
  hoverScale: 1.8,
  clickEffects: { enabled: true, ripple: true, particles: true, count: 12 },
  dragEffects: true,
  hideNativeCursor: true,
  touch: "off",
  respectReducedMotion: true,
  zIndex: 2147483000,
  selectors: {
    link: "a[href]",
    button: "button, [role=button], summary, input[type=button], input[type=submit], input[type=reset]",
    text: "p, h1, h2, h3, h4, h5, h6, li, blockquote, label, figcaption, textarea, input:not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=range])",
    ignore: "[data-ca-ignore]",
  },
};

const TOGGLED = ["trail", "particles", "clickEffects", "magnetic", "swarm"];
const NESTED = ["elastic", "selectors", ...TOGGLED];

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

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
  c.particles.lifetime = bounded("particles.lifetime", c.particles.lifetime, 100, 4000);
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
  if (
    !Array.isArray(c.imageHotspot) ||
    c.imageHotspot.length !== 2 ||
    c.imageHotspot.some((n) => typeof n !== "number")
  ) {
    throw new TypeError("Option imageHotspot must be an array of two numbers");
  }
  if (c.cursor === "image" && !c.imageUrl) {
    throw new TypeError('Cursor "image" requires the imageUrl option');
  }
  return c;
}

export function mergeOptions(base, input) {
  const source = input === undefined ? {} : input;
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

export function cloneConfig(config) {
  const copy = { ...config, imageHotspot: [...config.imageHotspot] };
  for (const key of NESTED) copy[key] = { ...config[key] };
  return copy;
}

export function effectiveConfig(config, reducedMotion) {
  if (!reducedMotion || !config.respectReducedMotion) return config;
  return {
    ...config,
    movement: "instant",
    motionBlur: false,
    trail: { ...config.trail, enabled: false },
    particles: { ...config.particles, enabled: false },
    clickEffects: { ...config.clickEffects, ripple: false, particles: false },
    magnetic: { ...config.magnetic, enabled: false },
    swarm: { ...config.swarm, enabled: false },
  };
}
