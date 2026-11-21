import { createElement } from "./dom.js";

const SVGNS = "http://www.w3.org/2000/svg";

const COLORS = [
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
  "#00B5CE",
];

const ARROW_D =
  "M4.6 3.9 C4.2 3.1 4.9 2.4 5.7 2.8 L20.6 9.4 C21.5 9.8 21.4 11.1 20.4 11.3 L13.9 12.9 C13.4 13 13 13.4 12.9 13.9 L11.3 20.4 C11.1 21.4 9.8 21.5 9.4 20.6 Z";

const HOT = { arrow: [5, 3.5], cross: [12, 12], pen: [3, 3], ibeam: [12, 12] };

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function shapeSVG(shape, color) {
  const stroke = 'stroke="#fff" stroke-width="1.5" stroke-linejoin="round"';
  switch (shape) {
    case "cross":
      return (
        `<g stroke-linecap="round"><path d="M12 3.5 V20.5 M3.5 12 H20.5" stroke="#fff" stroke-width="3.6"/>` +
        `<path d="M12 3.5 V20.5 M3.5 12 H20.5" stroke="${color}" stroke-width="1.5"/></g>`
      );
    case "pen":
      return (
        `<path d="M17.4 10.6 L20.6 13.8 L13.8 20.6 L10.6 17.4 Z" fill="${color}" ${stroke}/>` +
        `<path d="M3 3 L13.1 6.3 L17.4 10.6 L10.6 17.4 L6.3 13.1 Z" fill="${color}" ${stroke}/>` +
        `<path d="M3.6 3.6 L8.9 8.9" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>` +
        `<circle cx="10.2" cy="10.2" r="1.75" fill="none" stroke="#fff" stroke-width="1.2"/>`
      );
    case "ibeam":
      return (
        `<g fill="none" stroke-linecap="round">` +
        `<path d="M8.5 4.5 H10.5 Q12 4.5 12 6 Q12 4.5 13.5 4.5 H15.5 M12 6 V18 M8.5 19.5 H10.5 Q12 19.5 12 18 Q12 19.5 13.5 19.5 H15.5" stroke="#fff" stroke-width="3.6"/>` +
        `<path d="M8.5 4.5 H10.5 Q12 4.5 12 6 Q12 4.5 13.5 4.5 H15.5 M12 6 V18 M8.5 19.5 H10.5 Q12 19.5 12 18 Q12 19.5 13.5 19.5 H15.5" stroke="${color}" stroke-width="1.5"/></g>`
      );
    default:
      return `<path d="${ARROW_D}" fill="${color}" ${stroke}/>`;
  }
}

export class Swarm {
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
      speed: fast ? rand(1000, 1500) : rand(320, 760),
      force: fast ? rand(3500, 6000) : rand(750, 1800),
      spin: fast ? rand(2.2, 3.4) : rand(0.8, 1.8),
      curl: rand(-1, 1),
      orbit: rand(70, 170),
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
    const dt = Math.min(0.064, Math.max(0.001, frames * 0.016667));
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
        fx = fx * 0.7 + (ax / weight) * 0.3;
        fy = fy * 0.7 + (ay / weight) * 0.3;
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
}
