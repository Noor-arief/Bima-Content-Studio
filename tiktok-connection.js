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
card.setAttribute('data-secs','ringkasan');
card.innerHTML='<h3>TikTok Account Connection</h3><p id="tt-connect-state" role="status" aria-live="polite">Memeriksa koneksi Sandbox…</p><div class="aff-actions"><button type="button" id="tt-connect-action" class="aff-primary">Connect TikTok (Sandbox)</button><button type="button" id="tt-connect-check">Refresh status</button><button type="button" id="tt-owner-login">Sign in as BIMA owner</button></div><p class="aff-muted">Login Kit hanya membaca identitas yang disetujui. TikTok Shop Affiliate dan auto-posting belum terhubung.</p>';
const notice=root.querySelector('.aff-notice');notice?.insertAdjacentElement('afterend',card);
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
  const s=await request('/auth/tiktok/sandbox/status');
  label.textContent=s.connected?'Sandbox Connected: '+(s.displayName||'TikTok account'):s.configured?'Sandbox siap. Klik Connect TikTok untuk otorisasi.':'Kredensial Sandbox belum lengkap di Railway.';
  connect.disabled=!s.configured||s.connected;
 }catch(e){label.textContent=e.message;connect.disabled=true;}
 finally{check.disabled=false;ownerLogin.hidden=Boolean(sessionStorage.getItem(tokenKey));}
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
ownerLogin.addEventListener('click',()=>{location.assign(api+'/auth/google/start');});
status();
document.addEventListener('bima:owner-session',()=>status());
})();