(()=>{'use strict';
const core=window.BimaBackupCore;if(!core)return;
const DEFAULT='https://content-studio-api-production-3fe2.up.railway.app',DEVICE='bima_cloud_backup_device_v1',REVISION='bima_cloud_backup_revision_v1';
let running=false,lastSignature='',lastFull=0,lastStatus=null,nextAttempt=0;
const token=()=>sessionStorage.getItem('bima_content_server_session')||'';
function base(){const value=(localStorage.getItem('bima_content_server_url')||DEFAULT).replace(/\/$/,'');if(value!==DEFAULT)throw Error('backup_backend_not_allowed');return value}
function notify(state,detail={}){lastStatus={state,...detail};window.dispatchEvent(new CustomEvent('bima:cloud-backup:status',{detail:lastStatus}));const el=document.getElementById('cloudBackupStatus');if(el)el.textContent=JSON.stringify(lastStatus,null,2)}
async function call(route,{method='GET',body}={}){
 if(!token())throw Error('owner_login_required');const headers={Authorization:'Bearer '+token()};if(body&&!(body instanceof Blob))headers['Content-Type']='application/json';
 const response=await fetch(base()+'/api/backups/'+route,{method,headers,body:body instanceof Blob?body:body?JSON.stringify(body):undefined,cache:'no-store'});if(!response.ok){let value;try{value=await response.json()}catch{}throw Object.assign(Error(value?.error||'backup_http_'+response.status),{status:response.status,offset:value?.offset})}return response.json();
}
function device(){let id=localStorage.getItem(DEVICE);if(!id){id=crypto.randomUUID();localStorage.setItem(DEVICE,id)}return id}
function signature(){return ['bima-content-studio-v3','bima-tiktok-market-intel-v1','bima_affiliate_campaigns_v1','bima-shopee-studio-cache-v1','bima-tiktok-affiliate-v1','bima-shopee-affiliate-v1'].map(k=>localStorage.getItem(k)||'').join('\n')}
async function backup({manual=false}={}){
 if(running)return;if(!token()){notify('owner_login_required');return}running=true;
 try{
  notify('checking');const current=await call('status'),id=device();
  if(current.revision&&!manual&&(current.deviceId!==id||current.revision!==localStorage.getItem(REVISION))){notify('restore_or_manual_backup_required',{savedAt:current.savedAt});return}
  const pack=await core.snapshot();if(!pack.blobs.length)throw Error('no_local_media_backup_not_started');
  if(!pack.manifest.local['bima-content-studio-v3']||!pack.manifest.local['bima-tiktok-market-intel-v1'])throw Error('complete_local_content_required');
  const plan=await call('plan',{method:'POST',body:{manifest:pack.manifest}}),missing=new Set(plan.missing);let complete=0;const missingTotal=missing.size;
  for(let i=0;i<pack.blobs.length;i++){
   const m=pack.manifest.media[i],blob=pack.blobs[i];if(!missing.has(m.sha256))continue;notify('uploading',{file:++complete,files:missingTotal,bytes:blob.size});
   let offset=0,retries=0;do{const end=Math.min(blob.size,offset+8*1024*1024);try{const result=await call('blobs/'+m.sha256+'?offset='+offset+'&total='+blob.size,{method:'PUT',body:blob.slice(offset,end)});offset=result.offset;retries=0;if(result.complete)break}catch(e){if(e.message==='backup_offset_mismatch'&&Number.isSafeInteger(e.offset)&&e.offset>=0&&e.offset<=blob.size&&retries++<3){offset=e.offset;continue}throw e}}while(offset<blob.size);
   missing.delete(m.sha256);
  }
  const saved=await call('commit',{method:'POST',body:{manifest:pack.manifest,baseRevision:plan.revision,deviceId:id}});
  localStorage.setItem(REVISION,saved.revision);nextAttempt=Date.now()+30000;lastSignature=signature();lastFull=Date.now();const verified=await call('status');if(verified.revision!==saved.revision)throw Error('backup_verification_conflict');notify('verified_on_railway',{savedAt:saved.savedAt,revision:saved.revision,counts:pack.manifest.counts,mediaFiles:pack.blobs.length,unchanged:saved.unchanged||false});
 }catch(e){nextAttempt=Date.now()+5*60*1000;notify('failed',{error:e.message});console.warn('BIMA Railway backup:',e.message)}finally{running=false}
}
async function restoreLatest(){
 if(running)return;running=true;try{
  notify('downloading_backup');const value=await call('latest'),blobs=[];
  for(const m of value.manifest.media){const response=await fetch(base()+'/api/backups/blobs/'+m.sha256,{headers:{Authorization:'Bearer '+token()},cache:'no-store'});if(!response.ok)throw Error('backup_media_download_failed');const blob=await response.blob();if(blob.size!==m.size||await core.sha(blob)!==m.sha256)throw Error('backup_media_checksum_failed');blobs.push(blob)}
  // Verify archive schema and checksums using the same tested import path.
  const pack=await core.readArchive(core.archive({manifest:value.manifest,blobs}));
  const before=await core.snapshot();const url=URL.createObjectURL(core.archive(before)),a=document.createElement('a');a.href=url;a.download='bima-sebelum-restore-railway-'+Date.now()+'.bimabackup';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  await core.restore(pack);localStorage.setItem(DEVICE,value.deviceId);localStorage.setItem(REVISION,value.revision);lastSignature=signature();lastFull=Date.now();notify('restored_and_verified',{savedAt:value.savedAt,counts:value.manifest.counts,mediaFiles:blobs.length});
 }catch(e){notify('failed',{error:e.message})}finally{running=false}
}
window.addEventListener('bima:backup:progress',event=>{const el=document.getElementById('cloudBackupStatus');if(running&&el)el.textContent=event.detail.message});
window.BimaCloudBackup={backup,restoreLatest,status:()=>lastStatus,refresh:async()=>{try{const value=await call('status');notify(value.revision?'backup_available':'no_server_backup',value)}catch(e){notify('failed',{error:e.message})}}};
document.getElementById('cloudBackupNow')?.addEventListener('click',()=>backup({manual:true}));
document.getElementById('cloudBackupRestore')?.addEventListener('click',restoreLatest);
document.getElementById('cloudBackupRefresh')?.addEventListener('click',()=>window.BimaCloudBackup.refresh());
document.getElementById('cloudBackupLogin')?.addEventListener('click',()=>{location.href=base()+'/auth/google/start?frontend='+encodeURIComponent(location.origin)});
function tick(){if(!token()||running||document.hidden||Date.now()<nextAttempt)return;const sig=signature();if(sig!==lastSignature||Date.now()-lastFull>5*60*1000)void backup()}
if(document.body.dataset.backupPage==='true')void window.BimaCloudBackup.refresh();else{setTimeout(tick,15000);setInterval(tick,30000)}
})();
