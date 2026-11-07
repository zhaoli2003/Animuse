import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = process.env.ANIMUSE_ORIGIN || "http://127.0.0.1:3000";
const files = ["animuse-logo.svg", "animuse-logo-dark.svg", "animuse-mark.svg", "animuse-mark-dark.svg", "animuse-og.svg", "animuse-og.png", "favicon.svg", "favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];
const hash = data => createHash("sha256").update(data).digest("hex");
const masterMark = await fs.readFile(path.join(root, "design/brand/animuse-mark.svg"));
for (const name of ["animuse-mark.svg", "favicon.svg"]) {
  const content = (await fs.readFile(path.join(root, "public", name), "utf8")).replace(/<style>[\s\S]*?<\/style>/g, "");
  assert.equal(hash(content), hash(masterMark), `${name} differs from the SVG master`);
}
const results = [];
for (const name of files) {
  const bytes = await fs.readFile(path.join(root, "public", name));
  if (name.endsWith(".svg")) assert.match(bytes.toString(), /<title(?:\s[^>]*)?>Animuse/);
  const response = await fetch(new URL(name, `${origin.replace(/\/$/, "")}/`));
  assert.equal(response.status, 200, name);
  const matches = hash(bytes) === hash(Buffer.from(await response.arrayBuffer()));
  assert.ok(matches, `Served asset differs: ${name}`);
  results.push({ file: name, status: response.status, matches });
}
for (const [name, width, height] of [["animuse-logo.svg", 832, 160], ["animuse-logo-dark.svg", 832, 160], ["animuse-og.png", 1200, 630], ["apple-touch-icon.png", 180, 180], ["icon-192.png", 192, 192], ["icon-512.png", 512, 512]]) {
  const metadata = await sharp(path.join(root, "public", name)).metadata();
  assert.equal(metadata.width, width, name);
  assert.equal(metadata.height, height, name);
}
const manifest = JSON.parse(await fs.readFile(path.join(root, "public/site.webmanifest"), "utf8"));
assert.equal(manifest.name, "Animuse");
assert.equal(manifest.short_name, "Animuse");
console.log(JSON.stringify({ brand: "Animuse", assets: results, pass: true }, null, 2));
