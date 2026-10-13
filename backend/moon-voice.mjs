import {promises as fs} from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import {createNarration,retrieveNarration} from "./venus-narration.mjs";
const ID="yt26-20261013-moon-single";
const SCRIPT="Why does the Moon change shape? It stays round. As it orbits Earth, we see different portions of its sunlit half. That's what creates the Moon's phases.";
export function createMoonVoice({db,persist,mediaDir}){
 db.moonVoice||={status:"not_started"};
 let busy=false;
 const state=()=>({status:db.moonVoice.status,error:db.moonVoice.error||null,ready:db.moonVoice.status==="ready_for_review",estimatedTtsUsd:0.06});
 async function process(){
  if(busy)return state();busy=true;
  try{
   const source=db.piapiJobs?.[ID];
   if(source?.status!=="review_required"||!source.videoUrl)return state();
   if(["ready_for_review","failed","submitting"].includes(db.moonVoice.status))return state();
   if(db.moonVoice.status==="not_started"){
    if(process.env.PIAPI_MOON_TTS_APPROVED!=="true")return state();
    db.moonVoice.status="submitting";await persist();
    try{
     const t=await createNarration({apiKey:process.env.PIAPI_API_KEY,baseUrl:process.env.PIAPI_BASE_URL||"https://api.piapi.ai",text:SCRIPT,explicitApproval:true});
     db.moonVoice.taskId=t.taskId;db.moonVoice.status="processing";await persist();
    }catch(e){db.moonVoice.status="failed";db.moonVoice.error=String(e.message||e).slice(0,170);await persist();}
    return state();
   }
   if(db.moonVoice.status!=="processing"||!db.moonVoice.taskId)return state();
   const audio=path.join(mediaDir,"moon-narration.wav");
   const t=await retrieveNarration({apiKey:process.env.PIAPI_API_KEY,baseUrl:process.env.PIAPI_BASE_URL||"https://api.piapi.ai",taskId:db.moonVoice.taskId,mediaFile:audio});
   if(t.status!=="completed")return state();
   const v=await fetch(source.videoUrl,{redirect:"error",signal:AbortSignal.timeout(120000)});
   if(!v.ok||new URL(source.videoUrl).protocol!=="https:")throw Error("moon_video_download_failed");
   const buffer=Buffer.from(await v.arrayBuffer());
   if(buffer.length<1024||buffer.length>80000000)throw Error("invalid_moon_video");
   const original=path.join(mediaDir,"moon-original.mp4"),output=path.join(mediaDir,"moon-voice-review.mp4");
   await fs.writeFile(original,buffer);
   await new Promise((resolve,reject)=>{
    const proc=spawn(ffmpegPath,["-y","-i",original,"-i",audio,"-filter_complex","[0:a]volume=0.15[bg];[1:a]apad,atrim=0:15,volume=1.5[vo];[bg][vo]amix=inputs=2:duration=first[a]","-map","0:v:0","-map","[a]","-c:v","copy","-c:a","aac","-t","15","-movflags","+faststart",output],{stdio:["ignore","ignore","pipe"]});
    let err="";proc.stderr.on("data",b=>err=(err+b.toString()).slice(-800));const timer=setTimeout(()=>proc.kill("SIGKILL"),180000);
    proc.on("error",e=>{clearTimeout(timer);reject(e)});
    proc.on("close",code=>{clearTimeout(timer);code===0?resolve():reject(Error("moon_mux_failed_"+code+"_"+err.slice(-200)))});
   });
   if((await fs.stat(output)).size<1024)throw Error("empty_audio_video");
   db.moonVoice.file=output;db.moonVoice.status="ready_for_review";await persist();
  }catch(e){db.moonVoice.status="failed";db.moonVoice.error=String(e.message||e).slice(0,170);await persist();}
  finally{busy=false;}
  return state();
 }
 return {state,process};
}
