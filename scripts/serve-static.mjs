/** Local static preview only: no accounts, database, forms, or mail delivery. */
import http from 'node:http';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pipeline } from 'node:stream/promises';

const defaultRoot = fileURLToPath(new URL('../out/', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.webm': 'video/webm', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.wasm': 'application/wasm',
};

const inside = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
};

function cachePolicy(relative, rsc) {
  if (rsc) return 'no-cache';
  if (relative.startsWith('_next/static/')) return 'public,max-age=31536000,immutable';
  // Only content-addressed filenames get an immutable policy.
  if (/^(assets\/(motion|optimized)\/|doc-assets\/|fonts\/misans\/)/.test(relative)
      && /(?:^|[-.\/])[a-f0-9]{12,64}(?:[-.]|$)/i.test(relative)) return 'public,max-age=31536000,immutable';
  if (relative.endsWith('.html') && !/^(motion|landing|previews)\//.test(relative)) return 'no-cache';
  if (/^(ai\/|r\/)|(?:^|\/)(?:doc-assets-index|site-motion-manifest)\.json$/.test(relative)) return 'no-cache';
  return 'public,max-age=3600';
}

function rangeFor(header, size) {
  // Multipart ranges are optional; serve the full representation for them.
  if (!header?.startsWith('bytes=') || header.includes(',')) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size === 0) return false;
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if ((first !== null && !Number.isSafeInteger(first)) || (last !== null && !Number.isSafeInteger(last))) return false;
  if (first === null) return last > 0 ? { start: Math.max(0, size - last), end: size - 1 } : false;
  if (first >= size || (last !== null && last < first)) return false;
  return { start: first, end: Math.min(last ?? size - 1, size - 1) };
}

export async function createStaticServer(directory = defaultRoot) {
  const root = await fs.realpath(path.resolve(directory));
  await fs.access(path.join(root, 'index.html'));
  const segmentPayloads = new Set();
  const segmentAliases = new Map();
  // Next requests dotted segment names while export writes nested directories.
  // Index actual payloads once; never derive a filesystem path by replacing request dots.
  async function indexSegments(folder, ancestors = []) {
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      const parts = [...ancestors, entry.name];
      if (entry.isDirectory()) await indexSegments(path.join(folder, entry.name), parts);
      else if (entry.isFile() && entry.name.endsWith('.txt')) {
        const marker = parts.findIndex(part => part.startsWith('__next.'));
        if (marker < 0) continue;
        const relative = parts.join('/');
        segmentPayloads.add(relative);
        if (marker === parts.length - 1) continue;
        const alias = '/' + [...parts.slice(0, marker), parts.slice(marker).join('.')].join('/');
        // Distinct paths can contain literal dots. Ambiguous aliases stay unavailable.
        if (!segmentAliases.has(alias)) segmentAliases.set(alias, relative);
        else if (segmentAliases.get(alias) !== relative) segmentAliases.set(alias, null);
      }
    }
  }
  await indexSegments(root);

  async function findFile(candidates) {
    for (const candidate of candidates) {
      if (!inside(root, candidate)) throw Object.assign(new Error('Forbidden'), { status: 403 });
      try {
        const real = await fs.realpath(candidate);
        if (!inside(root, real)) throw Object.assign(new Error('Forbidden'), { status: 403 });
        const stat = await fs.stat(real);
        if (stat.isFile()) return { file: real, stat, relative: path.relative(root, candidate).replaceAll(path.sep, '/') };
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
      }
    }
    return null;
  }

  return http.createServer(async (req, res) => {
    const shared = { 'X-Content-Type-Options': 'nosniff', 'Access-Control-Allow-Origin': '*' };
    const errorResponse = (status, message, extra = {}) => {
      const body = Buffer.from(message);
      res.writeHead(status, { ...shared, 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': body.length, ...extra });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    try {
      if (!['GET', 'HEAD'].includes(req.method)) return errorResponse(405, 'Method not allowed', { Allow: 'GET, HEAD' });
      if (!req.url?.startsWith('/') || req.url.startsWith('//')) return errorResponse(400, 'Bad request');
      let pathname;
      try { pathname = decodeURIComponent(req.url.split(/[?#]/, 1)[0]); }
      catch { return errorResponse(400, 'Bad request'); }
      // Validate before URL normalization, including Windows separators and alternate data streams.
      if (pathname.includes('\\') || pathname.includes(':') || pathname.includes('\0') || pathname.split('/').includes('..')) return errorResponse(403, 'Forbidden');
      const requestUrl = new URL(req.url, 'http://static.local');
      const wantsRsc = req.headers.rsc === '1' || req.headers.accept?.includes('text/x-component') || requestUrl.searchParams.has('_rsc');
      const base = path.resolve(root, '.' + pathname);
      const extension = path.extname(base);
      let candidates;
      if (wantsRsc) {
        candidates = base === root ? [path.join(root, 'index.txt')] : extension === '.txt' ? [base]
          : extension === '.html' ? [base.slice(0, -5) + '.txt']
          : extension ? [] : [base + '.txt', path.join(base, 'index.txt')];
      } else {
        candidates = base === root ? [path.join(root, 'index.html')] : [base];
        if (base !== root && !extension) candidates.push(base + '.html', path.join(base, 'index.html'));
      }
      let found = await findFile(candidates);
      if (!found && extension === '.txt') {
        const relative = segmentAliases.get(pathname);
        if (relative) found = await findFile([path.join(root, relative)]);
      }
      let status = 200;
      if (!found) {
        // Missing RSC payloads and assets never fall back to successful HTML documents.
        if (wantsRsc || (extension && extension !== '.html')) return errorResponse(404, 'Not found');
        found = await findFile([path.join(root, '404.html')]);
        if (!found) return errorResponse(404, 'Not found');
        status = 404;
      }
      const { file, stat, relative } = found;
      if (['404.html', '_not-found.html'].includes(relative)) status = 404;
      const ext = path.extname(file).toLowerCase();
      const isRsc = ext === '.txt' && (segmentPayloads.has(relative) || path.basename(file).startsWith('__next.') || Boolean(await findFile([file.slice(0, -4) + '.html'])));
      if (wantsRsc && !isRsc) return errorResponse(404, 'Not found');
      const modified = stat.mtime.toUTCString();
      // Metadata validators are weak; If-Range never treats them as byte-identical strong tags.
      const etag = `W/"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs * 1000).toString(16)}"`;
      const headers = {
        ...shared, 'Content-Type': isRsc ? 'text/x-component; charset=utf-8' : types[ext] || 'application/octet-stream',
        'Cache-Control': status === 404 ? 'no-store' : cachePolicy(relative, isRsc),
        'Content-Length': stat.size, 'Last-Modified': modified, ETag: etag, 'Accept-Ranges': 'bytes',
        Vary: 'RSC, Accept',
      };
      if (status === 200) {
        const noneMatch = req.headers['if-none-match'];
        const since = Date.parse(req.headers['if-modified-since'] || '');
        const unchanged = noneMatch !== undefined
          ? noneMatch.split(',').some(value => value.trim() === '*' || value.trim().replace(/^W\//, '') === etag.slice(2))
          : Number.isFinite(since) && Math.floor(stat.mtimeMs / 1000) * 1000 <= since;
        if (unchanged) {
          delete headers['Content-Length'];
          res.writeHead(304, headers);
          return res.end();
        }
      }
      let range = null;
      if (status === 200 && req.method === 'GET' && req.headers.range) {
        const ifRange = req.headers['if-range'];
        const rangeDate = ifRange && !/^(?:W\/)?"/.test(ifRange.trim()) ? Date.parse(ifRange) : NaN;
        if (!ifRange || (Number.isFinite(rangeDate) && Math.floor(stat.mtimeMs / 1000) * 1000 <= rangeDate)) range = rangeFor(req.headers.range, stat.size);
        if (range === false) return errorResponse(416, 'Range not satisfiable', { 'Content-Range': `bytes */${stat.size}`, 'Accept-Ranges': 'bytes' });
        if (range) {
          status = 206;
          headers['Content-Range'] = `bytes ${range.start}-${range.end}/${stat.size}`;
          headers['Content-Length'] = range.end - range.start + 1;
        }
      }
      res.writeHead(status, headers);
      if (req.method === 'HEAD') return res.end();
      await pipeline(createReadStream(file, range || {}), res);
    } catch (error) {
      if (res.headersSent) return res.destroy();
      const status = error.status || (['EACCES', 'EPERM'].includes(error.code) ? 403 : 500);
      errorResponse(status, status === 403 ? 'Forbidden' : 'Static file unavailable');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port');
    const server = await createStaticServer();
    server.on('error', error => { console.error(error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`ZLUIAtlas 本地预览：http://127.0.0.1:${server.address().port}`));
  } catch (error) {
    console.error(error.code === 'ENOENT' ? '请先运行 npm run build，再启动本地预览。' : error.message);
    process.exitCode = 1;
  }
}
