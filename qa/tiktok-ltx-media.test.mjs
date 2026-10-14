import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {saveTikTokLtxMedia} from "../backend/tiktok-ltx-pilot.mjs";
test("LTX video import blocks hosts, credentials, plain HTTP, and unauthorized redirects",async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),"tt-ltx-test-"));
 try{
  let calls=0;
  const fetchImpl=async()=>{calls++;throw Error("unexpected network");};
  const base={outputPath:path.join(dir,"clip.mp4"),allowedHosts:["media.ltx.example"],fetchImpl};
  for(const url of ["http://media.ltx.example/f.mp4","https://127.0.0.1/f.mp4","https://evil.example/f.mp4","https://user:pass@media.ltx.example/f.mp4"]){
   await assert.rejects(saveTikTokLtxMedia({...base,videoUrl:url}));
  }
  assert.equal(calls,0);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("LTX video import never treats arbitrary bytes as valid MP4",async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),"tt-ltx-test-"));
 try{
  await assert.rejects(saveTikTokLtxMedia({videoUrl:"https://media.ltx.example/f.mp4",outputPath:path.join(dir,"clip.mp4"),allowedHosts:["media.ltx.example"],fetchImpl:async()=>({
   ok:true,headers:new Headers({"content-type":"video/mp4","content-length":"12000"}),
   body:(async function*(){yield Buffer.alloc(12000,65);})()
  })}),/video_decode_invalid/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
