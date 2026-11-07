// BASE_URL may point at either the local project-path preview or deployed Pages.
// Run after building and starting the preview; this script never starts a server.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const BASE = new URL((process.env.BASE_URL || process.env.TEST_BASE_URL || 'http://127.0.0.1:3001/Animuse').replace(/\/$/, '') + '/');
const PREFIX = BASE.pathname.replace(/\/$/, '');
const DIR = path.resolve(process.env.PAGES_REVIEW_DIR || '.local/pages-review');
const TIMEOUT = Number(process.env.PAGES_TIMEOUT || 30000);
const report = { base: BASE.href, startedAt: new Date().toISOString(), checks: [], scenarios: [], screenshots: [], pageErrors: [], consoleErrors: [], httpErrors: [], requestFailures: [], abortedRequests: [], escapedRequests: [], resources: [], observations: {} };
let scenarioName = '';
let page;
const route = pathname => new URL(pathname.replace(/^\//, ''), BASE).href;
const normalized = pathname => pathname.replace(/\/$/, '') || '/';
const isRoute = (url, pathname) => normalized(new URL(url).pathname) === normalized(PREFIX + pathname);
const inProject = url => url.pathname === PREFIX || url.pathname.startsWith(PREFIX + '/');
const localUrl = value => { try { const url = new URL(value); return url.origin === BASE.origin ? url : null; } catch { return null; } };

function check(name, actual, expected = true) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  report.checks.push({ scenario: scenarioName, name, passed, actual, expected });
  assert.deepEqual(actual, expected, name);
  console.log('PASS ' + name);
}
async function snapshot(name) {
  const file = name + '.png';
  await page.screenshot({ path: path.join(DIR, file), animations: 'disabled' });
  report.screenshots.push({ file, url: page.url(), scenario: scenarioName });
}
async function scenario(name, work) {
  scenarioName = name;
  const started = Date.now();
  try {
    await work();
    report.scenarios.push({ name, passed: true, durationMs: Date.now() - started });
  } catch (error) {
    report.scenarios.push({ name, passed: false, durationMs: Date.now() - started, url: page?.url(), error: error.stack });
    console.error('FAIL ' + name + ': ' + error.message);
    if (page && !page.isClosed()) await snapshot('failure-' + report.scenarios.length).catch(() => {});
  }
}
async function settle() {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => {
    const main = document.querySelector('main[data-component-entry-state]');
    return !main || main.dataset.componentEntryState === 'idle';
  });
  await page.waitForTimeout(450);
}
async function visibleHeading() {
  const heading = page.locator('h1:visible').first();
  await heading.waitFor({ state: 'visible' });
  check('Page has a readable main heading', (await heading.innerText()).trim().length > 0);
  check('Page title identifies Animuse', (await page.title()).includes('Animuse'));
}
async function open(pathname) {
  const response = await page.goto(route(pathname), { waitUntil: 'domcontentloaded' });
  check('Direct route returns successful HTML: ' + pathname, response?.status(), 200);
  await visibleHeading();
  await settle();
  check('Direct route remains under the project path', inProject(new URL(page.url())));
}
async function readyCatalog(expected = 53, glass = false) {
  await page.locator('[data-atlas-search]').waitFor({ state: 'visible' });
  await page.waitForFunction(({ expected, glass }) => {
    const count = document.querySelectorAll('main li[data-component-card]').length;
    const button = document.querySelector('[data-filter-dimension="visual"][data-filter-value="glass"]');
    return count === expected && button?.getAttribute('aria-pressed') === String(glass);
  }, { expected, glass });
  await settle();
  check('Catalog has the expected result count', await page.locator('main li[data-component-card]').count(), expected);
}
async function firstVisible(locator) {
  for (let index = 0; index < await locator.count(); index++) {
    const item = locator.nth(index);
    if (await item.isVisible()) return item;
  }
  throw new Error('Expected an actionable visible link.');
}
async function demoFrame() {
  const panel = page.locator('[data-component-document]:visible [data-component-demo-panel]').first();
  await panel.scrollIntoViewIfNeeded();
  await panel.hover();
  const iframe = panel.locator('iframe').first();
  await iframe.waitFor({ state: 'visible' });
  const element = await iframe.elementHandle();
  const frame = await element.contentFrame();
  assert(frame, 'Preview iframe has a browsing context');
  return frame;
}
async function activateGlassFolder() {
  const frame = await demoFrame();
  const hit = frame.locator('.gf-hit').first();
  await hit.waitFor({ state: 'visible' });
  await frame.evaluate(() => document.fonts.ready);
  const before = await hit.getAttribute('aria-expanded');
  // Keyboard activation avoids browser-driver coordinate scaling inside the
  // responsive iframe while exercising the component's real button behavior.
  await hit.focus();
  await hit.press('Enter');
  await page.waitForTimeout(700);
  check('Glass folder dynamic engine responds to keyboard activation', await hit.getAttribute('aria-expanded'), before === 'true' ? 'false' : 'true');
  report.observations.glassFolderFrame = { url: frame.url(), loadedScripts: await frame.locator('script[src]').evaluateAll(items => items.map(item => item.src)) };
}

await fs.mkdir(DIR, { recursive: true });
const browser = await chromium.launch({
  headless: process.env.HEADED !== '1',
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: process.env.BROWSER_CHANNEL || 'chrome' }),
});
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
  await context.addInitScript(() => {
    // Init scripts also execute in opaque sandboxed demos. Preferences belong
    // to the top-level site; those frames intentionally have no localStorage.
    if (window.top === window) {
      try { localStorage.setItem('animuse:locale', 'zh'); } catch { /* Browser may disable storage. */ }
    }
  });
  page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);
  page.setDefaultNavigationTimeout(TIMEOUT);
  page.on('pageerror', error => report.pageErrors.push({ scenario: scenarioName, url: page.url(), message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') report.consoleErrors.push({ scenario: scenarioName, text: message.text(), location: message.location() });
  });
  page.on('response', response => {
    const url = localUrl(response.url());
    if (!url) return;
    const request = response.request();
    const item = { scenario: scenarioName, url: response.url(), status: response.status(), type: request.resourceType() };
    report.resources.push(item);
    if (response.status() >= 400) report.httpErrors.push(item);
  });
  page.on('request', request => {
    const url = localUrl(request.url());
    if (url && !inProject(url)) report.escapedRequests.push({ scenario: scenarioName, url: request.url(), type: request.resourceType() });
  });
  page.on('requestfailed', request => {
    if (!localUrl(request.url())) return;
    const item = { scenario: scenarioName, url: request.url(), type: request.resourceType(), error: request.failure()?.errorText };
    if (item.error === 'net::ERR_ABORTED') report.abortedRequests.push(item);
    else report.requestFailures.push(item);
  });

  await scenario('homepage and real homepage card navigation', async () => {
    await open('/');
    const logo = page.locator('img[alt="Animuse"]').first();
    await logo.waitFor({ state: 'visible' });
    await logo.evaluate(image => image.decode());
    check('Homepage logo image decoded', await logo.evaluate(image => image.complete && image.naturalWidth > 0));
    await snapshot('01-home');
    await page.locator('#gallery-heading').scrollIntoViewIfNeeded();
    await page.locator('[data-component-home-card]').first().waitFor();
    const visibleIndex = await page.locator('[data-component-home-card]').evaluateAll(items => items.findIndex(item => {
      const box = item.getBoundingClientRect();
      return !item.closest('[aria-hidden="true"]') && box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight;
    }));
    assert(visibleIndex >= 0, 'Homepage gallery has a fully visible original card');
    const card = page.locator('[data-component-home-card]').nth(visibleIndex);
    const destination = new URL(await card.getAttribute('href'), page.url());
    await page.evaluate(() => { window.__pagesSmokeNavigation = 'home-card'; });
    // The product pauses the moving marquee on focus; ordinary hover's
    // stability wait cannot reach a card while its track is still moving.
    await card.focus();
    await card.hover();
    await page.waitForTimeout(700);
    await card.click();
    await page.waitForURL(url => normalized(url.pathname) === normalized(destination.pathname));
    await visibleHeading();
    await settle();
    check('Homepage card retains the Next application document', await page.evaluate(() => window.__pagesSmokeNavigation), 'home-card');
    check('Homepage card destination stays inside /Animuse', inProject(new URL(page.url())));
  });

  await scenario('homepage link, glass filter, detail return and deep reload', async () => {
    await open('/');
    const links = page.locator('a[href="' + PREFIX + '/components"], a[href="' + PREFIX + '/components/"]');
    const browse = await firstVisible(links);
    await page.evaluate(() => { window.__pagesSmokeNavigation = 'home-catalog'; });
    await browse.click();
    await page.waitForURL(url => isRoute(url, '/components'));
    await readyCatalog();
    check('Homepage browse uses Next navigation', await page.evaluate(() => window.__pagesSmokeNavigation), 'home-catalog');
    await snapshot('02-components');
    const glass = page.locator('[data-filter-dimension="visual"][data-filter-value="glass"]');
    await glass.click();
    await readyCatalog(6, true);
    check('Glass filter is represented in the URL', new URL(page.url()).searchParams.get('visual'), 'glass');
    const filteredUrl = page.url();
    const card = page.locator('main li[data-component-card*="/docs/animations/glass-folder"]').first();
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    await page.waitForTimeout(700);
    await card.locator('a').first().click();
    await page.waitForURL(url => isRoute(url, '/docs/animations/glass-folder'));
    await visibleHeading();
    await settle();
    await activateGlassFolder();
    await snapshot('03-glass-folder');
    const back = page.locator('[data-component-document]:visible').getByRole('link', { name: /返回组件库|Back to components/, exact: true });
    await back.click();
    await page.waitForURL(url => isRoute(url, '/components'));
    await readyCatalog(6, true);
    check('Detail return retains the selected glass filter', new URL(page.url()).searchParams.get('visual'), 'glass');
    check('Detail return keeps the project path', inProject(new URL(page.url())));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await readyCatalog(6, true);
    check('Refreshing the filtered deep link preserves results', new URL(page.url()).searchParams.get('visual'), new URL(filteredUrl).searchParams.get('visual'));
    await open('/docs/animations/glass-folder/');
    await activateGlassFolder();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await visibleHeading();
    await activateGlassFolder();
    check('Direct detail refresh remains on the correct route', isRoute(page.url(), '/docs/animations/glass-folder'));
  });

  await scenario('Canvas glass page and interaction', async () => {
    await open('/docs/components/glass/');
    await page.locator('canvas[layoutsubtree]').waitFor({ state: 'attached' });
    await page.mouse.move(650, 320);
    await page.mouse.move(850, 410, { steps: 12 });
    await page.waitForTimeout(800);
    check('Canvas glass route renders its document and canvas', await page.locator('canvas').count() >= 2);
    report.observations.canvasGlass = await page.locator('canvas[layoutsubtree]').evaluate(canvas => ({ nativeCanvasDisplayed: getComputedStyle(canvas).display !== 'none', browser: navigator.userAgent }));
    await snapshot('04-canvas-glass');
  });

  await scenario('text-selection flower dynamic preview', async () => {
    await open('/docs/animations/selection-flower/');
    const frame = await demoFrame();
    const paragraph = frame.locator('.sf-article p').first();
    await paragraph.waitFor({ state: 'visible' });
    await frame.evaluate(() => document.fonts.ready);
    await paragraph.focus();
    await paragraph.press('Enter');
    await frame.locator('.sf-scene').evaluate(scene => new Promise((resolve, reject) => {
      const started = performance.now();
      const poll = () => Number(scene.dataset.plants) > 0 ? resolve(true) : performance.now() - started > 10000 ? reject(new Error('No flowers grew after keyboard activation')) : requestAnimationFrame(poll);
      poll();
    }));
    check('Selection flowers react after scripts and fonts load', Number(await frame.locator('.sf-scene').getAttribute('data-plants')) > 0);
    await snapshot('05-selection-flower');
    await paragraph.press('Escape');
  });

  await scenario('AI integration and deployed Skill URL', async () => {
    await open('/docs/mcp/');
    check('AI guide exposes the current repository command', (await page.locator('body').innerText()).includes('npx skills add zhaoli2003/Animuse --skill animuse'));
    const skill = await context.request.get(route('/ai/SKILL.md'));
    check('Skill metadata resolves beneath the project path', skill.status(), 200);
    check('Skill metadata identifies animuse', /^name: animuse$/m.test(await skill.text()));
    const index = await context.request.get(route('/ai/search-index.json'));
    check('Live machine index resolves beneath the project path', index.status(), 200);
    check('Machine index retains all 43 source-package entries', (await index.json()).items.length, 43);
    await snapshot('06-ai-integration');
  });

  await scenario('network and runtime evidence', async () => {
    await page.waitForTimeout(1200);
    const types = Object.fromEntries(['document', 'script', 'stylesheet', 'font', 'fetch'].map(type => [type, report.resources.filter(item => item.type === type).length]));
    report.observations.resourceTypes = types;
    check('Real browser loaded dynamic scripts', types.script > 0);
    check('Real browser loaded local fonts', types.font > 0);
    check('No same-origin requests escaped the project base path', report.escapedRequests, []);
    check('No same-origin HTTP failures including RSC prefetch', report.httpErrors, []);
    check('No non-aborted same-origin resource failures', report.requestFailures, []);
    check('No uncaught browser exceptions', report.pageErrors, []);
    check('No browser console errors', report.consoleErrors, []);
  });
  await context.close();
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  report.summary = { passed: report.scenarios.every(item => item.passed), checks: report.checks.length, passedChecks: report.checks.filter(item => item.passed).length, failedScenarios: report.scenarios.filter(item => !item.passed).map(item => item.name), screenshots: report.screenshots.length, httpErrors: report.httpErrors.length, pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length };
  await fs.writeFile(path.join(DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  if (!report.summary.passed) process.exitCode = 1;
}
