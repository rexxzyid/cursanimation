import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const versionSource = readFileSync("src/version.js", "utf8");
if (!versionSource.includes(`"${pkg.version}"`)) {
  throw new Error(`src/version.js does not match package.json version ${pkg.version}`);
}

const devOnly = process.argv.includes("--dev");
const banner = `CursAnimation v${pkg.version} | MIT | RexxHayanasi | https://cursanimation.rexxhayanasi.cv`;
const header = `/*! ${banner} */`;

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

const common = {
  entryPoints: ["src/index.js"],
  bundle: true,
  target: ["es2018"],
  legalComments: "none",
  banner: { js: header },
  logLevel: "warning",
};

const iifeFooter =
  'if(typeof window!=="undefined"){window.CursAnimation=CursAnimationBundle.default;}';

const jobs = [
  {
    ...common,
    format: "iife",
    globalName: "CursAnimationBundle",
    footer: { js: iifeFooter },
    outfile: "dist/cursanimation.js",
    sourcemap: true,
  },
  { ...common, format: "esm", outfile: "dist/cursanimation.esm.js", sourcemap: true },
  {
    ...common,
    format: "cjs",
    footer: { js: "module.exports=Object.assign(module.exports.default,module.exports);" },
    outfile: "dist/cursanimation.cjs",
  },
  {
    entryPoints: ["src/cursanimation.css"],
    bundle: false,
    outfile: "dist/cursanimation.css",
    banner: { css: header },
    logLevel: "warning",
  },
];

if (!devOnly) {
  jobs.push(
    {
      ...common,
      format: "iife",
      globalName: "CursAnimationBundle",
      footer: { js: iifeFooter },
      minify: true,
      outfile: "dist/cursanimation.min.js",
      sourcemap: true,
    },
    { ...common, format: "esm", minify: true, outfile: "dist/cursanimation.esm.min.js" },
    {
      entryPoints: ["src/cursanimation.css"],
      bundle: false,
      minify: true,
      outfile: "dist/cursanimation.min.css",
      banner: { css: header },
      logLevel: "warning",
    }
  );
}

for (const job of jobs) await build(job);

for (const file of [
  "cursanimation.js",
  "cursanimation.esm.js",
  "cursanimation.cjs",
  "cursanimation.css",
  "cursanimation.min.js",
  "cursanimation.esm.min.js",
  "cursanimation.min.css",
]) {
  try {
    const path = `dist/${file}`;
    const size = statSync(path).size;
    const gzip = gzipSync(readFileSync(path)).length;
    console.log(`${file.padEnd(28)} ${String(size).padStart(7)} B   gzip ${String(gzip).padStart(6)} B`);
  } catch {
    continue;
  }
}
