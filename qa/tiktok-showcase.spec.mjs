import {test,expect} from '@playwright/test';
const api='https://content-studio-api-production-3fe2.up.railway.app';
async function setup(page,{owner=true,configured=true,connected=true,products=[]}={}){
 if(owner)await page.addInitScript(()=>sessionStorage.setItem('bima_content_server_session','test-owner'));
 await page.route(api+'/**',route=>{
  const path=new URL(route.request().url()).pathname;
  const json=path.endsWith('/creator/status')?{configured,connected,grantedScopes:connected?['creator.showcase.read']:[]}:path.endsWith('/creator/showcase')?{source:'tiktok_shop_creator_live',products}:path.endsWith('/creator/start')?{authorizationUrl:'https://shop.tiktok.com/alliance/creator/auth?app_key=test&state=test'}:{configured:false,connected:false,jobs:[],blockers:[]};
  return route.fulfill({json});
 });
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('#channelBar [data-channel="tiktok"]').click();
 await page.locator('.sidebar [data-go="desk"]').click();
}
test('no owner or official configuration keeps Creator actions blocked',async({page})=>{
 await setup(page,{owner:false});await expect(page.locator('#tt-showcase')).toBeVisible();
 await expect(page.locator('[data-creator-sync]')).toBeDisabled();await expect(page.locator('[data-creator-login]')).toBeVisible();
 await page.evaluate(()=>{sessionStorage.setItem('bima_content_server_session','test');document.dispatchEvent(new Event('bima:owner-session'));});
 await page.route(api+'/auth/tiktok-shop/creator/status',r=>r.fulfill({json:{configured:false,connected:false}}));
 await page.locator('[data-creator-refresh]').click();await expect(page.locator('[data-creator-connect]')).toBeDisabled();
});
test('sync shows exact API IDs safely, survives navigation, clears on failure',async({page})=>{
 await setup(page,{products:[{id:'1720000000000000001',name:'<img src=x onerror=alert(1)>',origin:'tiktok_shop_creator_live'}]});
 await page.locator('[data-creator-sync]').click();await expect(page.locator('[data-showcase-products]')).toContainText('1720000000000000001');
 await expect(page.locator('[data-showcase-products] img')).toHaveCount(0);
 await page.locator('#tt-google-review [data-sec-go="publishing"]').click();await expect(page.locator('#tt-showcase')).toBeVisible();
 await page.route(api+'/auth/tiktok-shop/creator/showcase',r=>r.fulfill({status:502,json:{error:'tiktok_shop_showcase_unavailable'}}));
 await page.locator('[data-creator-sync]').click();await expect(page.locator('[data-showcase-products] li')).toHaveCount(0);await expect(page.locator('[data-creator-state]')).toContainText('belum berhasil');
 for(const channel of ['youtube','shopee']){await page.locator(`#channelBar [data-channel="${channel}"]`).click();await expect(page.locator('#tt-showcase')).toBeHidden();}
});
test('empty read is not product retrieval; mobile has no overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await setup(page);await page.locator('[data-creator-sync]').click();await expect(page.locator('[data-creator-state]')).toContainText('0 produk');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/tiktok-showcase-mobile.png',fullPage:true});
});
test('untrusted authorization URL is not opened',async({page})=>{
 await setup(page,{connected:false});await page.route(api+'/auth/tiktok-shop/creator/start',r=>r.fulfill({json:{authorizationUrl:'https://example.com/steal'}}));
 await page.locator('[data-creator-connect]').click();await expect(page.locator('[data-creator-state]')).toContainText('belum dapat diperiksa');
});
