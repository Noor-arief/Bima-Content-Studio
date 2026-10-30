/* BIMA TikTok Login Kit — isolated owner connection panel, no TikTok Shop claims. */
(() => {
'use strict';
const api='https://content-studio-api-production-3fe2.up.railway.app';
const tokenKey='bima_content_server_session';
const root=document.getElementById('tiktokWorkspace');
if(!root||document.getElementById('bima-tiktok-connection'))return;
const card=document.createElement('section');
card.id='bima-tiktok-connection';
card.className='aff-card';
card.setAttribute('data-secs','publishing');
card.innerHTML='<h3>TikTok Account Connection</h3><p id="tt-connect-state" role="status" aria-live="polite">Memeriksa koneksi Sandbox…</p><div class="aff-actions"><button type="button" id="tt-connect-action" class="aff-primary">Connect TikTok (Sandbox)</button><button type="button" id="tt-connect-check">Refresh status</button><button type="button" id="tt-owner-login">Sign in as BIMA owner</button></div><p class="aff-muted">Login Kit hanya membaca identitas yang disetujui. TikTok Shop Affiliate dan auto-posting belum terhubung.</p>';
const notice=root.querySelector('.aff-notice');notice?.insertAdjacentElement('afterend',card);
const badge=root.querySelector('.aff-head .aff-badge');
const label=card.querySelector('#tt-connect-state'),connect=card.querySelector('#tt-connect-action'),check=card.querySelector('#tt-connect-check'),ownerLogin=card.querySelector('#tt-owner-login');
const request=async(path,method='GET')=>{
 const token=sessionStorage.getItem(tokenKey);
 if(!token)throw Error('Sesi owner belum aktif. Login sebagai owner di panel BIMA YouTube Automation, lalu kembali ke TikTok.');
 const response=await fetch(api+path,{method,headers:{Authorization:'Bearer '+token}});
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(body.error||'HTTP '+response.status);
 return body;
};
async function status(){
 check.disabled=true;
 label.textContent='Memeriksa status koneksi TikTok…';
 try{
  const response=await fetch(api+'/public/tiktok/sandbox/status',{cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||'Status backend tidak tersedia');
  const hasOwner=Boolean(sessionStorage.getItem(tokenKey));
  label.textContent=data.connected?'Sandbox Connected · Login Kit aktif (TikTok Shop belum terhubung)':data.configured?'Sandbox siap · login owner diperlukan untuk menghubungkan akun':'Kredensial Sandbox belum lengkap di Railway.';
  if(badge)badge.textContent=data.connected?'Login Kit · Sandbox Connected':data.configured?'Login Kit · Belum terhubung':'Login Kit · Belum dikonfigurasi';
  connect.disabled=Boolean(data.connected)||!data.configured||!hasOwner;
  ownerLogin.hidden=hasOwner;
 }catch(e){
  label.textContent='Gagal memeriksa backend: '+e.message;
  if(badge)badge.textContent='Login Kit · Status tidak tersedia';
  connect.disabled=true;
 }finally{check.disabled=false;}
}
connect.addEventListener('click',async()=>{
 connect.disabled=true;
 try{
  label.textContent='Menyiapkan login TikTok…';
  const r=await request('/auth/tiktok/sandbox/start','POST');
  if(!r.authorizationUrl||!r.authorizationUrl.startsWith('https://www.tiktok.com/'))throw Error('URL otorisasi TikTok tidak valid');
  location.assign(r.authorizationUrl);
 }catch(e){label.textContent=e.message;connect.disabled=false;}
});
check.addEventListener('click',status);
ownerLogin.addEventListener('click',()=>{location.assign(api+'/auth/google/start?frontend='+encodeURIComponent(location.origin));});
status();
document.addEventListener('bima:owner-session',()=>status());
})();