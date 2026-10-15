import test from "node:test";
import assert from "node:assert/strict";
import {beginCreatorAuthorization,validateCreatorCallback,validateCreatorToken,getCreatorShowcasePage,signTikTokShopGet,SHOWCASE_PATH} from "../tiktok-shop-creator.mjs";
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
