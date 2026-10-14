import {quoteTikTokMotion} from "./tiktok-motion-budget.mjs";
const API="https://api.ltx.io";
const mediaUri=s=>typeof s==="string"&&((/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(s)&&s.length<7_000_000)||s.startsWith("ltx://")||/^https:\/\/[a-z0-9.-]+\/[a-z0-9/_?&.%=-]+$/i.test(s));
export async function submitTikTokLtxPilot({
  imageUri,prompt,ownerApproved=false,maxUsd=0,verifiedProductImage=false,
  apiKey=process.env.LTX_API_KEY,fetchImpl=fetch
}={}){
 const quote=quoteTikTokMotion({model:"ltx-2-3-fast",duration:8,sceneCount:1,maxUsd});
 if(!ownerApproved||!quote.approvedToSpend)throw Error("owner_budget_approval_required");
 if(!verifiedProductImage)throw Error("verified_product_image_required");
 if(!mediaUri(imageUri))throw Error("valid_approved_image_uri_required");
 if(typeof prompt!=="string"||prompt.trim().length<40||prompt.length>1200)throw Error("motion_prompt_invalid");
 if(!apiKey)throw Error("ltx_api_key_not_configured");
 const res=await fetchImpl(API+"/v2/image-to-video",{
  method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
  body:JSON.stringify({image_uri:imageUri,prompt:prompt.trim(),model:"ltx-2-3-fast",duration:8,resolution:"720x1280",fps:24,generate_audio:false}),
  signal:AbortSignal.timeout(30000)
 });
 if(!res.ok)throw Error("ltx_submit_failed_"+res.status);
 const data=await res.json();
 if(typeof data.id!=="string"||!data.id)throw Error("ltx_job_id_missing");
 return {id:data.id,provider:"ltx",status:"submitted",estimatedUsd:quote.estimateUsd,published:false};
}
export async function checkTikTokLtxPilot({id,apiKey=process.env.LTX_API_KEY,fetchImpl=fetch}={}){
 if(typeof id!=="string"||!/^[a-zA-Z0-9_-]{4,128}$/.test(id))throw Error("ltx_job_id_invalid");
 if(!apiKey)throw Error("ltx_api_key_not_configured");
 const res=await fetchImpl(API+"/v2/image-to-video/"+encodeURIComponent(id),{
  headers:{"Authorization":"Bearer "+apiKey},signal:AbortSignal.timeout(15000)});
 if(!res.ok)throw Error("ltx_poll_failed_"+res.status);
 const data=await res.json();
 return {id,status:String(data.status||"unknown"),ready:data.status==="completed",
   // Do not echo untrusted remote URLs to the browser until owner media proxy is implemented.
   resultAvailable:Boolean(data.result?.video_url),videoUrl:typeof data.result?.video_url==="string"?data.result.video_url:null,published:false};
}

export async function saveTikTokLtxMedia({videoUrl,outputPath,allowedHosts=[],fetchImpl=fetch}={}){
 const {promises:fs}=await import("node:fs");
 const path=(await import("node:path")).default;
 if(typeof videoUrl!=="string"||typeof outputPath!=="string"||!path.isAbsolute(outputPath))throw Error("download_source_or_path_invalid");
 let u;try{u=new URL(videoUrl);}catch{throw Error("video_url_invalid");}
 if(u.protocol!=="https:"||u.username||u.password||u.port||!allowedHosts.includes(u.hostname.toLowerCase())||!/^[a-z0-9.-]+$/i.test(u.hostname))throw Error("video_download_host_not_approved");
 const response=await fetchImpl(u.href,{redirect:"error",signal:AbortSignal.timeout(45000)});
 if(!response.ok||!(response.headers.get("content-type")||"").toLowerCase().includes("video/"))throw Error("invalid_video_response");
 const declared=Number(response.headers.get("content-length")||0);
 if(declared>100000000)throw Error("video_too_large");
 const temp=outputPath+".download";
 let size=0;
 try{
  const file=await fs.open(temp,"wx",0o600);
  try{
   for await(const chunk of response.body){
    size+=chunk.length;if(size>100000000)throw Error("video_too_large");
    await file.write(chunk);
   }
  }finally{await file.close();}
  if(size<10000)throw Error("video_too_small");
  const {spawn}=await import("node:child_process");
  const ffmpeg=(await import("ffmpeg-static")).default;
  await new Promise((resolve,reject)=>{
   const p=spawn(ffmpeg,["-hide_banner","-v","error","-i",temp,"-f","null","-"],{stdio:"ignore"});
   const timer=setTimeout(()=>p.kill("SIGKILL"),50000);
   p.on("error",err=>{clearTimeout(timer);reject(err);});
   p.on("close",code=>{clearTimeout(timer);code===0?resolve():reject(Error("video_decode_invalid"));});
  });
  await fs.rename(temp,outputPath);
  return {bytes:size,downloaded:true,creativeQaPassed:false,published:false};
 }catch(err){await fs.rm(temp,{force:true}).catch(()=>{});throw err;}
}
