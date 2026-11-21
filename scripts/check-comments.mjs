import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const roots = ["src", "scripts", "tests"];
const extensions = new Set([".js", ".mjs", ".css", ".ts"]);
const offenders = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (extensions.has(extname(path)) && !path.endsWith("check-comments.mjs")) inspect(path);
  }
}

function inspect(path) {
  const text = readFileSync(path, "utf8");
  const stripped = text.replace(/https?:\/\/[^\s"'`)]+/g, "");
  stripped.split("\n").forEach((line, index) => {
    if (/(^|[^:"'`\w])\/\//.test(line) || /\/\*/.test(line)) {
      if (!/^\s*const header = /.test(line) && !/banner/.test(line)) offenders.push(`${path}:${index + 1}`);
    }
  });
}

for (const root of roots) walk(root);

if (offenders.length > 0) {
  console.error("Comments found:\n" + offenders.join("\n"));
  process.exit(1);
}
console.log("No comments found in source");
