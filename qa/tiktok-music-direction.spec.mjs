import {test,expect} from '@playwright/test';
test('TikTok product production pack selects appropriate music direction without falsely licensing tracks',async({page})=>{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();
 await page.locator('#tt-import-text').fill('Kipas Mini Portable\nhttps://shop.tiktok.com/view/product/123456');
 await page.locator('#tt-import-go').click();
 await expect(page.locator('#tt-pack-status')).toContainText('sleek, modern, punchy');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#tt-pack-json').click()]);
 const json=JSON.parse(await (await import('node:fs/promises')).readFile(await download.path(),'utf8'));
 expect(json.music.mode).toBe('hybrid-vo-first');
 expect(json.music.licenseVerified).toBe(false);
 expect(json.music.trackSelected).toBe(false);
 expect(json.music.plan.some(x=>x.voicePriority)).toBe(true);
 expect(json.rendered).toBe(false);
});