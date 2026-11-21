import { createElement } from "./dom.js";

const RING_LIMIT = 8;
const FRAME = 16.667;

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export class Particles {
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
    for (const particle of this.pool) if (!particle.active) return particle;
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
      spin: 0,
    };
    this.pool.push(particle);
    return particle;
  }

  spawn(x, y, speed, angle) {
    const particle = this.acquire();
    if (!particle) return;
    const settings = this.config;
    const velocity = speed * (0.5 + Math.random() * 0.8);
    const shape =
      settings.shape === "mixed" ? (Math.random() < 0.5 ? "sparkle" : "dot") : settings.shape;
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
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.5;
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
}
