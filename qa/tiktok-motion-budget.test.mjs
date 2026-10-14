import test from "node:test";
import assert from "node:assert/strict";
import {quoteTikTokMotion} from "../backend/tiktok-motion-budget.mjs";
test("pilot video quote cannot spend",()=>{
 const q=quoteTikTokMotion();
 assert.equal(q.estimateUsd,0.24);
 assert.equal(q.approvedToSpend,false);
 assert.equal(q.generationEnabled,false);
 assert.equal(q.creditUsageUsd,0);
});
test("spend estimate and strict budget limits",()=>{
 assert.equal(quoteTikTokMotion({sceneCount:3}).estimateUsd,0.72);
 assert.equal(quoteTikTokMotion({sceneCount:3,maxUsd:0.70}).approvedToSpend,false);
 assert.equal(quoteTikTokMotion({sceneCount:3,maxUsd:0.72}).approvedToSpend,true);
 assert.throws(()=>quoteTikTokMotion({model:"unknown"}),/unsupported_motion_model/);
 assert.throws(()=>quoteTikTokMotion({duration:24}),/invalid_motion_duration/);
});
