import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../tiktok-affiliate.js',import.meta.url),'utf8');
let cfg;
vm.runInNewContext(source,{window:{BimaAffiliate:{mount:c=>{cfg=c;}}}});
test('TikTok first sale works from genuine Showcase link without requiring Product ID',()=>{
 const product={productUrl:'https://shop.tiktok.com/example',showcaseChecked:true,visualChecked:true,disclosureChecked:true};
 assert.equal(cfg.readyGate(product),true);
 assert.equal(cfg.readyGate({...product,productUrl:''}),false);
 assert.equal(cfg.recordGate({...product,basketChecked:true},new URL('https://www.tiktok.com/@noor_arief/video/123')),true);
 assert.equal(cfg.recordGate({...product,basketChecked:false},new URL('https://www.tiktok.com/@noor_arief/video/123')),false);
 assert.equal(cfg.recordGate({...product,basketChecked:true},new URL('https://example.com/video/123')),false);
});
test('Affiliate production remains manually published and TikTok-specific',()=>{
 assert.match(cfg.uploadHint,/Showcase/);
 assert.match(cfg.uploadHint,/upload otomatis belum terhubung/i);
 assert.equal(cfg.id,'tiktok');
 assert.equal(cfg.storeKey,'bima-tiktok-affiliate-v1');
});
