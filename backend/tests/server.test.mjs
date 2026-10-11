import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as wait } from "node:timers/promises";

test("backend is healthy but blocks OAuth, uploads and private API until configured",async t=>{
  const tmp=await mkdtemp(path.join(os.tmpdir(),"bima-content-test-"));
  const port=44000+Math.floor(Math.random()*10000);
  const child=spawn(process.execPath,["server.mjs"],{
    cwd:path.resolve(import.meta.dirname,".."),
    env:{...process.env,PORT:String(port),DATA_DIR:tmp,
      GOOGLE_CLIENT_ID:"",GOOGLE_CLIENT_SECRET:"",OWNER_EMAIL:"",
      ENABLE_UPLOADS:"false",ENABLE_PUBLIC_SCHEDULING:"false"},
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
  const health=await (await fetch(url+"/health")).json();
  assert.equal(health.uploadsEnabled,false);
  assert.equal(health.publicSchedulingEnabled,false);
  assert.equal(health.youtubeConnected,false);
  assert.equal((await fetch(url+"/ready")).status,503);
  assert.equal((await fetch(url+"/api/status")).status,401);
  assert.equal((await fetch(url+"/api/content",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"})).status,401);
  assert.equal((await fetch(url+"/auth/google/start")).status,503);
  assert.equal((await fetch(url+"/health",{headers:{Origin:"https://evil.example"}})).status,403);
  const preflight=await fetch(url+"/api/status",{method:"OPTIONS",headers:{Origin:"https://noor-arief.github.io","Access-Control-Request-Method":"GET"}});
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get("access-control-allow-origin"),"https://noor-arief.github.io");
});
