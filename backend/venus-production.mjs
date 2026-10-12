// Venus full-length orchestration: owner-triggered only; no YouTube publishing.
import path from "node:path";
import { promises as fs } from "node:fs";
import { createNarration,retrieveNarration,VENUS_NARRATION,TTS_ESTIMATE_USD } from "./venus-narration.mjs";
import { buildVenusShort } from "./venus-assembly.mjs";
const id="yt26-20261013-piapi-pilot";
const scenes=[
 {duration:11,description:"Show the same pale golden cloud-covered terrestrial Venus, with a clearly visible slow counterclockwise reference arrow seen from above its north pole. Use a restrained celestial motion graphic overlay to illustrate that one axial rotation takes 243 Earth days. NO Jupiter bands, no fake storm eyes, no text or narration. Start with the established Venus artwork, smooth motion, fade into complete transition."},
 {duration:11,description:"Continue the same style and identical Venus. Pull back to a scientifically explanatory diagram with Venus travelling once around the Sun while a smaller rotation marker turns more slowly in retrograde direction. Venus orbit is 225 Earth days versus 243 Earth days for one sidereal spin. Complete the conclusion with a held final frame, no on-screen writing or narrator. Avoid Jupiter-like gas textures."}
];
export function createVenusProduction({db,persist,mediaDir}){
 const key=process.env.PIAPI_API_KEY||"",base=(process.env.PIAPI_BASE_URL||"https://api.piapi.ai").replace(/\/$/,"");
 const budget=()=>({newVisualSeconds:22,visualUsd:2.112,estimatedTtsUsd:TTS_ESTIMATE_USD,totalEstimateUsd:2.172,requiresSeparateOwnerApproval:true});
 db.venusProduction||={status:"not_started"};
 const publicState=()=>({status:db.venusProduction.status,scene1Archived:!!db.piapiProduction?.[id]?.scene1?.storedFile,completedSceneCount:(db.venusProduction.scenes||[]).filter(x=>x.status==="completed").length,...budget(),finalReady:db.venusProduction.status==="ready_for_review"});
 const task=async(apiPath,init={})=>{
  const r=await fetch(base+apiPath,{...init,headers:{"X-API-Key":key,"Content-Type":"application/json",...(init.headers||{})},signal:AbortSignal.timeout(30000)});
  const j=await r.json().catch(()=>({}));if(!r.ok||j.code!==200)throw Error("provider_request_failed_"+r.status);return j.data;
 };
 async function begin({ownerApproved,capUsd}){
  if(ownerApproved!==true||capUsd<budget().totalEstimateUsd)throw Error("full_episode_budget_approval_required");
  if(db.venusProduction.status!=="not_started")throw Error("episode_already_started");
  const first=db.piapiProduction?.[id]?.scene1;
  if(!first?.storedFile||!await fs.stat(first.storedFile).catch(()=>null))throw Error("archive_scene1_before_production");
  if(!key)throw Error("missing_piapi_key");
  db.venusProduction={status:"starting",scenes:[],createdAt:new Date().toISOString(),budgetApprovedUsd:capUsd};await persist();
  // Sequential billing: never auto-resubmit ambiguous operations.
  try{
   for(let i=0;i<2;i++){
    const source=await task("/api/v1/task",{method:"POST",body:JSON.stringify({
      model:"seedance",task_type:"seedance-2-fast",input:{prompt:scenes[i].description,
      mode:"first_last_frames",image_urls:["https://science.nasa.gov/wp-content/uploads/2023/05/venus-single.png"],
      duration:11,aspect_ratio:"9:16",resolution:"720p"}
    })});
    if(!source?.task_id)throw Error("ambiguous_video_submission_do_not_retry");
    db.venusProduction.scenes.push({taskId:source.task_id,status:"pending",duration:11});await persist();
   }
   const narration=await createNarration({apiKey:key,baseUrl:base,text:VENUS_NARRATION,explicitApproval:true});
   db.venusProduction.tts={taskId:narration.taskId,status:narration.status};db.venusProduction.status="processing";await persist();
  }catch(e){db.venusProduction.status="manual_reconciliation_required";db.venusProduction.error=String(e.message||e).slice(0,100);await persist();throw e;}
  return publicState();
 }
 async function poll(){
  const job=db.venusProduction;if(job.status!=="processing")return publicState();
  for(let i=0;i<job.scenes.length;i++){
   const scene=job.scenes[i];if(scene.status==="completed")continue;
   const result=await task("/api/v1/task/"+encodeURIComponent(scene.taskId));
   if(result?.status==="failed"){job.status="manual_reconciliation_required";job.error="scene_"+i+"_failed";await persist();return publicState();}
   if(result?.status!=="completed")continue;
   const videoUrl=result.output?.video||result.output?.video_url;
   if(typeof videoUrl!=="string"||!videoUrl.startsWith("https://")){job.status="manual_reconciliation_required";job.error="scene_output_missing";await persist();return publicState();}
   const fetched=await fetch(videoUrl,{signal:AbortSignal.timeout(120000),redirect:"error"});if(!fetched.ok)throw Error("scene_download_failed");
   const bytes=Buffer.from(await fetched.arrayBuffer());if(bytes.length<1000||bytes.length>60_000_000)throw Error("invalid_scene_video");
   scene.storedFile=path.join(mediaDir,"venus-scene-"+(i+2)+".mp4");await fs.writeFile(scene.storedFile,bytes,{mode:0o600});
   scene.status="completed";await persist();
  }
  if(job.tts?.status!=="completed"){
   const result=await retrieveNarration({apiKey:key,baseUrl:base,taskId:job.tts.taskId,mediaFile:path.join(mediaDir,"venus-narration.wav")});
   job.tts.status=result.status; if(result.file)job.tts.file=result.file;await persist();
  }
  if(job.scenes.length===2&&job.scenes.every(s=>s.status==="completed")&&job.tts?.status==="completed"){
   const final=await buildVenusShort({mediaDir,clips:[db.piapiProduction[id].scene1.storedFile,...job.scenes.map(s=>s.storedFile)],
     narrationFile:job.tts.file,outFile:path.join(mediaDir,"venus-30s-owner-review.mp4")});
   job.final=final;job.status="ready_for_review";await persist();
  }
  return publicState();
 }
 return {publicState,begin,poll};
}
