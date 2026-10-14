import test from "node:test";
import assert from "node:assert/strict";
import {submitTikTokLtxPilot} from "../backend/tiktok-ltx-pilot.mjs";
test("private source JPEG accepted by LTX with explicit spend approval",async()=>{
 const imageUri="data:image/jpeg;base64,"+Buffer.from("image-fixture").toString("base64");
 let called=false;
 const result=await submitTikTokLtxPilot({imageUri,prompt:"A realistic slow camera orbit around the untouched original product, stable proportions and clean room lighting.",ownerApproved:true,maxUsd:0.24,verifiedProductImage:true,apiKey:"test",fetchImpl:async (_url,opt)=>{called=true;assert.equal(JSON.parse(opt.body).image_uri,imageUri);return {ok:true,json:async()=>({id:"job-private1"})};}});
 assert.equal(called,true);assert.equal(result.estimatedUsd,0.24);
});
test("private source cannot spend without consent",async()=>{
 const imageUri="data:image/jpeg;base64,"+Buffer.from("x").toString("base64");
 await assert.rejects(submitTikTokLtxPilot({imageUri,prompt:"A realistic slow camera orbit around the original product preserving all original details.",ownerApproved:false,maxUsd:0.24,verifiedProductImage:true,apiKey:"test",fetchImpl:()=>{throw Error("MUST_NOT_CALL");}}),/owner_budget_approval_required/);
});
