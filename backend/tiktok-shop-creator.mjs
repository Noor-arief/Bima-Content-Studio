import {randomBytes, timingSafeEqual, createHmac} from "node:crypto";

const AUTH_URL="https://shop.tiktok.com/alliance/creator/auth";
const TOKEN_URL="https://auth.tiktok-shops.com/api/v2/token";
const API_ROOT="https://open-api.tiktokglobalshop.com";
export const SHOWCASE_PATH="/affiliate_creator/202405/showcases/products";
export const REQUIRED_CREATOR_SCOPE="creator.showcase.read";

export function beginCreatorAuthorization(appKey, now=Date.now()){
  if(!appKey || typeof appKey!=="string") throw Error("shop_app_key_required");
  const state=randomBytes(32).toString("base64url");
  const url=new URL(AUTH_URL);
  url.searchParams.set("app_key",appKey);
  url.searchParams.set("state",state);
  return {url:url.toString(),state,expiresAt:now+10*60*1000};
}
export function validateCreatorCallback(query,pending,now=Date.now()){
  if(!pending||!query||!pending.state||now>=pending.expiresAt)throw Error("creator_state_expired_or_missing");
  if(typeof query.state!=="string")throw Error("creator_state_invalid");
  const a=Buffer.from(query.state),b=Buffer.from(pending.state);
  if(a.length!==b.length||!timingSafeEqual(a,b))throw Error("creator_state_invalid");
  if(query.error)throw Error("creator_authorization_denied");
  if(typeof query.code!=="string"||!query.code)throw Error("creator_code_missing");
  return query.code;
}
export function validateCreatorToken(response){
  if(response?.code!==0||!response.data||Number(response.data.user_type)!==1)throw Error("creator_token_exchange_invalid");
  const d=response.data;
  const scopes=Array.isArray(d.granted_scopes)?d.granted_scopes:typeof d.granted_scopes==="string"?d.granted_scopes.split(/[\s,]+/):[];
  if(!scopes.includes(REQUIRED_CREATOR_SCOPE))throw Error("creator_showcase_scope_not_granted");
  if(typeof d.access_token!=="string"||!d.access_token||typeof d.refresh_token!=="string"||!d.refresh_token)throw Error("creator_token_missing");
  return {accessToken:d.access_token,refreshToken:d.refresh_token,openId:d.open_id||null,userType:1,scopes};
}
export async function exchangeCreatorCode({appKey,appSecret,authCode,fetchImpl=fetch}){
  if(!appKey||!appSecret||!authCode)throw Error("creator_exchange_args_missing");
  const u=new URL(TOKEN_URL+"/get");for(const [k,v] of Object.entries({app_key:appKey,app_secret:appSecret,auth_code:authCode,grant_type:"authorized_code"}))u.searchParams.set(k,v);
  const r=await fetchImpl(u,{method:"GET",signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error("creator_exchange_http_error");
  return validateCreatorToken(await r.json());
}
export async function refreshCreatorToken({appKey,appSecret,refreshToken,fetchImpl=fetch}){
  if(!appKey||!appSecret||!refreshToken)throw Error("creator_refresh_args_missing");
  const u=new URL(TOKEN_URL+"/refresh");for(const [k,v] of Object.entries({app_key:appKey,app_secret:appSecret,refresh_token:refreshToken,grant_type:"refresh_token"}))u.searchParams.set(k,v);
  const r=await fetchImpl(u,{method:"GET",signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error("creator_refresh_http_error");
  return validateCreatorToken(await r.json());
}
export function signTikTokShopGet(path,query,appSecret){
  if(path!==SHOWCASE_PATH||!appSecret)throw Error("showcase_sign_args_invalid");
  const normalized=Object.entries(query).filter(([k])=>k!=="sign"&&k!=="access_token").sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+String(v)).join("");
  const content=appSecret+path+normalized+appSecret;
  return createHmac("sha256",appSecret).update(content).digest("hex");
}
export async function getCreatorShowcasePage({appKey,appSecret,creatorAccessToken,pageToken=null,pageSize=20,fetchImpl=fetch,now=Date.now()}){
  if(!appKey||!appSecret||!creatorAccessToken)throw Error("creator_showcase_credentials_required");
  if(!Number.isInteger(pageSize)||pageSize<1||pageSize>20)throw Error("creator_showcase_page_size_invalid");
  const query={app_key:appKey,timestamp:String(Math.floor(now/1000)),page_size:String(pageSize),origin:"SHOWCASE"};
  if(pageToken)query.page_token=pageToken;
  const u=new URL(API_ROOT+SHOWCASE_PATH);
  query.sign=signTikTokShopGet(SHOWCASE_PATH,query,appSecret);
  for(const [k,v] of Object.entries(query))u.searchParams.set(k,v);
  const r=await fetchImpl(u,{headers:{"content-type":"application/json","x-tts-access-token":creatorAccessToken},signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error("creator_showcase_http_error");
  const j=await r.json();
  if(j?.code!==0||!Array.isArray(j?.data?.products))throw Error("creator_showcase_api_error");
  return {products:j.data.products.map(p=>({id:String(p.id||""),name:String(p.name||p.title||""),origin:"tiktok_shop_creator_live",gmv:null,gmvVerified:false})),nextPageToken:j.data.next_page_token||null};
}
