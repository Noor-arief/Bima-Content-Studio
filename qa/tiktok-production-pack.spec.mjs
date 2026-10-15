import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});await page.locator('#channelBar [data-channel="tiktok"]').click();await page.locator('#tt-google-review [data-sec-go="publishing"]').click();await page.locator('[data-legacy-toggle]').click();});
test('import automatically creates a grounded 3 scene video production pack',async({page})=>{
 await page.locator('#tt-import-text').fill('Kipas Mini Portable\nhttps://shop.tiktok.com/view/product/123456');
 await page.locator('#tt-import-go').click();
 await expect(page.locator('#tt-pack-voice')).toHaveValue(/Kipas Mini Portable/);
 await expect(page.locator('#tt-pack-story')).toHaveValue(/SCENE 3/);
 await expect(page.locator('#tt-pack-status')).toContainText('MP4 belum dibuat');
 await expect(page.locator('#tt-pack-status')).toContainText('Fakta belum terverifikasi');
 await expect(page.locator('#aff-tiktok-f-facts')).toHaveValue('');
 await expect(page.locator('#shopeeWorkspace')).toBeHidden();
});
test('SRT and storyboard can be downloaded without claiming generated MP4',async({page})=>{
 await page.locator('#tt-import-text').fill('Kipas Mini Portable\nhttps://shop.tiktok.com/view/product/123456');
 await page.locator('#tt-import-go').click();
 const [file]=await Promise.all([page.waitForEvent('download'),page.locator('#tt-pack-srt').click()]);
 expect(file.suggestedFilename()).toMatch(/\.srt$/);
 const [json]=await Promise.all([page.waitForEvent('download'),page.locator('#tt-pack-json').click()]);
 expect(json.suggestedFilename()).toMatch(/storyboard\.json$/);
});
