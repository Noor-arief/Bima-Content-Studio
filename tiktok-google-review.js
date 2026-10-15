/* TikTok owner workspace. Production runs on the server; review stays with owner. */
(()=>{
'use strict';
const root=document.getElementById('tiktokWorkspace');if(!root)return;
root.classList.add('tt-owner-mode');
const card=document.createElement('section');card.dataset.secs='ringkasan desk kalender publishing';card.id='tt-google-review';
card.innerHTML=`
<div class="tt-hero"><div><span class="tt-eyebrow">BIMA CONTENT STUDIO / TIKTOK</span><h3>Ide jadi video.<br><span>Kamu pegang keputusan.</span></h3><p>BIMA mencari produk, membuat video, lalu menyiapkan publikasi. Tugasmu hanya review dan approve.</p><div class="tt-pills"><span>Google Veo</span><span>24 detik · 9:16</span><span>Suara Indonesia</span></div></div><div class="tt-role"><span>PERAN KAMU</span><strong>Review &amp;<br>Approval</strong><small>Keputusan akhir tetap di tanganmu.</small></div></div>
<ol class="tt-flow" aria-label="Alur produksi video"><li><span>01</span><strong>Riset produk winning</strong><small>BIMA menilai tren, penjualan, komisi, dan kelayakan produk.</small></li><li><span>02</span><strong>Buat &amp; cek video</strong><small>BIMA membuat visual, narasi, musik, subtitle, lalu memeriksa kualitas.</small></li><li><span>03</span><strong>Kamu review</strong><small>Tonton hasil → approve atau minta revisi.</small></li><li><span>04</span><strong>Upload terjadwal</strong><small>BIMA menerbitkan versi disetujui setelah koneksi publikasi siap.</small></li></ol>
<div class="tt-owner-intro"><div><span class="tt-eyebrow">VIDEO TIKTOK</span><h3 data-main-title>Review Video</h3><p data-main-description>Tonton hasil video, approve atau minta revisi.</p><p class="tt-hours">Target kerja BIMA: 08.00–18.00 WIB · jadwal otomatis belum aktif</p></div><button type="button" class="tt-secondary" data-sec-go="publishing">Pengaturan</button><button type="button" class="tt-secondary" data-sec-go="ringkasan">Kembali ke video</button></div><div class="tt-metrics"><div><span>Perlu review</span><strong data-count="review">—</strong></div><div><span>Sedang diproses</span><strong data-count="processing">—</strong></div><div><span>Sudah disetujui</span><strong data-count="approved">—</strong></div></div>
<section class="tt-readiness"><div class="tt-row"><h4>Status produksi</h4><span class="tt-badge" data-health>Memeriksa</span></div><p data-status role="status" aria-live="polite">Menghubungkan ke BIMA…</p><ul data-blockers></ul><div class="tt-actions"><button type="button" data-login hidden>Masuk untuk review</button><button type="button" data-refresh class="tt-secondary">Perbarui status</button></div><details class="tt-budget"><summary>Biaya &amp; kesiapan koneksi</summary><p data-budget></p><p>Persetujuan video belum berarti tayang. Koneksi publikasi dan keranjang produk masih perlu diselesaikan.</p></details></section>
<section class="tt-research" data-owner-pane="desk"><span class="tt-eyebrow">RISET PRODUK OLEH BIMA</span><h4>Produk yang layak dibuatkan video</h4><p data-research-status>Memeriksa akses sumber produk…</p><ul><li>Permintaan: tren dan perubahan penjualan, beserta periode datanya.</li><li>Potensi: komisi, harga, stok, dan kecocokan dengan audiens.</li><li>Kualitas: reputasi penjual, ulasan, fakta serta izin aset produk.</li></ul><small>Belum ada label “winning” sebelum ada data yang mendukung. Kamu tidak perlu mengisi formulir riset.</small></section>
<section class="tt-research tt-manual-intake" data-owner-pane="desk"><span class="tt-eyebrow">SUMBER PRODUK SEMENTARA</span><h4>Masukkan 1 produk terverifikasi</h4><p>Showcase belum tersambung. Ini jalur pilot sementara untuk menguji BIMA tanpa mengarang data produk. Produk hanya dikirim ke server jika sumber, fakta dan izin foto sudah kamu verifikasi. Tidak ada pemotongan biaya otomatis dari formulir ini.</p>
<form data-intake-form>
<label>Nama produk <input name="productName" required maxlength="60" placeholder="Nama dan varian asli"></label>
<label>URL produk resmi <input name="productUrl" required type="url" placeholder="https://..."></label>
<label>Fakta produk yang sudah dicek <input name="productFact" required minlength="15" maxlength="100" placeholder="Spesifikasi yang terbukti pada listing"></label>
<label>Sumber bukti <input name="evidence" required minlength="10" maxlength="1000" placeholder="Sumber atau catatan verifikasi"></label>
<label>Foto referensi produk berizin (PNG/JPG/WebP, maks 750 KB) <input name="productImage" required type="file" accept="image/png,image/jpeg,image/webp"></label>
<label class="tt-intake-check"><input name="factsVerified" required type="checkbox"> Saya telah memeriksa kebenaran fakta produk</label>
<label class="tt-intake-check"><input name="assetsLicensed" required type="checkbox"> Saya memiliki hak menggunakan foto ini untuk produksi video</label>
<button type="submit">Kirim ke antrean BIMA</button><p data-intake-result role="status" aria-live="polite"></p>
</form><small>Untuk operasional penuh, input ini harus digantikan koneksi Showcase resmi. BIMA belum otomatis menilai penjualan atau komisi.</small></section>
<section class="tt-research" data-owner-pane="kalender"><span class="tt-eyebrow">PUBLIKASI TIKTOK</span><h4>Disetujui belum berarti sudah tayang</h4><p data-publishing-status>Memeriksa koneksi publikasi…</p><small>Jadwal aktif dan tautan hasil hanya ditampilkan setelah tercatat di server. Tidak ada upload sebelum approval.</small></section>
<div class="tt-section-heading"><div><span class="tt-eyebrow" data-view-kicker>MEJA REVIEW</span><h4 data-view-title>Video untukmu</h4></div><span class="tt-muted">Tersimpan di server</span></div><div data-jobs class="tt-jobs"></div>
<div class="tt-tools"><p>Butuh melihat draft atau pengaturan sebelumnya?</p><button type="button" data-legacy-toggle class="tt-secondary" aria-expanded="false">Buka alat lanjutan</button><small>Pengaturan koneksi dan alat lama untuk pemeliharaan; bukan pekerjaan harian owner.</small></div>`;
root.querySelector('.aff-head')?.insertAdjacentElement('afterend',card);
if(!card.isConnected)root.append(card);
const css=document.createElement('link');css.rel='stylesheet';css.href='tiktok-google-review.css?v=20261015-simple3';document.head.append(css);
const label=card.querySelector('[data-status]'),list=card.querySelector('[data-jobs]');
const base='https://content-studio-api-production-3fe2.up.railway.app';
const token=()=>sessionStorage.getItem('bima_content_server_session');
const labels={google_api_key_missing:'Koneksi Google belum siap.',google_automation_not_enabled:'Produksi Google belum diaktifkan.',google_budget_not_available:'Anggaran API Google belum tersedia.',verified_product_source_missing:'Riset tertahan: akses katalog/showcase dan data produk TikTok belum terhubung.'};
const stages={queued:'Dalam antrean',blocked_budget:'Menunggu anggaran',running:'Membuat scene',assembling:'Menggabungkan video',auditing_final:'Memeriksa kualitas',ready_for_review:'Siap direview',approved:'Disetujui',qa_failed:'Perlu perbaikan',failed:'Produksi tertahan',requires_reconciliation:'Sedang perlu pemeriksaan',revision_requested:'Revisi diminta'};
const safeError=code=>code==='owner_login_required'||code==='authentication_required'?'Sesi berakhir. Silakan masuk kembali.':'Proses belum berhasil. Coba perbarui status; hasil sebelumnya tetap tersimpan.';
let busy=false,signature='',urls=[],interaction=false;
function syncView(){
 const section=['ringkasan','desk','kalender','publishing'].includes(root.dataset.sec)?root.dataset.sec:'ringkasan';card.dataset.view=section;
 const copy={ringkasan:['KEPUTUSAN KAMU','Perlu kamu review'],desk:['PROSES OTOMATIS','Pekerjaan BIMA'],kalender:['JADWAL & HASIL','Video yang kamu setujui'],publishing:['PENGATURAN','Kesiapan sistem']};
 const [kicker,title]=copy[section]||copy.ringkasan;
 const intro={ringkasan:['Review Video','Tonton hasil, approve atau revisi.'],desk:['Proses BIMA','Pantau riset dan produksi video. Target kerja harian 08.00–18.00 WIB belum aktif sebagai scheduler.'],kalender:['Calendar & Upload','Video approved tercatat di sini. Upload masih menunggu izin TikTok Shop.'],publishing:['Pengaturan','Status akses API Google dan TikTok serta penghambat integrasi.']};
 card.querySelector('[data-main-title]').textContent=intro[section][0];card.querySelector('[data-main-description]').textContent=intro[section][1];
 card.querySelector('[data-view-kicker]').textContent=kicker;card.querySelector('[data-view-title]').textContent=title;
 for(const b of card.querySelectorAll('.tt-owner-tabs button'))b.setAttribute('aria-current',b.dataset.secGo===section?'page':'false');
}
document.addEventListener('bima:channel-section',syncView);syncView();
const actions=card.querySelector('[data-legacy-toggle]');actions.onclick=()=>{const open=root.classList.toggle('tt-owner-mode')===false;document.querySelector('.sidebar')?.classList.toggle('tt-advanced-nav',open);actions.setAttribute('aria-expanded',String(open));actions.textContent=open?'Tutup alat lanjutan':'Buka alat lanjutan';if(open)card.querySelector('[data-sec-go="ringkasan"]').click();};
card.querySelector('[data-login]').onclick=()=>location.assign(base+'/auth/google/start');
const intake=card.querySelector('[data-intake-form]');
intake.addEventListener('submit',async event=>{
 event.preventDefault();
 const result=card.querySelector('[data-intake-result]'),submit=intake.querySelector('[type="submit"]');
 if(!token()){result.textContent='Masuk sebagai owner terlebih dahulu melalui Review Video.';return;}
 const form=new FormData(intake),file=form.get('productImage');
 if(!(file instanceof File)||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>750000||file.size<1500){result.textContent='Foto harus PNG/JPG/WebP, ukuran 1,5–750 KB.';return;}
 submit.disabled=true;result.textContent='Mengirim produk ke server...';
 try{
  const imageData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('image_read_failed'));reader.readAsDataURL(file);});
  const name=String(form.get('productName')||'').trim(),url=String(form.get('productUrl')||'').trim(),fact=String(form.get('productFact')||'').trim(),evidence=String(form.get('evidence')||'').trim();
  const digestInput=new TextEncoder().encode(url+'|'+name);
  const hash=await crypto.subtle.digest('SHA-256',digestInput);
  const id='pilot_'+Array.from(new Uint8Array(hash)).slice(0,16).map(b=>b.toString(16).padStart(2,'0')).join('');
  await request('/api/tiktok/google/products',{product:{id,name,url,fact,evidence,factsVerified:form.get('factsVerified')==='on',assetsLicensed:form.get('assetsLicensed')==='on'},imageData});
  result.textContent='Produk diterima server. Lihat antrean BIMA di bawah. Produksi video tetap tergantung kesiapan Google API dan anggarannya.';
  intake.reset();signature='';refresh();
 }catch(e){result.textContent=e.message==='owner_login_required'?'Sesi habis, masuk ulang.':'Belum masuk antrean. Periksa data, sesi owner, izin aset, dan koneksi server.';}
 finally{submit.disabled=false;}
});

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
 card.querySelector('[data-research-status]').textContent=data.sourceConnected?'Sumber produk terhubung. Hasil analisis akan ditampilkan jika tersedia.':'Belum ada hasil riset: koneksi katalog/showcase dan data performa produk TikTok belum tersedia. Login TikTok saja belum memberikan akses ini.';
 card.querySelector('[data-publishing-status]').textContent=data.publishingConnected?'Koneksi publikasi tersedia. Status tiap video mengikuti catatan server.':'Upload otomatis belum aktif: akses publikasi affiliate TikTok belum terhubung. Video yang disetujui masuk antrean tayang yang tertahan, tanpa jadwal aktif.';
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
 if(jobs.length){
 for(const [group,predicate,message] of [
 ['review',j=>j.status==='ready_for_review','Belum ada video siap review. BIMA akan menampilkan hasil yang lolos pemeriksaan di sini.'],
 ['processing',j=>!['ready_for_review','approved'].includes(j.status),'Belum ada video dalam produksi. Status akses riset ada di atas.'],
 ['approved',j=>j.status==='approved','Belum ada video disetujui. Setelah kamu approve, hasilnya akan muncul di sini.']]){
 if(!jobs.some(predicate)){const empty=el('div',message,'tt-empty');empty.dataset.jobGroup=group;list.append(empty);}
 }
 }
 const rank=j=>j.status==='ready_for_review'?0:j.status==='approved'?1:2;
 let previousGroup='review';
 for(const job of [...jobs].sort((a,b)=>rank(a)-rank(b))){
 const group=rank(job)===0?'review':rank(job)===1?'approved':'processing';
 if(group!==previousGroup){const heading=el('h4',group==='approved'?'Antrean tayang':'BIMA sedang bekerja','tt-group-heading');heading.dataset.jobGroup=group;list.append(heading);previousGroup=group;}
 const item=el('article',undefined,'tt-job'),info=el('div',undefined,'tt-job-info'),visual=el('div',undefined,'tt-job-preview');
 item.dataset.jobGroup=job.status==='ready_for_review'?'review':job.status==='approved'?'approved':'processing';
 visual.append(el('span','▷','tt-empty-icon'),el('small',job.videoReady?'24 detik · Video tersedia':'Video sedang disiapkan'));
 const badge=el('span',stages[job.status]||'Memeriksa status','tt-badge');badge.dataset.ready=String(['ready_for_review','approved'].includes(job.status));
 info.append(badge,el('h4',job.product));
 if(job.productSource){const source=el('p','Sumber produk: '+job.productSource,'tt-muted');info.append(source);}
 info.append(el('p','Keranjang kuning: '+job.product+' · akses penautan produk belum terverifikasi.','tt-note'));
 if(job.selectionReason)info.append(el('p','Alasan pemilihan: '+job.selectionReason,'tt-note'));
 const progress=el('p',job.status==='approved'?'Masuk antrean tayang · tertahan akses TikTok Shop. Belum ada jadwal aktif atau unggahan.':`${job.scenes.filter(s=>s.status==='complete').length}/3 scene selesai · Revisi ${job.revision||0}`,'tt-muted');info.append(progress);
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
