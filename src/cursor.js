import { createElement } from "./dom.js";

const LAYOUT = {
  default: { head: true, body: true, headScale: 0.2 },
  circle: { head: false, body: true, headScale: 0 },
  dot: { head: true, body: false, headScale: 0.45 },
  ring: { head: false, body: true, headScale: 0 },
  crosshair: { head: true, body: false, headScale: 0.9 },
  minimal: { head: true, body: false, headScale: 0.14 },
  image: { head: true, body: false, headScale: 0 },
};

const STRETCH_BLOCKED = ["image", "crosshair"];

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
  if (
    Math.abs(targetX - state.x) < 0.1 &&
    Math.abs(targetY - state.y) < 0.1 &&
    Math.abs(state.vx) < 0.05 &&
    Math.abs(state.vy) < 0.05
  ) {
    state.x = targetX;
    state.y = targetY;
    state.vx = 0;
    state.vy = 0;
  }
}

export class Cursor {
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
    const headSize =
      config.cursor === "image"
        ? config.imageSize
        : Math.max(4, Math.round(config.size * this.layout.headScale));
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

    return (
      Math.abs(pulledX - leader.x) > 0.1 ||
      Math.abs(pulledY - leader.y) > 0.1 ||
      Math.abs(leader.vx) > 0.05 ||
      Math.abs(leader.vy) > 0.05
    );
  }

  destroy() {
    this.head.remove();
    this.body.remove();
    this.image = null;
  }
}
