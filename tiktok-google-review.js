/* TikTok owner workspace. Production runs on the server; review stays with owner. */
(()=>{
'use strict';
const root=document.getElementById('tiktokWorkspace');if(!root)return;
root.classList.add('tt-owner-mode');
const card=document.createElement('section');card.dataset.secs='ringkasan desk';card.id='tt-google-review';
card.innerHTML=`
<div class="tt-hero"><div><span class="tt-eyebrow">BIMA CONTENT STUDIO / TIKTOK</span><h3>Ide jadi video.<br><span>Kamu pegang keputusan.</span></h3><p>BIMA mengerjakan produksi. Tonton hasilnya, beri masukan, lalu setujui saat sudah sesuai.</p><div class="tt-pills"><span>Google Veo</span><span>24 detik · 9:16</span><span>Suara Indonesia</span></div></div><div class="tt-role"><span>PERAN KAMU</span><strong>Review &amp;<br>Approval</strong><small>Keputusan akhir tetap di tanganmu.</small></div></div>
<ol class="tt-flow" aria-label="Alur produksi video"><li><span>01</span><strong>Siapkan produk</strong><small>BIMA memakai fakta &amp; aset terverifikasi.</small></li><li><span>02</span><strong>Produksi video</strong><small>Visual, narasi, musik, dan subtitle.</small></li><li><span>03</span><strong>Periksa kualitas</strong><small>BIMA memeriksa gambar dan suara.</small></li><li><span>04</span><strong>Kamu review</strong><small>Tonton → setujui atau minta revisi.</small></li></ol>
<div class="tt-metrics"><div><span>Perlu review</span><strong data-count="review">—</strong></div><div><span>Sedang diproses</span><strong data-count="processing">—</strong></div><div><span>Sudah disetujui</span><strong data-count="approved">—</strong></div></div>
<section class="tt-readiness"><div class="tt-row"><h4>Status produksi</h4><span class="tt-badge" data-health>Memeriksa</span></div><p data-status role="status" aria-live="polite">Menghubungkan ke BIMA…</p><ul data-blockers></ul><div class="tt-actions"><button type="button" data-login hidden>Masuk untuk review</button><button type="button" data-refresh class="tt-secondary">Perbarui status</button></div><details class="tt-budget"><summary>Biaya &amp; kesiapan koneksi</summary><p data-budget></p><p>Persetujuan video belum berarti tayang. Koneksi publikasi dan keranjang produk masih perlu diselesaikan.</p></details></section>
<div class="tt-section-heading"><div><span class="tt-eyebrow">MEJA REVIEW</span><h4>Video untukmu</h4></div><span class="tt-muted">Tersimpan di server</span></div><div data-jobs class="tt-jobs"></div>
<div class="tt-tools"><p>Butuh melihat draft atau pengaturan sebelumnya?</p><button type="button" data-legacy-toggle class="tt-secondary" aria-expanded="false">Buka alat lanjutan</button><small>Alat manual dan uji coba lama tetap tersedia di sini.</small></div>`;
root.querySelector('.aff-head')?.insertAdjacentElement('afterend',card);
if(!card.isConnected)root.append(card);
const css=document.createElement('link');css.rel='stylesheet';css.href='tiktok-google-review.css?v=20261015-owner2';document.head.append(css);
const label=card.querySelector('[data-status]'),list=card.querySelector('[data-jobs]');
const base='https://content-studio-api-production-3fe2.up.railway.app';
const token=()=>sessionStorage.getItem('bima_content_server_session');
const labels={google_api_key_missing:'Koneksi Google belum siap.',google_automation_not_enabled:'Produksi Google belum diaktifkan.',google_budget_not_available:'Anggaran API Google belum tersedia.',verified_product_source_missing:'Sumber produk dan aset terverifikasi belum terhubung.'};
const stages={queued:'Dalam antrean',blocked_budget:'Menunggu anggaran',running:'Membuat scene',assembling:'Menggabungkan video',auditing_final:'Memeriksa kualitas',ready_for_review:'Siap direview',approved:'Disetujui',qa_failed:'Perlu perbaikan',failed:'Produksi tertahan',requires_reconciliation:'Sedang perlu pemeriksaan',revision_requested:'Revisi diminta'};
const safeError=code=>code==='owner_login_required'||code==='authentication_required'?'Sesi berakhir. Silakan masuk kembali.':'Proses belum berhasil. Coba perbarui status; hasil sebelumnya tetap tersimpan.';
let busy=false,signature='',urls=[],interaction=false;
const actions=card.querySelector('[data-legacy-toggle]');actions.onclick=()=>{const open=root.classList.toggle('tt-owner-mode')===false;actions.setAttribute('aria-expanded',String(open));actions.textContent=open?'Tutup alat lanjutan':'Buka alat lanjutan';};
card.querySelector('[data-login]').onclick=()=>location.assign(base+'/auth/google/start');
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
async function request(url,body){
 const r=await fetch(base+url,{cache:'no-store',...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{...(token()?{Authorization:'Bearer '+token()}:{}),'Content-Type':'application/json'}});
 const data=await r.json();if(!r.ok)throw Error(data.error||'status_unavailable');return data;
}
async function refresh(){
 if(busy)return;busy=true;
 try{
 const data=await request(token()?'/api/tiktok/google/status':'/public/tiktok/google/status');
 const jobs=data.jobs||[],blockers=data.blockers||[];
 const waiting=jobs.filter(j=>j.status==='ready_for_review').length;
 label.textContent=waiting?`${waiting} video siap kamu tonton dan review.`:blockers.length?'Produksi belum bisa dimulai. Berikut yang masih perlu disiapkan:':jobs.length?'BIMA memproses antrean di server. Kamu bisa menutup halaman ini.':'BIMA siap menerima produk terverifikasi.';
 const health=card.querySelector('[data-health]');health.textContent=waiting?'Menunggu review':blockers.length?'Belum siap':'Siap';health.dataset.ready=String(waiting>0||!blockers.length);
 const blockerList=card.querySelector('[data-blockers]');blockerList.replaceChildren(...blockers.map(b=>el('li',labels[b]||'Ada koneksi produksi yang perlu diperiksa.')));blockerList.hidden=!blockers.length;
 for(const [key,count] of Object.entries({review:waiting,processing:jobs.filter(j=>['queued','running','assembling','auditing_final'].includes(j.status)).length,approved:jobs.filter(j=>j.status==='approved').length}))card.querySelector(`[data-count="${key}"]`).textContent=token()?String(count):'—';
 card.querySelector('[data-login]').hidden=Boolean(token());
 card.querySelector('[data-budget]').textContent=`Estimasi US$${Number(data.estimateUsd||0).toFixed(2)} per video, termasuk cadangan pemeriksaan kualitas. Anggaran tersedia US$${Number(data.remainingUsd||0).toFixed(2)}. Ini biaya API Google; saldo Flow belum terhubung ke BIMA.`;
 const next=JSON.stringify(jobs)+Boolean(token());if(next===signature||interaction||list.querySelector('video:not([data-paused])'))return;signature=next;
 urls.forEach(url=>URL.revokeObjectURL(url));urls=[];list.replaceChildren();
 if(!jobs.length){const empty=el('div',undefined,'tt-empty');empty.append(el('span','▷','tt-empty-icon'),el('h4',token()?'Belum ada video untuk direview':'Hasil videomu bersifat privat'),el('p',token()?'Setelah koneksi produk dan anggaran siap, BIMA akan memproses video di server. Hasil yang lolos pemeriksaan akan muncul di sini.':'Masuk sebagai owner untuk melihat antrean dan hasil video.'));list.append(empty);}
 for(const job of [...jobs].sort((a,b)=>(b.status==='ready_for_review')-(a.status==='ready_for_review'))){
 const item=el('article',undefined,'tt-job'),info=el('div',undefined,'tt-job-info'),visual=el('div',undefined,'tt-job-preview');
 visual.append(el('span','▷','tt-empty-icon'),el('small',job.videoReady?'24 detik · Video tersedia':'Video sedang disiapkan'));
 const badge=el('span',stages[job.status]||'Memeriksa status','tt-badge');badge.dataset.ready=String(['ready_for_review','approved'].includes(job.status));
 info.append(badge,el('h4',job.product));
 const progress=el('p',job.status==='approved'?'Persetujuan tersimpan. Video belum dipublikasikan.':`${job.scenes.filter(s=>s.status==='complete').length}/3 scene selesai · Revisi ${job.revision||0}`,'tt-muted');info.append(progress);
 if(job.error||job.qa?.issues?.length)info.append(el('p','BIMA menahan hasil ini karena pemeriksaan belum lolos. Video ini belum bisa disetujui.','tt-issue'));
 if(job.reviewNotes)info.append(el('p','Catatanmu: '+job.reviewNotes,'tt-note'));
 const buttons=el('div',undefined,'tt-actions');info.append(buttons);
 if(job.videoReady){
 const play=el('button','Tonton video');play.type='button';play.className='tt-secondary';buttons.append(play);
 play.onclick=async()=>{play.disabled=true;try{const r=await fetch(base+'/api/tiktok/google/jobs/'+job.id+'/video',{headers:{Authorization:'Bearer '+token()}});if(!r.ok)throw Error('video_unavailable');const url=URL.createObjectURL(await r.blob());urls.push(url);const v=el('video');v.src=url;v.controls=true;v.playsInline=true;v.preload='metadata';v.setAttribute('aria-label','Preview '+job.product);v.dataset.paused='true';v.onplay=()=>delete v.dataset.paused;v.onpause=v.onended=()=>v.dataset.paused='true';visual.replaceChildren(v);play.remove();}catch(e){progress.textContent=safeError(e.message);play.disabled=false;}};
 }
 if(job.status==='ready_for_review'){
 const note=el('textarea');note.placeholder='Contoh: narasi lebih santai dan musik lebih pelan.';note.maxLength=600;note.setAttribute('aria-label','Catatan revisi video '+job.product);note.hidden=true;note.oninput=()=>interaction=true;
 const approve=el('button','Approve'),revise=el('button','Minta revisi');approve.type=revise.type='button';revise.className='tt-secondary';
 const send=async decision=>{approve.disabled=revise.disabled=true;try{await request('/api/tiktok/google/jobs/'+job.id+'/review',{decision,mediaHash:job.mediaHash,notes:note.value});interaction=false;signature='';for(const v of list.querySelectorAll('video')){v.pause();v.dataset.paused='true';}await refresh();}catch(e){progress.textContent=safeError(e.message);approve.disabled=revise.disabled=false;}};
 approve.onclick=()=>send('approve');revise.onclick=()=>{if(note.hidden){note.hidden=false;interaction=true;note.focus();revise.textContent='Kirim revisi';return;}if(note.value.trim().length<5){progress.textContent='Tulis catatan revisi minimal lima karakter.';return;}send('request_revision');};
 buttons.append(approve,revise);info.append(note,el('small','Approve menyetujui versi ini; belum memposting ke TikTok.','tt-muted'));
 }
 item.append(visual,info);list.append(item);
 }
 }catch(e){label.textContent=safeError(e.message);card.querySelector('[data-health]').textContent='Belum terhubung';}
 finally{busy=false;}
}
card.querySelector('[data-refresh]').onclick=refresh;
refresh();document.addEventListener('bima:owner-session',()=>{signature='';refresh();});
setInterval(()=>{if(!document.hidden&&root.getClientRects().length)refresh();},15000);
})();
