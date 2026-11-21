import { JSDOM } from "jsdom";

export function createEnv(options = {}) {
  const dom = new JSDOM(options.html || "<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
    url: "https://example.test/",
    runScripts: options.runScripts,
  });
  const { window } = dom;
  const env = { dom, window, document: window.document, frames: [], listeners: 0, media: new Map() };

  let time = 0;
  let nextId = 1;
  const queue = new Map();
  window.requestAnimationFrame = (callback) => {
    const id = nextId++;
    queue.set(id, callback);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    queue.delete(id);
  };
  env.pending = () => queue.size;
  env.flush = (count = 1, step = 16.667) => {
    for (let index = 0; index < count; index++) {
      const batch = [...queue.entries()];
      queue.clear();
      time += step;
      for (const [, callback] of batch) callback(time);
    }
  };

  const warm = window.document.createElement("div");
  window.document.body.appendChild(warm);
  warm.querySelector(".ca-warm");
  warm.querySelectorAll("[data-ca-warm], .ca-warm, a[href]");
  warm.matches(".ca-warm");
  warm.closest(".ca-warm");
  warm.remove();

  Object.defineProperty(window, "performance", {
    value: { now: () => time },
    configurable: true,
  });

  const track = (target) => {
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);
    target.addEventListener = (type, listener, opts) => {
      env.listeners++;
      return add(type, listener, opts);
    };
    target.removeEventListener = (type, listener, opts) => {
      env.listeners--;
      return remove(type, listener, opts);
    };
  };
  track(window);
  track(window.document);

  if (options.pointerEvents !== false) {
    window.PointerEvent = class PointerEvent extends window.MouseEvent {
      constructor(type, init = {}) {
        super(type, init);
        this.pointerType = init.pointerType || "mouse";
      }
    };
  } else {
    delete window.PointerEvent;
  }

  if (options.matchMedia !== false) {
    window.matchMedia = (query) => {
      if (!env.media.has(query)) {
        env.media.set(query, { matches: false, handlers: new Set() });
      }
      const state = env.media.get(query);
      return {
        get matches() {
          return state.matches;
        },
        media: query,
        addEventListener: (type, handler) => state.handlers.add(handler),
        removeEventListener: (type, handler) => state.handlers.delete(handler),
      };
    };
  } else {
    delete window.matchMedia;
  }
  env.setMedia = (query, matches) => {
    window.matchMedia(query);
    const state = env.media.get(query);
    state.matches = matches;
    for (const handler of state.handlers) handler({ matches });
  };

  env.observers = [];
  if (options.intersectionObserver !== false) {
    window.IntersectionObserver = class {
      constructor(callback, init) {
        this.callback = callback;
        this.init = init;
        this.targets = new Set();
        env.observers.push(this);
      }
      observe(target) {
        this.targets.add(target);
      }
      unobserve(target) {
        this.targets.delete(target);
      }
      disconnect() {
        this.targets.clear();
      }
    };
  }
  env.intersect = (target, ratio) => {
    for (const observer of env.observers) {
      if (!observer.targets.has(target)) continue;
      observer.callback([
        { target, isIntersecting: ratio > 0, intersectionRatio: ratio },
      ]);
    }
  };

  env.pointer = (type, x, y, extra = {}) => {
    const target = extra.target || window.document.body;
    const EventType = window.PointerEvent || window.MouseEvent;
    const event = new EventType(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: extra.button || 0,
      pointerType: extra.pointerType || "mouse",
      relatedTarget: extra.relatedTarget || null,
    });
    target.dispatchEvent(event);
    return event;
  };

  globalThis.window = window;
  globalThis.document = window.document;
  env.close = () => {
    window.close();
    delete globalThis.window;
    delete globalThis.document;
  };
  return env;
}
