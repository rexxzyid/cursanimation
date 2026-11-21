import { Engine } from "./engine.js";
import { Reveal } from "./reveal.js";
import { hasDOM, features, prefersReducedMotion } from "./compat.js";
import { version } from "./version.js";

const engine = new Engine();
const revealers = new Set();

function requireStarted() {
  if (!engine.started) {
    throw new Error("CursAnimation is not initialised. Call CursAnimation.init() first.");
  }
}

const CursAnimation = {
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
      return { refresh() {}, destroy() {} };
    }
    const instance = new Reveal(options);
    revealers.add(instance);
    return {
      refresh: () => instance.refresh(),
      destroy: () => {
        instance.destroy();
        revealers.delete(instance);
      },
    };
  },

  refresh() {
    if (!hasDOM()) return CursAnimation;
    engine.refresh();
    for (const instance of revealers) instance.refresh();
    return CursAnimation;
  },

  capabilities() {
    return {
      pointerEvents: features.pointerEvents(),
      intersectionObserver: features.intersectionObserver(),
      matchMedia: features.matchMedia(),
      colorMix: features.colorMix(),
      reducedMotion: hasDOM() && prefersReducedMotion(),
    };
  },
};

export const init = CursAnimation.init;
export const destroy = CursAnimation.destroy;
export const enable = CursAnimation.enable;
export const disable = CursAnimation.disable;
export const setCursor = CursAnimation.setCursor;
export const setOptions = CursAnimation.setOptions;
export const getOptions = CursAnimation.getOptions;
export const reveal = CursAnimation.reveal;
export const refresh = CursAnimation.refresh;
export { version };
export default CursAnimation;
