import test from "node:test";
import assert from "node:assert/strict";
import {submitTikTokLtxPilot,checkTikTokLtxPilot} from "../backend/tiktok-ltx-pilot.mjs";
const base={imageUri:"https://assets.example.com/product.jpg",prompt:"A realistic, stable close-up of this authentic product resting on a clean tabletop, soft natural daylight, subtle hand movement.",verifiedProductImage:true,ownerApproved:true,maxUsd:0.24,apiKey:"test-api-key"};
test("no LTX job without explicit budget or verified asset",async()=>{
 let called=false;
 const fetchImpl=async()=>{called=true;throw Error("network_called");};
 await assert.rejects(submitTikTokLtxPilot({...base,maxUsd:0,fetchImpl}),/owner_budget_approval_required/);
 await assert.rejects(submitTikTokLtxPilot({...base,verifiedProductImage:false,fetchImpl}),/verified_product_image_required/);
 assert.equal(called,false);
});
test("single v2 720x1280 job with silent output and correct auth",async()=>{
 let count=0;
 const fetchImpl=async(url,opt)=>{
 count++;assert.equal(url,"https://api.ltx.io/v2/image-to-video");
 assert.equal(opt.headers.Authorization,"Bearer test-api-key");
 const body=JSON.parse(opt.body);
 assert.deepEqual({model:body.model,duration:body.duration,resolution:body.resolution,generate_audio:body.generate_audio},
 {model:"ltx-2-3-fast",duration:8,resolution:"720x1280",generate_audio:false});
 assert.equal(body.prompt,base.prompt);
 return {ok:true,json:async()=>({id:"job-12345"})};
 };
 const result=await submitTikTokLtxPilot({...base,fetchImpl});
 assert.equal(count,1);assert.equal(result.estimatedUsd,0.24);assert.equal(result.published,false);
});
test("poll checks exact job endpoint without exposing generated url",async()=>{
 const result=await checkTikTokLtxPilot({id:"job-12345",apiKey:"key",
 fetchImpl:async url=>{assert.equal(url,"https://api.ltx.io/v2/image-to-video/job-12345");return {ok:true,json:async()=>({status:"completed",result:{video_url:"https://download.example/video.mp4"}})};}});
 assert.equal(result.ready,true);assert.equal(result.resultAvailable,true);assert.equal("video_url" in result,false);
});
