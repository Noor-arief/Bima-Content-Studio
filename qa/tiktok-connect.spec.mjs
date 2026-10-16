import { test,expect } from '@playwright/test';
test('TikTok connect panel uses owner session and never reports false connection',async({page})=>{
 await page.route('https://content-studio-api-production-3fe2.up.railway.app/public/tiktok/sandbox/status',r=>r.fulfill({json:{configured:true,connected:false}}));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();await page.locator('#tt-google-review [data-sec-go="publishing"]').click();
 await expect(page.locator('#bima-tiktok-connection')).toBeVisible();
 await expect(page.locator('#tt-connect-state')).toContainText(/Sandbox siap|Sandbox Connected|Kredensial|Gagal memeriksa/);
 await expect(page.locator('#tt-connect-action')).toBeDisabled();
 await expect(page.locator('#tt-owner-login')).toBeVisible();
 await page.locator('#tt-connect-check').click();
 await expect(page.locator('#tt-connect-check')).toBeEnabled();
 await expect(page.locator('#tt-connect-state')).toContainText(/Sandbox siap|Sandbox Connected|Kredensial|Gagal memeriksa/);
 await expect(page.locator('#shopeeWorkspace')).toBeHidden();
});

test('TikTok header badge reflects verified Sandbox status, independently from Shop',async({page})=>{
 await page.route('https://content-studio-api-production-3fe2.up.railway.app/public/tiktok/sandbox/status',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({environment:'sandbox',configured:true,connected:true,shopAffiliateConnected:false,postingConnected:false})}));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();await page.locator('#tt-google-review [data-sec-go="publishing"]').click();
 await expect(page.locator('#tiktokWorkspace .aff-head .aff-badge')).toContainText('Sandbox Connected');
 await expect(page.locator('#tt-connect-state')).toContainText('Sandbox Connected');
 await expect(page.locator('#tt-connect-action')).toBeDisabled();
});
