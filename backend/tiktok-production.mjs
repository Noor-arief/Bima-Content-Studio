import {promises as fs} from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";
import ffmpeg from "ffmpeg-static";
import {createTikTokLocalVoice,probeTikTokVoiceDuration,createTikTokTimedSrt} from "./tiktok-voice.mjs";
import {renderTikTokAffiliateVideo} from "./tiktok-affiliate-render.mjs";

// Isolated offline production orchestrator; does not publish or call paid APIs.
async function run(args){
 await new Promise((resolve,reject)=>{
  const p=spawn(ffmpeg,args,{stdio:["ignore","ignore","pipe"]});
  let err="",done=false;const timer=setTimeout(()=>p.kill("SIGKILL"),90000);
  p.stderr.on("data",b=>err=(err+String(b)).slice(-750));
  p.on("error",e=>{if(done)return;done=true;clearTimeout(timer);reject(e);});
  p.on("close",c=>{if(done)return;done=true;clearTimeout(timer);c===0?resolve():reject(Error("audio_composition_failed_"+c+"_"+err));});
 });
}
export async function composeTikTokAffiliatePreview({
  scenes,images,musicPath,outputPath,voiceModel,piperBinary,musicVolume=0.16,
  ownerApproved=false,approvedProductAssets=false,musicLicensed=false,voiceLicenseApproved=false
}={}){
 if(!ownerApproved)throw Error("owner_approval_required");
 if(!approvedProductAssets)throw Error("verified_product_assets_required");
 if(!musicLicensed||!voiceLicenseApproved)throw Error("audio_license_approval_required");
 if(!Array.isArray(scenes)||scenes.length!==3||scenes.some(s=>typeof s!=="string"||s.trim().length<15||s.length>150))throw Error("three_short_scripts_required");
 if(typeof outputPath!=="string"||!path.isAbsolute(outputPath)||path.extname(outputPath)!==".mp4")throw Error("mp4_absolute_output_required");
 const dir=await fs.mkdtemp(path.join(path.dirname(outputPath),".bima-tiktok-"));
 try{
  const durations=[],audio=[];
  for(let i=0;i<3;i++){
   const file=path.join(dir,"scene-"+i+".wav");
   await createTikTokLocalVoice({script:scenes[i],outputPath:file,voiceModel,piperBinary,voiceLicenseApproved,ownerApproved});
   durations.push(await probeTikTokVoiceDuration(file));
   audio.push(file);
  }
  // No time-stretching or clipped speech: narration MUST fit its 8s scene.
  const srt=createTikTokTimedSrt(scenes,durations);
  const subtitlesPath=path.join(dir,"captions.srt");await fs.writeFile(subtitlesPath,srt);
  const voicePath=path.join(dir,"voice-timeline.wav");
  const args=["-nostdin","-hide_banner","-loglevel","error","-y"];
  audio.forEach(p=>args.push("-i",p));
  const graph=audio.map((_,i)=>`[${i}:a]aresample=48000,apad=pad_dur=8,atrim=duration=8,asetpts=PTS-STARTPTS[a${i}]`).join(";")+";[a0][a1][a2]concat=n=3:v=0:a=1[out]";
  args.push("-filter_complex",graph,"-map","[out]","-c:a","pcm_s16le",voicePath);
  await run(args);
  const result=await renderTikTokAffiliateVideo({images,voicePath,musicPath,subtitlesPath,outputPath,ownerApproved,approvedProductAssets,musicLicensed,musicVolume});
  return {...result,ttsProvider:"local_piper",voiceDurations:durations,subtitlesSyncedToVoice:true,voiceQualityApproved:false,readyForOwnerReview:true,readyToPublish:false};
 }finally{await fs.rm(dir,{recursive:true,force:true});}
}
