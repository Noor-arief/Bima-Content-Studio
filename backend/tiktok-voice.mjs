import {spawn} from "node:child_process";
import {promises as fs} from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

// Offline voice generation adapter for Piper (https://github.com/rhasspy/piper).
// User supplies an Indonesian Piper ONNX voice model licensed for intended use.
// No provider calls or paid credit usage; isolated from YouTube voice workflows.
export async function createTikTokLocalVoice({
  script,outputPath,voiceModel=process.env.TIKTOK_PIPER_MODEL,
  piperBinary=process.env.TIKTOK_PIPER_BINARY||"piper",
  voiceLicenseApproved=false,ownerApproved=false
}={}){
  if(!ownerApproved)throw Error("owner_approval_required");
  if(!voiceLicenseApproved)throw Error("voice_model_license_approval_required");
  if(typeof script!=="string"||script.trim().length<15||script.length>1000)throw Error("voice_script_invalid");
  if(typeof voiceModel!=="string"||!path.isAbsolute(voiceModel)||!(await fs.stat(voiceModel).catch(()=>null))?.isFile())
    throw Error("indonesian_piper_model_not_configured");
  if(typeof outputPath!=="string"||!path.isAbsolute(outputPath)||path.extname(outputPath)!==".wav")
    throw Error("wav_absolute_output_required");
  if(typeof piperBinary!=="string"||!piperBinary.trim())throw Error("piper_binary_unavailable");
  if(outputPath===voiceModel)throw Error("cannot_overwrite_voice_model");
  const tmp=outputPath+".generating.wav";
  await fs.rm(tmp,{force:true});
  try {
    await new Promise((resolve,reject)=>{
      const proc=spawn(piperBinary,["--model",voiceModel,"--output_file",tmp],{stdio:["pipe","ignore","pipe"]});
      let done=false,err="";
      const timer=setTimeout(()=>proc.kill("SIGKILL"),90000);
      proc.stderr.on("data",b=>err=(err+String(b)).slice(-600));
      proc.on("error",e=>{if(!done){done=true;clearTimeout(timer);reject(Error("piper_launch_failed_"+e.code));}});
      proc.on("close",code=>{if(!done){done=true;clearTimeout(timer);code===0?resolve():reject(Error("piper_generation_failed_"+code+"_"+err));}});
      proc.stdin.on("error",()=>{});
      proc.stdin.end(script.trim()+"\n");
    });
    const st=await fs.stat(tmp);
    if(st.size<1000||st.size>30000000)throw Error("invalid_tts_audio_size");
    const fd=await fs.open(tmp,"r");
    try{const b=Buffer.alloc(12);await fd.read(b,0,12,0);if(b.toString("ascii",0,4)!=="RIFF"||b.toString("ascii",8,12)!=="WAVE")throw Error("not_valid_wav");}finally{await fd.close();}
    await fs.rename(tmp,outputPath);
    return {outputPath,provider:"local_piper",generated:true,estimatedApiCostUsd:0,qualityReviewed:false,voiceLicenseApproved:true};
  }catch(e){await fs.rm(tmp,{force:true}).catch(()=>{});throw e;}
}
// Probe actual speech duration rather than assuming the scene text lasts 8 seconds.
export async function probeTikTokVoiceDuration(file){
  if(typeof file!=="string"||!path.isAbsolute(file))throw Error("audio_path_required");
  return new Promise((resolve,reject)=>{
    const p=spawn(ffmpegPath,["-hide_banner","-i",file],{stdio:["ignore","ignore","pipe"]});
    let stderr="",done=false;
    const timer=setTimeout(()=>p.kill("SIGKILL"),12000);
    p.stderr.on("data",d=>stderr=(stderr+String(d)).slice(-5000));
    p.on("error",e=>{if(!done){done=true;clearTimeout(timer);reject(e);}});
    p.on("close",()=>{if(done)return;done=true;clearTimeout(timer);const m=/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);if(!m)return reject(Error("voice_duration_unknown"));const v=Number(m[1])*3600+Number(m[2])*60+Number(m[3]);if(v<=0||v>24)return reject(Error("voice_duration_out_of_range"));resolve(v);});
  });
}
export function createTikTokTimedSrt(scenes,durations,{totalSeconds=24}={}){
  if(!Array.isArray(scenes)||scenes.length!==3||!Array.isArray(durations)||durations.length!==3)throw Error("three_scenes_required");
  if(!durations.every(d=>Number.isFinite(d)&&d>0.3&&d<=8))throw Error("scene_audio_must_fit_eight_seconds");
  const pad=n=>String(n).padStart(2,"0");
  const stamp=t=>{let ms=Math.round(t*1000);return `${pad(Math.floor(ms/3600000))}:${pad(Math.floor(ms%3600000/60000))}:${pad(Math.floor(ms%60000/1000))},${String(ms%1000).padStart(3,"0")}`;};
  return scenes.map((text,i)=>{
    if(typeof text!=="string"||!text.trim()||text.length>150)throw Error("scene_text_invalid");
    const start=i*8,end=Math.min(totalSeconds,start+durations[i]);
    return `${i+1}\n${stamp(start)} --> ${stamp(end)}\n${text.trim()}\n`;
  }).join("\n");
}
