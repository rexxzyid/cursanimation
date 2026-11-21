import { createElement } from "./dom.js";
import { features } from "./compat.js";

export class Trail {
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
}
