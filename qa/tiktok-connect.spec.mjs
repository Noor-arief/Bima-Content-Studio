import { test,expect } from '@playwright/test';
test('TikTok connect panel uses owner session and never reports false connection',async({page})=>{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();
 await expect(page.locator('#bima-tiktok-connection')).toBeVisible();
 await expect(page.locator('#tt-connect-state')).toContainText('Sesi owner belum aktif');
 await expect(page.locator('#tt-connect-action')).toBeDisabled();
 await expect(page.locator('#shopeeWorkspace')).toBeHidden();
});
