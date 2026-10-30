/* Owner-only Creator Showcase read. No generation, publishing, or inferred approval. */
(()=>{
'use strict';
const root=document.getElementById('tiktokWorkspace'),host=document.getElementById('tt-google-review');
if(!root||!host)return;
const base='https://content-studio-api-production-3fe2.up.railway.app';
const panel=document.createElement('section');panel.id='tt-showcase';panel.className='tt-research';
panel.innerHTML=`<h4>Produk Showcase TikTok</h4><p data-creator-state role="status" aria-live="polite">Memeriksa koneksi…</p><div class="tt-actions"><button type="button" data-creator-login>Masuk sebagai owner</button><button type="button" data-creator-connect disabled>Hubungkan Creator</button><button type="button" data-creator-sync disabled>Sinkronkan Showcase</button><button type="button" data-creator-refresh class="tt-secondary">Perbarui status</button></div><p data-showcase-evidence></p><ul data-showcase-products style="overflow-wrap:anywhere"></ul><small>Sinkronisasi hanya membaca produk. Penjualan, GMV, kelayakan affiliate, produksi video dan publikasi perlu verifikasi terpisah.</small><details><summary>Catatan review · 16 Oktober 2026</summary><p>Pengajuan ditolak karena screenshot dan video belum menunjukkan sinkronisasi produk TikTok Shop. Akses pengujian Creator resmi diperlukan untuk menghasilkan bukti baru. Catatan ini adalah hasil review tanggal tersebut, bukan status persetujuan real-time.</p></details>`;
host.querySelector('.tt-readiness').insertAdjacentElement('afterend',panel);
const q=s=>panel.querySelector(s),label=q('[data-creator-state]'),products=q('[data-showcase-products]'),evidence=q('[data-showcase-evidence]');
let busy=false,ready=false,connected=false;
const token=()=>sessionStorage.getItem('bima_content_server_session');
const messages={owner_login_required:'Masuk sebagai owner untuk menghubungkan Creator.',tiktok_shop_creator_not_enabled:'Koneksi Creator belum diaktifkan. Menunggu akses resmi dan konfigurasi server.',creator_showcase_scope_not_granted:'Izin membaca Showcase belum diberikan. Otorisasi Creator diperlukan.',tiktok_shop_showcase_unavailable:'TikTok belum berhasil mengembalikan produk. Periksa akses resmi atau hubungkan ulang Creator.'};
function buttons(){q('[data-creator-login]').hidden=Boolean(token());q('[data-creator-connect]').disabled=busy||!ready||!token();q('[data-creator-sync]').disabled=busy||!ready||!connected||!token();q('[data-creator-refresh]').disabled=busy;}
function view(){panel.hidden=!['desk','publishing'].includes(root.dataset.sec);}
async function request(path,method='GET'){
 if(!token())throw Error('owner_login_required');
 const r=await fetch(base+path,{method,cache:'no-store',headers:{Authorization:'Bearer '+token()},signal:AbortSignal.timeout(20000)});
 const data=await r.json();if(!r.ok)throw Error(data.error||'unavailable');return data;
}
function failure(e){label.textContent=messages[e.message]||'Koneksi belum dapat diperiksa. Coba perbarui status.';}
async function status(){
 if(busy)return;busy=true;ready=false;connected=false;buttons();
 try{
  if(!token()){products.replaceChildren();evidence.textContent='';throw Error('owner_login_required');}
  const d=await request('/auth/tiktok-shop/creator/status');ready=d.configured===true;connected=d.connected===true&&Array.isArray(d.grantedScopes)&&d.grantedScopes.includes('creator.showcase.read');
  label.textContent=!ready?messages.tiktok_shop_creator_not_enabled:connected?'Creator terotorisasi. Sinkronkan untuk memeriksa produk terbaru.':'Server siap. Hubungkan akun Creator yang diizinkan TikTok.';
 }catch(e){failure(e);}finally{busy=false;buttons();}
}
q('[data-creator-login]').onclick=()=>location.assign(base+'/auth/google/start?frontend='+encodeURIComponent(location.origin));
q('[data-creator-refresh]').onclick=status;
q('[data-creator-connect]').onclick=async()=>{
 if(busy)return;busy=true;buttons();
 // Keep the owner session in this tab. The callback currently returns JSON in the new tab.
 const tab=window.open('about:blank','_blank');if(tab)tab.opener=null;
 try{
  if(!tab)throw Error('popup_blocked');
  const d=await request('/auth/tiktok-shop/creator/start','POST');const url=new URL(d.authorizationUrl);
  if(url.origin!=='https://shop.tiktok.com'||url.pathname!=='/alliance/creator/auth')throw Error('invalid_authorization_url');
  tab.location.replace(url.href);label.textContent='Selesaikan izin di tab TikTok, lalu kembali dan klik Perbarui status.';
 }catch(e){tab?.close();if(e.message==='popup_blocked')label.textContent='Izinkan tab baru untuk membuka otorisasi TikTok.';else failure(e);}finally{busy=false;buttons();}
};
q('[data-creator-sync]').onclick=async()=>{
 if(busy)return;busy=true;buttons();products.replaceChildren();evidence.textContent='';label.textContent='Membaca Showcase dari TikTok…';
 try{
  const d=await request('/auth/tiktok-shop/creator/showcase');
  if(d.source!=='tiktok_shop_creator_live'||!Array.isArray(d.products)||d.products.some(p=>!p.id||!p.name||p.origin!=='tiktok_shop_creator_live'))throw Error('invalid_showcase_response');
  for(const p of d.products){const li=document.createElement('li'),name=document.createElement('strong'),id=document.createElement('p');name.textContent=p.name;id.textContent='Product ID: '+p.id;li.append(name,id);products.append(li);}
  label.textContent=d.products.length?`${d.products.length} produk diterima dari API Showcase.`:'Pembacaan API berhasil; Showcase mengembalikan 0 produk.';
  evidence.textContent='Sumber: TikTok Shop Creator API · Diperiksa '+new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB';
 }catch(e){failure(e);}finally{busy=false;buttons();}
};
document.addEventListener('bima:channel-section',view);document.addEventListener('bima:owner-session',status);view();status();
})();
