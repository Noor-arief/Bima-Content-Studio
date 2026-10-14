import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,writeFile,stat,chmod,rm} from "node:fs/promises";
import {spawn} from "node:child_process";
import {createRequire} from "node:module";
import path from "node:path";
import os from "node:os";
import {composeTikTokAffiliatePreview} from "../backend/tiktok-production.mjs";
const ffmpeg=createRequire(new URL("../backend/server.mjs",import.meta.url))("ffmpeg-static");
const run=args=>new Promise((ok,bad)=>{const p=spawn(ffmpeg,args,{stdio:"ignore"});p.on("close",c=>c===0?ok():bad(Error("ffmpeg_"+c)));p.on("error",bad);});
test("TikTok orchestration refuses unapproved production",async()=>{
 await assert.rejects(composeTikTokAffiliatePreview({}),/owner_approval_required/);
 await assert.rejects(composeTikTokAffiliatePreview({ownerApproved:true}),/verified_product_assets_required/);
 await assert.rejects(composeTikTokAffiliatePreview({ownerApproved:true,approvedProductAssets:true}),/audio_license_approval_required/);
});
test("three actual audio files become one synced captioned MP4",async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),"bima-tt-composition-"));
 try{
  const images=[];
  for(const col of ["red","blue","green"]){const dest=path.join(dir,col+".png");await run(["-y","-hide_banner","-loglevel","error","-f","lavfi","-i","color=c="+col+":s=480x640","-frames:v","1","-update","1",dest]);images.push(dest);}
  const music=path.join(dir,"music.wav");await run(["-y","-hide_banner","-loglevel","error","-f","lavfi","-i","sine=frequency=160:duration=24","-c:a","pcm_s16le",music]);
  const model=path.join(dir,"id.onnx");await writeFile(model,"TEST");
  const fake=path.join(dir,"piper");await writeFile(fake,`#!/usr/bin/env node
const {spawnSync}=require("node:child_process");const a=process.argv;process.stdin.resume();process.stdin.on("end",()=>{const p=spawnSync(${JSON.stringify(ffmpeg)},["-y","-hide_banner","-loglevel","error","-f","lavfi","-i","sine=frequency=370:duration=2","-c:a","pcm_s16le",a[a.indexOf("--output_file")+1]]);process.exit(p.status??1);});`);
  await chmod(fake,0o755);
  const result=await composeTikTokAffiliatePreview({scenes:["Coba perhatikan produk yang ini.","Tampilannya sederhana dan mudah dilihat.","Lihat detail produk sebelum membeli."],images,musicPath:music,outputPath:path.join(dir,"final.mp4"),voiceModel:model,piperBinary:fake,ownerApproved:true,approvedProductAssets:true,musicLicensed:true,voiceLicenseApproved:true});
  assert.equal(result.subtitlesBurned,true);assert.equal(result.subtitlesSyncedToVoice,true);assert.equal(result.readyToPublish,false);assert.equal(result.voiceDurations.length,3);assert.ok((await stat(result.outputPath)).size>10000);
  const clips=[];
  for(let i=0;i<3;i++){
   const clip=path.join(dir,'motion-'+i+'.mp4');
   await run(['-y','-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=180x320:rate=24:duration=8','-c:v','libx264','-preset','ultrafast',clip]);clips.push(clip);
  }
  const motion=await composeTikTokAffiliatePreview({scenes:["Coba perhatikan produk yang ini.","Tampilannya sederhana dan mudah dilihat.","Lihat detail produk sebelum membeli."],clips,musicPath:music,outputPath:path.join(dir,"motion-final.mp4"),voiceModel:model,piperBinary:fake,ownerApproved:true,approvedProductAssets:true,musicLicensed:true,voiceLicenseApproved:true});
  assert.equal(motion.visualSource,'ai_motion_clips');assert.equal(motion.readyToPublish,false);
  assert.ok((await stat(motion.outputPath)).size>10000);

 }finally{await rm(dir,{recursive:true,force:true});}
},{timeout:190000});
