import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteWebsiteResources } from './website-base-path.mjs';

test('website URLs work below Pages without touching external URLs or logical routes', () => {
  const input = `<img src="/animuse-mark.svg"><script src="/assets/motion/test.js"></script><style>@font-face{src:url('/fonts/a.woff2')}</style><a href="/docs">Docs</a><img src="https://example.com/assets/a.png"><script>const x="/assets/optimized/a.js";</script>`;
  const output = rewriteWebsiteResources(input, '/Animuse');
  assert.match(output, /src="\/Animuse\/animuse-mark.svg"/);
  assert.match(output, /url\('\/Animuse\/fonts\/a.woff2'\)/);
  assert.match(output, /href="\/docs"/);
  assert.match(output, /https:\/\/example.com\/assets\/a.png/);
  assert.match(output, /x="\/Animuse\/assets\/optimized\/a.js"/);
  assert.equal(rewriteWebsiteResources(output, '/Animuse'), output);
  assert.equal(rewriteWebsiteResources(input, ''), input);
});
