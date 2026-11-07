// Run against the built preview: BASE_URL=http://127.0.0.1:3000 node scripts/test-atlas-filters-browser.mjs
// This is an independent UI regression: result-set oracles come from separate
// one-facet browser visits, never from the application's filtering functions.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const BASE = (process.env.BASE_URL || process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const DIR = path.resolve(process.env.FILTER_REVIEW_DIR || '.local/filter-review');
const EXPECTED_TOTAL = 53;
const DIMENSIONS = ['category', 'visual', 'interaction', 'framework', 'scene'];
const PARENT = process.env.FILTER_PARENT_ID || 'text';
const CHILD = process.env.FILTER_CHILD_ID || 'text-selection';
const report = { base: BASE, startedAt: new Date().toISOString(), checks: [], scenarios: [], screenshots: [], pageErrors: [], consoleErrors: [], localResourceFailures: [], localHttpErrors: [], observations: {} };
let currentScenario = '';
let page;
const oracle = new Map();
const sorted = values => [...new Set(values)].sort();
const union = (...sets) => sorted(sets.flat());
const intersection = (left, right) => left.filter(value => right.includes(value)).sort();
const selector = (dimension, value) => `[data-filter-dimension="${dimension}"][data-filter-value="${value}"]`;
const facet = (dimension, value) => page.locator(selector(dimension, value));

function check(name, actual, expected) {
  try {
    assert.deepEqual(actual, expected, name);
    report.checks.push({ scenario: currentScenario, name, passed: true, actual, expected });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ scenario: currentScenario, name, passed: false, actual, expected });
    throw error;
  }
}
async function screenshot(name) {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(DIR, file), animations: 'disabled' });
  report.screenshots.push({ file, url: page.url(), viewport: page.viewportSize(), scenario: currentScenario });
}
async function scenario(name, fn) {
  currentScenario = name;
  const start = Date.now();
  try {
    await fn();
    report.scenarios.push({ name, passed: true, durationMs: Date.now() - start });
  } catch (error) {
    report.scenarios.push({ name, passed: false, durationMs: Date.now() - start, url: page?.url(), error: error.stack });
    console.error(`FAIL ${name}: ${error.message}`);
    if (page && !page.isClosed()) await screenshot(`failure-${report.scenarios.length}`).catch(() => {});
  }
}
async function ready() {
  await page.locator('[data-atlas-search]').waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => {
    const root = document.querySelector('main[data-component-entry-state]');
    return !root || root.dataset.componentEntryState === 'idle';
  });
  const url = new URL(page.url());
  const expected = Object.fromEntries(DIMENSIONS.map(dimension => [dimension, selectedUrlValues(url, dimension)]));
  if (expected.category.includes(PARENT)) expected.category = expected.category.filter(value => value !== CHILD);
  await page.waitForFunction(({ expected, query }) => {
    if (document.querySelector('[data-atlas-search]')?.value !== query) return false;
    return Object.entries(expected).every(([dimension, values]) => {
      const selected = [...document.querySelectorAll(`[data-filter-dimension="${dimension}"][aria-pressed="true"]`)].map(element => element.dataset.filterValue).sort();
      return JSON.stringify(selected) === JSON.stringify(values);
    });
  }, { expected, query: (url.searchParams.get('q') || '').trim() });
  // Allow hydration and debounced URL state to settle without waiting for live
  // preview/media network activity, which can remain active indefinitely.
  await page.waitForTimeout(300);
}
async function open(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== '') query.set(key, Array.isArray(value) ? value.join(',') : value);
  await page.goto(`${BASE}/components${query.size ? `?${query}` : ''}`, { waitUntil: 'domcontentloaded' });
  await ready();
}
async function cards() {
  return page.locator('main li[data-component-card]').evaluateAll(items => items.filter(item => !item.closest('[inert]')).map(item => {
    const href = item.dataset.componentCard || item.querySelector('a[href]')?.getAttribute('href');
    return href ? new URL(href, location.href).pathname.replace(/\/$/, '') : '';
  }).sort());
}
async function expectCards(name, expected) {
  const target = sorted(expected);
  await page.waitForFunction(target => {
    const actual = [...document.querySelectorAll('main li[data-component-card]')].filter(item => !item.closest('[inert]')).map(item => {
      const href = item.dataset.componentCard || item.querySelector('a[href]')?.getAttribute('href');
      return href ? new URL(href, location.href).pathname.replace(/\/$/, '') : '';
    }).sort();
    return JSON.stringify(actual) === JSON.stringify(target);
  }, target);
  const actual = await cards();
  check(name, actual, target);
  check(`${name}: every result has a real unique destination`, actual.length === new Set(actual).size && !actual.includes(''), true);
  check(`${name}: displayed result count`, await displayedCount(), actual.length);
}
async function displayedCount() {
  return page.locator('[data-atlas-results]').first().evaluate(element => {
    const raw = element.getAttribute('data-atlas-results');
    if (raw && /^\d+$/.test(raw)) return Number(raw);
    const match = (element.textContent || '').match(/\d+/);
    return match ? Number(match[0]) : null;
  });
}
async function facets() {
  return page.locator('[data-filter-dimension][data-filter-value]').evaluateAll(items => items.map(element => {
    const explicit = element.getAttribute('data-filter-count');
    const badge = element.querySelector('[data-filter-count]');
    const badgeValue = badge?.getAttribute('data-filter-count') || badge?.textContent;
    const lastNumber = (element.textContent || '').match(/(\d+)\D*$/)?.[1];
    const raw = explicit || badgeValue || lastNumber;
    // Chromium may retain descendant geometry inside a closed <details>.
    // Such boxes are not painted or actionable, so rectangles alone are not
    // a visibility test for the advanced facet controls.
    const collapsed = Boolean(element.closest('details:not([open])'));
    return { dimension: element.dataset.filterDimension, value: element.dataset.filterValue, text: element.textContent.trim(), count: raw != null && /^\s*\d+\s*$/.test(raw) ? Number(raw) : null, selected: element.getAttribute('aria-pressed'), disabled: element.disabled || element.getAttribute('aria-disabled') === 'true', visible: !collapsed && Boolean(element.getClientRects().length) && getComputedStyle(element).visibility !== 'hidden' };
  }));
}
async function ensureMobileFiltersVisible() {
  const toggle = page.locator('[data-atlas-mobile-toggle]');
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
}
async function advanced() {
  await ensureMobileFiltersVisible();
  const options = page.locator('[data-filter-dimension="framework"], [data-filter-dimension="scene"]');
  if (await options.first().isVisible()) return;
  await page.locator('[data-atlas-more]').click();
  await options.first().waitFor({ state: 'visible' });
}
async function ensureFacetVisible(dimension, value) {
  await ensureMobileFiltersVisible();
  if (['framework', 'scene'].includes(dimension)) await advanced();
  const button = facet(dimension, value);
  if (!await button.isVisible()) {
    const expand = page.locator(`[data-expand-facet="${dimension}"]`);
    if (await expand.isVisible() && await expand.getAttribute('aria-expanded') !== 'true') await expand.click();
    if (!await button.isVisible() && dimension === 'interaction') await advanced();
  }
  await button.waitFor({ state: 'visible' });
}
async function toggle(dimension, value) {
  await ensureFacetVisible(dimension, value);
  const button = facet(dimension, value);
  const before = await button.getAttribute('aria-pressed');
  await button.click();
  await page.waitForFunction(({ dimension, value, selected }) => document.querySelector(`[data-filter-dimension="${dimension}"][data-filter-value="${value}"]`)?.getAttribute('aria-pressed') === selected, { dimension, value, selected: before === 'true' ? 'false' : 'true' });
  await page.waitForTimeout(120);
}
async function single(dimension, value) {
  const key = `${dimension}:${value}`;
  if (!oracle.has(key)) {
    await open({ [dimension]: value });
    check(`${key}: direct URL selects the facet`, await facet(dimension, value).getAttribute('aria-pressed'), 'true');
    const result = await cards();
    check(`${key}: count matches rendered cards`, await displayedCount(), result.length);
    oracle.set(key, result);
  }
  return oracle.get(key);
}
async function search(value) {
  await page.locator('[data-atlas-search]').fill(value);
  await page.waitForURL(url => (url.searchParams.get('q') || '') === value.trim());
  await page.waitForTimeout(150);
}
async function changeLanguage(locale) {
  const expected = locale === 'zh' ? 'zh-CN' : 'en';
  if (await page.locator('html').getAttribute('lang') !== expected) await page.locator('[data-language-toggle]:visible').first().click();
  await page.waitForFunction(expected => document.documentElement.lang === expected && !document.documentElement.dataset.languageTransition, expected);
}
async function setDark(dark) {
  const isDark = await page.locator('html').evaluate(element => element.classList.contains('dark'));
  if (isDark !== dark) await page.locator('[data-theme-toggle]:visible').first().click();
  await page.waitForFunction(dark => document.documentElement.classList.contains('dark') === dark, dark);
}
function selectedUrlValues(url, dimension) {
  return sorted(new URL(url).searchParams.getAll(dimension).flatMap(value => value.split(',')).filter(Boolean));
}

async function run() {
  await fs.mkdir(DIR, { recursive: true });
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1', ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: process.env.CHROME_CHANNEL || 'chrome' }) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  context.setDefaultTimeout(12000);
  page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push({ scenario: currentScenario, url: page.url(), message: error.message }));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ scenario: currentScenario, message: message.text(), location: message.location() }); });
  page.on('requestfailed', request => {
    const error = request.failure()?.errorText || '';
    if (request.url().startsWith(BASE) && ['script', 'stylesheet', 'document'].includes(request.resourceType()) && !error.includes('ERR_ABORTED')) report.localResourceFailures.push({ scenario: currentScenario, url: request.url(), error });
  });
  page.on('response', response => {
    if (response.url().startsWith(BASE) && response.status() >= 400) report.localHttpErrors.push({ scenario: currentScenario, url: response.url(), status: response.status(), type: response.request().resourceType() });
  });
  let all = [], baselineFacets = [], glass = [], particles = [], parent = [], child = [];
  let crossCategory = null, crossCategorySet = [];
  try {
    await scenario('Default catalog and public filter contract', async () => {
      await open();
      await changeLanguage('zh');
      all = await cards();
      check('Default catalog contains all 53 cards', all.length, EXPECTED_TOTAL);
      await expectCards('Default catalog', all);
      check('Search has an accessible name', await page.locator('[data-atlas-search]').evaluate(element => Boolean(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || element.labels?.length)), true);
      baselineFacets = await facets();
      report.observations.baselineFacets = baselineFacets;
      check('All five filter dimensions exist', sorted(baselineFacets.map(item => item.dimension)), [...DIMENSIONS].sort());
      check('All facet buttons expose a boolean pressed state', baselineFacets.every(item => ['true', 'false'].includes(item.selected)), true);
      check('All facet buttons expose an integer result count', baselineFacets.every(item => Number.isInteger(item.count) && item.count >= 0), true);
      check('Framework and scene start collapsed', baselineFacets.filter(item => ['framework', 'scene'].includes(item.dimension)).every(item => !item.visible), true);
      check('Basic filter dimensions remain visible', ['category', 'visual', 'interaction'].every(dimension => baselineFacets.some(item => item.dimension === dimension && item.visible)), true);
      await screenshot('default-1440-zh');
    });

    await scenario('Same-dimension OR and independent result-set oracles', async () => {
      glass = await single('visual', 'glass');
      particles = await single('visual', 'particles');
      check('Glass and particles are useful nonempty distinct test sets', glass.length > 0 && particles.length > 0 && union(glass, particles).length > Math.max(glass.length, particles.length), true);
      for (const [value, result] of [['glass', glass], ['particles', particles]]) check(`Default visual ${value} facet count`, baselineFacets.find(item => item.dimension === 'visual' && item.value === value)?.count, result.length);
      await open();
      await toggle('visual', 'glass');
      await expectCards('Selecting glass', glass);
      await toggle('visual', 'particles');
      await expectCards('Glass OR particles', union(glass, particles));
      check('Both visual values remain in the shareable URL', selectedUrlValues(page.url(), 'visual'), ['glass', 'particles']);
      check('Both selections have removable chips', await page.locator('[data-active-filter="visual:glass"], [data-active-filter="visual:particles"]').count(), 2);
      await screenshot('same-dimension-or');
    });

    await scenario('Cross-dimension AND, dynamic counts, and zero-count disabling', async () => {
      if (!glass.length) glass = await single('visual', 'glass');
      if (!particles.length) particles = await single('visual', 'particles');
      await open({ visual: 'glass' });
      const underGlass = await facets();
      const candidate = underGlass.find(item => item.dimension === 'category' && item.count > 0 && item.count < glass.length) || underGlass.find(item => item.dimension === 'category' && item.count > 0);
      check('A category can be combined with glass', Boolean(candidate), true);
      crossCategory = candidate.value;
      crossCategorySet = await single('category', crossCategory);
      await open({ visual: 'glass', category: crossCategory });
      await expectCards('Category AND glass equals the intersection of independent visits', intersection(crossCategorySet, glass));
      const current = await facets();
      check('Dynamic glass count ignores its own dimension', current.find(item => item.dimension === 'visual' && item.value === 'glass')?.count, intersection(crossCategorySet, glass).length);
      check('Dynamic particle count applies the other dimension', current.find(item => item.dimension === 'visual' && item.value === 'particles')?.count, intersection(crossCategorySet, particles).length);
      const zero = current.filter(item => item.count === 0 && item.selected !== 'true');
      check('Cross filtering exposes at least one unavailable option', zero.length > 0, true);
      check('All unavailable unselected options are disabled', zero.every(item => item.disabled), true);
      await screenshot('cross-dimension-and');
    });

    await scenario('Parent and child categories normalize without duplicate cards', async () => {
      parent = await single('category', PARENT);
      child = await single('category', CHILD);
      check('Child results are a nonempty subset of parent results', child.length > 0 && child.every(href => parent.includes(href)), true);
      await open({ category: CHILD });
      await toggle('category', PARENT);
      await expectCards('Parent selection covers child results once', parent);
      check('Parent remains selected', await facet('category', PARENT).getAttribute('aria-pressed'), 'true');
      check('Redundant child selection is removed', await facet('category', CHILD).getAttribute('aria-pressed'), 'false');
      check('Only the parent appears as an active category chip', await page.locator('[data-active-filter^="category:"]').count(), 1);
      await open({ category: `${PARENT},${CHILD}` });
      await expectCards('Parent-child direct URL does not duplicate results', parent);
      check('Direct URL normalizes redundant child UI selection', await facet('category', CHILD).getAttribute('aria-pressed'), 'false');
      await toggle('category', CHILD);
      await expectCards('Choosing a child refines the parent selection', child);
      check('Refining to a child removes the broader parent', await facet('category', PARENT).getAttribute('aria-pressed'), 'false');
      check('Refining to a child retains exactly that child', selectedUrlValues(page.url(), 'category'), [CHILD]);
    });

    await scenario('Interaction filters and advanced keyboard capability', async () => {
      const hover = await single('interaction', 'hover');
      const click = await single('interaction', 'click');
      check('Hover and click each have real catalog entries', hover.length > 0 && click.length > 0, true);
      await open();
      await toggle('interaction', 'hover');
      await expectCards('Hover interaction filters the catalog', hover);
      await toggle('interaction', 'click');
      await expectCards('Hover OR click uses same-dimension union', union(hover, click));
      const keyboard = await single('interaction', 'keyboard');
      check('Declared keyboard capability has catalog entries', keyboard.length > 0, true);
      await open();
      await advanced();
      await toggle('interaction', 'keyboard');
      await expectCards('Advanced keyboard capability is selectable', keyboard);
    });

    await scenario('Remove one active chip and clear every filter', async () => {
      if (!crossCategory) crossCategory = PARENT;
      const categoryOnly = crossCategorySet.length ? crossCategorySet : await single('category', crossCategory);
      await open({ visual: 'glass', category: crossCategory });
      await page.locator('[data-active-filter="visual:glass"]').click();
      await expectCards('Removing glass retains only the category', categoryOnly);
      check('Removing a chip removes its URL parameter', selectedUrlValues(page.url(), 'visual'), []);
      check('Removing one chip retains the other dimension', await facet('category', crossCategory).getAttribute('aria-pressed'), 'true');
      await page.locator('[data-atlas-clear]').click();
      await expectCards('Clear restores all 53 cards', all);
      check('Clear removes all active chips', await page.locator('[data-active-filter]').count(), 0);
      check('Clear removes query and dimension URL state', DIMENSIONS.concat('q').every(key => !new URL(page.url()).searchParams.has(key)), true);
    });

    await scenario('Chinese and English catalog search, plus a real empty state', async () => {
      await open();
      await search('玻璃');
      const chinese = await cards();
      check('Chinese glass search returns results', chinese.length > 0, true);
      await search('glass');
      const english = await cards();
      check('English search returns glass components in Chinese UI', english.includes('/docs/components/glass'), true);
      check('Chinese search also returns the glass component', chinese.includes('/docs/components/glass'), true);
      check('Search preserves unique result destinations', english.length, new Set(english).size);
      await page.locator('[data-active-filter="q"]').click();
      await expectCards('Removing the search chip restores the whole catalog', all);
      await page.waitForFunction(() => document.querySelector('[data-atlas-search]')?.value === '');
      check('Removing the search chip also clears the focused input', await page.locator('[data-atlas-search]').inputValue(), '');
      check('Removing the search chip removes q from the URL', new URL(page.url()).searchParams.has('q'), false);
      await open({ visual: 'glass' });
      await search('atlas-no-such-component-984731');
      await expectCards('Unknown search yields zero results', []);
      check('Empty state explains that no components match', /没有|未找到|no (?:matching )?(?:components|results)|nothing found/i.test(await page.locator('main').innerText()), true);
      const emptyFacets = await facets();
      check('Zero-result facets are still counted accurately', emptyFacets.every(item => item.count === 0), true);
      check('Selected zero-count filter remains available to deselect', emptyFacets.find(item => item.dimension === 'visual' && item.value === 'glass')?.disabled, false);
      await screenshot('no-results');
      await page.locator('[data-atlas-clear]').click();
      await expectCards('Clear recovers from an empty search', all);
      check('Clear also empties the search field', await page.locator('[data-atlas-search]').inputValue(), '');
    });

    await scenario('URL direct access, reload, browser Back, and Forward', async () => {
      await open({ q: 'glass' });
      check('Direct query populates the search field', await page.locator('[data-atlas-search]').inputValue(), 'glass');
      const queryResult = await cards();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await ready();
      await expectCards('Reload retains direct search results', queryResult);
      await open();
      await toggle('visual', 'glass');
      const one = page.url();
      await toggle('visual', 'particles');
      const two = page.url();
      check('Distinct selections create distinct shareable states', one !== two, true);
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForURL(one);
      await expectCards('Back restores the prior single selection', glass);
      check('Back restores aria-pressed', await facet('visual', 'particles').getAttribute('aria-pressed'), 'false');
      await page.goForward({ waitUntil: 'domcontentloaded' });
      await page.waitForURL(two);
      await expectCards('Forward restores the OR selection', union(glass, particles));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await ready();
      await expectCards('Reload preserves both selected values', union(glass, particles));
      check('Reload restores both selected buttons', await facet('visual', 'glass').getAttribute('aria-pressed') === 'true' && await facet('visual', 'particles').getAttribute('aria-pressed') === 'true', true);
    });

    await scenario('Advanced framework and use-case facets are functional', async () => {
      await open();
      await advanced();
      const options = await facets();
      check('Advanced control reveals both dimensions', ['framework', 'scene'].every(dimension => options.some(item => item.dimension === dimension && item.visible)), true);
      const framework = options.find(item => item.dimension === 'framework' && item.count > 0);
      const scene = options.find(item => item.dimension === 'scene' && item.count > 0 && item.count < EXPECTED_TOTAL);
      check('Framework and scene have usable options', Boolean(framework && scene), true);
      const frameworkOnly = await single('framework', framework.value);
      const sceneOnly = await single('scene', scene.value);
      await open();
      await advanced();
      await toggle('framework', framework.value);
      await toggle('scene', scene.value);
      await expectCards('Framework AND scene matches independent set intersection', intersection(frameworkOnly, sceneOnly));
      check('Advanced filter is represented in URL', selectedUrlValues(page.url(), 'scene'), [scene.value]);
      await screenshot('advanced-filters');
    });

    await scenario('Detail taxonomy tag opens the correct filtered catalog', async () => {
      await page.goto(`${BASE}/docs/animations/glass-folder`, { waitUntil: 'domcontentloaded' });
      await page.locator('h1').waitFor();
      const links = await page.locator('main a[href]').evaluateAll(anchors => anchors.map(a => ({ href: a.href, text: a.innerText })).filter(a => new URL(a.href).pathname === '/components' && ['category', 'visual', 'interaction', 'framework', 'scene'].some(key => new URL(a.href).searchParams.has(key))));
      check('Detail page exposes clickable taxonomy tags', links.length > 0, true);
      const target = links.find(link => new URL(link.href).searchParams.get('visual') === 'glass') || links[0];
      const targetUrl = new URL(target.href);
      const selected = DIMENSIONS.map(dimension => [dimension, targetUrl.searchParams.get(dimension)]).filter(([, value]) => value);
      await page.locator('main a[href]').filter({ hasText: target.text }).filter({ visible: true }).first().click();
      await page.waitForURL(url => url.pathname === '/components' && selected.every(([dimension, value]) => url.searchParams.get(dimension) === value));
      await ready();
      check('Linked catalog retains the originating component', (await cards()).includes('/docs/animations/glass-folder'), true);
      for (const [dimension, value] of selected) for (const item of value.split(',')) check(`Detail tag selects ${dimension}:${item}`, await facet(dimension, item).getAttribute('aria-pressed'), 'true');
    });

    await scenario('Real card entry, detail tag navigation, and return-history isolation', async () => {
      const flowerHref = all.find(href => href.endsWith('/selection-flower'));
      check('Selection Flower exists in the 53-card catalog', Boolean(flowerHref), true);
      const selectionOnly = await single('category', CHILD);
      check('Text selection has exactly the two intended components', selectionOnly.length, 2);
      async function enterFlower() {
        await page.locator(`main li[data-component-card="${flowerHref}"] a[href]`).first().click();
        await page.waitForURL(url => url.pathname === flowerHref);
        await page.waitForFunction(() => {
          const root = document.querySelector('main[data-component-entry-state]');
          return !root || root.dataset.componentEntryState === 'idle';
        });
        await page.locator('main [data-atlas-detail-tags] a[href]').first().waitFor({ state: 'visible' });
      }
      await open();
      await enterFlower();
      await page.locator(`main [data-atlas-detail-tags] a[href="/components?category=${CHILD}"]`).click();
      await page.waitForURL(url => url.pathname === '/components' && url.searchParams.get('category') === CHILD);
      await ready();
      await expectCards('A tag after real card entry keeps its query and returns two cards', selectionOnly);
      await screenshot('card-entry-detail-tag');

      // Repeat the real entry from an already filtered catalog. The global
      // card-return animation must not intercept later same-page filter history.
      const filteredUrl = page.url();
      await enterFlower();
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForURL(filteredUrl);
      await ready();
      await expectCards('Browser Back from a detail preserves the catalog filter', selectionOnly);
      await toggle('category', PARENT);
      const parentUrl = page.url();
      await expectCards('Parent filter works after animated detail return', parent);
      await toggle('category', PARENT);
      const clearUrl = page.url();
      await expectCards('Clearing a parent works after animated detail return', all);
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForURL(parentUrl);
      await expectCards('Filter-history Back is independent of card-return state', parent);
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForURL(filteredUrl);
      await expectCards('Second filter-history Back restores the child', selectionOnly);
      await page.goForward({ waitUntil: 'domcontentloaded' });
      await page.waitForURL(parentUrl);
      await expectCards('Filter-history Forward restores the parent', parent);
      await page.goForward({ waitUntil: 'domcontentloaded' });
      await page.waitForURL(clearUrl);
      await expectCards('Second filter-history Forward restores all 53', all);
    });

    await scenario('Keyboard operation and visible focus', async () => {
      await open();
      await page.locator('[data-atlas-search]').focus();
      await page.keyboard.press('Tab');
      check('Tab moves from search to a real focusable control', await page.evaluate(() => document.activeElement !== document.body && document.activeElement !== document.querySelector('[data-atlas-search]')), true);
      const button = facet('visual', 'glass');
      await button.focus();
      check('Facet keyboard focus has a visible indicator', await button.evaluate(element => {
        const style = getComputedStyle(element);
        return element.matches(':focus-visible') && ((style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== 'none');
      }), true);
      await screenshot('keyboard-focused');
      await page.keyboard.press('Space');
      await expectCards('Space selects a facet', glass);
      await page.keyboard.press('Enter');
      await expectCards('Enter deselects a facet', all);
      await button.focus();
      await page.keyboard.press('Enter');
      const chip = page.locator('[data-active-filter="visual:glass"]');
      await chip.focus();
      await page.keyboard.press('Enter');
      await expectCards('Keyboard removes an active filter chip', all);
      const more = page.locator('[data-atlas-more]');
      await more.focus();
      await page.keyboard.press('Enter');
      check('Keyboard opens advanced filters', await page.locator('[data-filter-dimension="framework"]').first().isVisible(), true);
    });

    await scenario('Language and dark mode preserve filter state across reload', async () => {
      await open({ visual: 'glass' });
      await setDark(true);
      const url = page.url();
      await changeLanguage('en');
      await expectCards('Language switching preserves the selected results', glass);
      check('Language switching preserves URL filters', page.url(), url);
      check('Language switching preserves selected button state', await facet('visual', 'glass').getAttribute('aria-pressed'), 'true');
      check('Language switching retains dark mode', await page.locator('html').evaluate(element => element.classList.contains('dark')), true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await ready();
      check('English survives reload', await page.locator('html').getAttribute('lang'), 'en');
      check('Dark mode survives reload', await page.locator('html').evaluate(element => element.classList.contains('dark')), true);
      await expectCards('Filtered results survive themed/translated reload', glass);
    });

    await scenario('375 / 768 / 1440 responsive layouts and translated labels', async () => {
      for (const width of [375, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await open({ visual: 'glass' });
        if (width === 375) {
          const mobile = page.locator('[data-atlas-mobile-toggle]');
          check('375px: filters are initially collapsed', await mobile.getAttribute('aria-expanded'), 'false');
          check('375px: search remains visible while facets are collapsed', await page.locator('[data-atlas-search]').isVisible(), true);
          check('375px: active chips remain visible outside the collapsed panel', await page.locator('[data-active-filter="visual:glass"]').isVisible(), true);
          check('375px: first result starts within a typical phone screen', await page.locator('li[data-component-card]').first().evaluate(element => element.getBoundingClientRect().top < 812), true);
          await screenshot('filters-375-collapsed-selected');
          await page.locator('[data-active-filter="visual:glass"]').click();
          await expectCards('375px: a chip can clear a collapsed filter', all);
          check('375px: clearing a chip keeps the filter panel collapsed', await mobile.getAttribute('aria-expanded'), 'false');
          await screenshot('filters-375-collapsed-default');
          await toggle('visual', 'glass');
          await expectCards('375px: expanding filters allows a new selection', glass);
        }
        for (const locale of ['zh', 'en']) {
          await changeLanguage(locale);
          await setDark(locale === 'en');
          await advanced();
          await expectCards(`${width}px ${locale}: selected catalog remains functional`, glass);
          const geometry = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
          check(`${width}px ${locale}: no horizontal page overflow`, geometry.document <= geometry.viewport + 1 && geometry.body <= geometry.viewport + 1, true);
          await screenshot(`filters-${width}-${locale}-${locale === 'en' ? 'dark' : 'light'}`);
        }
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await changeLanguage('zh');
      await setDark(false);
    });

    await scenario('No new browser exceptions or broken local application resources', async () => {
      check('No uncaught browser exceptions', report.pageErrors, []);
      check('No failed local script, stylesheet, or document requests', report.localResourceFailures, []);
      check('No local HTTP errors, including Next segment prefetches', report.localHttpErrors, []);
      check('No browser console errors', report.consoleErrors, []);
    });
  } finally {
    report.finishedAt = new Date().toISOString();
    report.summary = { passed: report.scenarios.every(item => item.passed), checks: report.checks.length, passedChecks: report.checks.filter(item => item.passed).length, failedScenarios: report.scenarios.filter(item => !item.passed).map(item => item.name), screenshots: report.screenshots.length };
    await fs.writeFile(path.join(DIR, 'report.json'), JSON.stringify(report, null, 2));
    await context.close();
    await browser.close();
  }
  console.log(JSON.stringify(report.summary, null, 2));
  if (!report.summary.passed) process.exitCode = 1;
}
run().catch(async error => {
  report.failure = error.stack;
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.error(error);
  process.exitCode = 1;
});
