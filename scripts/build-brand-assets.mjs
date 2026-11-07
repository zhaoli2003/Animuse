import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
// Animuse's own assets; upstream component demo artwork stays intact.
const wordmark = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="160" viewBox="0 0 640 160" role="img" aria-label="Animuse"><title>Animuse</title><text x="4" y="130" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="154" font-weight="750" letter-spacing="-6">Animuse</text></svg>\n';
const mark = await fs.readFile(path.join(root, "design/brand/animuse-mark.svg"), "utf8");
const og = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><title>Animuse — Free UI components for your next idea</title><rect width="1200" height="630" fill="#0a0a0a"/><text x="92" y="296" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="174" font-weight="750" letter-spacing="-7">Animuse</text><text x="100" y="385" fill="#b7b7b7" font-family="Arial,Helvetica,sans-serif" font-size="31">Free UI components. Ready for your next idea.</text><path d="M100 490h1000" stroke="#343434"/><text x="100" y="548" fill="#8a8a8a" font-family="Arial,Helvetica,sans-serif" font-size="24">Curated by zhaoli</text></svg>\n';

for (const [name, svg] of Object.entries({
  "animuse-logo.svg": wordmark,
  "animuse-mark.svg": mark,
  "animuse-og.svg": og,
  "favicon.svg": mark,
})) await fs.writeFile(path.join(publicDir, name), svg);
for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  await sharp(Buffer.from(mark)).resize(size, size).png().toFile(path.join(publicDir, name));
}
await sharp(Buffer.from(og)).png().toFile(path.join(publicDir, "animuse-og.png"));

// PNG frames keep the fallback browser icon in sync with the same mark.
const frames = await Promise.all([16, 32, 48].map(async size => ({
  size, data: await sharp(Buffer.from(mark)).resize(size, size).png().toBuffer(),
})));
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, i) => {
  const start = 6 + i * 16;
  header[start] = frame.size;
  header[start + 1] = frame.size;
  header.writeUInt16LE(1, start + 4);
  header.writeUInt16LE(32, start + 6);
  header.writeUInt32LE(frame.data.length, start + 8);
  header.writeUInt32LE(offset, start + 12);
  offset += frame.data.length;
});
await fs.writeFile(path.join(publicDir, "favicon.ico"), Buffer.concat([header, ...frames.map(frame => frame.data)]));
console.log("Generated Animuse wordmark, mark, social preview and browser/app icons.");
