import path from 'node:path';
import {checkTikTokLtxPilot,saveTikTokLtxMedia} from './tiktok-ltx-pilot.mjs';

// Resume existing jobs only. This worker cannot submit or spend on a new job.
const resumable=new Set(['submitted','pending','processing','completed','media_host_approval_required','media_download_failed']);
export function createTikTokLtxWorker({db,persist,mediaDir,check=checkTikTokLtxPilot,save=saveTikTokLtxMedia,env=process.env,now=Date.now,onState=()=>{}}){
 let busy=false,lastPoll=0,lastReport='';
 const state=()=>{
  const j=db.tiktokLtx||{};
  return {status:j.status||'not_started',providerConfigured:Boolean(env.LTX_API_KEY),
   estimatedUsd:j.estimatedUsd||null,referenceReady:j.referenceReady===true,
   resultAvailable:j.resultAvailable===true,technicalMediaReady:j.technicalMediaReady===true,
   creativeQaPassed:false,canStart:!j.status||j.status==='not_started',published:false,
   error:j.error||null,downloadHostRequired:j.downloadHostRequired||null};
 };
 async function tick(){
  if(busy||now()-lastPoll<10000)return state();
  busy=true;lastPoll=now();
  try{
   const j=db.tiktokLtx;
   if(!j?.id||!resumable.has(j.status))return state();
   const remote=await check({id:j.id,apiKey:env.LTX_API_KEY});
   Object.assign(j,{status:remote.status,resultAvailable:remote.resultAvailable,error:null});
   if(remote.ready&&remote.videoUrl){
    const hosts=String(env.LTX_VIDEO_DOWNLOAD_HOSTS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
    const host=new URL(remote.videoUrl).hostname.toLowerCase();
    if(!hosts.includes(host))Object.assign(j,{status:'media_host_approval_required',downloadHostRequired:host});
    else {
     try{
      await save({videoUrl:remote.videoUrl,outputPath:path.join(mediaDir,'tiktok-ltx-owner-motion.mp4'),allowedHosts:hosts});
      Object.assign(j,{status:'media_downloaded',technicalMediaReady:true,creativeQaPassed:false,downloadHostRequired:null});
     }catch{Object.assign(j,{status:'media_download_failed',error:'ltx_media_download_or_validation_failed'});}
    }
   }else if(remote.ready)j.error='ltx_completed_without_video';
   await persist();
  }catch(e){
   // Preserve job ID and lifecycle on transient errors; never resubmit a paid job.
   if(db.tiktokLtx){db.tiktokLtx.error='ltx_status_check_failed';await persist();}
  }finally{
   busy=false;
   const current=state(),signature=JSON.stringify(current);
   if(signature!==lastReport){lastReport=signature;onState(current);}
  }
  return state();
 }
 return {state,tick};
}
