import test from "node:test";
import assert from "node:assert/strict";
import {createVeoWorker} from "../veo.mjs";

test("owner-authorized queue never starts until API is enabled",async()=>{
 const before={key:process.env.GEMINI_API_KEY,flag:process.env.ENABLE_VEO_GENERATION};
 try{
   delete process.env.GEMINI_API_KEY;process.env.ENABLE_VEO_GENERATION="false";
   const worker=createVeoWorker({db:{},persist:async()=>{},logEvent:()=>{},mediaDir:"/tmp"});
   await assert.rejects(worker.queueBatch([]),/veo_disabled/);
 }finally{
   if(before.key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=before.key;
   if(before.flag===undefined)delete process.env.ENABLE_VEO_GENERATION;else process.env.ENABLE_VEO_GENERATION=before.flag;
 }
});

test("one-time approved queue serializes multiple unique shorts with no silent regeneration",async()=>{
 const old={key:process.env.GEMINI_API_KEY,flag:process.env.ENABLE_VEO_GENERATION,cap:process.env.VEO_PILOT_BUDGET_CENTS};
 const oldFetch=globalThis.fetch;
 process.env.GEMINI_API_KEY="fake-key-for-unit-tests-only";
 process.env.ENABLE_VEO_GENERATION="true";process.env.VEO_PILOT_BUDGET_CENTS="500";
 let calls=0;
 globalThis.fetch=async()=>new Response(JSON.stringify({name:"operations/mock_"+(++calls)}),{status:200,headers:{"Content-Type":"application/json"}});
 try{
   const db={},worker=createVeoWorker({db,persist:async()=>{},logEvent:()=>{},mediaDir:"/tmp"});
   const entries=[1,2,3].map(n=>({id:"ytpilot"+n,title:"A curious science fact "+n,
     prompt:"An inspiring cinematic nature film with clear original animation and a satisfying final science reveal.",
     voiceover:"The natural world holds extraordinary science.",model:"veo-3.1-fast-generate-preview",resolution:"1080p"}));
   const queued=await worker.queueBatch(entries);
   assert.equal(queued.length,3);assert.equal(calls,0);assert.equal(db.veoBudgetUsedCents,0);
   await assert.rejects(worker.queueBatch(entries),/already_in_autonomous_queue/);
   await worker.pump();assert.equal(calls,1);assert.equal(db.veoBudgetUsedCents,106);
   assert.equal(db.veoQueue[0].status,"submitted");
   await worker.pump();assert.equal(calls,1,"second job waits while first Veo call remains running");
   db.veoJobs.ytpilot1.status="needs_owner_review";
   await worker.pump();assert.equal(calls,2);
   assert.equal(db.veoBudgetUsedCents,212);
   assert.equal(worker.overview().queue.filter(x=>x.status==="submitted").length,2);
 }finally{
   globalThis.fetch=oldFetch;
   const vars={GEMINI_API_KEY:old.key,ENABLE_VEO_GENERATION:old.flag,VEO_PILOT_BUDGET_CENTS:old.cap};
   for(const [k,v] of Object.entries(vars)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
 }
});
