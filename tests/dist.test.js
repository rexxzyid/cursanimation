import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createEnv } from "./env.js";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const require = createRequire(import.meta.url);

test("all distribution files exist", () => {
  for (const file of [
    "cursanimation.js",
    "cursanimation.min.js",
    "cursanimation.esm.js",
    "cursanimation.esm.min.js",
    "cursanimation.cjs",
    "cursanimation.css",
    "cursanimation.min.css",
  ]) {
    assert.ok(existsSync(`dist/${file}`), file);
  }
  assert.ok(existsSync("types/index.d.ts"));
});

test("every export target in package.json exists", () => {
  const targets = [pkg.main, pkg.module, pkg.unpkg, pkg.jsdelivr, pkg.style, pkg.types];
  const walk = (value) => {
    if (typeof value === "string") targets.push(value);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(pkg.exports);
  for (const target of targets) {
    if (target.includes("*")) continue;
    assert.ok(existsSync(target), target);
  }
});

for (const file of ["cursanimation.js", "cursanimation.min.js"]) {
  test(`${file} exposes window.CursAnimation and runs end to end`, () => {
    const env = createEnv();
    env.window.eval(readFileSync(`dist/${file}`, "utf8"));
    const api = env.window.CursAnimation;
    assert.equal(api.version, pkg.version);
    for (const method of ["init", "destroy", "enable", "disable", "setCursor", "setOptions", "reveal", "refresh"]) {
      assert.equal(typeof api[method], "function", method);
    }
    env.document.body.innerHTML = '<h1 data-ca-reveal>t</h1>';
    api.init({ trail: true, particles: true });
    env.pointer("pointermove", 20, 20);
    env.pointer("pointerdown", 20, 20);
    env.flush(5);
    assert.equal(env.document.querySelectorAll(".ca-root").length, 1);
    const reveal = api.reveal();
    env.intersect(env.document.querySelector("h1"), 1);
    assert.ok(env.document.querySelector("h1").classList.contains("ca-in"));
    reveal.destroy();
    api.destroy();
    assert.equal(env.document.querySelectorAll(".ca-root").length, 0);
    env.close();
  });
}

test("ES module build resolves through the package exports", async () => {
  const module = await import("@rexxzyid/cursanimation");
  assert.equal(module.version, pkg.version);
  assert.equal(module.default.version, pkg.version);
  assert.equal(typeof module.init, "function");
  assert.equal(typeof module.reveal, "function");
});

test("CommonJS build resolves through the package exports", () => {
  const api = require("@rexxzyid/cursanimation");
  assert.equal(api.version, pkg.version);
  assert.equal(typeof api.init, "function");
});

test("server-side rendering is a safe no-op", async () => {
  const module = await import("@rexxzyid/cursanimation");
  assert.equal(typeof window, "undefined");
  module.init({ trail: true });
  module.setCursor("dot");
  module.refresh();
  const controller = module.reveal();
  controller.destroy();
  module.destroy();
  assert.equal(module.default.isSupported(), false);
});

test("minified CSS keeps every reveal animation and cursor style", () => {
  const css = readFileSync("dist/cursanimation.min.css", "utf8");
  for (const name of ["fade-up", "fade-down", "fade-left", "fade-right", "zoom-in", "scale-up", "blur-in"]) {
    assert.ok(css.includes(`data-ca-anim=${name}`) || css.includes(`data-ca-anim="${name}"`), name);
  }
  for (const name of ["circle", "crosshair", "image"]) {
    assert.ok(css.includes(`data-ca-style=${name}`) || css.includes(`data-ca-style="${name}"`), name);
  }
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(css.includes("pointer-events:none"));
});

test("type declarations cover the documented API", () => {
  const types = readFileSync("types/index.d.ts", "utf8");
  for (const method of ["init", "destroy", "enable", "disable", "setCursor", "setOptions", "reveal", "refresh"]) {
    assert.ok(types.includes(`${method}(`), method);
  }
  assert.ok(types.includes("readonly version"));
});
