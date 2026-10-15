import {test,expect} from '@playwright/test';
test('TikTok workflow navigation follows owner tasks, voice preview is clearly labelled, and other channels remain isolated',async({page})=>{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();await page.locator('#tt-google-review [data-sec-go="publishing"]').click();
 await expect(page.locator('.sidebar [data-go] .channel-menu-name').first()).toHaveText('TikTok Production 1');
 await page.locator('.sidebar [data-go="desk"]').click();
 await expect(page.locator('#tt-voice-preview')).toContainText('Ini bukan file VO final');
 await expect(page.locator('#tt-voice-play')).toBeHidden();
 await expect(page.locator('.sidebar [data-tiktok-calendar]')).toBeVisible();
 await page.locator('.sidebar [data-tiktok-calendar]').click();
 await expect(page.locator('[data-main-title]')).toHaveText('TikTok Calendar & Live');
 await page.locator('#channelBar [data-channel="youtube"]').click();
 await expect(page.locator('.sidebar [data-go] .channel-menu-name').first()).toHaveText('Ringkasan YouTube');
 await page.locator('#channelBar [data-channel="shopee"]').click();
 await expect(page.locator('.sidebar [data-go] .channel-menu-name').first()).toHaveText('Ringkasan');
});