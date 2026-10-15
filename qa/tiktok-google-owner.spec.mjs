import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
  await page.route('https://content-studio-api-production-3fe2.up.railway.app/**',route=>route.fulfill({json:route.request().url().includes('/google/status')?{blockers:['google_automation_not_enabled','google_budget_not_available','verified_product_source_missing'],estimateUsd:3,remainingUsd:0,jobs:[]}:{configured:false,connected:false}}));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.locator('#channelBar [data-channel="tiktok"]').click();
});
test('owner gets a clear workflow and advanced tools stay available',async({page})=>{
  await expect(page.locator('#tt-google-review')).toBeVisible();
  await expect(page.locator('.sidebar nav.menu [data-go]:visible')).toHaveCount(4);
  await page.locator('#tt-google-review [data-sec-go="publishing"]').click();
  await expect(page.locator('[data-blockers]')).toContainText('Anggaran API Google belum tersedia');
  await expect(page.locator('[data-count="review"]')).toHaveText('—');
  await expect(page.locator('#tt-production-pack')).toBeVisible();
  await page.locator('[data-legacy-toggle]').click();
  await page.locator('.sidebar [data-go="desk"]').click();
  await expect(page.locator('#tt-production-pack')).toBeVisible();
  await page.locator('[data-legacy-toggle]').click();
  await expect(page.locator('#tt-production-pack')).toBeHidden();
  for(const channel of ['youtube','shopee']){
    await page.locator(`#channelBar [data-channel="${channel}"]`).click();
    await expect(page.locator('#tt-google-review')).toBeHidden();
  }
});
test('mobile owner page has no horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#tt-google-review')).toBeVisible();
  const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth}));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
  await page.screenshot({path:'/tmp/tiktok-owner-mobile.png',fullPage:true});
});
test('one owner inbox keeps technical setup behind settings',async({page})=>{
 await expect(page.locator('.sidebar [data-go="ringkasan"]')).toHaveText(/Review Video/);
 await expect(page.locator('.sidebar [data-go="desk"]')).toBeVisible();
 await expect(page.locator('[data-view-title]')).toHaveText('Perlu kamu review');
 await expect(page.locator('[data-owner-pane="desk"]')).toBeHidden();
 await page.locator('#tt-google-review [data-sec-go="publishing"]').click();
 await expect(page.locator('[data-research-status]')).toBeHidden();
 await expect(page.locator('[data-publishing-status]')).toContainText('Upload otomatis belum aktif');
 await page.locator('#tt-google-review [data-sec-go="ringkasan"]').click();
 await expect(page.locator('[data-view-title]')).toHaveText('Perlu kamu review');
 await expect(page.locator('#aff-tiktok-agenda')).toBeHidden();
});
