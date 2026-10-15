/* TikTok owner workspace. Production runs on the server; review stays with owner. */
(()=>{
'use strict';
const root=document.getElementById('tiktokWorkspace');if(!root)return;
root.classList.add('tt-owner-mode');
const card=document.createElement('section');card.dataset.secs='ringkasan desk kalender publishing';card.id='tt-google-review';
card.innerHTML=`
<div class="tt-hero"><div><span class="tt-eyebrow">BIMA CONTENT STUDIO / TIKTOK</span><h3>Ide jadi video.<br><span>Kamu pegang keputusan.</span></h3><p>BIMA mencari produk, membuat video, lalu menyiapkan publikasi. Tugasmu hanya review dan approve.</p><div class="tt-pills"><span>Google Veo</span><span>24 detik · 9:16</span><span>Suara Indonesia</span></div></div><div class="tt-role"><span>PERAN KAMU</span><strong>Review &amp;<br>Approval</strong><small>Keputusan akhir tetap di tanganmu.</small></div></div>
<ol class="tt-flow" aria-label="Alur produksi video"><li><span>01</span><strong>Riset produk winning</strong><small>BIMA menilai tren, penjualan, komisi, dan kelayakan produk.</small></li><li><span>02</span><strong>Buat &amp; cek video</strong><small>BIMA membuat visual, narasi, musik, subtitle, lalu memeriksa kualitas.</small></li><li><span>03</span><strong>Kamu review</strong><small>Tonton hasil → approve atau minta revisi.</small></li><li><span>04</span><strong>Upload terjadwal</strong><small>BIMA menerbitkan versi disetujui setelah koneksi publikasi siap.</small></li></ol>
<div class="tt-owner-intro"><div><span class="tt-eyebrow">VIDEO TIKTOK</span><h3 data-main-title>TikTok Production 2</h3><p data-main-description>Tonton hasil video, approve atau minta revisi.</p><p class="tt-hours">Target kerja BIMA: 08.00–18.00 WIB · jadwal otomatis belum aktif</p></div><button type="button" class="tt-secondary" data-sec-go="publishing">Pengaturan</button><button type="button" class="tt-secondary" data-sec-go="ringkasan">Kembali ke video</button></div><section class="tt-workflow" data-owner-pane="desk"><div class="tt-work-head"><strong>Alur kerja harian BIMA</strong><span>08.00–18.00 WIB · Target, belum aktif</span></div><ol class="tt-work-steps"><li><strong>1. Analisa Showcase TikTok</strong><small>Menunggu izin TikTok · Belum ada hasil riset live</small></li><li><strong>2. Pilih 1 produk dengan GMV tinggi</strong><small>Harga, komisi, stok, relevansi dan bukti</small></li><li><strong>3. Buat storyboard</strong><small>Storyboard → visual 9:16 → VO → musik → subtitle</small></li><li><strong>4. Cek catatan revisi owner</strong><small>Video lolos QA masuk ke Review Video</small></li></ol><p class="tt-work-note">Ini alur yang disiapkan, bukan aktivitas otomatis yang sudah berjalan.</p></section>
<div class="tt-review-hint" data-owner-pane="ringkasan"><strong>Production 2 · Google Flow</strong><p>BIMA mengirim storyboard yang sudah disetujui ke generator, lalu memeriksa video, suara, subtitle dan kesesuaian produk. Integrasi langsung Google Flow belum aktif; jangan menganggap Google Veo API sebagai kredit Flow.</p><p>Keranjang kuning hanya dapat dipasang saat integrasi publikasi affiliate resmi tersedia.</p></div>
<div class="tt-calendar-hint" data-owner-pane="kalender"><strong>Owner Section</strong><p>Approve → antrean Calendar &amp; Live. Revisi → kembali ke TikTok Production 1 dengan catatan owner.</p><button type="button" class="tt-secondary" data-calendar-toggle>Calendar &amp; Live · lihat video approved</button><p data-calendar-state hidden>Calendar &amp; Live hanya berisi video approved. Belum ada jadwal aktif sampai sistem publishing terhubung.</p></div>
<div class="tt-metrics"><div><span>Perlu review</span><strong data-count="review">—</strong></div><div><span>Sedang diproses</span><strong data-count="processing">—</strong></div><div><span>Sudah disetujui</span><strong data-count="approved">—</strong></div></div>
<section class="tt-readiness"><div class="tt-row"><h4>Status produksi</h4><span class="tt-badge" data-health>Memeriksa</span></div><p data-status role="status" aria-live="polite">Menghubungkan ke BIMA…</p><ul data-blockers></ul><div class="tt-actions"><button type="button" data-login hidden>Masuk untuk review</button><button type="button" data-refresh class="tt-secondary">Perbarui status</button></div><details class="tt-budget"><summary>Biaya &amp; kesiapan koneksi</summary><p data-budget></p><p>Persetujuan video belum berarti tayang. Koneksi publikasi dan keranjang produk masih perlu diselesaikan.</p></details></section>
<section class="tt-research" data-owner-pane="publishing"><h4>Koneksi Showcase</h4><p data-research-status>Memeriksa akses TikTok…</p><small>Produk tidak dapat diambil otomatis sebelum akses tersedia.</small></section>
<section class="tt-research" data-owner-pane="kalender"><span class="tt-eyebrow">PUBLIKASI TIKTOK</span><h4>Disetujui belum berarti sudah tayang</h4><p data-publishing-status>Memeriksa koneksi publikasi…</p><small>Jadwal aktif dan tautan hasil hanya ditampilkan setelah tercatat di server. Tidak ada upload sebelum approval.</small></section>
<div class="tt-section-heading"><div><span class="tt-eyebrow" data-view-kicker>MEJA REVIEW</span><h4 data-view-title>Video untukmu</h4></div><span class="tt-muted">Tersimpan di server</span></div><div data-jobs class="tt-jobs"></div>
<div class="tt-tools"><p>Butuh melihat draft atau pengaturan sebelumnya?</p><button type="button" data-legacy-toggle class="tt-secondary" aria-expanded="false">Buka alat lanjutan</button><small>Pengaturan koneksi dan alat lama untuk pemeliharaan; bukan pekerjaan harian owner.</small></div>`;
root.querySelector('.aff-head')?.insertAdjacentElement('afterend',card);
if(!card.isConnected)root.append(card);
const css=document.createElement('link');css.rel='stylesheet';css.href='tiktok-google-review.css?v=20261015-fourmenu';document.head.append(css);
const label=card.querySelector('[data-status]'),list=card.querySelector('[data-jobs]');
const base='https://content-studio-api-production-3fe2.up.railway.app';
const token=()=>sessionStorage.getItem('bima_content_server_session');
const labels={google_api_key_missing:'Koneksi Google belum siap.',google_automation_not_enabled:'Produksi Google belum diaktifkan.',google_budget_not_available:'Anggaran API Google belum tersedia.',verified_product_source_missing:'Riset tertahan: akses katalog/showcase dan data produk TikTok belum terhubung.'};
const stages={storyboard_pending:'Storyboard menunggu persetujuan',queued:'Dalam antrean',blocked_budget:'Menunggu anggaran',running:'Membuat scene',assembling:'Menggabungkan video',auditing_final:'Memeriksa kualitas',ready_for_review:'Siap direview',approved:'Disetujui',qa_failed:'Perlu perbaikan',failed:'Produksi tertahan',requires_reconciliation:'Sedang perlu pemeriksaan',revision_requested:'Revisi diminta'};
const safeError=code=>code==='owner_login_required'||code==='authentication_required'?'Sesi berakhir. Silakan masuk kembali.':'Proses belum berhasil. Coba perbarui status; hasil sebelumnya tetap tersimpan.';
let busy=false,signature='',urls=[],interaction=false;
function syncView(){
 const section=['ringkasan','desk','kalender','publishing'].includes(root.dataset.sec)?root.dataset.sec:'ringkasan';card.dataset.view=section;
 // Settings restores the existing setup panels rather than hiding them behind owner mode.
 const settings=section==='publishing';if(settings)root.dataset.advancedMode='true';const advanced=root.dataset.advancedMode==='true';root.classList.toggle('tt-owner-mode',!advanced);document.querySelector('.sidebar')?.classList.toggle('tt-advanced-nav',advanced);const legacyButton=card.querySelector('[data-legacy-toggle]');legacyButton.setAttribute('aria-expanded',String(advanced));legacyButton.textContent=advanced?'Tutup alat lanjutan':'Buka alat lanjutan';
 const copy={ringkasan:['PRODUKSI VIDEO','Google Flow & video'],desk:['RISET & STORYBOARD','Produk, storyboard & revisi'],kalender:['KEPUTUSAN OWNER','Video untuk disetujui'],publishing:['PENGATURAN','Setup TikTok & Google Flow']};
 const [kicker,title]=copy[section]||copy.ringkasan;
 const intro={ringkasan:['TikTok Production 2','BIMA generate video mengikuti storyboard. Keranjang kuning menunggu izin publishing TikTok.'],desk:['TikTok Production 1','BIMA analisa Showcase, pilih 1 produk berdasar GMV terverifikasi, susun storyboard, dan tangani revisi.'],kalender:['Owner Section','Tonton hasil video. Approve ke Calendar & Live atau Revisi kembali ke Production 1.'],publishing:['Pengaturan','Setup TikTok dan Google Flow. Koneksi Google Flow konsumen belum tersedia melalui backend.']};
 card.querySelector('[data-main-title]').textContent=intro[section][0];card.querySelector('[data-main-description]').textContent=intro[section][1];
 const empty=card.querySelector('.tt-empty[data-empty-main]');if(empty){const message={ringkasan:['Belum ada video siap review','Video yang lolos QA akan muncul di sini.'],desk:['Belum ada proses video','BIMA menunggu akses produk Showcase.'],kalender:['Belum ada video approved','Hanya video yang sudah disetujui akan masuk ke sini.'],publishing:['','']}[section];empty.querySelector('h4').textContent=message[0];empty.querySelector('p').textContent=message[1];}
 card.querySelector('[data-view-kicker]').textContent=kicker;card.querySelector('[data-view-title]').textContent=title;
 for(const b of card.querySelectorAll('.tt-owner-tabs button'))b.setAttribute('aria-current',b.dataset.secGo===section?'page':'false');
}
document.addEventListener('bima:channel-section',syncView);syncView();
const calendarToggle=card.querySelector('[data-calendar-toggle]');calendarToggle.onclick=()=>{const state=card.querySelector('[data-calendar-state]');state.hidden=!state.hidden;card.classList.toggle('tt-calendar-open',!state.hidden);};
const actions=card.querySelector('[data-legacy-toggle]');actions.onclick=()=>{const open=root.dataset.advancedMode!=='true';root.dataset.advancedMode=String(open);root.classList.toggle('tt-owner-mode',!open);document.querySelector('.sidebar')?.classList.toggle('tt-advanced-nav',open);actions.setAttribute('aria-expanded',String(open));actions.textContent=open?'Tutup alat lanjutan':'Buka alat lanjutan';if(open)card.querySelector('[data-sec-go="ringkasan"]').click();};
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
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const todayJobs=jobs.filter(j=>j.createdAt&&new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(j.createdAt))===today);
 const storyboards=jobs.filter(j=>j.status==='storyboard_pending');const production=jobs.filter(j=>['queued','blocked_budget','running','assembling','auditing_final','requires_reconciliation','qa_failed','failed'].includes(j.status));const approved=jobs.filter(j=>j.status==='approved');
 const work=card.querySelector('.tt-workflow');
 if(work){
  const steps=work.querySelectorAll('.tt-work-steps li small');
  if(steps[0])steps[0].textContent=data.sourceConnected?'Showcase terhubung; menunggu data riset':'Menunggu izin Showcase TikTok · belum ada data live';
  if(steps[1])steps[1].textContent=!data.sourceConnected?'Belum ada hasil analisa produk dari Showcase':todayJobs.length?todayJobs.length+' pekerjaan produksi tercatat hari ini (bukan bukti analisa Showcase)':'Belum ada kandidat terverifikasi hari ini';
  if(steps[2])steps[2].textContent=storyboards.length?storyboards.length+' storyboard siap dicek di bawah':production.length?production.length+' pekerjaan produksi/QA tercatat':'Belum ada storyboard atau produksi';
  if(steps[3])steps[3].textContent=jobs.some(j=>j.status==='ready_for_review')?'Video siap di Review Video':approved.length?'Video approved ada di Calendar':'Belum ada video siap review';
  work.querySelector('.tt-work-note').textContent='Sistem membaca status pekerjaan nyata dari server. Jadwal otomatis 08.00–18.00 WIB belum diaktifkan.';
 }

 card.querySelector('[data-research-status]').textContent=data.sourceConnected?'Sumber produk terhubung. Hasil analisis akan ditampilkan jika tersedia.':'Belum ada hasil riset: koneksi katalog/showcase dan data performa produk TikTok belum tersedia. Login TikTok saja belum memberikan akses ini.';
 card.querySelector('[data-publishing-status]').textContent=data.publishingConnected?'Koneksi publikasi tersedia. Status tiap video mengikuti catatan server.':'Upload otomatis belum aktif: akses publikasi affiliate TikTok belum terhubung. Video yang disetujui masuk antrean tayang yang tertahan, tanpa jadwal aktif.';
 const waiting=jobs.filter(j=>j.status==='ready_for_review').length;
 label.textContent=waiting?`${waiting} video siap direview.`:blockers.length?'Koneksi produksi belum lengkap.':'Koneksi produksi tersedia.';
 const health=card.querySelector('[data-health]');health.textContent=waiting?'Menunggu review':blockers.length?'Belum siap':'Siap';health.dataset.ready=String(waiting>0||!blockers.length);
 const blockerList=card.querySelector('[data-blockers]');blockerList.replaceChildren(...blockers.map(b=>el('li',labels[b]||'Ada koneksi produksi yang perlu diperiksa.')));blockerList.hidden=!blockers.length;
 for(const [key,count] of Object.entries({review:waiting,processing:storyboards.length+production.length,approved:jobs.filter(j=>j.status==='approved').length}))card.querySelector(`[data-count="${key}"]`).textContent=token()?String(count):'—';
 card.querySelector('[data-login]').hidden=Boolean(token());
 card.querySelector('[data-budget]').textContent=`Estimasi US$${Number(data.estimateUsd||0).toFixed(2)} per video, termasuk cadangan pemeriksaan kualitas. Anggaran tersedia US$${Number(data.remainingUsd||0).toFixed(2)}. Ini biaya API Google; saldo Flow belum terhubung ke BIMA.`;
 const next=JSON.stringify(jobs)+Boolean(token());if(next===signature||interaction||list.querySelector('video:not([data-paused])'))return;signature=next;
 urls.forEach(url=>URL.revokeObjectURL(url));urls=[];list.replaceChildren();
 if(!jobs.length){const empty=el('div',undefined,'tt-empty');empty.dataset.emptyMain='true';empty.append(el('span','▷','tt-empty-icon'),el('h4',token()?'Belum ada video untuk direview':'Hasil videomu bersifat privat'),el('p',token()?'Setelah koneksi produk dan anggaran siap, BIMA akan memproses video di server. Hasil yang lolos pemeriksaan akan muncul di sini.':'Masuk sebagai owner untuk melihat antrean dan hasil video.'));list.append(empty);syncView();}
 if(jobs.length){
 for(const [group,predicate,message] of [
 ['review',j=>j.status==='ready_for_review','Belum ada video siap review. BIMA akan menampilkan hasil yang lolos pemeriksaan di sini.'],
 ['processing',j=>!['ready_for_review','approved','revision_requested'].includes(j.status),'Belum ada storyboard atau proses produksi. Alur persiapan ada di atas.'],
 ['approved',j=>j.status==='approved','Belum ada video approved. Hasil yang disetujui nanti masuk antrean publikasi.']]){
 if(!jobs.some(predicate)){const empty=el('div',message,'tt-empty');empty.dataset.jobGroup=group;list.append(empty);}
 }
 }
 const rank=j=>j.status==='ready_for_review'?0:j.status==='approved'?2:1;
 let previousGroup='review';
 for(const job of [...jobs].sort((a,b)=>rank(a)-rank(b))){
 const group=rank(job)===0?'review':rank(job)===2?'approved':'processing';
 if(group!==previousGroup){const heading=el('h4',group==='approved'?'Video disetujui — menunggu publikasi':'Storyboard & produksi BIMA','tt-group-heading');heading.dataset.jobGroup=group;list.append(heading);previousGroup=group;}
 const item=el('article',undefined,'tt-job'),info=el('div',undefined,'tt-job-info'),visual=el('div',undefined,'tt-job-preview');
 item.dataset.jobGroup=group;item.dataset.jobStatus=job.status;
 visual.append(el('span','▷','tt-empty-icon'),el('small',job.videoReady?'24 detik · Video tersedia':'Video sedang disiapkan'));
 const badge=el('span',stages[job.status]||'Memeriksa status','tt-badge');badge.dataset.ready=String(['ready_for_review','approved'].includes(job.status));
 info.append(badge,el('h4',job.product));
 if(job.productSource){const source=el('p','Sumber produk: '+job.productSource,'tt-muted');info.append(source);}
 if(job.status==='revision_requested')info.append(el('p','Revisi owner diterima. Tindak lanjut dilakukan di Production 1.','tt-note'));
 if(job.status==='approved')info.append(el('p','Status publikasi: tertahan sampai koneksi TikTok Shop tersedia. Tidak ada jadwal upload aktif.','tt-note'));
 if(job.selectionReason)info.append(el('p','Alasan pemilihan: '+job.selectionReason,'tt-note'));
 const progress=el('p',job.status==='approved'?'Approved · menunggu koneksi publikasi. Belum punya tanggal tayang.':job.status==='storyboard_pending'?'Storyboard siap diperiksa. Video belum digenerate.':`${job.scenes.filter(s=>s.status==='complete').length}/3 scene selesai · Revisi ${job.revision||0}`,'tt-muted');info.append(progress);
 if(job.storyboard?.length){const details=el('details',undefined,'tt-storyboard');const summary=el('summary',job.status==='storyboard_pending'?'Cek storyboard sebelum generate':'Lihat storyboard 3 scene');details.append(summary);for(const scene of job.storyboard){const part=el('div',undefined,'tt-story-scene');part.append(el('strong',`Scene ${scene.scene} · ${scene.durationSeconds} detik`),el('p',scene.visual),el('p','VO: '+scene.voice),el('small',scene.audio+' · '+scene.format));details.append(part);}info.append(details);}
 if(job.status==='storyboard_pending'){const gate=el('button','Setujui storyboard & mulai produksi');gate.type='button';gate.onclick=async()=>{gate.disabled=true;try{await request('/api/tiktok/google/jobs/'+job.id+'/storyboard-approve',{});signature='';await refresh();}catch(e){progress.textContent=safeError(e.message);gate.disabled=false;}};info.append(gate,el('p','Belum ada kredit Google digunakan sebelum storyboard disetujui dan anggaran API aktif.','tt-muted'));}
 if(job.error||job.qa?.issues?.length)info.append(el('p','BIMA menahan hasil ini karena pemeriksaan belum lolos. Video ini belum bisa disetujui.','tt-issue'));
 if(job.revisionBlockedReason)info.append(el('p','Revisi tertahan: batas dua revisi otomatis tercapai. Perlu penanganan produksi sebelum dilanjutkan.','tt-issue'));
 if(job.reviewNotes)info.append(el('p','Catatanmu: '+job.reviewNotes,'tt-note'));
 const buttons=el('div',undefined,'tt-actions');info.append(buttons);
 if(job.videoReady){
 const play=el('button','Tonton video');play.type='button';play.className='tt-secondary';buttons.append(play);
 play.onclick=async()=>{play.disabled=true;try{const r=await fetch(base+'/api/tiktok/google/jobs/'+job.id+'/video',{headers:{Authorization:'Bearer '+token()}});if(!r.ok)throw Error('video_unavailable');const url=URL.createObjectURL(await r.blob());urls.push(url);const v=el('video');v.src=url;v.controls=true;v.playsInline=true;v.preload='metadata';v.setAttribute('aria-label','Preview '+job.product);v.dataset.paused='true';v.onplay=()=>delete v.dataset.paused;v.onpause=v.onended=()=>v.dataset.paused='true';visual.replaceChildren(v);play.remove();}catch(e){progress.textContent=safeError(e.message);play.disabled=false;}};
 }
 if(job.status==='ready_for_review'){
 const note=el('textarea');note.placeholder='Contoh: narasi lebih santai dan musik lebih pelan.';note.maxLength=600;note.setAttribute('aria-label','Catatan revisi video '+job.product);note.hidden=true;note.oninput=()=>interaction=true;
 const approve=el('button','Approve'),revise=el('button','Revisi');approve.type=revise.type='button';revise.className='tt-secondary';
 const send=async decision=>{approve.disabled=revise.disabled=true;try{await request('/api/tiktok/google/jobs/'+job.id+'/review',{decision,mediaHash:job.mediaHash,notes:note.value});interaction=false;signature='';for(const v of list.querySelectorAll('video')){v.pause();v.dataset.paused='true';}await refresh();}catch(e){progress.textContent=safeError(e.message);approve.disabled=revise.disabled=false;}};
 approve.onclick=()=>send('approve');revise.onclick=()=>{if(note.hidden){note.hidden=false;interaction=true;note.focus();revise.textContent='Kirim revisi';return;}if(note.value.trim().length<5){progress.textContent='Tulis catatan revisi minimal lima karakter.';return;}send('request_revision');};
 buttons.append(approve,revise);info.append(note,el('small','Approve → antrean tayang. Revisi → BIMA memproses ulang, lalu hasil baru kembali untuk kamu review.','tt-muted'));
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
