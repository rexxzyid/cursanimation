import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createEnv } from "./env.js";

const { default: CursAnimation } = await import("../src/index.js");

let env;
let controller;

function setup(options, html) {
  env = createEnv(options);
  env.document.body.innerHTML =
    html ||
    '<h1 id="a" data-ca-reveal>Title</h1><p id="b" data-ca-reveal="zoom-in">Body</p><ul data-ca-stagger="100"><li id="c1" data-ca-reveal>1</li><li id="c2" data-ca-reveal>2</li><li id="c3" data-ca-reveal>3</li></ul>';
}

beforeEach(() => setup());

afterEach(() => {
  if (controller) controller.destroy();
  controller = null;
  env.close();
});

const el = (id) => env.document.getElementById(id);

test("elements start hidden and reveal when they enter the viewport", () => {
  controller = CursAnimation.reveal();
  assert.ok(el("a").classList.contains("ca-reveal"));
  assert.equal(el("a").classList.contains("ca-in"), false);
  env.intersect(el("a"), 0.5);
  assert.ok(el("a").classList.contains("ca-in"));
});

test("elements hide again when leaving and replay when returning, repeatedly", () => {
  controller = CursAnimation.reveal({ once: false });
  for (let cycle = 0; cycle < 4; cycle++) {
    env.intersect(el("a"), 0.6);
    assert.ok(el("a").classList.contains("ca-in"), `enter ${cycle}`);
    env.intersect(el("a"), 0);
    assert.equal(el("a").classList.contains("ca-in"), false, `leave ${cycle}`);
  }
});

test("elements below the threshold do not reveal", () => {
  controller = CursAnimation.reveal({ threshold: 0.3 });
  env.intersect(el("a"), 0.1);
  assert.equal(el("a").classList.contains("ca-in"), false);
  env.intersect(el("a"), 0.35);
  assert.ok(el("a").classList.contains("ca-in"));
});

test("once mode keeps elements revealed and stops observing", () => {
  controller = CursAnimation.reveal({ once: true });
  env.intersect(el("a"), 0.5);
  assert.equal(env.observers[0].targets.has(el("a")), false);
  env.intersect(el("a"), 0);
  assert.ok(el("a").classList.contains("ca-in"));
});

test("per-element animations override the default", () => {
  controller = CursAnimation.reveal({ animation: "blur-in" });
  assert.equal(el("a").getAttribute("data-ca-anim"), "blur-in");
  assert.equal(el("b").getAttribute("data-ca-anim"), "zoom-in");
});

test("every animation name is accepted and invalid ones are rejected", () => {
  for (const animation of ["fade", "fade-up", "fade-down", "fade-left", "fade-right", "zoom-in", "scale-up", "blur-in"]) {
    CursAnimation.reveal({ animation }).destroy();
  }
  assert.throws(() => CursAnimation.reveal({ animation: "spin" }), RangeError);
  assert.throws(() => CursAnimation.reveal({ unknown: 1 }), RangeError);
});

test("grouped elements are staggered on entry and instant on exit", () => {
  controller = CursAnimation.reveal({ delay: 20 });
  env.intersect(el("c1"), 1);
  env.intersect(el("c3"), 1);
  assert.equal(el("c1").style.getPropertyValue("--ca-delay"), "20ms");
  assert.equal(el("c3").style.getPropertyValue("--ca-delay"), "220ms");
  env.intersect(el("c3"), 0);
  assert.equal(el("c3").style.getPropertyValue("--ca-delay"), "0ms");
});

test("data-ca-delay and data-ca-duration are honoured", () => {
  el("a").setAttribute("data-ca-delay", "340");
  el("a").setAttribute("data-ca-duration", "1200");
  controller = CursAnimation.reveal();
  env.intersect(el("a"), 1);
  assert.equal(el("a").style.getPropertyValue("--ca-delay"), "340ms");
  assert.equal(el("a").style.getPropertyValue("--ca-reveal-duration"), "1200ms");
});

test("refresh picks up new elements and releases removed ones", () => {
  controller = CursAnimation.reveal();
  const added = env.document.createElement("section");
  added.id = "late";
  added.setAttribute("data-ca-reveal", "");
  env.document.body.appendChild(added);
  CursAnimation.refresh();
  assert.ok(added.classList.contains("ca-reveal"));
  env.intersect(added, 1);
  assert.ok(added.classList.contains("ca-in"));
  added.remove();
  CursAnimation.refresh();
  assert.equal(added.classList.contains("ca-reveal"), false);
});

test("destroy restores elements and disconnects the observer", () => {
  controller = CursAnimation.reveal();
  env.intersect(el("a"), 1);
  controller.destroy();
  assert.equal(el("a").classList.contains("ca-reveal"), false);
  assert.equal(el("a").classList.contains("ca-in"), false);
  assert.equal(el("a").hasAttribute("data-ca-anim"), false);
  assert.equal(el("a").style.getPropertyValue("--ca-delay"), "");
  assert.equal(env.observers[0].targets.size, 0);
  controller = null;
});

test("reduced motion shows everything immediately", () => {
  env.setMedia("(prefers-reduced-motion: reduce)", true);
  controller = CursAnimation.reveal();
  assert.ok(el("a").classList.contains("ca-in"));
  assert.ok(el("c3").classList.contains("ca-in"));
});

test("switching to reduced motion at runtime reveals hidden elements", () => {
  controller = CursAnimation.reveal();
  assert.equal(el("a").classList.contains("ca-in"), false);
  env.setMedia("(prefers-reduced-motion: reduce)", true);
  assert.ok(el("a").classList.contains("ca-in"));
});

test("without IntersectionObserver every element is visible", () => {
  env.close();
  setup({ intersectionObserver: false });
  controller = CursAnimation.reveal();
  assert.ok(el("a").classList.contains("ca-in"));
  assert.equal(CursAnimation.capabilities().intersectionObserver, false);
});

test("without matchMedia reveal still works", () => {
  env.close();
  setup({ matchMedia: false });
  controller = CursAnimation.reveal();
  env.intersect(el("a"), 1);
  assert.ok(el("a").classList.contains("ca-in"));
});

test("multiple reveal instances coexist and clean up independently", () => {
  controller = CursAnimation.reveal({ selector: "[data-ca-reveal]" });
  const second = CursAnimation.reveal({ selector: "#a", animation: "fade" });
  second.destroy();
  assert.equal(el("a").classList.contains("ca-reveal"), false);
  assert.ok(el("b").classList.contains("ca-reveal"));
});
