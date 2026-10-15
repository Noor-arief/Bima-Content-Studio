import {test,expect} from '@playwright/test';
test('TikTok render panel is honest, secure and isolated to production workspace',async({page})=>{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();await page.locator('#tt-google-review [data-sec-go="publishing"]').click();await page.locator('[data-legacy-toggle]').click();
 await page.locator('.sidebar [data-go="desk"]').click();
 await expect(page.locator('#tt-render-card')).toBeVisible();
 await expect(page.locator('#tt-render-start')).toBeDisabled();
 await expect(page.locator('#tt-render-status')).toContainText('Login owner BIMA belum aktif');
 await page.locator('#channelBar [data-channel="youtube"]').click();
 await expect(page.locator('#tt-render-card')).toBeHidden();
 await page.locator('#channelBar [data-channel="shopee"]').click();
 await expect(page.locator('#tt-render-card')).toBeHidden();
});

test('TikTok private source pilot cannot spend without owner login',async({page})=>{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();await page.locator('#tt-google-review [data-sec-go="publishing"]').click();await page.locator('[data-legacy-toggle]').click();
 await page.locator('.sidebar [data-go="desk"]').click();
 await expect(page.locator('#tt-reference-file')).toBeAttached();
 await expect(page.locator('#tt-reference-stage')).toBeAttached();
 await expect(page.locator('#tt-motion-pilot')).toBeDisabled();
 await page.locator('#tt-reference-stage').click();
 await expect(page.locator('#tt-motion-status')).toContainText('File harus PNG/JPG/WebP');
});
