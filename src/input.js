import { features, now } from "./compat.js";

const TOUCH_GUARD_MS = 700;

export function bindInput(handlers) {
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
    button: event.button,
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
