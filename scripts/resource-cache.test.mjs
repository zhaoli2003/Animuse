import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { request } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createStaticServer } from './serve-static.mjs';

let child, base, stopped;
test.before(async () => {
  child = spawn(process.execPath, ['scripts/serve-static.mjs'], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  stopped = new Promise(resolve => child.once('exit', resolve));
  await new Promise((resolve, reject) => {
    let output = '', errors = '';
    const fail = error => { clearTimeout(timeout); reject(error); };
    const timeout = setTimeout(() => { child.kill(); fail(new Error('Preview did not start: ' + errors)); }, 10000);
    child.once('error', fail);
    child.once('exit', code => fail(new Error(`Preview exited ${code}: ${errors}`)));
    child.stderr.on('data', chunk => { errors += chunk; });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { base = match[0]; clearTimeout(timeout); resolve(); }
    });
  });
});
test.after(async () => { child?.kill(); await stopped; });

const rawRequest = (origin, target, method = 'GET', headers = {}) => new Promise((resolve, reject) => {
  const url = new URL(origin);
  const req = request({ hostname: url.hostname, port: url.port, path: target, method, headers }, response => {
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
  });
  req.on('error', reject); req.end();
});

async function fixture(t, prepare = async () => {}) {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'zlui-static-test-'));
  const root = path.join(temporary, 'site');
  await fs.mkdir(root);
  await fs.writeFile(path.join(root, 'index.html'), '<h1>Fixture</h1>');
  await fs.writeFile(path.join(root, '404.html'), '<h1>Missing</h1>');
  await prepare({ root, temporary });
  const server = await createStaticServer(root);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    assert(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep));
    await fs.rm(temporary, { recursive: true, force: true });
  });
  return { root, temporary, origin: `http://127.0.0.1:${server.address().port}` };
}

test('unversioned static resources can be cached without making them immutable', async () => {
  for (const url of ['/fonts/misans.css', '/zlui-atlas-logo.svg', '/assets/components/original-asciify.png', '/motion/crumpled-paper.html']) {
    const response = await fetch(base + url, { method: 'HEAD' });
    assert.equal(response.status, 200, url);
    const policy = response.headers.get('cache-control');
    assert.match(policy, /public/, url);
    assert.match(policy, /max-age=[1-9]\d*/, url);
    assert(!policy.includes('immutable'), 'Mutable URLs must expire');
  }
});
test('ETag avoids resending unchanged HTML, CSS and images', async () => {
  for (const url of ['/', '/components', '/fonts/misans.css', '/assets/components/original-asciify.png']) {
    const first = await fetch(base + url, { method: 'HEAD' });
    const etag = first.headers.get('etag');
    assert(etag, url);
    const second = await fetch(base + url, { headers: { 'if-none-match': etag } });
    assert.equal(second.status, 304, url);
    assert.equal((await second.arrayBuffer()).byteLength, 0);
    const changed = await fetch(base + url, { method: 'HEAD', headers: { 'if-none-match': '"different-version"' } });
    assert.equal(changed.status, 200);
  }
});
test('errors and APIs are not cached and RSC never becomes a long-lived document', async () => {
  const missing = await fetch(base + '/does-not-exist.png');
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('cache-control'), 'no-store');
  const api = await fetch(base + '/api/contact');
  assert.equal(api.status, 404);
  assert.equal(api.headers.get('cache-control'), 'no-store');
  const page = await fetch(base + '/components', { method: 'HEAD' });
  assert.match(page.headers.get('cache-control'), /no-cache|max-age=0/);
  const rsc = await fetch(base + '/components.txt', { method: 'HEAD' });
  assert.match(rsc.headers.get('content-type'), /text\/x-component/);
  assert.match(rsc.headers.get('cache-control'), /no-cache|max-age=0/);
});

test('exported routes resolve to HTML and HEAD returns GET metadata without a body', async () => {
  for (const url of ['/', '/components', '/components/', '/docs/animations/glass-folder']) {
    const response = await fetch(base + url);
    const body = await response.arrayBuffer();
    assert.equal(response.status, 200, url);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    const head = await fetch(base + url, { method: 'HEAD' });
    assert.equal(head.status, 200);
    for (const header of ['content-type', 'content-length', 'etag', 'cache-control']) assert.equal(head.headers.get(header), response.headers.get(header));
    assert.equal(Number(head.headers.get('content-length')), body.byteLength);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
  }
  const expected = await fs.readFile('out/docs/animations/glass-folder.html', 'utf8');
  assert.equal(await (await fetch(base + '/docs/animations/glass-folder')).text(), expected);
  for (const url of ['/missing-page', '/404.html']) {
    const missing = await fetch(base + url);
    assert.equal(missing.status, 404);
    assert.equal(missing.headers.get('cache-control'), 'no-store');
    assert.equal(await missing.text(), await fs.readFile('out/404.html', 'utf8'));
  }
});

test('RSC navigation serves exported payloads and never falls back to HTML', async () => {
  for (const url of ['/components.txt', '/components?_rsc=client', '/?_rsc=client', '/components/__next._full.txt']) {
    const response = await fetch(base + url);
    assert.equal(response.status, 200, url);
    assert.match(response.headers.get('content-type'), /^text\/x-component/);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
    assert(!/^\s*<!doctype html/i.test(await response.text()));
  }
  const byHeader = await fetch(base + '/components', { headers: { RSC: '1' } });
  assert.equal(await byHeader.text(), await fs.readFile('out/components.txt', 'utf8'));
  const plain = await fetch(base + '/llms.txt');
  assert.match(plain.headers.get('content-type'), /^text\/plain/);
  for (const url of ['/missing-page?_rsc=client', '/missing-page.txt', '/components/__next.missing.txt', '/llms.txt?_rsc=client']) {
    const response = await fetch(base + url);
    assert.equal(response.status, 404, url);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert(!response.headers.get('content-type').includes('text/html'));
  }
});

test('every exported nested RSC segment resolves through its dotted prefetch alias', async () => {
  const exportedRoot = path.resolve('out');
  const entries = await fs.readdir(exportedRoot, { recursive: true, withFileTypes: true });
  const nested = entries.filter(entry => entry.isFile() && entry.name.endsWith('.txt'))
    .map(entry => path.relative(exportedRoot, path.join(entry.parentPath, entry.name)).replaceAll(path.sep, '/'))
    .filter(relative => relative.split('/').slice(0, -1).some(part => part.startsWith('__next.')));
  assert(nested.length > 0, 'The real export must include segment payloads');
  for (const relative of nested) {
    const parts = relative.split('/');
    const marker = parts.findIndex(part => part.startsWith('__next.'));
    const alias = '/' + [...parts.slice(0, marker), parts.slice(marker).join('.')].join('/');
    const response = await fetch(base + alias + '?_rsc=prefetch');
    assert.equal(response.status, 200, alias);
    assert.match(response.headers.get('content-type'), /^text\/x-component/);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await fs.readFile(path.join(exportedRoot, relative)), alias);
  }
  for (const [alias, direct] of [
    ['/components/__next.!KHNoZWxsKQ.components.__PAGE__.txt', '/components/__next.!KHNoZWxsKQ/components/__PAGE__.txt'],
    ['/docs/__next.!KHNoZWxsKQ.docs.__PAGE__.txt', '/docs/__next.!KHNoZWxsKQ/docs/__PAGE__.txt'],
  ]) {
    const first = await fetch(base + alias + '?_rsc=head', { method: 'HEAD' });
    const canonical = await fetch(base + direct, { method: 'HEAD' });
    assert.equal(first.status, 200);
    assert.equal(canonical.status, 200);
    for (const header of ['content-type', 'content-length', 'etag']) assert.equal(first.headers.get(header), canonical.headers.get(header));
    assert.equal((await first.arrayBuffer()).byteLength, 0);
    const cached = await fetch(base + alias, { headers: { 'If-None-Match': first.headers.get('etag') } });
    assert.equal(cached.status, 304);
  }
});

test('segment aliases preserve literal dots and reject collisions, missing payloads and linked escapes', async t => {
  const { origin } = await fixture(t, async ({ root, temporary }) => {
    const payloads = {
      '__next.test/route.with.dot/__PAGE__.txt': 'literal dot payload',
      '__next.test/a.b.txt': 'one segment',
      '__next.test/a/b.txt': 'two segments',
      'ordinary/folder/file.txt': 'not a segment payload',
    };
    for (const [relative, text] of Object.entries(payloads)) {
      const file = path.join(root, relative);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, text);
    }
    const outside = path.join(temporary, 'private');
    await fs.mkdir(outside);
    await fs.writeFile(path.join(outside, 'secret.txt'), 'private marker');
    await fs.symlink(outside, path.join(root, '__next.test/escape'), process.platform === 'win32' ? 'junction' : 'dir');
  });
  const literal = await fetch(origin + '/__next.test.route.with.dot.__PAGE__.txt?_rsc=known');
  assert.equal(literal.status, 200);
  assert.match(literal.headers.get('content-type'), /^text\/x-component/);
  assert.equal(await literal.text(), 'literal dot payload');
  for (const url of ['/__next.test.a.b.txt', '/__next.test.missing.__PAGE__.txt', '/ordinary.folder.file.txt', '/__next.test.escape.secret.txt']) {
    const response = await fetch(origin + url + '?_rsc=missing');
    assert.equal(response.status, 404, url);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert(!response.headers.get('content-type').includes('text/html'));
  }
  assert.equal((await fetch(origin + '/__next.test/escape/secret.txt?_rsc=escape')).status, 403);
  const traversal = await rawRequest(origin, '/__next.test/%2e%2e/%2e%2e/private/secret.txt?_rsc=escape');
  assert.equal(traversal.status, 403);
});

test('only GET and HEAD are supported, including for former business API routes', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const response = await fetch(base + '/api/contact', { method });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});

test('encoded traversal, malformed encoding and Windows alternate paths stay inside the root', async () => {
  for (const target of ['/../package.json', '/%2e%2e/package.json', '/%2e%2e%2fpackage.json', '/%2e%2e%5cpackage.json', '/C:%5cWindows%5cwin.ini', '/index.html:stream', '/%00']) {
    const result = await rawRequest(base, target);
    assert.equal(result.status, 403, target);
    assert.equal(result.headers['cache-control'], 'no-store');
  }
  assert.equal((await rawRequest(base, '/%broken')).status, 400);
});

test('filesystem links cannot expose files outside the export root', async t => {
  const { root, temporary, origin } = await fixture(t);
  const outside = path.join(temporary, 'private');
  await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, 'secret.txt'), 'outside marker');
  await fs.symlink(outside, path.join(root, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  const response = await fetch(origin + '/escape/secret.txt');
  assert.equal(response.status, 403);
  assert(!(await response.text()).includes('outside marker'));
});

test('validators revalidate mutable files and If-None-Match takes precedence over dates', async t => {
  const { root, origin } = await fixture(t);
  const file = path.join(root, 'mutable.css');
  await fs.writeFile(file, 'body{color:red}');
  const first = await fetch(origin + '/mutable.css', { method: 'HEAD' });
  const etag = first.headers.get('etag');
  const modified = first.headers.get('last-modified');
  for (const value of [etag, `"other", ${etag}`, '*']) {
    const response = await fetch(origin + '/mutable.css', { headers: { 'If-None-Match': value } });
    assert.equal(response.status, 304);
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
  assert.equal((await fetch(origin + '/mutable.css', { headers: { 'If-Modified-Since': modified } })).status, 304);
  assert.equal((await fetch(origin + '/mutable.css', { headers: { 'If-None-Match': '"stale"', 'If-Modified-Since': modified } })).status, 200);
  await fs.writeFile(file, 'body{color:blue}');
  const changed = await fetch(origin + '/mutable.css', { headers: { 'If-None-Match': etag } });
  assert.equal(changed.status, 200);
  assert.notEqual(changed.headers.get('etag'), etag);
  assert.equal(await changed.text(), 'body{color:blue}');
});

test('video byte ranges support seeking, suffixes, invalid ranges and If-Range', async () => {
  const url = '/assets/components/otp-verification-reference.mp4';
  const source = await fs.readFile('out' + url);
  for (const [range, start, end] of [['bytes=0-31', 0, 31], ['bytes=-16', source.length - 16, source.length - 1], [`bytes=${source.length - 16}-`, source.length - 16, source.length - 1]]) {
    const response = await fetch(base + url, { headers: { Range: range } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-type'), 'video/mp4');
    assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${source.length}`);
    assert.equal(Number(response.headers.get('content-length')), end - start + 1);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), source.subarray(start, end + 1));
  }
  for (const range of [`bytes=${source.length}-`, 'bytes=5-2', 'bytes=-0']) {
    const response = await fetch(base + url, { headers: { Range: range } });
    assert.equal(response.status, 416);
    assert.equal(response.headers.get('content-range'), `bytes */${source.length}`);
  }
  const head = await fetch(base + url, { method: 'HEAD', headers: { Range: 'bytes=0-31' } });
  assert.equal(head.status, 200);
  assert.equal(Number(head.headers.get('content-length')), source.length);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  const dateMatch = await fetch(base + url, { headers: { Range: 'bytes=0-31', 'If-Range': head.headers.get('last-modified') } });
  assert.equal(dateMatch.status, 206); await dateMatch.arrayBuffer();
  for (const validator of [head.headers.get('etag'), '"2099"', 'Wed, 01 Jan 1997 00:00:00 GMT']) {
    const mismatch = await fetch(base + url, { headers: { Range: 'bytes=0-31', 'If-Range': validator } });
    assert.equal(mismatch.status, 200);
    assert.equal((await mismatch.arrayBuffer()).byteLength, source.length);
  }
});
test('versioned runtime HTML, scripts and fonts are immutable and usable by opaque frames', async () => {
  const manifest = JSON.parse(await fs.readFile('public/site-motion-manifest.json', 'utf8'));
  const sample = manifest.components['fluid-tooltip'];
  for (const url of [sample.documentUrl, ...sample.resources, manifest.chineseFontStylesheet]) {
    const response = await fetch(base + url, { method: 'HEAD' });
    assert.equal(response.status, 200, url);
    assert.match(response.headers.get('cache-control'), /max-age=31536000,immutable/);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    if (/\.woff2?$/.test(url)) assert.match(response.headers.get('content-type'), /font\/woff/);
  }
});
