import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtemp,readFile,stat,writeFile,rm} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {createRequire} from "node:module";
const ffmpeg=createRequire(new URL("../backend/server.mjs",import.meta.url))("ffmpeg-static");
import {renderTikTokAffiliateVideo} from "../backend/tiktok-affiliate-render.mjs";
const run=(args)=>new Promise((resolve,reject)=>{const p=spawn(ffmpeg,args,{stdio:"ignore"});p.on("close",n=>n===0?resolve():reject(Error("fixture_ffmpeg_failed_"+n)));p.on("error",reject);});
test("renderer requires owner approval and verified images/music",async()=>{
 await assert.rejects(renderTikTokAffiliateVideo({images:[]}),/owner_approval_required/);
 await assert.rejects(renderTikTokAffiliateVideo({images:[],ownerApproved:true}),/verified_product_assets_required/);
 await assert.rejects(renderTikTokAffiliateVideo({images:[],ownerApproved:true,approvedProductAssets:true}),/commercial_music_license_required/);
});
test("render 24s portrait MP4 with voice and music, no false TikTok publishing claim",async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),"bima-tt-render-"));
 try {
 const imgs=[];
 for(let i=0;i<3;i++){
 const p=path.join(dir,"product"+i+".png");
 await run(["-hide_banner","-loglevel","error","-f","lavfi","-i",["color=c=red:s=480x640","color=c=blue:s=480x640","color=c=green:s=480x640"][i],"-frames:v","1","-update","1",p]);imgs.push(p);
 }
 const voice=path.join(dir,"voice.wav"),music=path.join(dir,"licensed-music.wav");
 await run(["-hide_banner","-loglevel","error","-f","lavfi","-i","sine=frequency=380:duration=24","-c:a","pcm_s16le",voice]);
 await run(["-hide_banner","-loglevel","error","-f","lavfi","-i","sine=frequency=180:duration=24","-c:a","pcm_s16le",music]);
 const srt=path.join(dir,"subtitles.srt");
 await writeFile(srt,"1\n00:00:00,000 --> 00:00:08,000\nScene one\n\n2\n00:00:08,000 --> 00:00:16,000\nScene two\n\n3\n00:00:16,000 --> 00:00:24,000\nScene three\n");
 const output=path.join(dir,"result.mp4");
 const res=await renderTikTokAffiliateVideo({images:imgs,voicePath:voice,musicPath:music,subtitlesPath:srt,outputPath:output,approvedProductAssets:true,musicLicensed:true,ownerApproved:true});
 assert.equal(res.durationSeconds,24);assert.equal(res.subtitlesBurned,false);assert.equal(res.uploaded,false);assert.equal(res.affiliateLinked,false);
 assert.ok((await stat(output)).size>10000);
 const buffer=await readFile(output);assert.ok(buffer.subarray(0,256).includes(Buffer.from("ftyp")));
 }finally{await rm(dir,{recursive:true,force:true});}
},{timeout:190000});
