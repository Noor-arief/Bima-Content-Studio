import http from "node:http";
import { randomBytes, createHash, createCipheriv, createDecipheriv, timingSafeEqual } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, promises as fs } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import os from "node:os";
import { Transform } from "node:stream";
import { convertShortsVideo } from "./shorts.mjs";
import { createShortsCoverVideo } from "./shorts-cover.mjs";
import { MIX_2026, validateEditorial } from "./editorial.mjs";
import { createVeoWorker } from "./veo.mjs";
import { createPiapiWorker } from "./piapi.mjs";
import { createVenusProduction } from "./venus-production.mjs";
import { createMoonVoice } from "./moon-voice.mjs";
import { createButterflyVoice } from "./butterfly-voice.mjs";

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
const THUMBNAIL_MAX_UPLOAD = 12 * 1024 * 1024;
const THUMBNAIL_START = "2026-10-19";
const ENABLE_THUMBNAIL_UPLOADS = process.env.ENABLE_THUMBNAIL_UPLOADS === "true";
let shortsConversionBusy = false;
const ENABLE_PUBLIC_SCHEDULING = process.env.ENABLE_PUBLIC_SCHEDULING === "true";
const EXPECTED_CHANNEL_ID = process.env.EXPECTED_YOUTUBE_CHANNEL_ID || "";

const TIKTOK_KEY = process.env.TIKTOK_CLIENT_KEY || "";
const TIKTOK_SECRET = process.env.TIKTOK_CLIENT_SECRET || "";
const TIKTOK_SANDBOX_KEY = process.env.TIKTOK_SANDBOX_CLIENT_KEY || "";
const TIKTOK_SANDBOX_SECRET = process.env.TIKTOK_SANDBOX_CLIENT_SECRET || "";
const TIKTOK_SANDBOX_READY = Boolean(BASE && TIKTOK_SANDBOX_KEY && TIKTOK_SANDBOX_SECRET && KEY.length === 32);
const TIKTOK_REDIRECT = BASE ? BASE + "/auth/tiktok/callback" : "";
const TIKTOK_READY = Boolean(BASE && TIKTOK_KEY && TIKTOK_SECRET && KEY.length === 32);
async function tiktokToken(params, sandbox=false){
  const r=await fetch("https://open.tiktokapis.com/v2/oauth/token/",{method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({client_key:sandbox?TIKTOK_SANDBOX_KEY:TIKTOK_KEY,client_secret:sandbox?TIKTOK_SANDBOX_SECRET:TIKTOK_SECRET,...params}),
    signal:AbortSignal.timeout(20000)});
  const j=await r.json();if(!r.ok||!j.access_token)throw Error("tiktok_token_exchange_failed");
  return j;
}
async function tiktokProfile(token){
  const r=await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",{
    headers:{Authorization:"Bearer "+token},signal:AbortSignal.timeout(20000)});
  const j=await r.json();if(!r.ok||j.error?.code!=="ok"||!j.data?.user?.open_id)throw Error("tiktok_profile_failed");
  return j.data.user;
}

const ACCESS_SCOPE = "openid email https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";
const sha = x => createHash("sha256").update(x).digest("hex");
async function fileSha256(filepath){const h=createHash("sha256");for await(const chunk of createReadStream(filepath))h.update(chunk);return h.digest("hex");}
const random = () => randomBytes(32).toString("base64url");
let db = {oauth:null,oauthStates:{},sessions:{},content:{},events:[]};
let pendingWrite = Promise.resolve();
const submitting = new Set();
let veoWorker=null;
let piapiWorker=null;
let venusProduction=null;

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
function publicEntry(item){const {filePath,thumbnailPath,youtubeResumableSession,...safe}=item;return safe;}
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
  // Only future, not-yet-uploaded Shorts. The scheduled Pufferfish stays untouched.
  let youtubeFilePath=item.filePath;
  if(item.id!=="yt26-20261019" && item.publishAt>="2026-10-19" && item.thumbnailPath &&
     item.thumbnailForMediaHash===item.approvedMediaHash && existsSync(item.thumbnailPath)){
    youtubeFilePath=await createShortsCoverVideo(item.filePath,item.thumbnailPath);
    logEvent("shorts_cover_embedded",item.id,{source:"approved_video_frame",transition:"crossfade",holdSeconds:0.20,fadeSeconds:0.80});
    await persist();
  }else if(item.id!=="yt26-20261019" && item.publishAt>="2026-10-19"){
    throw Error("future_shorts_cover_missing_or_mismatched");
  }
  const st=await fs.stat(youtubeFilePath);
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
    const source=createReadStream(youtubeFilePath);
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
    // A rejected Shorts thumbnail must not invalidate a confirmed video upload.
    if(item.thumbnailPath&&ENABLE_THUMBNAIL_UPLOADS){
      try{await applyYouTubeThumbnail(item,token);}
      catch(e){
        item.thumbnailStatus="failed";
        item.thumbnailError=String(e?.message||e).slice(0,180);
        logEvent("youtube_thumbnail_failed",item.id,{reason:item.thumbnailError});
        await persist();
      }
    }
  }catch(e){
    // A failed/ambiguous resumable upload is NEVER re-submitted automatically: it might already exist.
    item.status="needs_review";item.lastError=String(e.message||e).slice(0,300);
    logEvent("youtube_upload_needs_review",item.id,{message:item.lastError});await persist();
  }
}
async function applyYouTubeThumbnail(item,token){
  if(!item.youtubeId||!item.thumbnailPath||!existsSync(item.thumbnailPath))throw Error("thumbnail_file_missing");
  if(item.thumbnailForMediaHash!==item.approvedMediaHash)throw Error("thumbnail_video_mismatch");
  if(item.thumbnailStatus==="api_accepted")return;
  const file=await fs.stat(item.thumbnailPath);
  if(file.size<100||file.size>THUMBNAIL_MAX_UPLOAD)throw Error("thumbnail_size_invalid");
  item.thumbnailStatus="applying";item.thumbnailError=null;await persist();
  const response=await fetch(
    "https://www.googleapis.com/upload/youtube/v3/thumbnails/set?uploadType=media&videoId="+encodeURIComponent(item.youtubeId),{
      method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"image/png","Content-Length":String(file.size)},
      body:createReadStream(item.thumbnailPath),duplex:"half",signal:AbortSignal.timeout(65000)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error("youtube_thumbnail_rejected_"+response.status+":"+String(result.error?.message||"unsupported_or_no_permission").slice(0,100));
  item.thumbnailStatus="api_accepted";item.thumbnailAppliedAt=new Date().toISOString();item.thumbnailError=null;
  logEvent("youtube_thumbnail_api_accepted",item.id,{youtubeId:item.youtubeId});await persist();
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

  // TikTok access is separate from the YouTube OAuth and upload state.
  // Only an authenticated BIMA owner can initiate a new account connection.
  if(req.method==="GET"&&(u.pathname==="/auth/tiktok/status"||u.pathname==="/auth/tiktok/sandbox/status")){
    const sandbox=u.pathname.includes("/sandbox/");
    const account=sandbox?db.tiktokSandbox:db.tiktok;
    if(!access(req))return error(res,401,"owner_login_required");
    return respond(res,200,{environment:sandbox?"sandbox":"production",configured:sandbox?TIKTOK_SANDBOX_READY:TIKTOK_READY,connected:Boolean(account?.openId),
      displayName:account?.displayName||null,scopes:account?.scopes||[],
      redirectUri:TIKTOK_REDIRECT,shopAffiliateConnected:false,postingConnected:false});
  }
  if(req.method==="POST"&&(u.pathname==="/auth/tiktok/start"||u.pathname==="/auth/tiktok/sandbox/start")){
    const sandbox=u.pathname.includes("/sandbox/");
    if(!access(req))return error(res,401,"owner_login_required");
    if(!(sandbox?TIKTOK_SANDBOX_READY:TIKTOK_READY))return error(res,503,"tiktok_credentials_not_configured");
    const state=random();
    db.tiktokStates ||= {};
    for(const [key,val] of Object.entries(db.tiktokStates))if(Date.now()-val.created>600000)delete db.tiktokStates[key];
    db.tiktokStates[sha(state)]={created:Date.now(),sandbox};await persist();
    const params=new URLSearchParams({client_key:sandbox?TIKTOK_SANDBOX_KEY:TIKTOK_KEY,response_type:"code",scope:"user.info.basic",
      redirect_uri:TIKTOK_REDIRECT,state});
    return respond(res,200,{authorizationUrl:"https://www.tiktok.com/v2/auth/authorize/?"+params});
  }
  if(req.method==="GET"&&u.pathname==="/auth/tiktok/callback"){
    const state=u.searchParams.get("state")||"";
    const saved=db.tiktokStates?.[sha(state)];
    if(saved)delete db.tiktokStates[sha(state)];
    await persist();
    if(!state||!saved||Date.now()-saved.created>600000)return error(res,400,"tiktok_state_invalid");
    if(u.searchParams.has("error"))return error(res,400,"tiktok_authorization_denied");
    const code=u.searchParams.get("code");
    if(!code||!(saved.sandbox?TIKTOK_SANDBOX_READY:TIKTOK_READY))return error(res,400,"tiktok_callback_incomplete");
    try{
      const tokens=await tiktokToken({grant_type:"authorization_code",code,redirect_uri:TIKTOK_REDIRECT},saved.sandbox);
      const profile=await tiktokProfile(tokens.access_token);
      const account={openId:profile.open_id,displayName:profile.display_name||"",
        scopes:(tokens.scope||"").split(",").filter(Boolean),accessToken:seal(tokens.access_token),
        refreshToken:seal(tokens.refresh_token),expiresAt:Date.now()+tokens.expires_in*1000,
        connectedAt:new Date().toISOString()};
      if(saved.sandbox)db.tiktokSandbox=account;else db.tiktok=account;
      logEvent("tiktok_login_connected","owner",{environment:saved.sandbox?"sandbox":"production"});await persist();
      return respond(res,200,{connected:true,environment:saved.sandbox?"sandbox":"production",displayName:account.displayName,
        note:"TikTok Login Kit only. TikTok Shop and Content Posting not connected."});
    }catch{
      return error(res,502,"tiktok_authorization_exchange_failed");
    }
  }
  // Boolean-only public connection state. Never exposes account identifiers or tokens.
  if(req.method==="GET"&&u.pathname==="/public/tiktok/sandbox/status"){
    return respond(res,200,{environment:"sandbox",configured:TIKTOK_SANDBOX_READY,
      connected:Boolean(db.tiktokSandbox?.openId),shopAffiliateConnected:false,postingConnected:false});
  }
  if(req.method==="GET"&&u.pathname==="/health")return respond(res,200,{
    service:"bima-content-studio-api",status:"online",oauthConfigured:HAVE_OAUTH,
    youtubeConnected:activeOauth(),channelLocked:Boolean(EXPECTED_CHANNEL_ID),
    channelVerified:activeOauth()&&Boolean(EXPECTED_CHANNEL_ID)&&db.oauth.channelId===EXPECTED_CHANNEL_ID,
    uploadsEnabled:ENABLE_UPLOADS,publicSchedulingEnabled:ENABLE_PUBLIC_SCHEDULING,
    thumbnailUploadsEnabled:ENABLE_THUMBNAIL_UPLOADS,
    veoConfigured:veoWorker?.overview().configured||false,
    veoEnabled:veoWorker?.overview().enabled||false,
    piapiConfigured:piapiWorker?.overview().configured||false,
    piapiEnabled:piapiWorker?.overview().enabled||false
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
  if(req.method==="GET"&&u.pathname==="/api/production/plan"){
    return respond(res,200,{mode:"editorial_only",providerGenerationEnabled:false,publishEnabled:false,
      note:"Alternating daily release proposal; no video generated, source verified, or upload initiated.",
      items:MIX_2026});
  }
  if(req.method==="POST"&&u.pathname==="/api/production/preflight"){
    let input;try{input=await readJSON(req,250000);}catch{return error(res,400,"invalid_editorial_package");}
    return respond(res,200,validateEditorial(input));
  }
  if(req.method==="POST"&&u.pathname==="/api/production/generate"){
    return error(res,409,"generation_not_enabled_paid_provider_and_source_QA_pending");
  }

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
  // Full-length Venus production, owner-only. No YouTube publishing.
  if(req.method==="GET"&&u.pathname==="/api/venus-production/status"){
    // Complete archival of an already selected, paid-for Scene 1 on first status read.
    // This fetches the existing MP4 only; it NEVER submits a paid generation task.
    const selected=db.piapiProduction?.["yt26-20261013-piapi-pilot"]?.scene1;
    if(selected?.taskId&&!selected.storedFile){
      try{await piapiWorker.useAsScene1("yt26-20261013-piapi-pilot");}
      catch(e){console.warn("venus_scene1_archive_pending",String(e.message||e).slice(0,90));}
    }
    return respond(res,200,venusProduction.publicState());
  }
  if(req.method==="POST"&&u.pathname==="/api/venus-production/start"){
    let data;try{data=await readJSON(req,3000);}catch{return error(res,400,"invalid_budget_approval");}
    if(data?.confirmPaidProduction!==true)return error(res,409,"explicit_paid_production_approval_required");
    try{return respond(res,202,await venusProduction.begin({ownerApproved:true,capUsd:Number(data.maximumUsd||0)}));}
    catch(e){return error(res,409,String(e.message||e).slice(0,160));}
  }
  if(req.method==="POST"&&u.pathname==="/api/venus-production/refresh"){
    try{return respond(res,200,await venusProduction.poll());}
    catch(e){return error(res,409,String(e.message||e).slice(0,150));}
  }
  if(req.method==="GET"&&u.pathname==="/api/venus-production/video"){
    const job=db.venusProduction?.final;
    if(db.venusProduction?.status!=="ready_for_review"||!job?.path)return error(res,404,"final_video_not_ready");
    try{
      const stat=await fs.stat(job.path);
      res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":stat.size,
        "Cache-Control":"private,no-store","Content-Disposition":"inline; filename=venus-owner-review.mp4"});
      return createReadStream(job.path).pipe(res);
    }catch{return error(res,404,"final_video_unavailable");}
  }
  // PiAPI pilot: owner-authenticated, no publishing endpoint, explicit budget consent.
  if(req.method==="GET"&&u.pathname==="/api/butterfly-review/status"){
    const job=db.piapiJobs?.[BUTTERFLY_ID]||null;
    return respond(res,200,{job:job?{status:job.status,error:job.error||job.lastPollError||null,videoUrl:job.status==="review_required"?job.videoUrl:null}:null,voice:butterflyVoice.state()});
  }
  if(req.method==="GET"&&u.pathname==="/api/butterfly-review/video"){
    if(!butterflyVoice.state().ready)return error(res,404,"butterfly_voice_not_ready");
    const f=db.butterflyVoice?.file;
    if(!f||path.dirname(f)!==MEDIA_DIR||path.basename(f)!=="butterfly-voice-review.mp4")return error(res,404,"invalid_butterfly_asset");
    try{const stat=await fs.stat(f);res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":stat.size,"Cache-Control":"private,no-store","Content-Disposition":"inline; filename=butterfly-voice-review.mp4"});return createReadStream(f).pipe(res);}
    catch{return error(res,404,"butterfly_file_missing");}
  }
  if(req.method==="GET"&&u.pathname==="/api/moon-voice/status")return respond(res,200,moonVoice.state());
  if(req.method==="GET"&&u.pathname==="/api/moon-voice/video"){
    const state=moonVoice.state();if(!state.ready||!db.moonVoice?.file)return error(res,404,"moon_voice_not_ready");
    try{
      const f=db.moonVoice.file;if(path.dirname(f)!==MEDIA_DIR||path.basename(f)!=="moon-voice-review.mp4")throw Error("invalid_asset");
      const stat=await fs.stat(f);res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":stat.size,"Cache-Control":"private,no-store","Content-Disposition":"inline; filename=moon-voice-review.mp4"});
      return createReadStream(f).pipe(res);
    }catch{return error(res,404,"moon_voice_file_missing");}
  }
  if(req.method==="GET"&&u.pathname==="/api/piapi/status")
    return respond(res,200,await piapiWorker.refresh());
  if(req.method==="POST"&&u.pathname==="/api/piapi/use-scene1"){
    let data;try{data=await readJSON(req,2000);}catch{return error(res,400,"invalid_scene_selection_payload");}
    if(data?.id!=="yt26-20261013-piapi-pilot")return error(res,403,"pilot_only");
    try{return respond(res,200,await piapiWorker.useAsScene1(data.id));}
    catch(e){return error(res,409,String(e.message||e).slice(0,130));}
  }
  if(req.method==="POST"&&u.pathname==="/api/piapi/reject"){
    let data;try{data=await readJSON(req,2000);}catch{return error(res,400,"invalid_rejection_payload");}
    if(data?.id!=="yt26-20261013-piapi-pilot")return error(res,403,"pilot_only");
    try{return respond(res,200,{job:await piapiWorker.reject(data.id)});}
    catch(e){return error(res,409,String(e.message||e).slice(0,140));}
  }
  if(req.method==="POST"&&u.pathname==="/api/piapi/single-video"){
    let data;try{data=await readJSON(req,10000);}catch{return error(res,400,"invalid_single_video_payload");}
    // Independent production job. No publishing, no scene concatenation.
    if(!/^yt26-20261013-moon-single$/.test(String(data?.id||"")))return error(res,403,"single_video_draft_not_allowed");
    if(data?.title!=="Why Does the Moon Change Shape?")return error(res,409,"draft_title_mismatch");
    try{return respond(res,202,{job:await piapiWorker.startSingle(data)});}
    catch(e){return error(res,409,String(e.message||e).slice(0,170));}
  }
  if(req.method==="POST"&&u.pathname==="/api/piapi/generate"){
    let data;try{data=await readJSON(req,10000);}catch{return error(res,400,"invalid_generation_payload");}
    const item=db.content[data?.id];
    if(!item)return error(res,404,"draft_not_registered_on_server");
    if(item.title!==data.title)return error(res,409,"draft_title_mismatch");
    if(item.filePath||["uploading","scheduled","published","private_uploaded"].includes(item.status))
      return error(res,409,"content_locked_for_generation");
    try{return respond(res,202,{job:await piapiWorker.start(data)});}
    catch(e){return error(res,409,String(e.message||e).slice(0,170));}
  }
  // Owner-only autonomous video pipeline; generation has explicit cost confirmation and hard cap.
  if(req.method==="GET"&&u.pathname==="/api/veo/status")
    return respond(res,200,veoWorker.overview());
  if(req.method==="POST"&&u.pathname==="/api/veo/queue"){
    let data;try{data=await readJSON(req,35000);}catch{return error(res,400,"invalid_autonomous_queue_payload");}
    if(data?.confirmBudget!==true)return error(res,409,"owner_budget_approval_required");
    const rows=Array.isArray(data?.jobs)?data.jobs:[];
    if(rows.length<1||rows.length>4)return error(res,422,"queue_requires_1_to_4_shorts");
    const jobs=[];
    for(const job of rows){
      const item=db.content?.[job?.id];
      if(!item||item.title!==job.title||item.filePath||!["draft","draft_with_video"].includes(item.status))
        return error(res,409,"queue_requires_registered_unpublished_draft");
      if(!job.prompt||typeof job.prompt!=="string")return error(res,422,"queue_requires_storyboard");
      jobs.push({...job,description:item.description});
    }
    try{
      const queued=await veoWorker.queueBatch(jobs);
      void veoWorker.pump().catch(e=>console.warn("veo_autonomous_pump_failed",String(e.message||e).slice(0,90)));
      return respond(res,202,{queued,summary:veoWorker.overview()});
    }catch(e){return error(res,409,String(e.message||e).slice(0,160));}
  }
  if(req.method==="POST"&&u.pathname==="/api/veo/generate"){
    let data;try{data=await readJSON(req,10000);}catch{return error(res,400,"invalid_generation_payload");}
    if(!db.content[data?.id])return error(res,404,"draft_not_registered_on_server");
    const item=db.content[data.id];
    if(["uploading","scheduled","published","private_uploaded","needs_review","approved"].includes(item.status)||item.filePath)
      return error(res,409,"content_locked_for_generation");
    // Prevent a client from generating for a different title than the saved server draft.
    if(data.title!==item.title)return error(res,409,"draft_title_mismatch");
    if(!data.prompt||typeof data.prompt!=="string")return error(res,422,"storyboard_prompt_required");
    try{
      const job=await veoWorker.start({...data,description:item.description});
      return respond(res,202,{job,summary:veoWorker.overview()});
    }catch(e){return error(res,409,String(e.message||e).slice(0,160));}
  }
  const vm=u.pathname.match(/^\/api\/veo\/([A-Za-z0-9_-]{3,80})\/(video|accept|reject)$/);
  if(vm){
    const id=vm[1],action=vm[2],job=veoWorker.job(id);
    if(!job)return error(res,404,"veo_job_not_found");
    if(req.method==="GET"&&action==="video"){
      if(!["needs_owner_review","qa_failed","approved","rejected"].includes(job.status)||!job.filename)
        return error(res,409,"video_not_ready");
      try{
        const st=await fs.stat(job.filename);
        res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":String(st.size),
          "Cache-Control":"private,no-store","X-Content-Type-Options":"nosniff",
          "Content-Disposition":"inline; filename=review.mp4"});
        return createReadStream(job.filename).pipe(res);
      }catch{return error(res,404,"video_file_missing");}
    }
    if(req.method==="POST"&&action==="reject"){
      let input={};try{input=await readJSON(req,2000);}catch{}
      try{return respond(res,200,{job:await veoWorker.reject(id,input.reason)});}
      catch(e){return error(res,409,String(e.message||e));}
    }
    if(req.method==="POST"&&action==="accept"){
      const item=db.content[id];
      if(!item||!["draft","draft_with_video"].includes(item.status))
        return error(res,409,"draft_locked_or_missing");
      // Copy and verify first. Never mark a video accepted when its MP4 could not
      // be copied to the persistent publishing vault.
      const candidate=veoWorker.job(id);
      if(!candidate||candidate.status!=="needs_owner_review"||!candidate.qa?.technicalPass||
         !candidate.qa?.semanticPass||!candidate.filename||!candidate.hash)
        return error(res,409,"generation_failed_quality_gate");
      const final=path.join(MEDIA_DIR,id+"-veo-"+Date.now()+".mp4");
      try{
        await fs.copyFile(candidate.filename,final);
        const verifiedHash=await fileSha256(final);
        if(verifiedHash!==candidate.hash)throw Error("generated_video_hash_mismatch");
        const result=await veoWorker.accept(id);
        const previous=item.filePath;
        item.filePath=final;item.mediaHash=verifiedHash;item.mediaSize=(await fs.stat(final)).size;
        item.mediaName="BIMA Veo "+result.job.revision+".mp4";
        item.status="draft_with_video";item.approvedMediaHash=null;item.approvedAt=null;
        item.containsSyntheticMedia=true;
        item.updatedAt=new Date().toISOString();
        logEvent("veo_video_imported_for_owner_approval",id,{revision:result.job.revision});
        await persist();
        if(previous&&previous!==final)await fs.unlink(previous).catch(()=>{});
        return respond(res,200,{job:result.job,item:publicEntry(item)});
      }catch(e){await fs.unlink(final).catch(()=>{});return error(res,500,"veo_media_import_failed");}
    }
    return error(res,405,"method_not_allowed");
  }
  if(req.method==="GET"&&u.pathname==="/api/status"){
    return respond(res,200,{authenticated:true,email:OWNER,channel:activeOauth()?{
      id:db.oauth.channelId,name:db.oauth.channelName,verified:db.oauth.channelId===EXPECTED_CHANNEL_ID}:null,
      uploadsEnabled:ENABLE_UPLOADS,publicSchedulingEnabled:ENABLE_PUBLIC_SCHEDULING,
    thumbnailUploadsEnabled:ENABLE_THUMBNAIL_UPLOADS,
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
  const m=u.pathname.match(/^\/api\/content\/([A-Za-z0-9_-]{3,80})(\/(media|thumbnail|approve|submit|verify))?$/);
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
      if(item.thumbnailPath)await fs.unlink(item.thumbnailPath).catch(()=>{});
      item.thumbnailPath=null;item.thumbnailForMediaHash=null;item.thumbnailHash=null;
      item.thumbnailSize=null;item.thumbnailStatus="awaiting_mp4_frame";item.thumbnailError=null;
      item.filePath=final;item.mediaSize=count;item.status="draft_with_video";
      item.mediaHash=await fileSha256(final);item.updatedAt=new Date().toISOString();
      logEvent("media_stored",id,{size:count});await persist();
      return respond(res,201,{item:publicEntry(item)});
    }catch(e){await fs.unlink(temp).catch(()=>{});return error(res,400,String(e.message||e).slice(0,100));}
  }
  if(req.method==="POST"&&action==="thumbnail"){
    if(item.status!=="draft_with_video"&&item.status!=="approved")return error(res,409,"thumbnail_locked");
    if(!item.filePath||!item.mediaHash||!existsSync(item.filePath))return error(res,409,"video_required");
    if(String(item.publishAt||"").slice(0,10)<THUMBNAIL_START)return error(res,422,"thumbnail_starts_19_oct");
    if(req.headers["content-type"]!=="image/png")return error(res,415,"png_only");
    const len=Number(req.headers["content-length"]||0);
    if(!Number.isSafeInteger(len)||len<100||len>THUMBNAIL_MAX_UPLOAD)return error(res,413,"thumbnail_size_unsupported");
    const temp=path.join(MEDIA_DIR,id+"."+Date.now()+".thumb.part");
    let count=0;
    try{
      await pipeline(req,async function*(source){
        for await(const chunk of source){
          count+=chunk.length;if(count>THUMBNAIL_MAX_UPLOAD)throw Error("thumbnail_too_large");yield chunk;
        }
      },createWriteStream(temp,{flags:"wx",mode:0o600}));
      if(count!==len)throw Error("incomplete_thumbnail");
      const fh=await fs.open(temp,"r"),head=Buffer.alloc(24);
      try{await fh.read(head,0,24,0);}finally{await fh.close();}
      if(head.toString("hex",0,8)!=="89504e470d0a1a0a"||head.toString("ascii",12,16)!=="IHDR")
        throw Error("invalid_png");
      if(head.readUInt32BE(16)!==1080||head.readUInt32BE(20)!==1920)
        throw Error("thumbnail_9x16_1080x1920_required");
      const final=path.join(MEDIA_DIR,id+"-"+Date.now()+".png");
      await fs.rename(temp,final);
      const prior=item.thumbnailPath;
      item.thumbnailPath=final;item.thumbnailForMediaHash=item.mediaHash;
      item.thumbnailHash=await fileSha256(final);item.thumbnailSize=count;
      item.thumbnailStatus="stored_on_railway";item.thumbnailError=null;
      if(prior&&prior!==final)await fs.unlink(prior).catch(()=>{});
      logEvent("thumbnail_stored",id,{size:count});await persist();
      return respond(res,201,{item:publicEntry(item)});
    }catch(e){await fs.unlink(temp).catch(()=>{});return error(res,422,String(e?.message||e).slice(0,90));}
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
veoWorker=createVeoWorker({db,persist,logEvent,mediaDir:MEDIA_DIR});
piapiWorker=createPiapiWorker({db,persist,mediaDir:MEDIA_DIR});
venusProduction=createVenusProduction({db,persist,mediaDir:MEDIA_DIR});
// One-off BIMA-owned Moon review video job. Explicitly limited to one 15s PiAPI task,
 // never retried after an ambiguous submission or failed generation, never uploaded.
 const MOON_REVIEW_ID="yt26-20261013-moon-single";
 const MOON_REVIEW_PROMPT="ONE complete 15-second 9:16 720p premium animated science short with coherent beginning, explanation, and resolved ending. SUBJECT: lunar phases, WHY THE MOON CHANGES APPARENT SHAPE. Consistent scientifically accurate grey cratered Moon and blue Earth, fixed incoming sunlight from the Sun. 0-4 seconds: a cinematic Moon in Earth's night sky gradually appears crescent, first quarter, then full with a compelling visual question. 4-11 seconds: elegant overhead animation of the Moon orbiting Earth with sunlight illuminating half the lunar sphere; demonstrate the different sunlit fractions visible from Earth, explicitly NOT the Earth's shadow or eclipse, no Venus. 11-15 seconds: smoothly return to the observer looking at a crescent then full Moon, finish on complete gorgeous held final frame. Educational but visually captivating with clear motion, no written words, no subtitles, no humans. ONE finished video, NO separate clips, ambient sound only.";
 const moonVoice=createMoonVoice({db,persist,mediaDir:MEDIA_DIR});
 let moonWatchBusy=false;
 async function moonAutoReview(){
   if(moonWatchBusy||process.env.PIAPI_AUTO_MOON_APPROVED!=="true")return;
   moonWatchBusy=true;
   try{
     if(!db.piapiJobs?.[MOON_REVIEW_ID]){
       await piapiWorker.startSingle({id:MOON_REVIEW_ID,title:"Why Does the Moon Change Shape?",prompt:MOON_REVIEW_PROMPT,duration:15,confirmCost:true,maxChargeUsd:1.44});
       console.log("bima_moon_single_video_job_submitted");
     }else{
       const job=db.piapiJobs[MOON_REVIEW_ID];
       if(job.taskId&&!["review_required","rejected","failed"].includes(job.status))
         await piapiWorker.refresh();
       if(db.piapiJobs[MOON_REVIEW_ID]?.status==="review_required")await moonVoice.process();
     }
   }catch(e){console.warn("bima_moon_auto_review",String(e.message||e).slice(0,150));}
   finally{moonWatchBusy=false;}
 }
 // Trigger once shortly after boot, then poll existing jobs without ever resubmitting.
 setTimeout(()=>{void moonAutoReview();},3000).unref();
 setInterval(()=>{void moonAutoReview();},60000).unref();
// One approved Moon publication, without owner re-uploading media.
 // Once handed to YouTube, ambiguous results are NEVER retried automatically.
 const MOON_PUBLISH_ID="yt26-20261013-moon-final-with-voice";
 const MOON_PUBLISH_AT="2026-10-13T12:30:00.000Z"; // 19:30 WIB
 let moonPublishBusy=false;
 async function finalizeApprovedMoon(){
   if(moonPublishBusy||process.env.BIMA_MOON_PUBLISH_APPROVED!=="true")return;
   if(!moonVoice.state().ready||!db.moonVoice?.file)return;
   if(!ENABLE_UPLOADS||!ENABLE_PUBLIC_SCHEDULING||!activeOauth()||!EXPECTED_CHANNEL_ID){
     console.warn("moon_publish_waiting_for_youtube_settings");return;
   }
   if(Date.now()>=Date.parse(MOON_PUBLISH_AT)-15*60000){
     console.warn("moon_publish_target_too_close_no_late_automatic_publish");return;
   }
   if(Object.values(db.content).some(x=>x.youtubeId&&(x.id===MOON_PUBLISH_ID||x.title==="Why Does the Moon Change Shape?"))){
     console.log("moon_publish_existing_youtube_video_skip");return;
   }
   const existing=db.content[MOON_PUBLISH_ID];
   if(existing&&existing.status!=="approved")return;
   if(existing?.attemptedAt||existing?.youtubeResumableSession)return;
   moonPublishBusy=true;
   try{
     const f=db.moonVoice.file;
     if(path.dirname(f)!==MEDIA_DIR||path.basename(f)!=="moon-voice-review.mp4")throw Error("wrong_source_media");
     const mediaHash=await fileSha256(f);
     if(existing&&existing.mediaHash!==mediaHash)throw Error("approved_media_changed");
     if(!db.content[MOON_PUBLISH_ID]){
       db.content[MOON_PUBLISH_ID]={
         id:MOON_PUBLISH_ID,title:"Why Does the Moon Change Shape?",
         description:"Why does the Moon appear to change shape? As it orbits Earth, we see changing portions of its sunlit half. These are the lunar phases. #OrbitAndOcean #MoonPhases #SpaceScience #Shorts",
         filePath:f,mediaHash,approvedMediaHash:mediaHash,
         status:"approved",approvedAt:new Date().toISOString(),publishAt:MOON_PUBLISH_AT,
         madeForKids:false,containsSyntheticMedia:true,platform:"youtube"
       };
       logEvent("moon_owner_approval_recorded",MOON_PUBLISH_ID,{publishAt:MOON_PUBLISH_AT});
       await persist();
     }
     console.log("moon_approved_youtube_schedule_submitting");
     await uploadToYoutube(db.content[MOON_PUBLISH_ID]);
     console.log("moon_youtube_schedule_result",JSON.stringify({
       status:db.content[MOON_PUBLISH_ID].status,
       videoId:db.content[MOON_PUBLISH_ID].youtubeId||null,
       error:db.content[MOON_PUBLISH_ID].lastError||null
     }));
   }catch(e){console.warn("moon_publish_blocked",String(e.message||e).slice(0,170));}
   finally{moonPublishBusy=false;}
 }
 setTimeout(()=>{void finalizeApprovedMoon();},5000).unref();
 setInterval(()=>{void finalizeApprovedMoon();},60000).unref();
// Next Orbit & Ocean episode: one 15s PiAPI video plus English narration.
// Separate review state; never publish or retry a paid job automatically.
const BUTTERFLY_ID="yt26-20261014-butterfly-single";
const butterflyVoice=createButterflyVoice({db,persist,mediaDir:MEDIA_DIR});
const butterflyPrompt="ONE finished 15-second vertical 9:16 high-quality animated science video. Topic: Butterflies Taste With Their Feet. Premium polished 3D animation, colorful friendly stylized butterfly, vibrant sunlit flower meadow, believable butterfly anatomy, no humans, no text, no voice. 0-4s intriguing cinematic close-up: vivid butterfly lands on a large green leaf with its tiny feet. 4-11s educational camera close-up on the SAME butterfly and leaf; tasteful glowing dots at its feet illustrate external contact taste receptors; subtle particles represent recognizing plant chemicals, no x-ray or exposed anatomy. 11-15s butterfly chooses the appropriate healthy host plant leaf, calmly places a tiny cluster of eggs and lifts off; hold complete beautiful final frame. Explain with visual storytelling that butterflies sense plants through their feet and this helps some species choose egg-laying plants. One coherent video with finished ending, no unrelated objects, no ocean planets or Venus.";
let butterflyBusy=false;
async function butterflyReviewCycle(){
 if(butterflyBusy||process.env.PIAPI_AUTO_BUTTERFLY_APPROVED!=="true")return;
 butterflyBusy=true;
 try{
  const j=db.piapiJobs?.[BUTTERFLY_ID];
  if(!j){
   await piapiWorker.startSingle({id:BUTTERFLY_ID,title:"Butterflies Taste With Their Feet",prompt:butterflyPrompt,duration:15,confirmCost:true,maxChargeUsd:1.44});
   console.log("bima_butterfly_single_video_job_submitted");
  }else{
   if(j.taskId&&!["review_required","rejected","failed"].includes(j.status))await piapiWorker.refresh();
   if(db.piapiJobs[BUTTERFLY_ID]?.status==="review_required")await butterflyVoice.process();
  }
 }catch(e){console.warn("bima_butterfly_review",String(e.message||e).slice(0,160));}
 finally{butterflyBusy=false;}
}
setTimeout(()=>void butterflyReviewCycle(),4000).unref();
setInterval(()=>void butterflyReviewCycle(),60000).unref();
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
