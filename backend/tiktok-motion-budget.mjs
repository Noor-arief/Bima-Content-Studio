// TikTok motion generation planning only. No billable call is made here.
// Prices USD/sec from https://docs.ltx.io/pricing/ (verified Oct 2026).
const PRICE=Object.freeze({"ltx-2-3-fast":0.03,"ltx-2-3-pro":0.04,"ltx-2-5-fast":0.09,"ltx-2-5-pro":0.12});
export function quoteTikTokMotion({model="ltx-2-3-fast",duration=8,sceneCount=1,resolution="720x1280",maxUsd=0}={}){
 if(!Object.hasOwn(PRICE,model))throw Error("unsupported_motion_model");
 if(resolution!=="720x1280")throw Error("only_portrait_720p_quoted");
 if(!Number.isInteger(duration)||duration<4||duration>10)throw Error("invalid_motion_duration");
 if(!Number.isInteger(sceneCount)||sceneCount<1||sceneCount>3)throw Error("invalid_scene_count");
 if(!Number.isFinite(maxUsd)||maxUsd<0||maxUsd>25)throw Error("invalid_budget");
 const estimateUsd=Math.round(PRICE[model]*duration*sceneCount*100)/100;
 return {provider:"ltx",model,format:"9:16",resolution,sceneCount,durationSeconds:duration,
   estimateUsd,approvedToSpend:maxUsd>=estimateUsd&&maxUsd>0,
   generationEnabled:false,creditUsageUsd:0,
   warning:"Estimate only: no API key configured, no generation submitted; video quality unverified."};
}
