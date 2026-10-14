import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,writeFile,readFile,rm,stat} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {createRequire} from "node:module";
const ffmpegBinary=createRequire(new URL("../backend/server.mjs",import.meta.url))("ffmpeg-static");
import {createTikTokLocalVoice,probeTikTokVoiceDuration,createTikTokTimedSrt} from "../backend/tiktok-voice.mjs";
test("local-TTS guardrails prevent unapproved generation and missing model",async()=>{
 await assert.rejects(createTikTokLocalVoice(),/owner_approval_required/);
 await assert.rejects(createTikTokLocalVoice({ownerApproved:true}),/voice_model_license_approval_required/);
 await assert.rejects(createTikTokLocalVoice({ownerApproved:true,voiceLicenseApproved:true,script:"A real Indonesian narration script that is long enough.",voiceModel:"/missing/piper.onnx",outputPath:"/tmp/result.wav"}),/indonesian_piper_model_not_configured/);
});
test("real WAV output from offline adapter and time-aligned SRT",async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),"bima-voice-"));
 try{
 const model=path.join(dir,"id.onnx");await writeFile(model,"TEST MODEL PLACEHOLDER");
 const fake=path.join(dir,"fake-piper");
 await writeFile(fake,`#!/usr/bin/env node
const {spawnSync}=require("node:child_process");
const a=process.argv, dest=a[a.indexOf("--output_file")+1];
process.stdin.resume();process.stdin.on("end",()=>{
  const f=spawnSync(${JSON.stringify(ffmpegBinary)},["-hide_banner","-loglevel","error","-f","lavfi","-i","sine=frequency=440:duration=2.4","-c:a","pcm_s16le",dest]);
  process.exit(f.status??1);
});`);
 await import("node:fs/promises").then(fs=>fs.chmod(fake,0o755));
 const out=path.join(dir,"voice.wav");
 const result=await createTikTokLocalVoice({script:"Ini contoh narasi produk yang akan direkam secara lokal.",voiceModel:model,piperBinary:fake,outputPath:out,ownerApproved:true,voiceLicenseApproved:true});
 assert.equal(result.generated,true);assert.equal(result.estimatedApiCostUsd,0);
 assert.ok((await stat(out)).size>1000);
 const duration=await probeTikTokVoiceDuration(out);assert.ok(duration>2.2&&duration<2.6);
 const srt=createTikTokTimedSrt(["Adegan pertama","Adegan kedua","Adegan ketiga"],[duration,3,2]);
 assert.match(srt,/00:00:00,000 --> 00:00:02,4/);
 assert.match(srt,/00:00:08,000 --> 00:00:11,000/);
 assert.match(srt,/00:00:16,000 --> 00:00:18,000/);
 assert.throws(()=>createTikTokTimedSrt(["a","b","c"],[2,9,2]),/scene_audio_must_fit_eight_seconds/);
 }finally{await rm(dir,{recursive:true,force:true});}
},{timeout:30000});
