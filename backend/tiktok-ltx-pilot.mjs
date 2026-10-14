import {quoteTikTokMotion} from "./tiktok-motion-budget.mjs";
const API="https://api.ltx.io";
const mediaUri=s=>typeof s==="string"&&(s.startsWith("ltx://")||/^https:\/\/[a-z0-9.-]+\/[a-z0-9/_?&.%=-]+$/i.test(s));
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
   resultAvailable:Boolean(data.result?.video_url),published:false};
}
