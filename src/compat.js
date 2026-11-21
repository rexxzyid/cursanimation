export const hasDOM = () => typeof window !== "undefined" && typeof document !== "undefined";

export const now = () => {
  const clock = typeof window !== "undefined" && window.performance ? window.performance : null;
  return clock && typeof clock.now === "function" ? clock.now() : Date.now();
};

export const features = {
  pointerEvents: () => hasDOM() && "PointerEvent" in window,
  intersectionObserver: () => hasDOM() && "IntersectionObserver" in window,
  matchMedia: () => hasDOM() && typeof window.matchMedia === "function",
  colorMix: () =>
    hasDOM() &&
    typeof window.CSS !== "undefined" &&
    typeof window.CSS.supports === "function" &&
    window.CSS.supports("color", "color-mix(in srgb, red, blue)"),
};

export function matches(query) {
  return features.matchMedia() && window.matchMedia(query).matches;
}

export const prefersReducedMotion = () => matches("(prefers-reduced-motion: reduce)");

export function watchMedia(query, callback) {
  if (!features.matchMedia()) return () => {};
  const list = window.matchMedia(query);
  if (typeof list.addEventListener === "function") {
    list.addEventListener("change", callback);
    return () => list.removeEventListener("change", callback);
  }
  if (typeof list.addListener === "function") {
    list.addListener(callback);
    return () => list.removeListener(callback);
  }
  return () => {};
}

export function requestFrame(callback) {
  if (typeof window.requestAnimationFrame === "function") return window.requestAnimationFrame(callback);
  return window.setTimeout(() => callback(now()), 16);
}

export function cancelFrame(id) {
  if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(id);
  else window.clearTimeout(id);
}
