import { test,expect } from '@playwright/test';
test('TikTok connect panel uses owner session and never reports false connection',async({page})=>{
 await page.goto('https://noor-arief.github.io/Bima-Content-Studio/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();
 // Explicitly load PR feature script into the live UI shell, without changing live assets.
 const script=await page.evaluate(async()=>{const r=await fetch('https://raw.githubusercontent.com/Noor-arief/Bima-Content-Studio/feature/tiktok-connect-ui-20261014/tiktok-connection.js');return await r.text();});
 await page.evaluate(code=>{(0,eval)(code)},script);
 await expect(page.locator('#bima-tiktok-connection')).toBeVisible();
 await expect(page.locator('#tt-connect-state')).toContainText('Sesi owner belum aktif');
 await expect(page.locator('#tt-connect-action')).toBeDisabled();
 await expect(page.locator('#shopeeWorkspace')).toBeHidden();
});
