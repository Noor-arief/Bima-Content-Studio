import {promises as fs,createReadStream} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';

const HASH=/^[a-f0-9]{64}$/;
const DBS={'bima-content-studio-v4-assets':['videos'],'bima-video-matched-thumbnail-v1':['covers'],'bima-tiktok-production-media-v1':['files']};
const keyAllowed=k=>/^(bima-content-studio-|bima-tiktok-|bima-shopee-|bima_affiliate_|bima_content_server_url$|bima_youtube_|bima_piapi_|bima_public_)/.test(k);
const fail=(code,status=400)=>Object.assign(Error(code),{status});
export function validateBackup(m){
 if(m?.format!=='bima-complete-v1'||!['https://noor-arief.github.io','https://mycontentstudio.site'].includes(m.origin)||!Array.isArray(m.media)||!Array.isArray(m.databases)||!m.local||typeof m.local!=='object'||!Object.keys(m.local).length)throw fail('invalid_backup_manifest');
 if(m.media.length>10000||m.databases.length>3)throw fail('backup_too_large',413);
 for(const [k,v]of Object.entries(m.local))if(!keyAllowed(k)||typeof v!=='string')throw fail('invalid_backup_settings');
 for(const [k,v]of Object.entries(m.session||{}))if(!(k==='bimaView'||k.startsWith('bimaTikTok'))||typeof v!=='string')throw fail('credentials_not_allowed');
 for(const b of m.media)if(!HASH.test(b.sha256)||!Number.isSafeInteger(b.size)||b.size<0||b.size>512*1024*1024)throw fail('invalid_backup_media');
 const walk=(n,depth=0)=>{if(!n||depth>30)throw fail('invalid_backup_value');switch(n.t){case 'scalar':if(n.v!==null&&!['string','number','boolean'].includes(typeof n.v))throw fail('invalid_scalar');break;case 'undefined':break;case 'date':if(!Number.isFinite(Date.parse(n.v)))throw fail('invalid_date');break;case 'blob':if(!Number.isInteger(n.i)||!m.media[n.i]||m.media[n.i].size!==n.size)throw fail('invalid_blob_reference');break;case 'array':if(!Array.isArray(n.v))throw fail('invalid_array');for(const x of n.v)walk(x,depth+1);break;case 'object':if(!Array.isArray(n.v))throw fail('invalid_object');for(const pair of n.v){if(!Array.isArray(pair)||typeof pair[0]!=='string')throw fail('invalid_object');walk(pair[1],depth+1)}break;default:throw fail('invalid_backup_value')}};
 const stores=new Set();for(const d of m.databases){if(!DBS[d.name]?.includes(d.store)||d.version!==1||!Array.isArray(d.rows)||d.rows.length>10000||stores.has(d.name+':'+d.store))throw fail('invalid_backup_database');stores.add(d.name+':'+d.store);for(const row of d.rows){walk(row.key);walk(row.value)}}
 return m;
}
async function json(req,max=16*1024*1024){const chunks=[];let size=0;for await(const b of req){size+=b.length;if(size>max)throw fail('payload_too_large',413);chunks.push(b)}return JSON.parse(Buffer.concat(chunks).toString())}
const digest=async file=>{const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex')};
export function createStudioBackups({directory,access,stateFile,reserveBytes=128*1024*1024}){
 const locks=new Set();let committing=false;
 const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))};
 const root=directory&&path.resolve(directory),blobs=root&&path.join(root,'blobs'),versions=root&&path.join(root,'versions');
 const init=async()=>{if(!root)throw fail('persistent_volume_required',503);await fs.mkdir(blobs,{recursive:true,mode:0o700});await fs.mkdir(versions,{recursive:true,mode:0o700})};
 const latest=async()=>{try{return JSON.parse(await fs.readFile(path.join(root,'latest.json'),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}};
 const fileInfo=async file=>{try{return await fs.stat(file)}catch(e){if(e.code==='ENOENT')return null;throw e}};
 const space=async bytes=>{const s=await fs.statfs(root),freeBytes=s.bavail*s.bsize;if(freeBytes<bytes+reserveBytes)throw Object.assign(fail('backup_storage_full',507),{details:{freeBytes,requiredBytes:bytes,reserveBytes}});return {freeBytes,requiredBytes:bytes,reserveBytes}};
 const atomic=async(file,value)=>{const temp=file+'.'+randomUUID()+'.tmp',handle=await fs.open(temp,'wx',0o600);try{await handle.writeFile(JSON.stringify(value));await handle.sync()}finally{await handle.close()}await fs.rename(temp,file)};
 return async function route(req,res,url){
  if(!url.pathname.startsWith('/api/backups/'))return false;
  if(!access(req)){send(res,401,{error:'owner_login_required'});return true}
  try{
   await init();
   if(req.method==='GET'&&url.pathname==='/api/backups/status'){
    const value=await latest(),disk=await fs.statfs(root);send(res,200,{persistent:true,revision:value?.revision||null,deviceId:value?.deviceId||null,savedAt:value?.savedAt||null,counts:value?.manifest.counts||null,mediaFiles:value?.manifest.media.length||0,freeBytes:disk.bavail*disk.bsize,reserveBytes});return true;
   }
   if(req.method==='POST'&&url.pathname==='/api/backups/plan'){
    const {manifest}=await json(req);validateBackup(manifest);const missing=[],seen=new Set();let bytes=0;for(const b of manifest.media){if(seen.has(b.sha256))continue;seen.add(b.sha256);const st=await fileInfo(path.join(blobs,b.sha256));if(!st||st.size!==b.size){const part=await fileInfo(path.join(blobs,b.sha256+'.part'));if(part&&part.size>b.size)throw fail('backup_partial_size_invalid',409);missing.push(b.sha256);bytes+=b.size-(part?.size||0)}}
    const capacity=await space(bytes);const value=await latest();send(res,200,{missing,revision:value?.revision||null,...capacity});return true;
   }
   const match=url.pathname.match(/^\/api\/backups\/blobs\/([a-f0-9]{64})$/);
   if(match){const hash=match[1],file=path.join(blobs,hash);
    if(req.method==='GET'){const st=await fileInfo(file);if(!st)throw fail('backup_blob_not_found',404);res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':st.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});createReadStream(file).on('error',()=>res.destroy()).pipe(res);return true}
    if(req.method==='PUT'){
     if(locks.has(hash))throw fail('backup_upload_busy',409);locks.add(hash);
     try{
      const offset=Number(url.searchParams.get('offset')),total=Number(url.searchParams.get('total'));
      if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(total)||total<0||total>512*1024*1024||offset>total)throw fail('invalid_chunk');
      const existing=await fileInfo(file);if(existing){if(existing.size!==total)throw fail('backup_blob_size_mismatch',409);send(res,200,{complete:true,offset:total});return true}
      const part=file+'.part',st=await fileInfo(part);if((st?.size||0)!==offset){send(res,409,{error:'backup_offset_mismatch',offset:st?.size||0});return true}
      let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024||offset+size>total)throw fail('chunk_too_large',413);chunks.push(chunk)}
      if(!size&&total!==0)throw fail('empty_chunk');await space(size);await fs.appendFile(part,Buffer.concat(chunks),{mode:0o600});
      const next=offset+size;if(next===total){if(await digest(part)!==hash){await fs.unlink(part);throw fail('backup_checksum_mismatch')}await fs.rename(part,file)}
      send(res,200,{complete:next===total,offset:next});return true;
     }finally{locks.delete(hash)}
    }
   }
   if(req.method==='GET'&&url.pathname==='/api/backups/latest'){const value=await latest();if(!value)throw fail('backup_not_found',404);send(res,200,value);return true}
   if(req.method==='POST'&&url.pathname==='/api/backups/commit'){
    if(committing)throw fail('backup_commit_busy',409);committing=true;
    try{const {manifest,baseRevision,deviceId}=await json(req);validateBackup(manifest);if(!/^[a-zA-Z0-9-]{16,80}$/.test(deviceId||''))throw fail('invalid_backup_device');const old=await latest();if((old?.revision||null)!==(baseRevision||null))throw fail('backup_conflict',409);
     for(const b of manifest.media){const st=await fileInfo(path.join(blobs,b.sha256));if(!st||st.size!==b.size)throw fail('backup_media_incomplete',409)}
     const fingerprint=createHash('sha256').update(JSON.stringify({local:manifest.local,databases:manifest.databases,media:manifest.media.map(b=>({sha256:b.sha256,size:b.size}))})).digest('hex');
     if(old?.fingerprint===fingerprint){send(res,200,{revision:old.revision,savedAt:old.savedAt,unchanged:true});return true}
     if(old?.manifest.media.length&&!manifest.media.length)throw fail('empty_backup_rejected',409);
     const value={revision:randomUUID(),savedAt:new Date().toISOString(),deviceId,fingerprint,manifest};await space(Buffer.byteLength(JSON.stringify(value))*2);await atomic(path.join(versions,value.revision+'.json'),value);if(stateFile&&await fileInfo(stateFile)){await fs.copyFile(stateFile,path.join(versions,value.revision+'.server-state.json'));await fs.chmod(path.join(versions,value.revision+'.server-state.json'),0o600)}await atomic(path.join(root,'latest.json'),value);send(res,200,{revision:value.revision,savedAt:value.savedAt,counts:manifest.counts,mediaFiles:manifest.media.length});return true;
    }finally{committing=false}
   }
   throw fail('backup_route_not_found',404);
  }catch(e){if(!res.headersSent)send(res,e.status||500,{error:e.status?e.message:'backup_failed',...(e.details||{})});else res.destroy();return true}
 };
}
