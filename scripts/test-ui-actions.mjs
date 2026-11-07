import assert from 'node:assert/strict';
import { chromium, expect } from 'playwright/test';

const base=process.env.BASE_URL || 'http://127.0.0.1:3000';
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[];
function check(name,ok){assert(ok,name);checks.push(name);console.log(`PASS ${name}`);}
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  // External AI destinations are inspected without sending prompts to another service.
  await context.addInitScript(()=>{window.__openedUrls=[];window.open=url=>{window.__openedUrls.push(String(url));return null;};});
  const page=await context.newPage();
  await page.goto(base+'/docs/animations/glass-folder');
  await expect(page.getByRole('heading',{name:'玻璃文件夹展开',exact:true})).toBeVisible();
  check('Animuse page and logo', (await page.title()).includes('Animuse') && await page.locator('img[alt="Animuse"]').first().isVisible());
  check('Contact and mail entry removed', await page.locator('[data-contact-trigger],a[href^="mailto:"]').count()===0);
  const assetIndex=await (await page.request.get(base+'/doc-assets-index.json')).json();
  const refs=assetIndex.motion['glass-folder'].find(p=>p.framework==='react');
  const normalized=value=>value.replaceAll('\r\n','\n');
  const bundle=normalized((await (await page.request.get(base+refs.bundleUrl)).json()).source);
  const prompt=normalized((await (await page.request.get(base+refs.promptUrl)).json()).source);
  const trigger=page.getByRole('button',{name:'复制给 AI',exact:true});
  const menu=page.getByRole('menu',{name:'复制给 AI'});
  await trigger.click();
  await expect(menu).toBeVisible();
  check('AI menu exposes copy and provider actions',await menu.getByRole('menuitem').count()===5);
  for(const [label,validate] of [
    ['复制提示词',value=>value===prompt],
    ['复制完整代码包',value=>value===bundle],
    ['复制页面 Markdown',value=>value.includes(bundle)&&value.includes(prompt)],
  ]) {
    if(!await menu.isVisible())await trigger.click();
    await menu.getByRole('menuitem',{name:label,exact:true}).click();
    await expect.poll(async()=>validate(normalized(await page.evaluate(()=>navigator.clipboard.readText())))).toBe(true);
    check(label+' matches actual source',true);
    await expect(menu).toBeHidden();
  }
  for(const [label,host] of [['在 ChatGPT 中打开','chatgpt.com'],['在 Claude 中打开','claude.ai']]){
    await trigger.click();await menu.getByRole('menuitem',{name:label,exact:true}).click();
    const url=new URL(await page.evaluate(()=>window.__openedUrls.at(-1)));
    check(label+' points to selected component',url.hostname===host&&url.searchParams.get('q').includes('glass-folder'));
  }
  const download=page.getByRole('link',{name:'下载独立 HTML',exact:true});
  const downloadUrl=await download.getAttribute('href');
  const html=await page.request.get(new URL(downloadUrl,base).href);
  check('Standalone HTML download contains real implementation',html.ok()&&(await html.text()).includes('Glass folder'));
  await page.goto(base+'/components');
  check('Complete visual collection',await page.locator('[data-component-card]').count()===53);
  await page.getByRole('button',{name:'搜索',exact:true}).click();
  const search=page.getByRole('textbox',{name:'搜索组件和文档'});
  await search.fill('玻璃文件夹');
  const result=page.getByRole('dialog').getByRole('button',{name:'玻璃文件夹展开',exact:true});
  await expect(result).toBeVisible();await result.click();await page.waitForURL('**/docs/animations/glass-folder');
  check('Search result navigates to correct detail',true);
  await page.getByRole('button',{name:'切换深色模式',exact:true}).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();await expect(page.locator('html')).toHaveClass(/dark/);
  check('Theme persists across reload',true);
  for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:1000});await page.goto(base+'/docs/mcp');
    await expect(page.getByRole('heading',{name:'使用 Animuse Skill',exact:true})).toBeVisible();
    check(`Skill guide fits ${width}px`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await context.close();console.log(`${checks.length} UI checks passed.`);
}finally{await browser.close();}
