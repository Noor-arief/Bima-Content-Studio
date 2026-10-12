import test from "node:test";
import assert from "node:assert/strict";
import {RATES,storyboard,createVeoWorker} from "../veo.mjs";

test("Veo pricing and 8-second complete spoken sentence",()=>{
  assert.equal(RATES["veo-3.1-fast-generate-preview"]["1080p"],96);
  const s=storyboard({title:"Octopus has three hearts",description:"An octopus has three hearts. #Shorts",
    prompt:'8-second vertical film. Cinematic octopus with transparent accurate heart anatomy. Natural English voice: "An octopus has three hearts. Two pump to the gills, while one pumps through its body."'});
  assert.match(s.voiceover,/^An octopus has three hearts\./);
  assert.match(s.text,/0–2s/);
  assert.match(s.text,/finish/);
  assert.throws(()=>storyboard({title:"An odd fish",prompt:"A".repeat(50),voiceover:"This is an intentionally extremely long voice over sentence that certainly goes beyond eighteen words and cannot fit into an eight second video without cutting off."}),/voiceover_requires/);
});

test("Veo is disabled until owner configures private API key and explicit enable flag",async()=>{
  const orig={GEMINI_API_KEY:process.env.GEMINI_API_KEY,ENABLE_VEO_GENERATION:process.env.ENABLE_VEO_GENERATION,VEO_PILOT_BUDGET_CENTS:process.env.VEO_PILOT_BUDGET_CENTS};
  try{
    delete process.env.GEMINI_API_KEY;process.env.ENABLE_VEO_GENERATION="false";process.env.VEO_PILOT_BUDGET_CENTS="500";
    const db={},worker=createVeoWorker({db,persist:async()=>{},logEvent:()=>{},mediaDir:"/tmp"});
    assert.equal(worker.overview().enabled,false);
    await assert.rejects(worker.start({id:"mydraft",confirmCost:true}),/veo_disabled/);
  }finally{
    for(const [k,v] of Object.entries(orig)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
  }
});

test("pilot budget hard cap cannot be bypassed by revisions or API failures",async()=>{
  const previous={GEMINI_API_KEY:process.env.GEMINI_API_KEY,ENABLE_VEO_GENERATION:process.env.ENABLE_VEO_GENERATION,VEO_PILOT_BUDGET_CENTS:process.env.VEO_PILOT_BUDGET_CENTS};
  const originalFetch=globalThis.fetch;
  process.env.GEMINI_API_KEY="fake-key-test-not-a-real-secret";
  process.env.ENABLE_VEO_GENERATION="true";process.env.VEO_PILOT_BUDGET_CENTS="500";
  let calls=0;
  globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({name:"operations/test_"+calls}),{status:200,headers:{"Content-Type":"application/json"}});};
  try{
    const db={},worker=createVeoWorker({db,persist:async()=>{},logEvent:()=>{},mediaDir:"/tmp"});
    const input={id:"video1",title:"An octopus has three hearts",prompt:"A dramatic underwater cinematic octopus demonstrates its three hearts with a clear educational ending.",description:"An octopus has three hearts.",confirmCost:true};
    await worker.start(input);
    assert.equal(worker.overview().remainingUsd,4.04);
    assert.equal(db.veoBudgetUsedCents,96);
    db.veoJobs.video1.status="rejected";
    await worker.start(input); // paid revision, must retain cumulative cost
    assert.equal(db.veoBudgetUsedCents,192);
    assert.equal(worker.overview().remainingUsd,3.08);
    for(let i=2;i<=4;i++){
      db.veoJobs.video1.status="rejected";
      await worker.start(input);
    }
    assert.equal(worker.overview().reservedUsd,4.8);
    db.veoJobs.video1.status="rejected";
    await assert.rejects(worker.start(input),/budget_exhausted/);
    assert.equal(calls,5);
    assert.equal(db.veoBudgetUsedCents,480);
  }finally{
    globalThis.fetch=originalFetch;
    for(const [k,v] of Object.entries(previous)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
  }
});
