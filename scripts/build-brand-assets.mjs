import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
// Every production size uses this vector master, including the cursor cutout.
const mark = await fs.readFile(path.join(root, "design/brand/animuse-mark.svg"), "utf8");
const darkMark = mark.replace('fill="#151515"', 'fill="#f5f5f5"');
const artwork = svg => svg.replace(/^[\s\S]*?<desc[^>]*>[\s\S]*?<\/desc>/, "").replace(/<\/svg>\s*$/, "");
const lockup = (color, symbol) => `<svg xmlns="http://www.w3.org/2000/svg" width="832" height="160" viewBox="0 0 832 160" role="img" aria-label="Animuse"><title>Animuse</title><g transform="translate(0 8) scale(1.125)">${artwork(symbol)}</g><text x="180" y="130" fill="${color}" font-family="Arial,Helvetica,sans-serif" font-size="154" font-weight="750" letter-spacing="-6">Animuse</text></svg>\n`;
// Browser-tab color follows the browser theme; page logos follow the website theme.
const favicon = mark.replace("</desc>", '</desc><style>@media(prefers-color-scheme:dark){.front-card{fill:#f5f5f5}}</style>');
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><title>Animuse — Free UI components for your next idea</title><rect width="1200" height="630" fill="#0a0a0a"/><g transform="translate(90 126) scale(1.5)">${artwork(darkMark)}</g><text x="324" y="296" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="150" font-weight="750" letter-spacing="-7">Animuse</text><text x="100" y="385" fill="#b7b7b7" font-family="Arial,Helvetica,sans-serif" font-size="31">Free UI components. Ready for your next idea.</text><path d="M100 490h1000" stroke="#343434"/><text x="100" y="548" fill="#8a8a8a" font-family="Arial,Helvetica,sans-serif" font-size="24">Curated by zhaoli</text></svg>\n`;

for (const [name, svg] of Object.entries({
  "animuse-logo.svg": lockup("#151515", mark),
  "animuse-logo-dark.svg": lockup("#f5f5f5", darkMark),
  "animuse-mark.svg": mark,
  "animuse-mark-dark.svg": darkMark,
  "animuse-og.svg": og,
  "favicon.svg": favicon,
})) await fs.writeFile(path.join(publicDir, name), svg);
// App-launcher icons use a light surface to stay clear on any wallpaper.
const appIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#faf9f6"/><g transform="translate(64 64) scale(3)">${artwork(mark)}</g></svg>`;
for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  await sharp(Buffer.from(appIcon)).resize(size, size).png().toFile(path.join(publicDir, name));
}
await sharp(Buffer.from(og)).png().toFile(path.join(publicDir, "animuse-og.png"));

// PNG frames keep the fallback browser icon in sync with the same mark.
const frames = await Promise.all([16, 32, 48].map(async size => ({
  size, data: await sharp(Buffer.from(mark)).resize(size, size).flatten({ background: "#faf9f6" }).png().toBuffer(),
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
console.log("Generated Animuse card-and-cursor logos, social preview and browser/app icons.");
