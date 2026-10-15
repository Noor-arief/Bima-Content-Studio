import test from "node:test";
import assert from "node:assert/strict";
import {beginCreatorAuthorization,validateCreatorCallback,validateCreatorToken,getCreatorShowcasePage,signTikTokShopGet,collectCreatorShowcase,SHOWCASE_PATH} from "../tiktok-shop-creator.mjs";
test("creator auth state is unguessable, single-use validation input and expires",()=>{
 const a=beginCreatorAuthorization("abc",1000),b=beginCreatorAuthorization("abc",1000);
 assert.notEqual(a.state,b.state);
 assert.equal(validateCreatorCallback({state:a.state,code:"ok"},a,2000),"ok");
 assert.throws(()=>validateCreatorCallback({state:a.state,code:"ok"},a,601000),/expired/);
 assert.throws(()=>validateCreatorCallback({state:b.state,code:"ok"},a,2000),/invalid/);
});
test("creator token requires creator identity and showcase scope",()=>{
 const valid={code:0,data:{user_type:1,granted_scopes:["creator.showcase.read"],access_token:"a",refresh_token:"b"}};
 assert.equal(validateCreatorToken(valid).userType,1);
 assert.throws(()=>validateCreatorToken({...valid,data:{...valid.data,user_type:0}}),/invalid/);
 assert.throws(()=>validateCreatorToken({...valid,data:{...valid.data,granted_scopes:[]}}),/scope/);
});
test("showcase is signed and never invents GMV",async()=>{
 const p=await getCreatorShowcasePage({appKey:"key",appSecret:"secret",creatorAccessToken:"token",now:1000000,fetchImpl:async (url,options)=>{
  assert.equal(url.pathname,SHOWCASE_PATH);
  assert.equal(url.searchParams.get("origin"),"SHOWCASE");
  assert.equal(url.searchParams.get("sign"),signTikTokShopGet(SHOWCASE_PATH,Object.fromEntries([...url.searchParams].filter(([k])=>k!=="sign")),"secret"));
  assert.equal(options.headers["x-tts-access-token"],"token");
  return {ok:true,json:async()=>({code:0,data:{products:[{id:"123",name:"Test product"}],next_page_token:null}})};
 }});
 assert.deepEqual(p.products,[{id:"123",name:"Test product",origin:"tiktok_shop_creator_live",gmv:null,gmvVerified:false}]);
});

test("collect pages deduplicates creator products and preserves unverified GMV",async()=>{
 let count=0;
 const result=await collectCreatorShowcase({appKey:"k",appSecret:"s",creatorAccessToken:"t",maxPages:3,fetchImpl:async url=>{
  const cursor=url.searchParams.get("page_token");count++;
  return {ok:true,json:async()=>({code:0,data:{products:cursor?[{id:"A",name:"A"},{id:"B",name:"B"}]:[{id:"A",name:"A"}],next_page_token:cursor?null:"next"}})};
 }});
 assert.equal(count,2);
 assert.deepEqual(result.products.map(x=>x.id),["A","B"]);
 assert.equal(result.gmvVerified,false);
 assert.ok(result.products.every(x=>x.gmv===null));
});
test("collect pages rejects repeating cursors",async()=>{
 await assert.rejects(()=>collectCreatorShowcase({appKey:"k",appSecret:"s",creatorAccessToken:"t",maxPages:3,fetchImpl:async()=>({ok:true,json:async()=>({code:0,data:{products:[],next_page_token:"repeat"}})})}),/pagination_cycle/);
});
