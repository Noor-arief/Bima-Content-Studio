import http from "node:http";
import { randomBytes, createHash, createCipheriv, createDecipheriv, timingSafeEqual } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, promises as fs } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import os from "node:os";
import { Transform } from "node:stream";
import { convertShortsVideo } from "./shorts.mjs";

const ORIGIN = "https://noor-arief.github.io";
const DATA_DIR = process.env.DATA_DIR || "./data";
const STATE_PATH = path.join(DATA_DIR, "state.json");
const MEDIA_DIR = path.join(DATA_DIR, "media");
const PORT = Number(process.env.PORT || 3000);
const BASE = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
const REDIRECT = BASE ? BASE + "/auth/google/callback" : "";
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const OWNER = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
const KEY_B64 = process.env.TOKEN_ENCRYPTION_KEY || "";
const KEY = /^[0-9a-f]{64}$/i.test(KEY_B64) ? Buffer.from(KEY_B64,"hex") : Buffer.from(KEY_B64,"base64");
const HAVE_OAUTH = Boolean(BASE && CLIENT_ID && CLIENT_SECRET && OWNER && KEY.length === 32);
const ENABLE_UPLOADS = process.env.ENABLE_UPLOADS === "true";
const SHORTS_MAX_UPLOAD = 30 * 1024 * 1024;
let shortsConversionBusy = false;
const ENABLE_PUBLIC_SCHEDULING = process.env.ENABLE_PUBLIC_SCHEDULING === "true";
const EXPECTED_CHANNEL_ID = process.env.EXPECTED_YOUTUBE_CHANNEL_ID || "";
const ACCESS_SCOPE = "openid email https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";
const sha = x => createHash("sha256").update(x).digest("hex");
async function fileSha256(filepath){const h=createHash("sha256");for await(const chunk of createReadStream(filepath))h.update(chunk);return h.digest("hex");}
const random = () => randomBytes(32).toString("base64url");
let db = {oauth:null,oauthStates:{},sessions:{},content:{},events:[]};
let pendingWrite = Promise.resolve();
const submitting = new Set();

const logEvent=(action,id,extra={})=>{
  db.events.push({at:new Date().toISOString(),action,id,...extra});
  if(db.events.length>2500)db.events=db.events.slice(-2500);
};
async function persist(){
  const body=JSON.stringify(db);
  const file=STATE_PATH+"."+randomBytes(5).toString("hex")+".tmp";
  pendingWrite=pendingWrite.catch(()=>{}).then(async()=>{await fs.writeFile(file,body,{mode:0o600});await fs.rename(file,STATE_PATH);});
  await pendingWrite;
}
async function init(){
  await fs.mkdir(MEDIA_DIR,{recursive:true,mode:0o700});
  if(existsSync(STATE_PATH)){
    const old=JSON.parse(await fs.readFile(STATE_PATH,"utf8"));
    db={...db,...old};
    let repaired=false;
    for(const item of Object.values(db.content)){
      if(item.status==="uploading"){
        item.status="needs_review";item.lastError="Server restarted during upload. Reconcile in YouTube before any retry.";
        logEvent("upload_requires_reconciliation",item.id);repaired=true;
      }
    }
    if(repaired)await persist();
  } else await persist();
}
function seal(value){
  if(KEY.length!==32)throw Error("encryption_not_configured");
  const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",KEY,iv);
  const enc=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
  return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),enc.toString("base64url")].join(".");
}
function unseal(value){
  const [iv,tag,data]=value.split(".").map(v=>Buffer.from(v,"base64url"));
  const dec=createDecipheriv("aes-256-gcm",KEY,iv);
  dec.setAuthTag(tag);return Buffer.concat([dec.update(data),dec.final()]).toString("utf8");
}
function respond(res,status,body,headers={}){
  res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",...headers});
  res.end(JSON.stringify(body));
}
function redirect(res,url){res.writeHead(302,{"Location":url,"Cache-Control":"no-store","Referrer-Policy":"no-referrer"});res.end();}
function error(res,status,code){respond(res,status,{error:code});}
async function readJSON(req,max=100000){
  const list=[];let n=0;for await(const c of req){n+=c.length;if(n>max)throw Error("payload_too_large");list.push(c);}
  return JSON.parse(Buffer.concat(list).toString("utf8"));
}
function access(req){
  const raw=(req.headers.authorization||"").match(/^Bearer ([A-Za-z0-9_-]+)$/);
  if(!raw)return false;
  const record=db.sessions[sha(raw[1])];
  if(!record||record.expires<Date.now())return false;
  return record.email===OWNER;
}
function envOK(){return HAVE_OAUTH&&Boolean(EXPECTED_CHANNEL_ID);}
function validateId(id){return /^[a-zA-Z0-9_-]{3,80}$/.test(id);}
function publicEntry(item){const {filePath,youtubeResumableSession, ...safe}=item;return safe;}
function activeOauth(){return Boolean(db.oauth?.refreshToken&&db.oauth?.email===OWNER);}
async function tokenExchange(params){
  const response=await fetch("https://oauth2.googleapis.com/token",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams(params),signal:AbortSignal.timeout(25000)});
  const o=await response.json();if(!response.ok)throw Error("google_token_exchange_failed: "+(o.error||response.status));
  return o;
}
async function newAccessToken(){
  if(!activeOauth())throw Error("youtube_not_connected");
  const o=await tokenExchange({client_id:CLIENT_ID,client_secret:CLIENT_SECRET,refresh_token:unseal(db.oauth.refreshToken),grant_type:"refresh_token"});
  return o.access_token;
}
async function channelForToken(token){
  const url="https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true";
  const r=await fetch(url,{headers:{Authorization:"Bearer "+token},signal:AbortSignal.timeout(20000)});
  const j=await r.json();if(!r.ok)throw Error("channel_lookup_failed: "+(j.error?.message||r.status));
  const list=j.items||[];if(list.length!==1)throw Error("expected_one_authorized_channel");
  return {id:list[0].id,name:list[0].snippet?.title||""};
}
async function syncChannel(token){
  const ch=await channelForToken(token);
  if(!EXPECTED_CHANNEL_ID||ch.id!==EXPECTED_CHANNEL_ID)throw Error("youtube_channel_not_confirmed_or_mismatch");
  return ch;
}
async function uploadToYoutube(item){
  if(!ENABLE_UPLOADS)throw Error("uploads_disabled");
  if(!activeOauth())throw Error("youtube_not_connected");
  if(!EXPECTED_CHANNEL_ID)throw Error("expected_channel_id_missing");
  if(item.status!=="approved")throw Error("requires_approval");
  if(item.youtubeId)throw Error("already_uploaded");
  const token=await newAccessToken();
  const ch=await syncChannel(token);
  const when=Date.parse(item.publishAt||"");
  if(!Number.isFinite(when)||when<Date.now()+10*60000)throw Error("publishAt_requires_future_time");
  if(!existsSync(item.filePath))throw Error("video_file_not_found");
  // Public scheduling remains disabled until verification/audit gate is completed.
  const schedule=ENABLE_PUBLIC_SCHEDULING;
  const meta={
    snippet:{title:item.title,description:item.description||"",categoryId:"27",defaultLanguage:"en"},
    status:{privacyStatus:"private",selfDeclaredMadeForKids:!!item.madeForKids,containsSyntheticMedia:!!item.containsSyntheticMedia}
  };
  if(schedule)meta.status.publishAt=new Date(when).toISOString();
  const st=await fs.stat(item.filePath);
  item.status="uploading";item.lastError=null;item.attemptedAt=new Date().toISOString();logEvent("youtube_upload_started",item.id,{channel:ch.id});await persist();
  let sessionURL;
  try{
    const start=await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",{
      method:"POST",headers:{
        Authorization:"Bearer "+token,"Content-Type":"application/json; charset=utf-8",
        "X-Upload-Content-Type":"video/mp4","X-Upload-Content-Length":String(st.size)},
      body:JSON.stringify(meta),signal:AbortSignal.timeout(30000)});
    if(!start.ok)throw Error("youtube_session_creation_failed_"+start.status+":"+(await start.text()).slice(0,250));
    sessionURL=start.headers.get("location");if(!sessionURL||!sessionURL.startsWith("https://www.googleapis.com/"))throw Error("invalid_upload_location");
    item.youtubeResumableSession=seal(sessionURL);await persist();
    const source=createReadStream(item.filePath);
    const done=await fetch(sessionURL,{method:"PUT",headers:{"Content-Type":"video/mp4","Content-Length":String(st.size)},
      body:source,duplex:"half",signal:AbortSignal.timeout(180000)});
    const response=await done.json().catch(()=>({}));
    if(!done.ok||!response.id)throw Error("youtube_upload_unconfirmed_"+done.status+":"+(response.error?.message||"unknown"));
    item.youtubeId=response.id;
    item.youtubeChannelId=response.snippet?.channelId||ch.id;
    item.status=(schedule && response.status?.publishAt)?"scheduled":"private_uploaded";
    item.youtubeResumableSession=null;
    item.lastError=null;logEvent("youtube_upload_confirmed",item.id,{youtubeId:item.youtubeId,status:item.status});
    await persist();
  }catch(e){
    // A failed/ambiguous resumable upload is NEVER re-submitted automatically: it might already exist.
    item.status="needs_review";item.lastError=String(e.message||e).slice(0,300);
    logEvent("youtube_upload_needs_review",item.id,{message:item.lastError});await persist();
  }
}
async function inspectVideo(item){
  if(!item.youtubeId)return;
  const token=await newAccessToken();
  const url="https://www.googleapis.com/youtube/v3/videos?part=status,snippet&id="+encodeURIComponent(item.youtubeId);
  const r=await fetch(url,{headers:{Authorization:"Bearer "+token},signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error("youtube_status_unavailable");
  const j=await r.json();const entry=j.items?.[0];if(!entry)return;
  if(entry.snippet?.channelId!==EXPECTED_CHANNEL_ID)throw Error("youtube_channel_changed");
  item.youtubePrivacyStatus=entry.status?.privacyStatus||null;
  item.youtubeUploadStatus=entry.status?.uploadStatus||null;
  if(entry.status?.privacyStatus==="public"){item.status="published";logEvent("youtube_confirmed_public",item.id);}
  await persist();
}
async function handler(req,res){
  const u=new URL(req.url||"/","http://localhost");
  const origin=req.headers.origin;
  if(origin&&origin!==ORIGIN)return error(res,403,"origin_not_allowed");
  if(origin===ORIGIN){
    res.setHeader("Access-Control-Allow-Origin",ORIGIN);
    res.setHeader("Vary","Origin");
    res.setHeader("Access-Control-Allow-Headers","Authorization,Content-Type");
    res.setHeader("Access-Control-Allow-Methods","GET,POST,PUT,OPTIONS");
  }
  if(req.method==="OPTIONS"){res.writeHead(204);return res.end();}
  if(req.method==="GET"&&u.pathname==="/health")return respond(res,200,{
    service:"bima-content-studio-api",status:"online",oauthConfigured:HAVE_OAUTH,
    youtubeConnected:activeOauth(),channelLocked:Boolean(EXPECTED_CHANNEL_ID),
    channelVerified:activeOauth()&&Boolean(EXPECTED_CHANNEL_ID)&&db.oauth.channelId===EXPECTED_CHANNEL_ID,
    uploadsEnabled:ENABLE_UPLOADS,publicSchedulingEnabled:ENABLE_PUBLIC_SCHEDULING
  });
  // Public-safe YouTube counters for the channel dashboard.
  // Expose no OAuth data, titles, descriptions, schedules, video IDs or draft metadata.
  // Per-item indicators contain only the internal id and non-sensitive upload state.
  if(req.method==="GET"&&u.pathname==="/public/stats"){
    const records=Object.values(db.content);
    const uploaded=records.filter(item=>typeof item.youtubeId==="string"&&item.youtubeId.length>0);
    const summary={
      uploaded:uploaded.length,
      scheduled:uploaded.filter(item=>item.status==="scheduled").length,
      published:uploaded.filter(item=>item.status==="published").length,
      private:uploaded.filter(item=>item.status==="private_uploaded").length,
      observedAt:new Date().toISOString(),
      uploadIndicators:uploaded.map(item=>({id:item.id,status:item.status}))
    };
    return respond(res,200,summary);
  }
  if(req.method==="GET"&&u.pathname==="/ready")return respond(res,envOK()&&activeOauth()?200:503,{
    ready:envOK()&&activeOauth(),reason:envOK()&&activeOauth()?"ready":envOK()?"awaiting_owner_youtube_oauth":"awaiting_railway_configuration"
  });
  if(req.method==="GET"&&u.pathname==="/auth/google/start"){
    if(!HAVE_OAUTH)return error(res,503,"oauth_not_configured");
    const state=random(),verifier=random();
    const challenge=createHash("sha256").update(verifier).digest("base64url");
    db.oauthStates[sha(state)]={verifier,created:Date.now()};await persist();
    const q=new URLSearchParams({client_id:CLIENT_ID,redirect_uri:REDIRECT,response_type:"code",scope:ACCESS_SCOPE,access_type:"offline",
      prompt:"consent select_account",state,code_challenge:challenge,code_challenge_method:"S256"});
    return redirect(res,"https://accounts.google.com/o/oauth2/v2/auth?"+q);
  }
  if(req.method==="GET"&&u.pathname==="/auth/google/callback"){
    const state=u.searchParams.get("state")||"";
    const entry=db.oauthStates[sha(state)];delete db.oauthStates[sha(state)];await persist();
    if(!entry||Date.now()-entry.created>600000)return error(res,400,"oauth_state_invalid");
    const code=u.searchParams.get("code");
    if(!code)return error(res,400,"google_denied_access");
    try{
      const tokens=await tokenExchange({code,client_id:CLIENT_ID,client_secret:CLIENT_SECRET,redirect_uri:REDIRECT,
        code_verifier:entry.verifier,grant_type:"authorization_code"});
      const me=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{
        headers:{"Authorization":"Bearer "+tokens.access_token},signal:AbortSignal.timeout(20000)});
      if(!me.ok)throw Error("owner_identity_unavailable");
      const identity=await me.json();
      if(!identity.email_verified||String(identity.email).toLowerCase()!==OWNER)throw Error("not_authorized_owner");
      const ch=await channelForToken(tokens.access_token);
      if(EXPECTED_CHANNEL_ID&&ch.id!==EXPECTED_CHANNEL_ID)throw Error("wrong_youtube_channel");
      if(!tokens.refresh_token&&!db.oauth?.refreshToken)throw Error("google_refresh_token_missing");
      db.oauth={email:OWNER,refreshToken:tokens.refresh_token?seal(tokens.refresh_token):db.oauth.refreshToken,
        channelId:ch.id,channelName:ch.name,connectedAt:new Date().toISOString()};
      const session=random();db.sessions[sha(session)]={email:OWNER,expires:Date.now()+12*3600000};
      logEvent("youtube_oauth_connected","owner",{channel:ch.id});await persist();
      // Fragment never travels to Github Pages server; frontend removes it immediately.
      return redirect(res,ORIGIN+"/Bima-Content-Studio/#bima_session="+session);
    }catch(e){return error(res,403,String(e.message||e).slice(0,150));}
  }
  if(!u.pathname.startsWith("/api/"))return error(res,404,"not_found");
  if(!access(req))return error(res,401,"authentication_required");
  // Conversion is isolated from publishing: authenticated, bounded, temporary MP4 processing only.
  if(req.method==="POST"&&u.pathname==="/api/convert-shorts"){
    if(shortsConversionBusy)return error(res,429,"conversion_busy_try_again");
    const mode=u.searchParams.get("mode")||"blur";
    if(mode!=="blur"&&mode!=="crop")return error(res,400,"invalid_conversion_mode");
    if(!String(req.headers["content-type"]||"").startsWith("video/mp4"))return error(res,415,"only_mp4_supported");
    const givenBytes=Number(req.headers["content-length"]||0);
    if(!Number.isFinite(givenBytes)||givenBytes>SHORTS_MAX_UPLOAD)return error(res,413,"shorts_max_30mb");
    shortsConversionBusy=true;
    let tmp="";
    try{
      tmp=await fs.mkdtemp(path.join(os.tmpdir(),"bima-short-"));
      const source=path.join(tmp,"source.mp4"),output=path.join(tmp,"shorts.mp4");
      let bytes=0;
      const limiter=new Transform({transform(chunk,enc,cb){
        bytes+=chunk.length;
        cb(bytes>SHORTS_MAX_UPLOAD?Error("shorts_max_30mb"):null,bytes>SHORTS_MAX_UPLOAD?undefined:chunk);
      }});
      await pipeline(req,limiter,createWriteStream(source,{flags:"wx"}));
      if(bytes<128)throw Error("invalid_mp4");
      const input=await fs.open(source,"r");
      let header;
      try{header=Buffer.alloc(12);await input.read(header,0,12,0);}finally{await input.close();}
      if(header.toString("ascii",4,8)!=="ftyp")throw Error("invalid_mp4");
      const info=await convertShortsVideo(source,output,{mode});
      const file=await fs.stat(output);
      if(!file.size||file.size>150*1024*1024)throw Error("conversion_output_too_large");
      logEvent("shorts_converted","local",{mode,durationSeconds:info.durationSeconds});
      res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":file.size,
        "Content-Disposition":'attachment; filename="bima-shorts-9x16.mp4"',
        "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
      await pipeline(createReadStream(output),res);
    }catch(e){
      const code=String(e?.message||"conversion_failed").split(":")[0];
      const userError=["shorts_max_30mb","invalid_mp4","shorts_duration_out_of_range","video_metadata_unavailable","conversion_timeout","conversion_output_too_large"].includes(code)?code:"conversion_failed";
      const status=code==="shorts_max_30mb"?413:code==="conversion_timeout"?504:code==="conversion_failed"||code.startsWith("ffmpeg")?500:422;
      if(!res.headersSent&&!res.destroyed)error(res,status,userError);
      else if(!res.destroyed)res.destroy();
    }finally{
      if(tmp)await fs.rm(tmp,{recursive:true,force:true}).catch(()=>{});
      shortsConversionBusy=false;
    }
    return;
  }
  if(req.method==="GET"&&u.pathname==="/api/status"){
    return respond(res,200,{authenticated:true,email:OWNER,channel:activeOauth()?{
      id:db.oauth.channelId,name:db.oauth.channelName,verified:db.oauth.channelId===EXPECTED_CHANNEL_ID}:null,
      uploadsEnabled:ENABLE_UPLOADS,publicSchedulingEnabled:ENABLE_PUBLIC_SCHEDULING,
      items:Object.values(db.content).map(publicEntry),events:db.events.slice(-30)});
  }
  if(req.method==="POST"&&u.pathname==="/api/content"){
    let input;try{input=await readJSON(req);}catch{return error(res,400,"invalid_json");}
    const id=String(input.id||"");
    if(!validateId(id))return error(res,400,"invalid_id");
    if(typeof input.title!=="string"||!input.title.trim()||input.title.length>100)return error(res,400,"invalid_title");
    if(typeof input.description!=="string"||input.description.length>5000)return error(res,400,"invalid_description");
    const old=db.content[id]||{};
    if(old.status&&["uploading","private_uploaded","scheduled","published","needs_review"].includes(old.status))return error(res,409,"published_job_immutable");
    const item={...old,id,title:input.title.trim(),description:input.description,
      publishAt:String(input.publishAt||""),madeForKids:input.madeForKids===true,
      containsSyntheticMedia:input.containsSyntheticMedia===true,
      status:old.filePath?"draft_with_video":"draft",updatedAt:new Date().toISOString()};
    db.content[id]=item;await persist();
    return respond(res,200,{item:publicEntry(item)});
  }
  const m=u.pathname.match(/^\/api\/content\/([A-Za-z0-9_-]{3,80})(\/(media|approve|submit|verify))?$/);
  if(!m)return error(res,404,"not_found");
  const id=m[1],action=m[3]||"";
  const item=db.content[id];if(!item)return error(res,404,"content_not_found");
  if(req.method==="GET"&&!action)return respond(res,200,{item:publicEntry(item)});
  if(req.method==="POST"&&action==="media"){
    if(item.youtubeId||["uploading","scheduled","published","private_uploaded","needs_review"].includes(item.status))return error(res,409,"media_locked");
    if(req.headers["content-type"]!=="video/mp4")return error(res,415,"mp4_only");
    const len=Number(req.headers["content-length"]||0);
    if(!Number.isSafeInteger(len)||len<1024||len>150_000_000)return error(res,413,"video_size_unsupported");
    const temp=path.join(MEDIA_DIR,id+"."+Date.now()+".part");
    let count=0;
    try{
      await pipeline(req,async function*(source){for await(const chunk of source){count+=chunk.length;if(count>150_000_000)throw Error("too_large");yield chunk;}},createWriteStream(temp,{flags:"wx",mode:0o600}));
      if(count!==len)throw Error("incomplete_media");
      const fd=await fs.open(temp,"r");const sig=Buffer.alloc(12);await fd.read(sig,0,12,0);await fd.close();
      if(sig.toString("ascii",4,8)!=="ftyp")throw Error("not_mp4");
      const final=path.join(MEDIA_DIR,id+"-"+Date.now()+".mp4");
      await fs.rename(temp,final);
      if(item.filePath)await fs.unlink(item.filePath).catch(()=>{});
      item.filePath=final;item.mediaSize=count;item.status="draft_with_video";
      item.mediaHash=await fileSha256(final);item.updatedAt=new Date().toISOString();
      logEvent("media_stored",id,{size:count});await persist();
      return respond(res,201,{item:publicEntry(item)});
    }catch(e){await fs.unlink(temp).catch(()=>{});return error(res,400,String(e.message||e).slice(0,100));}
  }
  if(req.method==="POST"&&action==="approve"){
    if(item.status!=="draft_with_video"||!item.filePath)return error(res,409,"video_required");
    if(!Number.isFinite(Date.parse(item.publishAt))||Date.parse(item.publishAt)<Date.now()+15*60000)return error(res,422,"future_publishAt_required");
    if(!EXPECTED_CHANNEL_ID||!activeOauth()||db.oauth.channelId!==EXPECTED_CHANNEL_ID)return error(res,409,"youtube_channel_not_verified");
    item.status="approved";item.approvedMediaHash=item.mediaHash;item.approvedAt=new Date().toISOString();
    logEvent("owner_approved_video",id,{hash:item.mediaHash});await persist();
    return respond(res,200,{item:publicEntry(item)});
  }
  if(req.method==="POST"&&action==="submit"){
    if(submitting.has(id))return error(res,409,"upload_already_in_progress");
    if(item.status!=="approved"||item.mediaHash!==item.approvedMediaHash)return error(res,409,"owner_approval_required");
    if(!ENABLE_UPLOADS)return error(res,409,"uploads_disabled");
    // intentionally single-fire. No automatic retry after any network ambiguity.
    submitting.add(id);
    void uploadToYoutube(item).catch(async e=>{item.status="needs_review";item.lastError=String(e.message||e);await persist();}).finally(()=>submitting.delete(id));
    return respond(res,202,{status:"upload_started",id});
  }
  if(req.method==="POST"&&action==="verify"){
    if(!item.youtubeId)return error(res,409,"youtube_video_missing");
    try{await inspectVideo(item);return respond(res,200,{item:publicEntry(item)});}
    catch(e){return error(res,502,String(e.message||e).slice(0,100));}
  }
  return error(res,405,"method_not_allowed");
}
await init();
let pollBusy=false;
setInterval(async ()=>{
  if(pollBusy||!activeOauth()||!ENABLE_PUBLIC_SCHEDULING||!EXPECTED_CHANNEL_ID)return;
  pollBusy=true;
  try{
    for(const item of Object.values(db.content).filter(x=>x.status==="scheduled"&&x.youtubeId).slice(0,10)){
      try{await inspectVideo(item);}catch(e){console.warn("youtube_status_poll_failed",item.id,String(e.message||e).slice(0,80));}
    }
  }finally{pollBusy=false;}
},15*60*1000).unref();
http.createServer((req,res)=>{handler(req,res).catch(e=>{
  console.error("request_failed",String(e?.message||e).slice(0,150));
  if(!res.headersSent)error(res,500,"internal_error");
  else res.end();
});}).listen(PORT,"0.0.0.0",()=>{
  console.log("bima-content-studio-api listening:"+PORT+", uploadEnabled:"+ENABLE_UPLOADS+", publicSchedulingEnabled:"+ENABLE_PUBLIC_SCHEDULING);
});
