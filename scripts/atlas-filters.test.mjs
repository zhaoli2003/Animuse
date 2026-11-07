import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

// Bundle in memory: the same browser-safe TypeScript modules run without a Next server.
const root = fileURLToPath(new URL('../', import.meta.url));
const bundled = await build({
  stdin: { contents: 'export * from "./src/data/atlas-taxonomy.ts"; export * from "./src/lib/atlas-filters.ts"; export { AI_DISCOVERY } from "./src/data/ai-discovery.ts"; export { interactionTranslations } from "./src/lib/i18n/interactions.ts"; export { docsTranslations } from "./src/lib/i18n/docs.ts";', resolveDir: root, loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm', metafile: true,
});
const { ATLAS_ITEMS, ATLAS_FACETS, AI_DISCOVERY, interactionTranslations, docsTranslations, FILTER_DIMENSIONS, EMPTY_FILTERS, parseFilters, serializeFilters, filterItems, countFacet, toggleFilter } =
  await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const state = (values = {}) => ({ ...parseFilters(''), ...values });
const slugs = (items) => items.map(({ slug }) => slug).sort();

test('all 53 components have stable unique routes and one valid main/subtype assignment', () => {
  assert.equal(ATLAS_ITEMS.length, 53);
  assert.equal(new Set(ATLAS_ITEMS.map((item) => item.slug)).size, 53);
  assert.equal(new Set(ATLAS_ITEMS.map((item) => item.href)).size, 53);
  const categories = new Map(ATLAS_FACETS.category.map((facet) => [facet.id, facet]));
  assert.equal(ATLAS_FACETS.category.filter((facet) => !facet.parent).length, 10);
  for (const item of ATLAS_ITEMS) {
    assert.equal(item.category.length, 2, item.slug);
    const [main, subtype] = item.category;
    assert.equal(categories.get(main).parent, undefined, item.slug);
    assert.equal(categories.get(subtype).parent, main, item.slug);
    assert(item.scene.length > 0, `${item.slug} needs a use-case topic`);
    assert(item.searchText.includes(item.slug));
    for (const dimension of FILTER_DIMENSIONS) {
      const valid = new Set(ATLAS_FACETS[dimension].map((facet) => facet.id));
      assert.equal(new Set(item[dimension]).size, item[dimension].length, `${item.slug}/${dimension} duplicate`);
      assert(item[dimension].every((id) => valid.has(id)), `${item.slug}/${dimension} invalid facet`);
    }
  }
  for (const dimension of FILTER_DIMENSIONS) {
    assert.equal(new Set(ATLAS_FACETS[dimension].map((facet) => facet.id)).size, ATLAS_FACETS[dimension].length);
  }
  const expected = { input: 6, 'navigation-layout': 9, 'cards-media': 11, text: 3, feedback: 3, 'files-collaboration': 3, 'background-effects': 10, 'hero-models': 6, data: 1, templates: 1 };
  for (const [id, total] of Object.entries(expected)) assert.equal(countFacet(ATLAS_ITEMS, state(), 'category', id), total, id);
});

test('browser taxonomy does not pull source prompts or component implementation packages into its dependency graph', () => {
  const dependencies = Object.keys(bundled.metafile.inputs);
  assert(!dependencies.some((path) => /interaction-components\.ts$|(?:^|\/)prompts\//.test(path)), dependencies.join('\n'));
});

test('same-dimension selections use OR without duplicating a parent/child match', () => {
  const actual = filterItems(ATLAS_ITEMS, state({ category: ['text-selection', 'buttons'] }));
  assert.deepEqual(slugs(actual), ['notes-text-color', 'selection-flower', 'tactile-push-button']);
  assert.deepEqual(slugs(filterItems(ATLAS_ITEMS, state({ category: ['text', 'text-selection'] }))), ['inline-text-morph', 'notes-text-color', 'selection-flower']);
});

test('different dimensions and query words use AND', () => {
  assert.deepEqual(slugs(filterItems(ATLAS_ITEMS, state({ category: ['text'], visual: ['glass'], interaction: ['text-selection'], framework: ['react'], q: 'notes color' }))), ['notes-text-color']);
  assert.equal(filterItems(ATLAS_ITEMS, state({ category: ['text'], visual: ['glass'], q: 'flowers' })).length, 0);
  assert.equal(filterItems(ATLAS_ITEMS, state({ category: ['text'], visual: ['glass'], interaction: ['drag'] })).length, 0);
});

test('parent selections include descendants even when a caller supplies leaf-only categories', () => {
  const leafOnly = ATLAS_ITEMS.map((item) => ({ ...item, category: item.category.slice(1) }));
  assert.equal(filterItems(leafOnly, state({ category: ['text'] })).length, 3);
  assert.equal(countFacet(leafOnly, state(), 'category', 'text'), 3);
  assert.equal(countFacet(ATLAS_ITEMS, state(), 'category', 'text-selection'), 2);
});

test('facet counts ignore the current dimension but retain other dimensions and search', () => {
  const selected = state({ category: ['input'], visual: ['glass'] });
  assert.equal(filterItems(ATLAS_ITEMS, selected).length, 0);
  assert.equal(countFacet(ATLAS_ITEMS, selected, 'category', 'text'), 1);
  assert.equal(countFacet(ATLAS_ITEMS, selected, 'category', 'text-selection'), 1);
  assert.equal(countFacet(ATLAS_ITEMS, state({ category: ['text-selection'], q: 'flowers' }), 'category', 'text'), 1);
  assert.equal(countFacet(ATLAS_ITEMS, state({ category: ['text'], visual: ['glass'] }), 'visual', 'botanical'), 1);
  assert.equal(countFacet(ATLAS_ITEMS, state(), 'category', 'missing'), 0);
});

test('URL parsing accepts repeated/comma parameters, removes duplicates, and rejects unknown values', () => {
  const parsed = parseFilters('?category=text,buttons&category=text-selection,text&visual=glass,invalid&framework=unknown&bogus=value&q=%20%E7%8E%BB%E7%92%83%20%20%E6%96%87%E4%BB%B6%E5%A4%B9%20');
  assert.deepEqual(parsed.category, ['buttons', 'text']);
  assert.deepEqual(parsed.visual, ['glass']);
  assert.deepEqual(parsed.framework, ['unknown']);
  assert.equal(parsed.q, '玻璃 文件夹');
  assert(!Object.hasOwn(parsed, 'bogus'));
  assert.deepEqual(parseFilters(new URLSearchParams('category=__proto__,constructor&visual=missing')), state());
});

test('URL serialization is deterministic, clean, and round trips all five dimensions', () => {
  const original = state({ q: '  ＧＬＡＳＳ   folder  ', category: ['text-selection', 'input', 'input'], visual: ['glass'], interaction: ['click'], framework: ['vue', 'react'], scene: ['portfolio-gallery'] });
  const serialized = serializeFilters(original);
  assert.equal(serialized, 'q=GLASS+folder&category=input%2Ctext-selection&visual=glass&interaction=click&framework=react%2Cvue&scene=portfolio-gallery');
  assert.equal(serializeFilters(parseFilters(serialized)), serialized);
  assert.equal(serializeFilters(state()), '');
  assert.equal(serializeFilters(state({ category: ['invalid'] })), '');
  assert.equal(serializeFilters({ ...original, category: [...original.category].reverse() }), serialized);
  assert.deepEqual(parseFilters('category=text-selection,text').category, ['text']);
  assert.equal(serializeFilters(state({ category: ['text-selection', 'text'] })), 'category=text');
  assert.equal(Array.from(parseFilters(`q=${'花'.repeat(161)}`).q).length, 160);
  assert.equal(Array.from(parseFilters(serializeFilters(state({ q: '🌸'.repeat(161) }))).q).length, 160);
});

test('toggleFilter is immutable and does not allow unregistered IDs', () => {
  const original = state({ category: ['text'], visual: ['glass'] });
  const snapshot = structuredClone(original);
  const added = toggleFilter(original, 'category', 'buttons');
  assert.deepEqual(added.category, ['buttons', 'text']);
  assert.deepEqual(original, snapshot);
  assert.notEqual(added.visual, original.visual);
  assert.deepEqual(toggleFilter(added, 'category', 'text').category, ['buttons']);
  assert.deepEqual(toggleFilter(original, 'category', 'text-selection').category, ['text']);
  assert.deepEqual(toggleFilter(original, 'visual', '__proto__'), original);
  assert.deepEqual(EMPTY_FILTERS, state());
});

test('Chinese names, Chinese/English keywords and full-width input find actual components', () => {
  assert.deepEqual(slugs(filterItems(ATLAS_ITEMS, state({ q: '文字选区开花' }))), ['selection-flower']);
  assert.deepEqual(slugs(filterItems(ATLAS_ITEMS, state({ q: '玻璃 文件夹' }))), ['glass-folder']);
  assert.deepEqual(slugs(filterItems(ATLAS_ITEMS, state({ q: 'ＧＬＡＳＳ folder' }))), ['glass-folder']);
  assert(slugs(filterItems(ATLAS_ITEMS, state({ q: '流体物体' }))).includes('liquid-object'));
  assert(slugs(filterItems(ATLAS_ITEMS, state({ q: 'text selection' }))).includes('notes-text-color'));
  assert.equal(filterItems(ATLAS_ITEMS, state({ q: 'no-such-widget-0123456789' })).length, 0);
  for (const item of ATLAS_ITEMS) {
    const chineseName = interactionTranslations[item.name] ?? docsTranslations[item.name];
    assert(chineseName, `${item.slug}: missing current Chinese name`);
    assert(slugs(filterItems(ATLAS_ITEMS, state({ q: chineseName }))).includes(item.slug), `${item.slug}: ${chineseName}`);
  }
});

test('frameworks distinguish 43 six-framework packages, Orbit Next.js, and nine unknown entries', () => {
  for (const id of ['react', 'vue', 'svelte', 'solid', 'preact', 'vanilla']) assert.equal(countFacet(ATLAS_ITEMS, state(), 'framework', id), 43, id);
  assert.deepEqual(slugs(filterItems(ATLAS_ITEMS, state({ framework: ['nextjs'] }))), ['orbit-not-found']);
  const unknown = filterItems(ATLAS_ITEMS, state({ framework: ['unknown'] }));
  assert.deepEqual(slugs(unknown), ['ascii-object', 'asciify', 'frost', 'glass', 'glass-object', 'glyph-rain', 'liquid-object', 'particle-object', 'particle-scroll']);
  assert(unknown.every((item) => item.framework.length === 1));
  assert.equal(filterItems(ATLAS_ITEMS, state({ framework: ['unknown', 'react'] })).length, 52);
});

test('interaction filters retain declared capabilities without inferring keyboard or touch support', () => {
  for (const [slug, discovery] of Object.entries(AI_DISCOVERY)) {
    const item = ATLAS_ITEMS.find((item) => item.slug === slug);
    assert(item, slug);
    assert.deepEqual([...item.interaction].sort(), [...new Set(discovery.interactions)].sort(), slug);
  }
  const glass = ATLAS_ITEMS.find((item) => item.slug === 'glass');
  assert.deepEqual(glass.interaction, ['pointer']);
  assert.equal(filterItems([glass], state({ interaction: ['keyboard', 'touch'] })).length, 0);
  assert.equal(ATLAS_FACETS.interaction.find((facet) => facet.id === 'keyboard').label.zh, '键盘支持');
});

test('brand topics cross main classes, while metadata lists no longer masquerade as navigation', () => {
  const brand = filterItems(ATLAS_ITEMS, state({ scene: ['brand-showcase'] }));
  assert(brand.some((item) => item.category.includes('cards-media')));
  assert(brand.some((item) => item.category.includes('hero-models')));
  assert(brand.some((item) => item.category.includes('background-effects')));
  const metadata = ATLAS_ITEMS.find((item) => item.slug === 'stacked-metadata');
  assert.deepEqual(metadata.category, ['cards-media', 'metadata-lists']);
});
