import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createEnv } from "./env.js";

const { default: CursAnimation } = await import("../src/index.js");
const { CURSOR_TYPES } = await import("../src/config.js");

let env;

function setup(options) {
  env = createEnv(options);
  env.document.body.innerHTML =
    '<a id="link" href="#">link</a><button id="btn">button</button><p id="text">paragraph</p><div id="plain">plain</div>';
  return env;
}

beforeEach(() => setup());

afterEach(() => {
  CursAnimation.destroy();
  env.close();
});

const root = () => env.document.querySelector(".ca-root");
const move = (x, y, extra) => env.pointer("pointermove", x, y, extra);

test("exposes the public API surface", () => {
  for (const name of ["init", "destroy", "enable", "disable", "setCursor", "setOptions", "reveal", "refresh"]) {
    assert.equal(typeof CursAnimation[name], "function", name);
  }
  assert.match(CursAnimation.version, /^\d+\.\d+\.\d+$/);
});

test("init mounts exactly one overlay and destroy removes everything", () => {
  const baseline = env.listeners;
  CursAnimation.init({ trail: true, particles: true });
  assert.equal(env.document.querySelectorAll(".ca-root").length, 1);
  assert.equal(root().getAttribute("aria-hidden"), "true");
  CursAnimation.destroy();
  assert.equal(env.document.querySelectorAll(".ca-root").length, 0);
  assert.equal(env.listeners, baseline);
  assert.equal(env.pending(), 0);
  assert.equal(env.document.documentElement.classList.contains("ca-hide-native"), false);
});

test("reinitialisation never duplicates overlays or listeners", () => {
  const baseline = env.listeners;
  for (let index = 0; index < 5; index++) CursAnimation.init({ trail: true });
  assert.equal(env.document.querySelectorAll(".ca-root").length, 1);
  const active = env.listeners - baseline;
  CursAnimation.destroy();
  assert.equal(env.listeners, baseline);
  CursAnimation.init({ trail: true });
  assert.equal(env.listeners - baseline, active);
});

test("every cursor style mounts and reports its style", () => {
  CursAnimation.init({ imageUrl: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" });
  for (const type of CURSOR_TYPES) {
    if (type === "image") continue;
    CursAnimation.setCursor(type);
    assert.equal(root().getAttribute("data-ca-style"), type);
  }
  CursAnimation.setCursor("image");
  assert.equal(root().getAttribute("data-ca-style"), "image");
  assert.ok(root().querySelector(".ca-head-inner img"));
  CursAnimation.setCursor("dot");
  assert.equal(root().querySelector(".ca-head-inner img"), null);
});

test("invalid options fail loudly", () => {
  assert.throws(() => CursAnimation.init({ cursor: "arrow" }), RangeError);
  assert.throws(() => CursAnimation.init({ cursor: "image" }), TypeError);
  assert.throws(() => CursAnimation.init({ nope: true }), RangeError);
  assert.throws(() => CursAnimation.init({ speed: "fast" }), TypeError);
  CursAnimation.destroy();
  assert.throws(() => CursAnimation.setCursor("dot"), /not initialised/);
});

test("pointer movement moves the head immediately and the body smoothly", () => {
  CursAnimation.init();
  move(100, 100);
  env.flush(2);
  move(300, 200);
  env.flush(1);
  const head = root().querySelector(".ca-head").style.transform;
  const body = root().querySelector(".ca-body").style.transform;
  assert.match(head, /translate3d\(300\.00px,200\.00px/);
  const bodyX = Number(body.match(/translate3d\(([\d.]+)px/)[1]);
  assert.ok(bodyX > 100 && bodyX < 300, `body at ${bodyX}`);
  env.flush(80);
  assert.match(root().querySelector(".ca-body").style.transform, /translate3d\(300\.00px,200\.00px/);
});

test("movement modes converge on the pointer", () => {
  for (const movement of ["instant", "smooth", "delayed", "elastic"]) {
    CursAnimation.init({ movement, cursor: "ring" });
    move(50, 50);
    env.flush(2);
    move(400, 300);
    env.flush(400);
    const value = root().querySelector(".ca-body").style.transform;
    const [x, y] = value.match(/translate3d\(([\d.-]+)px,([\d.-]+)px/).slice(1).map(Number);
    assert.ok(Math.abs(x - 400) < 1 && Math.abs(y - 300) < 1, `${movement}: ${x},${y}`);
  }
});

test("the animation loop goes idle after the cursor settles", () => {
  CursAnimation.init({ trail: true });
  move(10, 10);
  env.flush(2);
  move(200, 200);
  env.flush(600);
  assert.equal(env.pending(), 0);
  move(210, 210);
  assert.equal(env.pending(), 1);
});

test("trail builds the requested number of nodes and shows only while moving", () => {
  CursAnimation.init({ trail: { length: 9, style: "gradient" } });
  assert.equal(root().querySelectorAll(".ca-trail-dot").length, 9);
  move(20, 20);
  env.flush(1);
  move(60, 60);
  env.flush(2);
  assert.equal(root().querySelector(".ca-trail").style.opacity, "1");
  env.flush(60);
  assert.equal(root().querySelector(".ca-trail").style.opacity, "0");
  CursAnimation.setOptions({ trail: { length: 4 } });
  assert.equal(root().querySelectorAll(".ca-trail-dot").length, 4);
  CursAnimation.setOptions({ trail: false });
  assert.equal(root().querySelectorAll(".ca-trail-dot").length, 0);
});

test("particles are pooled, capped and recycled", () => {
  CursAnimation.init({ particles: { max: 20, lifetime: 200 }, clickEffects: { count: 30 } });
  move(100, 100);
  env.flush(1);
  for (let index = 0; index < 5; index++) env.pointer("pointerdown", 100, 100);
  env.flush(2);
  const created = root().querySelectorAll(".ca-particle").length;
  assert.ok(created > 0 && created <= 20, `created ${created}`);
  env.flush(40);
  for (let index = 0; index < 5; index++) env.pointer("pointerdown", 100, 100);
  env.flush(2);
  assert.ok(root().querySelectorAll(".ca-particle").length <= 20);
});

test("ambient particles follow movement only when enabled", () => {
  CursAnimation.init({ particles: { enabled: true, density: 10 }, clickEffects: false });
  move(0, 0);
  env.flush(1);
  for (let index = 1; index <= 20; index++) {
    move(index * 20, index * 10);
    env.flush(1);
  }
  assert.ok(root().querySelectorAll(".ca-particle").length > 0);
  CursAnimation.init({ particles: false, clickEffects: false });
  move(0, 0);
  env.flush(1);
  for (let index = 1; index <= 20; index++) {
    move(index * 20, index * 10);
    env.flush(1);
  }
  assert.equal(root().querySelectorAll(".ca-particle").length, 0);
});

test("click renders a ripple and recycles it", () => {
  CursAnimation.init({ clickEffects: { particles: false } });
  move(100, 100);
  env.flush(1);
  env.pointer("pointerdown", 100, 100);
  env.flush(2);
  const ring = root().querySelector(".ca-ring");
  assert.ok(ring);
  assert.ok(Number(ring.style.opacity) > 0);
  env.flush(60);
  assert.equal(ring.style.opacity, "0");
  env.pointer("pointerup", 100, 100);
  assert.equal(root().hasAttribute("data-ca-pressed"), false);
});

test("click effects can be switched off independently", () => {
  CursAnimation.init({ clickEffects: false });
  move(100, 100);
  env.pointer("pointerdown", 100, 100);
  env.flush(2);
  assert.equal(root().querySelectorAll(".ca-ring, .ca-particle").length, 0);
});

test("hover states follow link, button, text and ignored regions", () => {
  CursAnimation.init();
  const state = () => root().getAttribute("data-ca-state");
  move(10, 10, { target: env.document.getElementById("link") });
  assert.equal(state(), "link");
  move(10, 10, { target: env.document.getElementById("btn") });
  assert.equal(state(), "button");
  move(10, 10, { target: env.document.getElementById("text") });
  assert.equal(state(), "text");
  move(10, 10, { target: env.document.getElementById("plain") });
  assert.equal(state(), "idle");
  env.document.getElementById("plain").setAttribute("data-ca-hover", "link");
  CursAnimation.refresh();
  move(10, 10, { target: env.document.getElementById("plain") });
  assert.equal(state(), "link");
  env.document.getElementById("link").setAttribute("data-ca-ignore", "");
  CursAnimation.refresh();
  move(10, 10, { target: env.document.getElementById("link") });
  assert.equal(state(), "idle");
});

test("hover effects can be disabled", () => {
  CursAnimation.init({ hoverEffects: false });
  move(10, 10, { target: env.document.getElementById("link") });
  assert.equal(root().getAttribute("data-ca-state"), "idle");
});

test("drag state starts after the threshold and ends on release", () => {
  CursAnimation.init();
  move(100, 100);
  env.pointer("pointerdown", 100, 100);
  move(102, 101);
  assert.notEqual(root().getAttribute("data-ca-state"), "drag");
  move(140, 120);
  assert.equal(root().getAttribute("data-ca-state"), "drag");
  env.pointer("pointerup", 140, 120);
  assert.notEqual(root().getAttribute("data-ca-state"), "drag");
});

test("magnetic mode pulls the body toward the hovered element", () => {
  const link = env.document.getElementById("link");
  link.getBoundingClientRect = () => ({ left: 200, top: 200, right: 300, bottom: 240, width: 100, height: 40 });
  CursAnimation.init({ cursor: "ring", movement: "instant", magnetic: { strength: 0.5, radius: 120 } });
  move(310, 220);
  env.flush(2);
  env.flush(40, 200);
  const [x] = root().querySelector(".ca-body").style.transform.match(/translate3d\(([\d.-]+)px/).slice(1).map(Number);
  assert.ok(x < 310 && x > 250, `x=${x}`);
});

test("touch pointers hide the cursor and never show tap effects by default", () => {
  CursAnimation.init();
  move(50, 50);
  assert.equal(root().getAttribute("data-ca-visible"), "true");
  env.pointer("pointerdown", 80, 80, { pointerType: "touch" });
  env.flush(2);
  assert.equal(root().getAttribute("data-ca-visible"), "false");
  assert.equal(root().querySelectorAll(".ca-ring, .ca-particle").length, 0);
  assert.equal(env.document.documentElement.classList.contains("ca-hide-native"), false);
});

test("touch tap mode renders tap feedback", () => {
  CursAnimation.init({ touch: "tap" });
  env.pointer("pointerdown", 80, 80, { pointerType: "touch" });
  env.flush(2);
  assert.ok(root().querySelector(".ca-ring"));
});

test("native cursor is hidden only while a mouse is active", () => {
  CursAnimation.init();
  const html = env.document.documentElement;
  assert.equal(html.classList.contains("ca-hide-native"), false);
  move(10, 10);
  assert.equal(html.classList.contains("ca-hide-native"), true);
  env.pointer("mouseout", 0, 0, { relatedTarget: null });
  assert.equal(html.classList.contains("ca-hide-native"), false);
  CursAnimation.init({ hideNativeCursor: false });
  move(10, 10);
  assert.equal(env.document.documentElement.classList.contains("ca-hide-native"), false);
});

test("enable and disable detach listeners and stop the loop", () => {
  const baseline = env.listeners;
  CursAnimation.init({ trail: true });
  const active = env.listeners;
  move(10, 10);
  CursAnimation.disable();
  assert.equal(CursAnimation.isEnabled(), false);
  assert.equal(env.listeners, baseline);
  assert.equal(env.pending(), 0);
  assert.equal(root().getAttribute("data-ca-visible"), "false");
  CursAnimation.enable();
  assert.equal(CursAnimation.isEnabled(), true);
  assert.equal(env.listeners, active);
  move(20, 20);
  assert.equal(root().getAttribute("data-ca-visible"), "true");
});

test("setOptions applies colours, sizes and merges nested objects", () => {
  CursAnimation.init({ trail: { length: 6 } });
  CursAnimation.setOptions({ color: "#ff0066", size: 48, glow: true, trail: { style: "neon" } });
  assert.equal(root().style.getPropertyValue("--ca-color"), "#ff0066");
  assert.equal(root().style.getPropertyValue("--ca-size"), "48px");
  assert.equal(root().getAttribute("data-ca-glow"), "true");
  const options = CursAnimation.getOptions();
  assert.equal(options.trail.length, 6);
  assert.equal(options.trail.style, "neon");
  options.trail.length = 99;
  assert.equal(CursAnimation.getOptions().trail.length, 6);
});

test("reduced motion removes trail, particles and ripples", () => {
  env.setMedia("(prefers-reduced-motion: reduce)", true);
  CursAnimation.init({ trail: true, particles: true });
  assert.ok(root().classList.contains("ca-reduced"));
  assert.equal(root().querySelectorAll(".ca-trail-dot").length, 0);
  move(10, 10);
  env.pointer("pointerdown", 10, 10);
  env.flush(2);
  assert.equal(root().querySelectorAll(".ca-ring, .ca-particle").length, 0);
  env.setMedia("(prefers-reduced-motion: reduce)", false);
  assert.equal(root().classList.contains("ca-reduced"), false);
  assert.equal(root().querySelectorAll(".ca-trail-dot").length, 14);
});

test("reduced motion can be overridden", () => {
  env.setMedia("(prefers-reduced-motion: reduce)", true);
  CursAnimation.init({ trail: true, respectReducedMotion: false });
  assert.equal(root().querySelectorAll(".ca-trail-dot").length, 14);
});

test("works without PointerEvent using mouse and touch fallbacks", () => {
  CursAnimation.destroy();
  env.close();
  setup({ pointerEvents: false });
  CursAnimation.init({ touch: "tap" });
  env.pointer("mousemove", 70, 80);
  assert.equal(root().getAttribute("data-ca-visible"), "true");
  env.pointer("mousedown", 70, 80);
  env.flush(2);
  assert.ok(root().querySelector(".ca-ring"));
  CursAnimation.destroy();
  assert.equal(env.listeners, 0);
});

test("works without matchMedia", () => {
  CursAnimation.destroy();
  env.close();
  setup({ matchMedia: false });
  CursAnimation.init({ trail: true });
  assert.equal(root().querySelectorAll(".ca-trail-dot").length, 14);
  assert.equal(CursAnimation.capabilities().matchMedia, false);
});

test("initialisation waits for the body when it is missing", () => {
  CursAnimation.destroy();
  env.close();
  env = createEnv();
  const body = env.document.body;
  body.remove();
  CursAnimation.init();
  assert.equal(env.document.querySelector(".ca-root"), null);
  env.document.documentElement.appendChild(body);
  env.document.dispatchEvent(new env.window.Event("DOMContentLoaded"));
  assert.ok(env.document.querySelector(".ca-root"));
  CursAnimation.destroy();
});

test("overlay never intercepts pointer events", () => {
  CursAnimation.init({ trail: true });
  assert.equal(root().getAttribute("aria-hidden"), "true");
});

test("long interaction sessions do not leak nodes", () => {
  CursAnimation.init({ trail: true, particles: { enabled: true, max: 50 } });
  move(0, 0);
  env.flush(1);
  for (let index = 0; index < 400; index++) {
    move((index * 7) % 800, (index * 13) % 600);
    if (index % 25 === 0) env.pointer("pointerdown", 10, 10);
    env.flush(1);
  }
  const nodes = root().querySelectorAll("*").length;
  for (let index = 0; index < 400; index++) {
    move((index * 11) % 800, (index * 5) % 600);
    if (index % 25 === 0) env.pointer("pointerdown", 10, 10);
    env.flush(1);
  }
  assert.equal(root().querySelectorAll("*").length, nodes);
  assert.ok(root().querySelectorAll(".ca-particle").length <= 50);
});
