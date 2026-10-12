// A paid TTS stage used only after explicit per-episode budget approval.
// Does not generate or upload automatically on deploy.
import { promises as fs } from "node:fs";
export const VENUS_NARRATION="Venus rotates incredibly slowly. One spin takes about 243 Earth days. But one trip around the Sun takes just 225. That means Venus completes an orbit before it finishes one rotation. The planet turns backward compared with most planets. Its thick clouds make the surface hard to see, but spacecraft measurements reveal this unusual motion. On Venus, a year passes before a full spin is complete.";
export const TTS_ESTIMATE_USD=0.06;
export async function createNarration({apiKey,baseUrl="https://api.piapi.ai",text=VENUS_NARRATION,explicitApproval}){
 if(explicitApproval!==true)throw Error("tts_cost_approval_required");
 if(!apiKey)throw Error("missing_piapi_key");
 const r=await fetch(baseUrl+"/api/v1/task",{method:"POST",headers:{"X-API-Key":apiKey,"Content-Type":"application/json"},body:JSON.stringify({
  model:"byteaudio",task_type:"seed-audio-1.0",input:{text,format:"wav",sample_rate:24000,speech_rate:0}
 }),signal:AbortSignal.timeout(30000)});
 const j=await r.json();if(!r.ok||j.code!==200||!j.data?.task_id)throw Error("tts_submission_failed");
 return {taskId:j.data.task_id,status:j.data.status};
}
export async function retrieveNarration({apiKey,taskId,mediaFile,baseUrl="https://api.piapi.ai"}){
 if(!apiKey||!/^[a-f0-9-]{20,}$/i.test(taskId))throw Error("invalid_tts_task");
 const r=await fetch(baseUrl+"/api/v1/task/"+encodeURIComponent(taskId),{headers:{"X-API-Key":apiKey},signal:AbortSignal.timeout(30000)});
 const j=await r.json();if(!r.ok||j.code!==200)throw Error("tts_poll_failed");
 if(j.data?.status!=="completed")return {status:j.data?.status||"pending"};
 const url=j.data?.output?.audio_url;if(!url||new URL(url).protocol!=="https:")throw Error("tts_audio_missing");
 const a=await fetch(url,{signal:AbortSignal.timeout(60000),redirect:"error"});if(!a.ok)throw Error("tts_download_failed");
 const data=Buffer.from(await a.arrayBuffer());if(data.length<500||data.length>20_000_000)throw Error("tts_audio_invalid_size");
 await fs.writeFile(mediaFile,data,{mode:0o600});return {status:"completed",file:mediaFile,bytes:data.length};
}
