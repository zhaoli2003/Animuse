import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultDirectory = fileURLToPath(new URL('../out/', import.meta.url));
const inside = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
};

/** Materialize Next export segment aliases for a host without rewrite rules. */
export async function preparePagesExport(directory = defaultDirectory) {
  const root = path.resolve(directory);
  const rootStat = await fs.lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('Export root must be a real directory, not a link.');
  const realRoot = await fs.realpath(root);
  const samePath = process.platform === 'win32'
    ? realRoot.toLowerCase() === root.toLowerCase()
    : realRoot === root;
  if (!samePath) throw new Error('Export root must not traverse linked directories.');

  const files = new Map();
  async function inventory(folder, ancestors = []) {
    for (const name of await fs.readdir(folder)) {
      const parts = [...ancestors, name];
      const target = path.join(root, ...parts);
      if (!inside(root, target)) throw new Error('Export entry escaped the output directory.');
      const stat = await fs.lstat(target);
      if (stat.isSymbolicLink()) throw new Error('Export contains a symbolic link: ' + parts.join('/'));
      if (stat.isDirectory()) await inventory(target, parts);
      else if (stat.isFile()) {
        if (stat.nlink !== 1) throw new Error('Export contains a hard link: ' + parts.join('/'));
        files.set(parts.join('/'), { target, parts, bytes: stat.size });
      } else throw new Error('Export contains a non-regular entry: ' + parts.join('/'));
    }
  }
  await inventory(root);
  if (!files.has('index.html')) throw new Error('Export must contain index.html.');

  const aliases = new Map();
  let payloads = 0;
  for (const [relative, file] of files) {
    if (!relative.endsWith('.txt')) continue;
    const marker = file.parts.findIndex(part => part.startsWith('__next.'));
    if (marker < 0) continue;
    payloads++;
    if (marker === file.parts.length - 1) continue;
    const alias = [...file.parts.slice(0, marker), file.parts.slice(marker).join('.')].join('/');
    if (aliases.has(alias) && aliases.get(alias).source !== relative) {
      throw new Error('Ambiguous Next segment alias: ' + alias);
    }
    const target = path.join(root, ...alias.split('/'));
    if (!inside(root, target)) throw new Error('Next segment alias escaped the output directory.');
    aliases.set(alias, { source: relative, target, bytes: file.bytes, sourcePath: file.target });
  }

  // Complete conflict checks before creating any files. Existing equal copies
  // are safe to reuse; differing files and directory collisions are rejected.
  const pending = [];
  let reused = 0;
  for (const [alias, entry] of aliases) {
    let stat;
    try { stat = await fs.lstat(entry.target); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat) {
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error('Alias target is not a regular independent file: ' + alias);
      const [original, existing] = await Promise.all([fs.readFile(entry.sourcePath), fs.readFile(entry.target)]);
      if (!original.equals(existing)) throw new Error('Conflicting Next segment alias: ' + alias);
      reused++;
    } else pending.push(entry);
  }
  const markerPath = path.join(root, '.nojekyll');
  const markerExists = files.has('.nojekyll');
  if (!markerExists) {
    try {
      await fs.lstat(markerPath);
      throw new Error('.nojekyll must be a regular file.');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }

  let copiedBytes = 0;
  for (const entry of pending) {
    // Exclusive creation cannot overwrite a file added after preflight.
    const payload = await fs.readFile(entry.sourcePath);
    await fs.writeFile(entry.target, payload, { flag: 'wx' });
    copiedBytes += payload.length;
  }
  if (!markerExists) await fs.writeFile(markerPath, '', { flag: 'wx' });
  return { root, payloads, aliases: aliases.size, created: pending.length, reused, copiedBytes, nojekyllCreated: !markerExists };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.length > 3) throw new Error('Usage: node scripts/prepare-pages-export.mjs [export-directory]');
    console.log(JSON.stringify(await preparePagesExport(process.argv[2]), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
