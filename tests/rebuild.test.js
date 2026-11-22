import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createEnv } from "./env.js";

const { default: CursAnimation } = await import("../src/index.js");

let env;
let controller;

const box = { left: 10, top: 10, width: 240, height: 120, right: 250, bottom: 130 };
const mediaBox = { left: 20, top: 60, width: 120, height: 60, right: 140, bottom: 120 };

function setup(html) {
  env = createEnv();
  env.document.body.innerHTML = html;
  for (const element of env.document.querySelectorAll(".reveal")) {
    element.getBoundingClientRect = () => box;
  }
  for (const image of env.document.querySelectorAll("img")) {
    image.getBoundingClientRect = () => mediaBox;
  }
}

function advance(ms) {
  env.flush(Math.ceil(ms / 16.667), 16.667);
}

afterEach(() => {
  if (controller) controller.destroy();
  controller = null;
  env.close();
});

test("rebuild types text, reveals the element and cleans up cursors", () => {
  setup('<div class="reveal"><h2>Hello there</h2><p>Some body text</p></div>');
  const element = env.document.querySelector(".reveal");
  const heading = element.querySelector("h2");
  controller = CursAnimation.rebuild({
    selector: ".reveal",
    revealClass: "visible",
    duration: 200,
    stagger: 0,
    maxConcurrent: 1,
    charDelay: 10,
    maxTypeDuration: 200,
  });
  env.intersect(element, 1);
  advance(260);
  assert.ok(heading.textContent.length > 0);
  assert.ok(heading.textContent.length < "Hello there".length);
  assert.equal(env.document.querySelectorAll(".ca-typing-caret").length, 1);
  advance(2500);
  assert.ok(element.classList.contains("visible"));
  assert.equal(heading.textContent, "Hello there");
  assert.equal(env.document.querySelector(".reveal p").textContent, "Some body text");
  assert.equal(env.document.querySelectorAll(".ca-typing-caret").length, 0);
  assert.equal(env.document.querySelectorAll(".ca-rebuild-cursor").length, 0);
});

test("rebuild hides on leave and replays on return", () => {
  setup('<div class="reveal"><h2>Title</h2></div>');
  const element = env.document.querySelector(".reveal");
  controller = CursAnimation.rebuild({
    selector: ".reveal",
    revealClass: "visible",
    duration: 120,
    stagger: 0,
    maxConcurrent: 1,
    charDelay: 8,
    maxTypeDuration: 160,
  });
  for (let cycle = 0; cycle < 3; cycle++) {
    env.intersect(element, 1);
    advance(1600);
    assert.ok(element.classList.contains("visible"), `enter ${cycle}`);
    env.intersect(element, 0);
    assert.equal(element.classList.contains("visible"), false, `leave ${cycle}`);
  }
});

test("leaving mid-build restores the original text", () => {
  setup('<div class="reveal"><h2>Hello there</h2><p>Some body text</p></div>');
  const element = env.document.querySelector(".reveal");
  controller = CursAnimation.rebuild({
    selector: ".reveal",
    revealClass: "visible",
    duration: 160,
    stagger: 0,
    maxConcurrent: 1,
    charDelay: 20,
    maxTypeDuration: 600,
  });
  env.intersect(element, 1);
  advance(230);
  assert.notEqual(element.querySelector("h2").textContent, "Hello there");
  env.intersect(element, 0);
  assert.equal(element.querySelector("h2").textContent, "Hello there");
  assert.equal(element.querySelector("p").textContent, "Some body text");
  assert.equal(element.classList.contains("visible"), false);
});

test("typeSelector only types inside matching elements", () => {
  setup('<div class="reveal"><h2>Typed heading</h2><button>Static button</button></div>');
  const element = env.document.querySelector(".reveal");
  const button = element.querySelector("button");
  controller = CursAnimation.rebuild({
    selector: ".reveal",
    revealClass: "visible",
    duration: 120,
    stagger: 0,
    maxConcurrent: 1,
    typeSelector: "h2",
    charDelay: 12,
    maxTypeDuration: 300,
  });
  env.intersect(element, 1);
  advance(200);
  assert.equal(button.textContent, "Static button");
  advance(1500);
  assert.equal(element.querySelector("h2").textContent, "Typed heading");
  assert.equal(button.textContent, "Static button");
});

test("media is hidden while typing and revealed after the pen stroke", () => {
  setup('<div class="reveal"><p>Caption text</p><img src="a.png"></div>');
  const element = env.document.querySelector(".reveal");
  const image = element.querySelector("img");
  controller = CursAnimation.rebuild({
    selector: ".reveal",
    revealClass: "visible",
    duration: 100,
    stagger: 0,
    maxConcurrent: 1,
    charDelay: 6,
    maxTypeDuration: 120,
  });
  env.intersect(element, 1);
  advance(140);
  assert.ok(image.classList.contains("ca-build-media"));
  advance(2000);
  assert.equal(image.classList.contains("ca-build-media"), false);
});
