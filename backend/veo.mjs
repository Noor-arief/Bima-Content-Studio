import {createHash,randomBytes} from "node:crypto";
import {createWriteStream,createReadStream,promises as fs} from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";
import {pipeline} from "node:stream/promises";

export const RATES=Object.freeze({"veo-3.1-lite-generate-preview":{"720p":40,"1080p":64},"veo-3.1-fast-generate-preview":{"720p":80,"1080p":96},"veo-3.1-generate-preview":{"720p":320,"1080p":320}});
export function storyboard({title,prompt,description,voiceover}){
  if(typeof title!=="string"||title.length<5||title.length>100)throw Error("title_required");
  if(typeof prompt!=="string"||prompt.length<40||prompt.length>4500)throw Error("visual_storyboard_required");
  const fromQuote=prompt.match(/(?:voice|narrat)[^:\n]{0,100}:\s*["“]([^"”]+)[”"]/i);
  const fromCaption=String(description||"").replace(/#[a-z0-9_]+/gi,"").split(/[.!?]\s/)[0];
  let spoken=String(voiceover||fromQuote?.[1]||fromCaption||title).replace(/[^\w\s.,'!?-]/g,"").trim();
  let wc=spoken.split(/\s+/).filter(Boolean).length;
  if(wc>18){
    // Preserve a fully formed short sentence, never truncate spoken audio mid-thought.
    const candidate=(spoken.match(/^.{15,160}?[.!?](?=\s|$)/)||[])[0];
    if(candidate&&candidate.split(/\s+/).length>=4&&candidate.split(/\s+/).length<=18)spoken=candidate;
    wc=spoken.split(/\s+/).filter(Boolean).length;
  }
  if(wc<4||wc>18)throw Error("voiceover_requires_complete_4_to_18_word_sentence_for_8_seconds");
  if(!/[.!?]$/.test(spoken))spoken+=".";
  const base=prompt.replace(/10.seconds?/gi,"8 seconds").slice(0,3000);
  return {voiceover:spoken,shots:["00:00–00:02 hook","00:02–00:06 reveal","00:06–00:08 payoff"],text:"Premium 8-second vertical 9:16 Orbit & Ocean cinematic original science animation. STORYBOARD 0–2s visual hook, 2–6s science reveal, 6–8s satisfying payoff with a settled last frame. Use these specific visual instructions: "+base+" VOICE: Speak this exact single complete English sentence with clear natural voice, beginning at 0.5s and finishing by 7.4s: \""+spoken+"\". Voice must be louder than gentle original music. Smooth scene transitions, accurate anatomy and physics, consistent subject, no cheap looping motion. No captions, text, watermark, garbled narration, missing ending or sudden cut."};
}
const hashFile=async file=>{const h=createHash("sha256");for await(const b of createReadStream(file))h.update(b);return h.digest("hex");};
async function probe(file){
  const ff=(process.env.FFMPEG_PATH||(await import("ffmpeg-static")).default);
  return new Promise((resolve,reject)=>{
    const p=spawn(ff,["-hide_banner","-i",file],{stdio:["ignore","ignore","pipe"]});let err="";
    const timer=setTimeout(()=>p.kill("SIGKILL"),15000);
    p.stderr.on("data",c=>err=(err+c).slice(-12000));
    p.on("error",e=>{clearTimeout(timer);reject(e)});
    p.on("close",()=>{clearTimeout(timer);
      const d=err.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/),wh=err.match(/Video:[^\n]*?(\d{3,5})x(\d{3,5})/);
      if(!d||!wh)return reject(Error("video_metadata_unavailable"));
      resolve({seconds:Number(d[1])*3600+Number(d[2])*60+Number(d[3]),width:Number(wh[1]),height:Number(wh[2]),hasAudio:/Audio:\s/.test(err)});
    });
  });
}
async function jsonCall(part,key,opts={}){
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/"+part,{...opts,headers:{"x-goog-api-key":key,...opts.headers},signal:AbortSignal.timeout(30000)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw Error("veo_http_"+r.status+"_"+String(j.error?.message||"rejected").slice(0,90));
  return j;
}
async function download(uri,key,file){
  let u=new URL(uri);let withKey=true;
  if(u.protocol!=="https:"||u.hostname!=="generativelanguage.googleapis.com"||!u.pathname.startsWith("/v1beta/"))throw Error("invalid_google_download_url");
  for(let n=0;n<4;n++){
    if(u.protocol!=="https:"||!["generativelanguage.googleapis.com","storage.googleapis.com"].includes(u.hostname))throw Error("untrusted_redirect");
    const r=await fetch(u.toString(),{headers:withKey?{"x-goog-api-key":key}:{},redirect:"manual",signal:AbortSignal.timeout(150000)});
    if(r.status>=300&&r.status<400){u=new URL(r.headers.get("location")||"",u);withKey=false;continue;}
    if(!r.ok||!r.body)throw Error("download_failed_"+r.status);
    const sz=Number(r.headers.get("content-length")||0);
    if(sz>150000000)throw Error("video_too_large");
    let received=0;
    const meter=new TransformStream({transform(c,ctrl){received+=c.length;if(received>150000000)throw Error("video_too_large");ctrl.enqueue(c)}});
    await pipeline(r.body.pipeThrough(meter),createWriteStream(file,{flags:"wx",mode:0o600}));
    return received;
  }
  throw Error("download_redirect_limit");
}
export function createVeoWorker({db,persist,logEvent,mediaDir}){
  db.veoJobs ||= {};
  db.veoBudgetUsedCents ||= Object.values(db.veoJobs).reduce((s,j)=>s+(j.cents||0),0);
  const key=process.env.GEMINI_API_KEY||"";
  const enabled=process.env.ENABLE_VEO_GENERATION==="true"&&key.length>12;
  const cap=Math.min(500,Math.max(0,Number(process.env.VEO_PILOT_BUDGET_CENTS||0)));
  const busy=new Set();
  const total=()=>db.veoBudgetUsedCents;
  const sanitized=j=>{if(!j)return null;const {operation,filename,...rest}=j;return rest;};
  const overview=()=>({configured:key.length>12,enabled,limitUsd:cap/100,reservedUsd:total()/100,
    remainingUsd:Math.max(0,cap-total())/100,jobs:Object.values(db.veoJobs).map(sanitized).slice(-50)});
  async function start(data){
    if(!enabled)throw Error("veo_disabled_or_api_key_missing");
    if(data.confirmCost!==true)throw Error("owner_cost_confirmation_required");
    const id=String(data.id||"");
    if(!/^[a-zA-Z0-9_-]{3,80}$/.test(id))throw Error("invalid_id");
    const model=data.model||"veo-3.1-fast-generate-preview",res=data.resolution||"1080p";
    const cents=RATES[model]?.[res];
    if(!cents||total()+cents>cap||cap<1)throw Error("invalid_model_or_pilot_budget_exhausted");
    if(Object.values(db.veoJobs).some(j=>["submitting","running","downloading"].includes(j.status)))throw Error("one_video_generation_at_a_time");
    const old=db.veoJobs[id];
    if(old&&!["rejected","failed"].includes(old.status))throw Error("existing_job_must_be_reviewed_first");
    const story=storyboard(data);
    const j={id,revision:(old?.revision||0)+1,title:data.title,model,resolution:res,cents,
      voiceover:story.voiceover,shots:story.shots,prompt:story.text,status:"submitting",
      createdAt:new Date().toISOString(),error:null,qa:null,filename:null,operation:null};
    db.veoJobs[id]=j;db.veoBudgetUsedCents+=cents;logEvent("veo_budget_reserved",id,{cents,ledgerCents:db.veoBudgetUsedCents});await persist();
    try{
      const o=await jsonCall("models/"+model+":predictLongRunning",key,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({instances:[{prompt:story.text}],
          parameters:{aspectRatio:"9:16",durationSeconds:"8",resolution:res,numberOfVideos:1}})});
      if(!o.name||!/^(?:models\/[A-Za-z0-9._-]+\/)?operations\/[A-Za-z0-9._-]+$/.test(o.name))
        throw Error("provider_submission_ambiguous_inspect_before_retry");
      j.operation=o.name;j.status="running";await persist();return sanitized(j);
    }catch(e){j.status="failed";j.error=String(e.message||e).slice(0,170);await persist();throw e;}
  }
  async function poll(){
    if(!enabled)return;
    for(const j of Object.values(db.veoJobs).filter(j=>j.status==="running"&&j.operation)){
      if(busy.has(j.id))continue;busy.add(j.id);
      try{
        const data=await jsonCall(j.operation,key);
        if(!data.done)continue;
        if(data.error){j.status="failed";j.error="provider_failed_"+String(data.error.message||"unknown").slice(0,120);await persist();continue;}
        const uri=data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri||
          data.response?.generatedVideos?.[0]?.video?.uri;
        if(!uri){j.status="failed";j.error="provider_missing_output";await persist();continue;}
        j.status="downloading";await persist();
        const file=path.join(mediaDir,"veo-"+j.id+"-"+randomBytes(6).toString("hex")+".mp4");
        try{
          j.bytes=await download(uri,key,file);
          const info=await probe(file);const issues=[];
          if(info.seconds<7.5||info.seconds>9)issues.push("duration_wrong");
          if(info.height<=info.width)issues.push("not_vertical");
          if(!info.hasAudio)issues.push("no_audio_track");
          j.qa={...info,technicalPass:issues.length===0,issues,storyVerified:false,narrationVerified:false,
            note:"Automated checks cover file/audio track/duration/orientation only. Owner must watch and verify story accuracy, voiceover words and uncut ending."};
          j.filename=file;j.hash=await hashFile(file);j.status=issues.length?"qa_failed":"needs_owner_review";
          j.completedAt=new Date().toISOString();logEvent("veo_video_stored",j.id,{qa:j.status});
        }catch(e){await fs.unlink(file).catch(()=>{});j.status="failed";j.error=String(e.message||e).slice(0,180);}
        await persist();
      }catch(e){logEvent("veo_poll_retryable",j.id,{error:String(e.message||e).slice(0,70)});}
      finally{busy.delete(j.id);}
    }
  }
  async function reject(id,note){
    const j=db.veoJobs[id];if(!j||!["needs_owner_review","qa_failed"].includes(j.status))throw Error("not_reviewable");
    j.status="rejected";j.reviewNote=String(note||"").slice(0,500);await persist();return sanitized(j);
  }
  async function accept(id){
    const j=db.veoJobs[id];if(!j||j.status!=="needs_owner_review"||!j.qa?.technicalPass||!j.filename)throw Error("not_ready_to_approve");
    j.status="approved";j.ownerApprovedAt=new Date().toISOString();await persist();
    return {job:sanitized(j),filename:j.filename};
  }
  for(const j of Object.values(db.veoJobs)){
    if(j.status==="submitting"){j.status="failed";j.error="ambiguous_submission_on_restart_do_not_retry_automatically";}
    if(j.status==="downloading")j.status="running";
  }
  const timer=setInterval(()=>void poll(),20000);timer.unref();
  return {overview,start,poll,reject,accept,job:id=>db.veoJobs[id],sanitized};
}
