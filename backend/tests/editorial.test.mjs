import test from "node:test";
import assert from "node:assert/strict";
import { dailyMix, MIX_2026, TOPICS, validateEditorial } from "../editorial.mjs";

test("alternates Shorts then long-form every day through 2026-12-31",()=>{
  assert.equal(MIX_2026.length,81);
  assert.equal(MIX_2026[0].date,"2026-10-12");
  assert.equal(MIX_2026.at(-1).date,"2026-12-31");
  assert.equal(MIX_2026[0].format,"Shorts");
  assert.equal(MIX_2026[1].format,"Video");
  assert.equal(MIX_2026.filter(x=>x.format==="Shorts").length,41);
  assert.equal(MIX_2026.filter(x=>x.format==="Video").length,40);
  assert.equal(new Set(MIX_2026.map(x=>x.date)).size,81);
  assert.equal(new Set(MIX_2026.map(x=>x.title)).size,81);
  assert.ok(MIX_2026.every(x=>x.status==="Research required"&&!x.approved&&!x.generated));
  assert.ok(MIX_2026.every((x,i)=>x.format===(i%2===0?"Shorts":"Video")));
});
test("rejects unverified textbook references, inaccurate anatomy and incomplete story",()=>{
  const r=validateEditorial({format:"Shorts",targetSeconds:8,voiceover:"A short narration",scenes:[],sources:[],containsAnatomy:true,rightsCleared:false});
  assert.equal(r.passed,false);
  assert.ok(r.issues.some(x=>x.includes("Book citation")));
  assert.ok(r.issues.some(x=>x.includes("Anatomy")));
  assert.ok(r.issues.some(x=>x.includes("payoff")));
  assert.ok(r.issues.some(x=>x.includes("Voiceover")||x.includes("voiceover")));
});
test("passes fully cited, timed and reviewed short only",()=>{
  const r=validateEditorial({
    format:"Shorts",targetSeconds:8,rightsCleared:true,containsAnatomy:true,
    sources:[{id:"book-1",type:"book",title:"Animal Physiology",edition:"6",page:"123",verified:true}],
    claims:[{text:"Tested fact",sourceId:"book-1"}],
    anatomyLabels:[{name:"Verified structure",sourceId:"book-1"}],
    scenes:[
      {start:0,end:2,purpose:"hook"},
      {start:2,end:6,purpose:"mechanism"},
      {start:6,end:8,purpose:"payoff"}
    ],
    voiceover:"One surprising fact has a clear scientific explanation. Watch how this works in nature.",
    voiceEndsBeforeOutro:true,
    thumbnail:{ratio:"9:16",concept:"one science fact",misleading:false},
    manualQualityApproval:true
  });
  assert.deepEqual(r.issues,[]);assert.equal(r.passed,true);
});
