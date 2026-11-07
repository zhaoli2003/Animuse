import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rewriteWebsiteResources, websiteBasePath } from './website-base-path.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../out');
const basePath = websiteBasePath();
if (!basePath) throw new Error('Pages preparation requires NEXT_PUBLIC_BASE_PATH');
let updated = 0;
// Website-only companion resources. Generated motion assets were already
// prefixed before hashing; AI packages, original HTML, and source JSON stay intact.
async function visit(folder) {
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected link: ${file}`);
    if (entry.isDirectory()) await visit(file);
    else if (/\.(?:html|css|js|svg)$/.test(entry.name)) {
      const text = await fs.readFile(file, 'utf8');
      const next = rewriteWebsiteResources(text, basePath);
      if (next !== text) { await fs.writeFile(file, next); updated++; }
    }
  }
}
for (const directory of ['fonts', 'assets/optimized', 'landing', 'previews']) await visit(path.join(root, directory));
const file = path.join(root, 'site.webmanifest');
const manifest = JSON.parse(await fs.readFile(file, 'utf8'));
manifest.start_url = `${basePath}/`;
manifest.scope = `${basePath}/`;
manifest.icons = manifest.icons.map(icon => ({...icon, src: icon.src.startsWith(`${basePath}/`) ? icon.src : `${basePath}${icon.src}`}));
await fs.writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared ${updated} website companion resources for ${basePath}; source downloads preserved.`);
