import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();await page.locator('#tt-google-review [data-sec-go="publishing"]').click();await page.locator('[data-legacy-toggle]').click();
});
test('Share text creates TikTok draft without fabricated commission or claims',async({page})=>{
 await page.locator('#tt-import-text').fill('Portable mini fan\nhttps://shop.tiktok.com/view/product/123456');
 await page.locator('#tt-import-go').click();
 await expect(page.locator('#aff-tiktok-f-product')).toHaveValue('Portable mini fan');
 await expect(page.locator('#aff-tiktok-f-productUrl')).toHaveValue('https://shop.tiktok.com/view/product/123456');
 await expect(page.locator('#aff-tiktok-f-commission')).toHaveValue('');
 await expect(page.locator('#aff-tiktok-f-facts')).toHaveValue('');
 const v=await page.evaluate(()=>JSON.parse(localStorage.getItem('bima-tiktok-affiliate-v1')));
 expect(v.drafts.length).toBe(1);
 expect(v.drafts[0].product).toBe('Portable mini fan');
});
test('Invalid URL does not create draft',async({page})=>{
 const before=await page.evaluate(()=>localStorage.getItem('bima-tiktok-affiliate-v1')); 
 await page.locator('#tt-import-text').fill('https://example.com/product/123');
 await page.locator('#tt-import-go').click();
 await expect(page.locator('#tt-import-result')).toContainText('Belum ada link TikTok');
 expect(await page.evaluate(()=>localStorage.getItem('bima-tiktok-affiliate-v1'))).toBe(before);
});
