import { promises as fs } from "node:fs";
import path from "node:path";
// Owner-only PiAPI pilot worker. No upload, publishing, or autonomous scheduling.
export function createPiapiWorker({db,persist,mediaDir}){
  const key=process.env.PIAPI_API_KEY||"";
  const base=(process.env.PIAPI_BASE_URL||"https://api.piapi.ai").replace(/\/$/,"");
  const enabled=process.env.VIDEO_PROVIDER==="piapi"&&key.length>10;
  const cap=300; // USD cents pilot maximum; not a provider-side billing limit.
  const priceCents=77; // 8s * $0.096 = $0.768 rounded up
  db.piapiJobs ||= {};
  db.piapiReservedCents ||= 0;
  // Recover rejected tasks even when an older provider poll overwrote their status.
  for(const job of Object.values(db.piapiJobs)){
    if(job.rejectedAt && job.status !== "rejected") job.status="rejected";
  }
  const safe=j=>j&&(({prompt,...rest})=>rest)(j);
  const overview=()=>({configured:key.length>10,enabled,capUsd:cap/100,
    reservedUsd:db.piapiReservedCents/100,
    jobs:Object.values(db.piapiJobs).slice(-15).map(j=>safe(j.rejectedAt?{...j,status:"rejected"}:j)),
    production:db.piapiProduction||{}});
  async function api(path,options={}){
    const r=await fetch(base+path,{...options,headers:{"X-API-Key":key,"Content-Type":"application/json",...options.headers},signal:AbortSignal.timeout(30000)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.code&&j.code!==200)throw Error("piapi_error_"+r.status+"_"+String(j.message||j.error?.message||"request_rejected").slice(0,120));
    return j.data||j;
  }
  async function start(data){
    if(!enabled)throw Error("piapi_not_configured");
    if(data.confirmCost!==true)throw Error("owner_cost_confirmation_required");
    const id=String(data.id||"");
    if(!/^[a-zA-Z0-9_-]{3,80}$/.test(id))throw Error("invalid_id");
    const previous=db.piapiJobs[id];
    // A confirmed retry may replace an existing completed preview even if a stale
    // status refresh restored review_required after the owner rejected it.
    // Never allow retry of an active job or any unpublished user content.
    if(previous&&!["rejected","review_required"].includes(previous.status))
      throw Error("piapi_job_exists_no_duplicate_billing");
    if(previous&&previous.status==="review_required"&&!previous.videoUrl)
      throw Error("preview_not_complete");
    if(previous&&!data.retryApproved)throw Error("explicit_retry_approval_required");
    if(Object.values(db.piapiJobs).some(x=>["submitting","pending","processing"].includes(x.status)))throw Error("piapi_generation_in_progress");
    if(db.piapiReservedCents+priceCents>cap)throw Error("pilot_budget_exhausted");
    if(data.referenceApproved!==true)throw Error("reference_image_approval_required");
    const ref=String(data.referenceImageUrl||"").trim();
    let parsed;try{parsed=new URL(ref);}catch{throw Error("invalid_reference_image_url");}
    if(parsed.protocol!=="https:"||parsed.username||parsed.password||ref.length>1600||
       /^(localhost|127\\.|10\\.|192\\.168\\.|169\\.254\\.|172\\.(1[6-9]|2\\d|3[01])\\.|0\\.|::1|\\[::1\\])/i.test(parsed.hostname))
      throw Error("public_https_reference_required");
    const prompt=String(data.prompt||"").trim();
    if(prompt.length<40||prompt.length>4000)throw Error("storyboard_prompt_invalid");
    const j={id,title:String(data.title||"").slice(0,100),referenceImageUrl:ref,prompt,status:"submitting",estimatedCents:priceCents,
      createdAt:new Date().toISOString()};
    if(previous){db.piapiHistory ||= [];db.piapiHistory.push({...previous,prompt:undefined});}
    db.piapiJobs[id]=j;db.piapiReservedCents+=priceCents;await persist();
    try{
      const response=await api("/api/v1/task",{method:"POST",body:JSON.stringify({
        model:"seedance",task_type:"seedance-2-fast",
        input:{prompt,mode:"first_last_frames",image_urls:[ref],duration:8,aspect_ratio:"9:16",resolution:"720p"}
      })});
      if(!response.task_id)throw Error("piapi_ambiguous_submission_do_not_retry");
      j.taskId=response.task_id;j.status=response.status||"pending";await persist();
      return safe(j);
    }catch(e){j.status="failed";j.error=String(e.message||e).slice(0,160);await persist();throw e;}
  }
  // A single Seedance task yields ONE complete video (maximum 15 seconds).
  // Owner must explicitly approve every paid request.
  async function startSingle(data){
    if(!enabled)throw Error("piapi_not_configured");
    if(data.confirmCost!==true)throw Error("owner_cost_confirmation_required");
    const id=String(data.id||"");
    if(!/^[a-zA-Z0-9_-]{3,80}$/.test(id))throw Error("invalid_id");
    const duration=Number(data.duration||15);
    if(duration!==15)throw Error("single_video_duration_must_be_15s");
    const price=Math.ceil(duration*9.6); // $0.096/sec, estimated $1.44
    if(Number(data.maxChargeUsd||0)<price/100||Number(data.maxChargeUsd||0)>1.45)
      throw Error("owner_single_video_budget_approval_required");
    const prompt=String(data.prompt||"").trim();
    if(prompt.length<60||prompt.length>4000)throw Error("invalid_single_video_prompt");
    if(db.piapiJobs[id])throw Error("job_already_exists_do_not_charge_twice");
    if(Object.values(db.piapiJobs).some(j=>["submitting","pending","processing"].includes(j.status)))
      throw Error("another_piapi_job_in_progress");
    const j={id,title:String(data.title||"").slice(0,100),prompt,status:"submitting",durationSeconds:15,estimatedCents:price,mode:"single_complete_video",createdAt:new Date().toISOString()};
    db.piapiJobs[id]=j;await persist();
    try{
      const response=await api("/api/v1/task",{method:"POST",body:JSON.stringify({
        model:"seedance",task_type:"seedance-2-fast",
        input:{prompt,duration:15,aspect_ratio:"9:16",resolution:"720p"}
      })});
      if(!response.task_id)throw Error("ambiguous_provider_submission_do_not_retry");
      j.taskId=response.task_id;j.status=response.status||"pending";await persist();
      return safe(j);
    }catch(e){j.status="failed";j.error=String(e.message||e).slice(0,170);await persist();throw e;}
  }
  async function useAsScene1(id){
    const job=db.piapiJobs[id];
    if(!job||job.status!=="review_required"||job.rejectedAt||!job.videoUrl)
      throw Error("completed_preview_required");
    if(!job.videoUrl.startsWith("https://"))throw Error("invalid_provider_video_url");
    // Store a local copy before promising reuse; external PiAPI URLs may expire.
    const target=path.join(mediaDir,"piapi-scene1-"+id+".mp4");
    let stat=await fs.stat(target).catch(()=>null);
    if(!stat||stat.size<1024){
      const u=new URL(job.videoUrl);
      if(u.protocol!=="https:"||u.username||u.password)throw Error("invalid_video_source");
      const response=await fetch(u,{signal:AbortSignal.timeout(120000),redirect:"error"});
      if(!response.ok||!response.body)throw Error("video_download_failed");
      const type=response.headers.get("content-type")||"";
      if(!type.includes("video")&&!type.includes("octet-stream"))throw Error("invalid_video_content_type");
      const limit=60*1024*1024;
      const tmp=target+".part";
      let n=0;
      const out=await fs.open(tmp,"w",0o600);
      try{
        for await(const chunk of response.body){
          n+=chunk.length;if(n>limit)throw Error("scene1_exceeds_60mb");
          await out.write(chunk);
        }
      }catch(e){await out.close();await fs.rm(tmp,{force:true}).catch(()=>{});throw e;}
      await out.close();
      if(n<1024){await fs.rm(tmp,{force:true});throw Error("scene1_empty");}
      await fs.rename(tmp,target);
      stat=await fs.stat(target);
    }
    db.piapiProduction ||= {};
    db.piapiProduction[id]={
      scene1:{taskId:job.taskId,videoUrl:job.videoUrl,storedFile:target,bytes:stat.size,durationSeconds:8,status:"archived",
        selectedAt:new Date().toISOString()},
      status:"planning_only",autoPublish:false
    };
    await persist();
    return {id,scene1Selected:true,taskId:job.taskId,status:"archived",bytes:stat.size};
  }
  async function reject(id){
    const j=db.piapiJobs[id];
    if(!j)throw Error("piapi_job_not_found");
    if(j.status==="rejected"||j.rejectedAt)return safe({...j,status:"rejected"});
    if(j.status!=="review_required")throw Error("only_completed_video_can_be_rejected");
    j.status="rejected";j.rejectedAt=new Date().toISOString();j.lastPollError=undefined;await persist();return safe(j);
  }
  async function refresh(){
    for(const j of Object.values(db.piapiJobs).filter(x=>x.taskId&&!x.rejectedAt&&!["completed","failed","review_required","rejected"].includes(x.status)).slice(0,2)){
      try{
        const d=await api("/api/v1/task/"+encodeURIComponent(j.taskId));
        const status=String(d.status||"").toLowerCase();
        if(["completed","success"].includes(status)){
          const url=d.output?.video_url||d.output?.video_urls?.[0]||(typeof d.output?.video==="string"?d.output.video:d.output?.video?.url)||d.output?.url;
          if(typeof url!=="string"||!url.startsWith("https://"))throw Error("piapi_video_url_missing");
          j.videoUrl=url;j.status="review_required";j.completedAt=new Date().toISOString();
        }else if(["failed","error","cancelled"].includes(status)){j.status="failed";j.error=String(d.error?.message||"provider_failed").slice(0,120);}
        else j.status=status||"processing";
        await persist();
      }catch(e){j.lastPollError=String(e.message||e).slice(0,130);await persist();}
    }
    return overview();
  }
  // Do not retry ambiguous POSTs after restart.
  for(const j of Object.values(db.piapiJobs))if(j.status==="submitting"){j.status="failed";j.error="interrupted_submission_do_not_retry";}
  return {start,startSingle,reject,useAsScene1,refresh,overview};
}
