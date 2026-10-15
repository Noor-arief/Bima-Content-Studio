import test from 'node:test';
import assert from 'node:assert/strict';
import {collectShowcasePages,normalizeShowcaseProduct,selectHighestVerifiedGmv} from '../backend/tiktok-showcase-contract.mjs';
test('offline fixture paginates/deduplicates, never claims live Showcase',async()=>{
 const pages={start:{products:[{id:'A',name:'Kipas A',gmv:100,gmvCurrency:'IDR',gmvVerified:true,gmvSource:'source fixture A'}],nextPageToken:'next'},next:{products:[{id:'A',name:'Kipas A'},{id:'B',name:'Kipas B',gmv:350,gmvCurrency:'IDR',gmvVerified:true,gmvSource:'source fixture B'}]}};
 const got=await collectShowcasePages(async cursor=>pages[cursor||'start']);
 assert.equal(got.length,2);assert.ok(got.every(p=>p.origin==='fixture'));
 const choice=selectHighestVerifiedGmv(got);assert.equal(choice.product.id,'B');assert.notEqual(choice.status,'ready_to_publish');
});
test('unverified GMV and fake metrics cannot qualify as winner',()=>{
 const x=normalizeShowcaseProduct({id:'A',name:'Kipas',gmv:1000000,gmvCurrency:'IDR',gmvVerified:false,gmvSource:'unknown'});
 assert.equal(x.gmv,null);assert.equal(selectHighestVerifiedGmv([x]).status,'blocked_no_verified_gmv');
 assert.equal(normalizeShowcaseProduct({id:'B',name:'Lain',orders:1000}).gmv,null);
});
test('pagination errors fail closed',async()=>{
 await assert.rejects(()=>collectShowcasePages(async()=>({products:[],nextPageToken:'again'})),/showcase_pagination_cycle/);
 await assert.rejects(()=>collectShowcasePages(async()=>({products:'bad'})),/showcase_invalid_response/);
});
