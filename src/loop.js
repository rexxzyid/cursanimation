import { requestFrame, cancelFrame } from "./compat.js";

export function createLoop(step) {
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
    },
  };
}
