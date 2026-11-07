import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import Ajv from 'ajv';
import { run } from '../integrations/skills/animuse/scripts/animuse.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const prefix = '/Animuse';
const source = '// Copyright LeiBox; retain the original notice.\nexport const image = "/assets/original.png";\n';

async function fixture(t) {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'animuse-base-'));
  const discovery = { category: 'text', useCases: ['文字选区'], searchTerms: ['selection', '文字选区'], visualTags: ['minimal'], interactions: ['text-selection'], caveat: 'Preserve source notices.' };
  const entry = {
    slug: 'selection-demo', name: { en: 'Selection demo', zh: '文字选区演示' },
    description: { en: 'Animate a selection.', zh: '文字选区动效' },
    docsPath: `${prefix}/docs/selection-demo/`, detailPath: `${prefix}/ai/components/selection-demo.json`,
    markdownPath: `${prefix}/ai/components/selection-demo.md`, previewPath: `${prefix}/assets/motion/selection-demo.html`,
    frameworks: ['react'], renderers: [], discovery,
    source: { kind: 'project-source', provider: 'LeiBox', license: 'Retain original notice.' },
    distribution: { installProvider: 'animuse' },
  };
  const packagePath = `${prefix}/ai/packages/selection-demo/react.json`;
  const detail = { ...entry, packages: { react: { url: packagePath, component: 'SelectionDemo', dependencies: ['react'] } } };
  const bundle = { dependencies: ['react'], usage: 'Import SelectionDemo from the downloaded file.', files: [{ path: 'SelectionDemo.tsx', content: source, sha256: digest(source) }] };
  const indexItem = { slug: entry.slug, name: entry.name, summary: entry.description.zh, frameworks: entry.frameworks, renderers: entry.renderers, docsPath: entry.docsPath, detailPath: entry.detailPath, previewPath: entry.previewPath, sourceProvider: 'animuse', discovery };
  const index = {
    $schema: `${prefix}/ai/search-index.schema.json`, schemaVersion: 1, revision: digest(JSON.stringify([indexItem])), total: 1,
    siteOrigin: 'http://fixture.invalid', siteBaseUrl: `http://fixture.invalid${prefix}/`, basePath: prefix,
    links: { catalog: `${prefix}/ai/catalog.json`, guide: `${prefix}/ai/README.md`, skill: `${prefix}/ai/SKILL.md` },
    facets: { categories: { text: 1 }, frameworks: { react: 1 }, visualTags: { minimal: 1 } }, items: [indexItem],
  };
  const documents = new Map([
    [`${prefix}/ai/search-index.json`, index],
    [`${prefix}/ai/catalog.json`, { schemaVersion: 1, items: [entry] }],
    [entry.detailPath, detail], [packagePath, bundle],
  ]);
  const requests = [];
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    requests.push(pathname);
    response.writeHead(documents.has(pathname) ? 200 : 404, { 'content-type': 'application/json' });
    response.end(JSON.stringify(documents.get(pathname) ?? { error: 'not_found' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const base = origin + prefix;
  index.siteOrigin = origin;
  index.siteBaseUrl = base + '/';
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    const resolved = await fs.realpath(folder);
    assert.equal(path.dirname(resolved), await fs.realpath(os.tmpdir()));
    assert(path.basename(resolved).startsWith('animuse-base-'));
    await fs.rm(resolved, { recursive: true, force: true });
  });
  return { base, origin, folder, entry, detail, bundle, index, packagePath, requests };
}

test('a directory-only site supports list, search, recommend, show and pull without changing source bytes', async t => {
  const site = await fixture(t);
  assert.equal((await fetch(site.origin + '/ai/catalog.json')).status, 404);
  site.requests.length = 0;
  const invoke = args => run(args, { cwd: site.folder, env: { ANIMUSE_ORIGIN: site.base + '/' } });
  assert.equal((await invoke(['list'])).count, 1);
  assert.equal((await invoke(['search', '文字选区'])).items[0].slug, site.entry.slug);
  assert.equal((await invoke(['recommend', 'selection', '--framework', 'react'])).items[0].slug, site.entry.slug);
  assert.equal((await invoke(['show', site.entry.slug])).selectedPackage.url, site.packagePath);
  const pulled = await invoke(['pull', site.entry.slug]);
  assert.equal(pulled.origin, site.base);
  assert.equal(pulled.provider, 'animuse');
  assert.deepEqual(pulled.source, site.entry.source);
  assert.equal(await fs.readFile(pulled.files[0].path, 'utf8'), source);
  assert.equal(pulled.files[0].sha256, digest(source));
  assert(site.requests.every(url => url.startsWith(prefix + '/ai/')));
  assert.equal((await run(['help', '--origin', site.base], { env: { ANIMUSE_ORIGIN: 'https://unused.invalid' } })).origin, site.base);
  const validate = new Ajv({ allErrors: true }).compile(JSON.parse(await fs.readFile('scripts/ai-search-index.schema.json')));
  assert(validate(site.index), JSON.stringify(validate.errors));
});

test('source links resolve once under the base and cannot escape to a sibling project or origin', async t => {
  const site = await fixture(t);
  const invoke = () => run(['pull', site.entry.slug, '--origin', site.base], { cwd: site.folder, env: {} });
  for (const reference of [site.packagePath, 'ai/packages/selection-demo/react.json', '/ai/packages/selection-demo/react.json', site.origin + site.packagePath]) {
    site.detail.packages.react.url = reference;
    assert.equal((await invoke()).files[0].sha256, digest(source), reference);
    assert.equal(site.requests.at(-1), site.packagePath);
  }
  for (const reference of ['/Other/ai/package.json', '/AnimuseOther/ai/package.json', site.origin + '/ai/package.json', 'https://outside.invalid/Animuse/ai/package.json', '/Animuse/../Other/package.json', '/Animuse/%2e%2e/Other/package.json', '/Animuse/%2fOther/package.json']) {
    site.detail.packages.react.url = reference;
    const before = site.requests.length;
    await assert.rejects(invoke(), { code: 'INVALID_SOURCE' }, reference);
    assert.equal(site.requests.length - before, 2, 'only the catalog and selected detail are requested');
  }
  assert.equal(await fs.readFile(path.join(site.folder, 'components/animuse/selection-demo/SelectionDemo.tsx'), 'utf8'), source);
});

async function siteHelpers(siteUrl, basePath) {
  const result = await build({ entryPoints: ['src/lib/site-url.ts'], bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'silent',
    define: { 'process.env.NEXT_PUBLIC_SITE_URL': JSON.stringify(siteUrl), 'process.env.NEXT_PUBLIC_BASE_PATH': JSON.stringify(basePath) } });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

test('public links preserve deployment directories once while root builds and external assets stay usable', async () => {
  const deployed = await siteHelpers('https://zhaoli2003.github.io/Animuse/', '/Animuse');
  assert.equal(deployed.BASE_PATH, '/Animuse');
  for (const value of ['/ai/catalog.json', '/Animuse/ai/catalog.json', 'ai/catalog.json']) {
    assert.equal(deployed.publicPath(value), '/Animuse/ai/catalog.json');
    assert.equal(deployed.siteUrl(value), 'https://zhaoli2003.github.io/Animuse/ai/catalog.json');
  }
  assert.equal(deployed.publicPath('/Animuse-other/logo.svg'), '/Animuse/Animuse-other/logo.svg');
  assert.equal(deployed.publicPath('/Animuse?category=text'), '/Animuse?category=text');
  for (const value of ['https://example.com/a.png', '//example.com/a.png', 'data:image/svg+xml;base64,AA==', 'blob:https://example.com/id', '#selection']) assert.equal(deployed.publicPath(value), value);
  const local = await siteHelpers('http://127.0.0.1:3000', '');
  assert.equal(local.publicPath('/ai/catalog.json'), '/ai/catalog.json');
  assert.equal(local.siteUrl('/ai/catalog.json'), 'http://127.0.0.1:3000/ai/catalog.json');
  assert.equal(deployed.normalizeSiteBaseUrl('https://example.com/Project/'), 'https://example.com/Project');
  for (const value of ['https://example.com/../Other', 'https://example.com/%2e%2e/Other', 'https://example.com/%2fOther', 'https://user@example.com/Project', 'https://example.com/Project?q=1', 'file:///tmp']) assert.throws(() => deployed.normalizeSiteBaseUrl(value), undefined, value);
});
