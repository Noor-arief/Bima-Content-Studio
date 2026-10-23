import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { setTimeout as wait } from "node:timers/promises";

test("backend is healthy but blocks OAuth, uploads and private API until configured",async t=>{
  const tmp=await mkdtemp(path.join(os.tmpdir(),"bima-content-test-"));
  const owner="owner@example.com",session="testsession";
  await writeFile(path.join(tmp,"state.json"),JSON.stringify({sessions:{[createHash("sha256").update(session).digest("hex")]:{email:owner,expires:Date.now()+60000}},content:{"review-job":{id:"review-job",status:"needs_review"}}}));
  const port=44000+Math.floor(Math.random()*10000);
  const child=spawn(process.execPath,["server.mjs"],{
    cwd:path.resolve(import.meta.dirname,".."),
    env:{...process.env,PORT:String(port),DATA_DIR:tmp,
      GOOGLE_CLIENT_ID:"",GOOGLE_CLIENT_SECRET:"",OWNER_EMAIL:owner,
      ENABLE_UPLOADS:"false",ENABLE_PUBLIC_SCHEDULING:"false",ENABLE_TIKTOK_GOOGLE:"false"},
    stdio:["ignore","pipe","pipe"]
  });
  t.after(async()=>{child.kill("SIGTERM");await rm(tmp,{recursive:true,force:true});});
  const url="http://127.0.0.1:"+port;
  let started=false;for(let i=0;i<50;i++){
    if(child.exitCode!==null)throw Error("server exited unexpectedly");
    try{const r=await fetch(url+"/health");if(r.ok){started=true;break;}}catch{}
    await wait(100);
  }
  assert.equal(started,true,"health endpoint becomes ready");
  const publicGoogle=await fetch(url+"/public/tiktok/google/status");
  assert.equal(publicGoogle.status,200);
  const google=await publicGoogle.json();assert.equal(google.enabled,false);assert.equal(google.jobs,undefined);
  for(const route of ["status","products","jobs/aaaaaaaaaaaaaaaaaaaaaaaa/video"]){
    assert.equal((await fetch(url+"/api/tiktok/google/"+route)).status,401);
  }
  const googlePrivate=await fetch(url+"/api/tiktok/google/status",{headers:{Authorization:"Bearer "+session}});
  assert.equal(googlePrivate.status,200);assert.deepEqual((await googlePrivate.json()).jobs,[]);
  const health=await (await fetch(url+"/health")).json();
  const locked=await fetch(url+"/api/content/review-job/media",{method:"POST",headers:{Authorization:"Bearer "+session,"Content-Type":"video/mp4"},body:Buffer.alloc(1024)});
  assert.equal(locked.status,409,"uncertain upload must not be reset by replacing media");
  assert.equal((await locked.json()).error,"media_locked");
  assert.equal(health.uploadsEnabled,false);
  assert.equal(health.publicSchedulingEnabled,false);
  assert.equal(health.youtubeConnected,false);
  assert.equal((await fetch(url+"/ready")).status,503);
  assert.equal((await fetch(url+"/api/status")).status,401);
  assert.equal((await fetch(url+"/api/youtube/analytics")).status,401);
  assert.equal((await fetch(url+"/api/youtube/analytics",{headers:{Authorization:"Bearer "+session}})).status,409);
  assert.equal((await fetch(url+"/api/content",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"})).status,401);
  assert.equal((await fetch(url+"/auth/google/start")).status,503);
  assert.equal((await fetch(url+"/health",{headers:{Origin:"https://evil.example"}})).status,403);
  const preflight=await fetch(url+"/api/status",{method:"OPTIONS",headers:{Origin:"https://noor-arief.github.io","Access-Control-Request-Method":"GET"}});
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get("access-control-allow-origin"),"https://noor-arief.github.io");
});
