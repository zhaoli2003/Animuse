import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const brandDir = path.join(root, "design/brand");
const master = await fs.readFile(path.join(brandDir, "animuse-glass-master.png"));
const small = await fs.readFile(path.join(brandDir, "animuse-glass-small.png"));
for (const [name, input] of [["master", master], ["small", small]]) {
  const metadata = await sharp(input).metadata();
  const { channels } = await sharp(input).stats();
  assert.ok(metadata.hasAlpha && channels.at(-1).min === 0 && channels.at(-1).max === 255, `${name} must have genuine transparency`);
}
const png = (input, size) => sharp(input).resize(size, size, { fit: "contain", background: "#00000000" }).png({ compressionLevel: 9 }).toBuffer();
const uri = bytes => `data:image/png;base64,${bytes.toString("base64")}`;
const full512 = await png(master, 512);
const full160 = await png(master, 160);
const simple64 = await png(small, 64);
const svg = (width, height, body, title = "Animuse") => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Animuse"><title>${title}</title>${body}</svg>\n`;
const raster = (bytes, x, y, width, height = width) => `<image x="${x}" y="${y}" width="${width}" height="${height}" href="${uri(bytes)}"/>`;
// SVG containers embed the approved raster art; they are not vector redraws.
const mark = svg(512, 512, raster(full512, 0, 0, 512));
const favicon = svg(64, 64, raster(simple64, 0, 0, 64));
const lockup = color => svg(832, 160, `${raster(full160, 0, 0, 160)}<text x="180" y="130" fill="${color}" font-family="Arial,Helvetica,sans-serif" font-size="154" font-weight="750" letter-spacing="-6">Animuse</text>`);
const og = svg(1200, 630, `<defs><radialGradient id="glow"><stop stop-color="#502075" stop-opacity=".35"/><stop offset="1" stop-color="#130d1e" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="#130d1e"/><ellipse cx="250" cy="270" rx="400" ry="320" fill="url(#glow)"/>${raster(full512, 66, 132, 250)}<text x="352" y="294" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="145" font-weight="750" letter-spacing="-6">Animuse</text><text x="360" y="350" fill="#c9bdd9" font-family="Arial,Helvetica,sans-serif" font-size="23" letter-spacing="4">INTERACTION IN MOTION</text><path d="M100 470h1000" stroke="#44344f"/><text x="100" y="533" fill="#ccc3d6" font-family="Arial,Helvetica,sans-serif" font-size="25">Free UI components. Ready for your next idea.</text><text x="100" y="576" fill="#a494b4" font-family="Arial,Helvetica,sans-serif" font-size="19">Curated by zhaoli</text>`, "Animuse — Free UI components for your next idea");

for (const [name, content] of Object.entries({ "animuse-logo.svg": lockup("#151515"), "animuse-logo-dark.svg": lockup("#f5f5f5"), "animuse-mark.svg": mark, "favicon.svg": favicon, "animuse-og.svg": og })) {
  await fs.writeFile(path.join(publicDir, name), content);
}
await fs.writeFile(path.join(brandDir, "animuse-mark.svg"), mark);
await fs.writeFile(path.join(publicDir, "animuse-mark.png"), full512);
await fs.writeFile(path.join(publicDir, "favicon-32.png"), await png(small, 32));
const appIcon = svg(512, 512, `<rect width="512" height="512" rx="112" fill="#130d1e"/>${raster(full512, 24, 24, 464)}`);
for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  await sharp(Buffer.from(appIcon)).resize(size, size).png().toFile(path.join(publicDir, name));
}
await sharp(Buffer.from(og)).png().toFile(path.join(publicDir, "animuse-og.png"));

const frames = await Promise.all([16, 32, 48].map(async size => ({ size, data: await png(small, size) })));
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

// Inspect the actual production pixels at native favicon sizes on both surfaces.
const proof = [];
for (const [x, background, color] of [[0, "#faf9f6", "#151515"], [600, "#130d1e", "#f5f5f5"]]) {
  proof.push(`<rect x="${x}" width="600" height="640" fill="${background}"/>${raster(full512, x + 170, 48, 260)}`);
  for (const [i, frame] of frames.entries()) proof.push(`${raster(frame.data, x + 155 + i * 135, 370, frame.size)}<text x="${x + 155 + i * 135}" y="450" fill="${color}" font-family="Arial" font-size="15">${frame.size}px</text>`);
  proof.push(raster(await sharp(Buffer.from(lockup(color))).resize(260, 50).png().toBuffer(), x + 170, 520, 260, 50));
}
await sharp(Buffer.from(svg(1200, 640, proof.join("")))).png().toFile(path.join(brandDir, "animuse-icon-preview.png"));
console.log("Generated Animuse liquid-glass brand assets, transparent icons and light/dark size proof.");
