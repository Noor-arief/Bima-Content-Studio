import { test, expect } from '@playwright/test';
test('TikTok affiliate production exposes blocking dependencies instead of fake automation readiness',async({page})=>{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();
 await expect(page.locator('#tt-automation-gate')).toContainText('AUTO BLOCKED');
 await expect(page.locator('#tt-automation-gate')).toContainText('Affiliate Creator');
 await expect(page.locator('#tt-automation-gate')).toContainText('keranjang kuning');
});
