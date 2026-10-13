import {promises as fs} from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import {createNarration,retrieveNarration} from "./venus-narration.mjs";
const ID="yt26-20261014-butterfly-single";
const SCRIPT="Butterflies can taste with their feet! Tiny taste receptors on their legs help them check whether a leaf is right for their caterpillars. One gentle landing reveals a whole lot of information.";
export function createButterflyVoice({db,persist,mediaDir}){
 db.butterflyVoice||={status:"not_started"};
 // Recover the pre-submission failure caused by function-name shadowing of Node process.
 // Only this exact failure can reset safely: no TTS request was sent.
 if(db.butterflyVoice.status==="failed"&&String(db.butterflyVoice.error||"").includes("PIAPI_BUTTERFLY_TTS_APPROVED")){db.butterflyVoice.status="not_started";db.butterflyVoice.error=null;}
 let busy=false;
 const state=()=>({status:db.butterflyVoice.status,error:db.butterflyVoice.error||null,ready:db.butterflyVoice.status==="ready_for_review",estimatedTtsUsd:0.06});
 async function runVoice(){
  if(busy)return state();busy=true;
  try{
   const source=db.piapiJobs?.[ID];
   if(source?.status!=="review_required"||!source.videoUrl)return state();
   if(["ready_for_review","failed","submitting"].includes(db.butterflyVoice.status))return state();
   if(db.butterflyVoice.status==="not_started"){
    if(process.env.PIAPI_BUTTERFLY_TTS_APPROVED!=="true")return state();
    db.butterflyVoice.status="submitting";await persist();
    try{
     const t=await createNarration({apiKey:process.env.PIAPI_API_KEY,baseUrl:process.env.PIAPI_BASE_URL||"https://api.piapi.ai",text:SCRIPT,explicitApproval:true});
     db.butterflyVoice.taskId=t.taskId;db.butterflyVoice.status="processing";await persist();
    }catch(e){db.butterflyVoice.status="failed";db.butterflyVoice.error=String(e.message||e).slice(0,170);await persist();}
    return state();
   }
   if(db.butterflyVoice.status!=="processing"||!db.butterflyVoice.taskId)return state();
   const audio=path.join(mediaDir,"butterfly-narration.wav");
   const t=await retrieveNarration({apiKey:process.env.PIAPI_API_KEY,baseUrl:process.env.PIAPI_BASE_URL||"https://api.piapi.ai",taskId:db.butterflyVoice.taskId,mediaFile:audio});
   if(t.status!=="completed")return state();
   const v=await fetch(source.videoUrl,{redirect:"error",signal:AbortSignal.timeout(120000)});
   if(!v.ok||new URL(source.videoUrl).protocol!=="https:")throw Error("butterfly_video_download_failed");
   const buffer=Buffer.from(await v.arrayBuffer());
   if(buffer.length<1024||buffer.length>80000000)throw Error("invalid_butterfly_video");
   const original=path.join(mediaDir,"butterfly-original.mp4"),output=path.join(mediaDir,"butterfly-voice-review.mp4");
   await fs.writeFile(original,buffer);
   await new Promise((resolve,reject)=>{
    const proc=spawn(ffmpegPath,["-y","-i",original,"-i",audio,"-filter_complex","[1:a]apad,atrim=0:15,volume=1.5[a]","-map","0:v:0","-map","[a]","-c:v","copy","-c:a","aac","-t","15","-movflags","+faststart",output],{stdio:["ignore","ignore","pipe"]});
    let err="";proc.stderr.on("data",b=>err=(err+b.toString()).slice(-800));const timer=setTimeout(()=>proc.kill("SIGKILL"),180000);
    proc.on("error",e=>{clearTimeout(timer);reject(e)});
    proc.on("close",code=>{clearTimeout(timer);code===0?resolve():reject(Error("butterfly_mux_failed_"+code+"_"+err.slice(-200)))});
   });
   if((await fs.stat(output)).size<1024)throw Error("empty_audio_video");
   db.butterflyVoice.file=output;db.butterflyVoice.status="ready_for_review";await persist();
  }catch(e){db.butterflyVoice.status="failed";db.butterflyVoice.error=String(e.message||e).slice(0,170);await persist();}
  finally{busy=false;}
  return state();
 }
 return {state,process:runVoice};
}
