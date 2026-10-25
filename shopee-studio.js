/* Shopee production desk: owner-only media, real MP4 rendering, explicit manual publication. */
(()=>{'use strict';
const STORE='bima-shopee-studio-cache-v1',TOKEN='bima_content_server_session';
const root=document.createElement('section');root.id='shopeeStudio';root.className='ss';root.hidden=true;
document.getElementById('shopeeWorkspace').after(root);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n==null?'—':'Rp'+Math.round(n).toLocaleString('id-ID');
const names={draft:'Draft',rendering:'Sedang render',review:'Menunggu review',approved:'Approved',revision:'Perlu revisi',failed:'Render perlu diperiksa',published:'Tayang · konfirmasi owner'};
let drafts=[],selected='',view='research',dirty=false,loading=false,online=false,busy=false,active=false,previewUrl='',previewKey='',previewSerial=0;
try{const cache=JSON.parse(localStorage.getItem(STORE)||'null');if(cache){drafts=cache.drafts||[];selected=cache.selected||'';}}catch{}
const d=()=>drafts.find(x=>x.id===selected), el=id=>root.querySelector('#ss-'+id);
const cache=()=>{try{localStorage.setItem(STORE,JSON.stringify({drafts,selected}));}catch{}};
const message=(s,bad=false)=>{el('message').textContent=s;el('message').dataset.bad=String(bad);};
function base(){const b=(localStorage.getItem('bima_content_server_url')||'https://content-studio-api-production-3fe2.up.railway.app').replace(/\/$/,'');if(!/^https:\/\/[a-zA-Z0-9.-]+\.up\.railway\.app$/.test(b))throw Error('Alamat server BIMA tidak valid.');return b;}
const errors={authentication_required:'Sesi owner berakhir. Masuk kembali sebagai owner BIMA.',confirm_product_asset_rights:'Konfirmasi foto/clip sesuai produk dan boleh digunakan.',confirm_audio_rights:'Konfirmasi hak penggunaan audio.',three_product_assets_required:'Isi foto atau clip untuk ketiga scene.',voice_must_fit_24_seconds:'Narasi harus berupa audio dengan durasi maksimal 24 detik.',render_failed_check_source_media:'File sumber tidak dapat diproses. Periksa foto, MP4, atau audio lalu render ulang.',render_before_review:'Render versi terbaru sebelum review.',complete_review_checks:'Lengkapi tiga pemeriksaan review dan link affiliate.',revision_notes_required:'Tulis catatan revisi minimal 5 karakter.',renderer_busy:'Renderer sedang digunakan. Tunggu proses yang berjalan selesai.',asset_max_30mb:'Ukuran tiap aset maksimal 30 MB.',asset_content_mismatch:'Isi file tidak sesuai formatnya. Gunakan file media asli, bukan file yang hanya diganti ekstensinya.',unsupported_asset_type:'Gunakan JPG/PNG/WebP/MP4 untuk scene, atau MP3/WAV/M4A untuk audio.',approve_before_export:'Setujui versi video ini sebelum menyiapkan paket unggah.',render_interrupted_retry:'Render terhenti saat server restart. Periksa aset dan klik render ulang.',confirm_shopee_video_and_product_tag:'Isi URL video Shopee dan konfirmasi tag produknya.'};
async function request(path,method='GET',body){
 const token=sessionStorage.getItem(TOKEN);if(!token)throw Error('Masuk sebagai owner BIMA terlebih dahulu.');
 const headers={Authorization:'Bearer '+token};let payload=body;
 if(body instanceof File||body instanceof Blob)headers['Content-Type']=body.type||'application/octet-stream';
 else if(body!==undefined){headers['Content-Type']='application/json';payload=JSON.stringify(body);}
 const r=await fetch(base()+'/api/shopee/studio'+path,{method,headers,body:payload,cache:'no-store',signal:AbortSignal.timeout(45000)});
 if(!r.ok){let j;try{j=await r.json();}catch{}throw Error(errors[j?.error]||j?.error||'Server belum dapat diakses ('+r.status+').');}
 return r;
}
async function json(path,method,body){return (await request(path,method,body)).json();}
function replace(value){const i=drafts.findIndex(x=>x.id===value.id);if(i<0)drafts.push(value);else drafts[i]=value;selected=value.id;cache();}
function field(k,label,type='text',full=false){return `<label class="${full?'ss-full':''}">${label}<input data-field="${k}" type="${type}" value="${esc(d()?.[k]??'')}" ${type==='number'?'min="0" step="any"':''}></label>`;}
function area(k,label,rows=3){return `<label class="ss-full">${label}<textarea data-field="${k}" rows="${rows}">${esc(d()?.[k]||'')}</textarea></label>`;}
function collect(){const item=d();if(!item)return;root.querySelectorAll('[data-field]').forEach(e=>item[e.dataset.field]=e.value);root.querySelectorAll('[data-scene-text]').forEach(e=>item.scenes[+e.dataset.sceneText].text=e.value);root.querySelectorAll('[data-scene-visual]').forEach(e=>item.scenes[+e.dataset.sceneVisual].visual=e.value);cache();}
function nav(v){collect();view=v;draw();}
async function save(){collect();if(!d())throw Error('Pilih draft terlebih dahulu.');const item=(await json('/drafts','POST',d())).draft;replace(item);dirty=false;online=true;return item;}
async function load(){if(loading)return;loading=true;try{const r=await json('');if(r.version!=='20261025-production1')throw Error('Server produksi Shopee sedang diperbarui. Coba lagi sebentar.');if(!dirty){drafts=r.drafts;if(!d())selected=drafts[0]?.id||'';cache();}online=true;draw();message('Draft dan aset tersimpan di server BIMA.');}catch(e){online=false;draw();message(e.message,true);}finally{loading=false;}}
function download(data,name,type){const url=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
async function showPreview(){const item=d(),video=el('preview');if(!video||!item?.render?.available)return;const key=item.id+':'+item.render.finishedAt,serial=++previewSerial;
 if(previewKey===key&&previewUrl){video.src=previewUrl;return;}
 try{const blob=await (await request('/drafts/'+item.id+'/video')).blob();if(serial!==previewSerial)return;if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(blob);previewKey=key;video.src=previewUrl;}catch(e){message(e.message,true);}
}
function draw(){
 const item=d(),steps=[['research','1 · Riset Produk'],['storyboard','2 · Storyboard'],['production','3 · Produksi Video'],['review','4 · Review Owner'],['publishing','5 · Publikasi']];
 root.innerHTML=`<header class="ss-head"><div><span>SHOPEE AFFILIATE · BIMA</span><h1>Semua produksi, satu tempat.</h1><p>Dari produk terpilih sampai MP4 siap unggah ke Shopee Video.</p></div><div class="ss-actions"><button data-action="sync">${online?'Sinkronkan draft':'Hubungkan server'}</button><button data-action="signin">Masuk owner BIMA</button></div></header>
 <div class="ss-status"><span>Produksi MP4 tersedia</span><span>Open API Shopee belum tersedia</span><span>Publikasi melalui aplikasi Shopee</span></div>
 <div class="ss-toolbar"><label>Draft aktif<select id="ss-picker"><option value="">Pilih draft…</option>${drafts.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(x.product)} · ${esc(names[x.stage]||x.stage)}</option>`).join('')}</select></label><button data-action="new">+ Produk baru</button><button data-action="seed">Gunakan tumbler hasil riset</button></div>
 <nav class="ss-tabs" aria-label="Tahap produksi Shopee">${steps.map(([k,label])=>`<button data-view="${k}" ${k===view?'aria-current="step"':''}>${label}</button>`).join('')}</nav>
 <p id="ss-message" class="ss-message" role="status">${dirty?'Ada perubahan lokal. Simpan sebelum render atau review.':online?'Terhubung ke server BIMA.':'Masuk sebagai owner BIMA untuk menyimpan draft dan aset.'}</p>
 ${item?`<div class="ss-title"><h2>${esc(item.product)}</h2><span class="ss-badge">${esc(names[item.stage]||item.stage)}</span></div>${item.renderError?`<p class="ss-warning">${esc(errors[item.renderError]||item.renderError)}</p>`:''}
 ${view==='research'?research(item):view==='storyboard'?storyboard(item):view==='production'?production(item):view==='review'?review(item):publishing(item)}
 <footer class="ss-footer"><span>${dirty?'Perubahan belum disinkronkan':'Versi draft '+item.revision}${item.updatedAt?' · '+new Date(item.updatedAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB':''}</span><button class="ss-primary" data-action="save" ${item.stage==='rendering'?'disabled':''}>Simpan draft ke BIMA</button></footer>`:
 `<section class="ss-card ss-empty"><h2>Mulai dari produk yang sudah diperiksa</h2><p>Tumbler 900 ml · Rp63.990 · rating 4,8 · 10RB+ terjual. Komisi Shopee Video 10% saat pemeriksaan 25 Oktober 2026.</p><button class="ss-primary" data-action="seed">Siapkan draft tumbler</button><p>Atau gunakan “Produk baru” untuk kandidat lain. Tidak ada video yang dipublikasikan otomatis.</p></section>`}`;
 root.dataset.busy=String(busy);
 if(['review','publishing'].includes(view))void showPreview();
}
function research(item){return `<div class="ss-grid"><section class="ss-card"><h3>Produk & sumber riset</h3><div class="ss-fields">${field('product','Nama produk')}${field('price','Harga saat riset (Rp)','number')}${field('productUrl','URL listing Shopee','url',true)}${field('affLink','Link affiliate','url',true)}${area('facts','Fakta dan catatan riset terverifikasi',5)}</div><div class="ss-actions"><a href="https://affiliate.shopee.co.id/offer/product_offer" target="_blank" rel="noopener noreferrer">Buka katalog Shopee ↗</a></div></section>
 <aside class="ss-card"><h3>Komisi sesuai platform</h3><div class="ss-fields">${field('videoCommission','Komisi Shopee Video (%)','number')}${field('socialCommission','Komisi media sosial (%)','number')}</div><div class="ss-number">${item.price!=null&&item.videoCommission!=null?money(Number(item.price)*Number(item.videoCommission)/100):'—'}<small>Estimasi per order Shopee Video sebelum penyesuaian transaksi</small></div><p>Angka “hingga” di katalog bisa berbeda dari komisi Shopee Video. Periksa ulang di rincian penawaran sebelum publikasi.</p>${item.researchAt?`<p>Riset awal ${esc(item.researchAt)} · ${esc(item.researchSource||'Dashboard Shopee Affiliate')}</p>`:''}<button data-view="storyboard" class="ss-primary">Lanjut storyboard →</button></aside></div>`;}
function storyboard(item){return `<section class="ss-card"><div class="ss-line"><h3>Storyboard · 24 detik · portrait 9:16</h3><button data-action="brief">Buat brief produksi</button></div><p>Edit narasi/subtitle dan arahan visual di sini. Maksimal 150 karakter per scene; hindari klaim yang belum dibuktikan.</p><div class="ss-scenes">${item.scenes.map((s,i)=>`<article><b>Scene ${i+1} <small>${i*8}–${(i+1)*8} detik</small></b><label>Narasi / subtitle<textarea data-scene-text="${i}" maxlength="150" rows="4">${esc(s.text)}</textarea></label><label>Arahan visual<textarea data-scene-visual="${i}" maxlength="500" rows="4">${esc(s.visual)}</textarea></label></article>`).join('')}</div><div class="ss-fields">${area('caption','Caption Shopee Video',4)}</div><p>Subtitle mengikuti pembagian scene. Jika memakai voice-over, siapkan audio penuh 24 detik dan cek kesesuaian ucapannya pada review.</p><button data-view="production" class="ss-primary">Lanjut produksi →</button></section>`;}
function production(item){const slot=(key,label,accept)=>`<label class="ss-upload"><b>${label}</b><small>${item.assets?.[key]?`Tersimpan · ${(item.assets[key].size/1048576).toFixed(1)} MB · ${esc(item.assets[key].mime)}`:'Belum ada aset'}</small><input type="file" data-asset="${key}" accept="${accept}" ${item.stage==='rendering'?'disabled':''}>${item.assets?.[key]?`<button type="button" data-remove="${key}">Lepas aset</button>`:''}</label>`;return `<section class="ss-card"><h3>Susun & render video di BIMA</h3><p>Masukkan foto atau clip produk asli untuk setiap scene. BIMA menyusun MP4 24 detik dengan subtitle; foto dibuat sebagai tampilan produk, tanpa mengarang gerakan atau demonstrasi fungsi.</p><div class="ss-scenes">${[1,2,3].map(i=>slot('scene'+i,'Scene '+i+' · '+((i-1)*8)+'–'+i*8+' detik','image/jpeg,image/png,image/webp,video/mp4')).join('')}</div><div class="ss-grid">${slot('voice','Narasi · opsional · maksimal 24 detik','audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac')}${slot('music','Musik latar · opsional','audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac')}</div><p>JPG, PNG, WebP, atau MP4 · maksimal 30 MB per aset. Musik dipelankan saat narasi tersedia. Tanpa audio, hasil berupa video dengan subtitle.</p><label class="ss-check"><input id="ss-assetsConfirm" type="checkbox">Foto/clip cocok dengan produk dan varian, serta boleh dipakai untuk promosi ini.</label><label class="ss-check"><input id="ss-audioConfirm" type="checkbox">Audio yang saya lampirkan boleh dipakai untuk promosi ini.</label><button class="ss-primary" data-action="render" ${item.stage==='rendering'?'disabled':''}>${item.stage==='rendering'?'Sedang render…':'Render MP4 di BIMA'}</button><p>Render ini tidak memakai layanan AI berbayar. Jika memakai Gemini/Flow untuk membuat clip, lampirkan hasilnya pada scene yang sesuai.</p></section>`;}
function review(item){return `<div class="ss-grid"><section class="ss-card"><h3>Preview versi ${item.render?.revision||'—'}</h3>${item.render?.available?'<video id="ss-preview" controls playsinline preload="metadata"></video>':'<p>Render video terlebih dahulu melalui Produksi Video.</p>'}${item.render?`<p>720 × 1280 · 24 detik · subtitle tertanam · narasi ${item.render.voiceIncluded?'ada':'tidak ada'} · musik ${item.render.musicIncluded?'ada':'tidak ada'}</p>`:''}</section><section class="ss-card"><h3>Keputusan owner</h3><label class="ss-check"><input id="ss-reviewVisual" type="checkbox">Visual, teks, dan varian produk sudah sesuai.</label><label class="ss-check"><input id="ss-reviewAudio" type="checkbox">Audio dan subtitle sudah saya tonton/periksa sampai akhir.</label><label class="ss-check"><input id="ss-reviewProduct" type="checkbox">Produk tujuan dan link affiliate sudah benar.</label><label>Catatan revisi<textarea id="ss-notes" maxlength="600" rows="4">${esc(item.review?.notes||'')}</textarea></label><div class="ss-actions"><button class="ss-primary" data-action="approve" ${!item.render?.available?'disabled':''}>Approve video</button><button data-action="revision" ${!item.render?.available?'disabled':''}>Minta revisi</button></div><p>Approve hanya menyiapkan paket unggah. Video belum diposting ke Shopee.</p>${item.review?`<p>Review: ${esc(item.review.decision)} · ${esc(item.review.notes||'Tanpa catatan')}</p>`:''}</section></div>`;}
function publishing(item){return `<div class="ss-grid"><section class="ss-card"><h3>Jadwal & paket unggah</h3><div class="ss-fields">${field('date','Rencana tanggal tayang · WIB','date')}${field('time','Rencana jam tayang · WIB','time')}${area('caption','Caption untuk Shopee Video',4)}</div><p>Jadwal ini adalah rencana produksi, belum menjadi jadwal otomatis di Shopee.</p><div class="ss-actions"><button class="ss-primary" data-action="export" ${!['approved','published'].includes(item.stage)?'disabled':''}>Unduh paket siap unggah</button><button data-action="copyCaption">Salin caption</button></div><ol><li>Unduh MP4 hasil review.</li><li>Buka Shopee → Shopee Video → tombol +, lalu pilih video.</li><li>Tempel caption dan gunakan Tambah Produk untuk listing yang sama.</li><li>Periksa varian dan tag produk, lalu posting di Shopee.</li></ol><p><b>Upload otomatis belum terhubung.</b> Open API affiliate akun ini belum tersedia; akses browser Seller Centre tertahan karena toko nonaktif. Keduanya terpisah dari kemampuan produksi BIMA.</p><label>URL Shopee Video setelah tayang<input id="ss-publishedUrl" type="url" value="${esc(item.publication?.url||'')}" placeholder="https://…"></label><label class="ss-check"><input id="ss-tagConfirm" type="checkbox">Saya sudah membuka video tayang dan memastikan tag produk benar.</label><button data-action="record">Catat video tayang</button>${item.publication?`<p>Dicatat berdasarkan konfirmasi owner pada ${new Date(item.publication.confirmedAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB. Belum diverifikasi API.</p>`:''}</section><aside class="ss-card"><h3>Performa · input dari Shopee</h3><p>Masukkan angka dari laporan resmi. BIMA belum menarik laporan Shopee secara otomatis.</p><div class="ss-fields">${[['views','Views'],['clicks','Klik produk'],['orders','Order'],['earned','Komisi diterima (Rp)']].map(([k,l])=>`<label>${l}<input type="number" min="0" step="any" data-perf="${k}" value="${esc(item.performance?.[k]??'')}"></label>`).join('')}</div><button data-action="performance">Simpan performa</button><h3>Cadangan produksi</h3><button data-action="backup">Unduh data semua draft</button></aside></div>`;}
async function action(name){
 if(['seed','new'].includes(name)&&dirty)await save();
 if(name==='signin'){collect();location.href=base()+'/auth/google/start';return;}
 if(name==='sync'){collect();if(dirty)await save();await load();return;}
 if(name==='backup'){download(JSON.stringify({drafts,exportedAt:new Date().toISOString()},null,2),'bima-shopee-drafts.json','application/json');return;}
 if(name==='seed'){
  collect();const existing=drafts.find(x=>x.id==='shopee-tumbler-41561442154');if(existing){selected=existing.id;view='research';draw();return;}
  const r=await fetch('shopee-studio-seed.json?v=20261025',{cache:'no-store'});if(!r.ok)throw Error('Draft riset tidak dapat dimuat.');const seed=await r.json();replace((await json('/drafts','POST',seed)).draft);dirty=false;view='research';draw();message('Draft tumbler beserta link affiliate dan komisi Shopee Video sudah disiapkan.');return;
 }
 if(name==='new'){collect();const seed={product:'Produk baru',productUrl:'',affLink:'',facts:'',caption:'',price:null,videoCommission:null,socialCommission:null,date:'',time:'19:00',scenes:[{text:'Tulis hook yang sesuai fakta produk.',visual:''},{text:'Kenalkan satu detail produk yang terverifikasi.',visual:''},{text:'Cek detail melalui tag produk di video ini.',visual:''}]};replace((await json('/drafts','POST',seed)).draft);dirty=false;view='research';draw();return;}
 if(!d())return;
 if(name==='save'){await save();draw();message('Draft disimpan. Perubahan produksi membatalkan persetujuan versi sebelumnya.');return;}
 if(name==='brief'){collect();const item=d();const text=`PRODUK: ${item.product}\nLISTING: ${item.productUrl}\nFAKTA: ${item.facts}\nFORMAT: 9:16, 24 detik. Pertahankan produk/varian asli; jangan buat testimoni atau demonstrasi rekaan.\n`+item.scenes.map((s,i)=>`SCENE ${i+1} (${i*8}–${(i+1)*8}s)\nVisual: ${s.visual}\nNarasi/subtitle: ${s.text}`).join('\n\n');download(text,'brief-produksi-shopee.txt','text/plain');message('Brief produksi diunduh. Aset dan MP4 dapat disusun di menu Produksi Video.');return;}
 if(name==='render'){const assetsConfirmed=el('assetsConfirm')?.checked,audioConfirmed=el('audioConfirm')?.checked;if(dirty)await save();replace((await json('/drafts/'+d().id+'/render','POST',{assetsConfirmed,audioConfirmed})).draft);view='production';draw();message('Render berjalan di server BIMA. Kamu bisa menunggu di sini.');return;}
 if(['approve','revision','export','record'].includes(name)&&dirty)throw Error('Ada perubahan belum disimpan. Simpan draft, lalu render dan review versi terbaru.');
 if(name==='approve'||name==='revision'){const result=await json('/drafts/'+d().id+'/review','POST',{decision:name==='approve'?'approve':'revision',notes:el('notes')?.value||'',visualChecked:el('reviewVisual')?.checked,audioChecked:el('reviewAudio')?.checked,productChecked:el('reviewProduct')?.checked});replace(result.draft);draw();message(name==='approve'?'Video approved. Paket unggah tersedia pada menu Publikasi.':'Catatan revisi tersimpan. Perbaiki storyboard/aset lalu render ulang.');return;}
 if(name==='copyCaption'){collect();await navigator.clipboard.writeText(d().caption);message('Caption disalin.');return;}
 if(name==='export'){const id=d().id,p=await json('/drafts/'+id+'/package');const video=await (await request('/drafts/'+id+'/video')).blob();download(video,'shopee-'+id+'.mp4');download(JSON…77546 tokens truncated…-depth","date":"2026-11-03","time":"19:30","title":"How Deep Is the Ocean?","format":"Shorts · 10s","status":"Prompt Ready","platform":"youtube","caption":"The ocean's deepest known point, Challenger Deep in the Mariana Trench, lies approximately 10,935 meters below the surface—nearly 11 kilometers. #OrbitAndOcean #Ocean #ChallengerDeep #Science #Shorts","prompt":"ORBIT & OCEAN | How Deep Is the Ocean?\nCreate ONE complete 10-second video, vertical portrait 9:16, 1080x1920.\nUse the three supplied scene references in order: sunlit shallow water, dark descent, deep seafloor.\n\nSTYLE:\nPhotorealistic scientific CGI ocean documentary. Keep the same compact white spherical submersible, yellow protective frame, small viewport and two LED floodlights. Use image 1 as the master vehicle design; images 2 and 3 guide environment and framing. Preserve proportions and equipment. No divers, monsters, logos or watermark.\n\n0.0–2.5s — HOOK\nUse image 1: the submersible begins descending below the sunlit surface. Camera follows gently downward.\nVoice-over and subtitle: \"How deep is the ocean?\"\n\n2.5–5.5s — DESCENT\nUse a clear cinematic time-jump dissolve to image 2. The submersible is now in dark deep water; only its lamps reveal sparse marine snow. No sunlight, surface or seabed visible.\nVoice-over and subtitle: \"Its deepest point, Challenger Deep,\"\n\n5.5–10.0s — REVEAL\nUse another time-jump transition to image 3: the same submersible hovers above a gently undulating sediment-covered seabed. Only its lamps illuminate the bottom. Hold the final view from 9–10s.\nVoice-over: \"lies nearly eleven kilometers below the surface.\"\nSubtitles in sequence:\n\"lies nearly eleven kilometers\"\n\"below the surface.\"\nAdd one small clear label above the subtitles from 6.5–10s:\n\"CHALLENGER DEEP | ~10,935 m\"\n\nNARRATION:\nOne warm, clear English narrator.\nExact full script:\n\"How deep is the ocean? Its deepest point, Challenger Deep, lies nearly eleven kilometers below the surface.\"\nStart at 0.2s and finish by 8.8s. Natural delivery, no additional words or cut-off syllables.\n\nSUBTITLES:\nSynchronize precisely with the voice. White semibold type with dark shadow, maximum two lines around 72% frame height. Avoid the bottom 20% and rightmost 15%. Keep the depth label separate and readable.\n\nMUSIC:\nQuiet original cinematic underwater ambient music beneath the voice. Subtle mechanical hum, no horror jump scares. Gentle resolved fade by 10 seconds.\n\nSCIENCE:\nChallenger Deep is the deepest known ocean location, in the Mariana Trench, approximately 10,935 meters below sea level. This is maximum depth, not average ocean depth. The journey is compressed with time jumps, not a real-time ten-second descent. No sunlight at the deep seafloor, no coral reefs, vegetation or fantasy vertical chasm. The craft is an illustrative full-ocean-depth submersible, not footage of a named expedition.\n\nOUTPUT:\nExactly 10 seconds, one coherent portrait video with a finished ending. No new narration or scenes after 9s.","notes":"Owner requested ocean depth theme for 3 November 2026. Portrait 9:16, 10 seconds, English VO and subtitles. Three separate generated reference images in conversation: sunlit shallow water, dark descent, sediment-covered deep seabed; not attached to calendar. Cinematic time jumps, not real-time descent. Planning slot 19:30 WIB; not scheduled for YouTube upload. Final MP4 and owner review required. Source: https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/","approved":false,"mediaName":"","youtubeId":""},{"date":"2026-11-05","id":"yt26-20261105-aliens-real","title":"Are Aliens Real?","caption":"Are aliens real? We still have no confirmed evidence of life beyond Earth. Scientists keep searching—from distant planets to icy moons. #OrbitAndOcean #Aliens #Space #Science #Shorts","source":"https://science.nasa.gov/uap/faqs/","shots":[["0–2s","Slow push toward a mysterious blue exoplanet with a thin cyan atmospheric rim and distant warm star. No creatures or UFOs; this is a speculative world, not evidence of life.","Are aliens real?"],["2–6s","Cut to a radio telescope beneath the Milky Way. Slowly tilt its dish skyward, tiny red indicator light, realistic silent mechanical motion. No fabricated detection or incoming alien message.","We have no confirmed evidence yet."],["6–10s","Glide over a cracked icy moon with distant Jupiter. Convey the continuing search without showing microbes, organisms or a discovery. Settle into a composed final frame.","But the search continues."]],"time":"19:30","format":"Shorts · 10s","status":"Prompt Ready","platform":"youtube","approved":false,"mediaName":"","youtubeId":"","prompt":"Vertical 9:16, cinematic photorealistic space documentary CGI, navy/cyan/gold grade. Exactly 10 seconds TOTAL across three shots (not 10 seconds per shot). Use reference images in scene order. Same warm clear English narrator, natural pace. Voice foreground, quiet original ambient space music, subtle transition whooshes. English subtitles exactly matching voice-over, lower safe area, large white type, max two lines. No extra speech, logos or watermark. Hold ending and gently fade music during last 0.5 seconds. No cropped words. If the selected Gemini video model does not offer 10s, render a supported length then edit to the specified 10s timeline; preserve full narration.\n\nTITLE: Are Aliens Real?\n\nSCENE 1 | 0–2s\nVISUAL PROMPT: Slow push toward a mysterious blue exoplanet with a thin cyan atmospheric rim and distant warm star. No creatures or UFOs; this is a speculative world, not evidence of life.\nVOICE-OVER / SUBTITLE (exact): \"Are aliens real?\"\n\nSCENE 2 | 2–6s\nVISUAL PROMPT: Cut to a radio telescope beneath the Milky Way. Slowly tilt its dish skyward, tiny red indicator light, realistic silent mechanical motion. No fabricated detection or incoming alien message.\nVOICE-OVER / SUBTITLE (exact): \"We have no confirmed evidence yet.\"\n\nSCENE 3 | 6–10s\nVISUAL PROMPT: Glide over a cracked icy moon with distant Jupiter. Convey the continuing search without showing microbes, organisms or a discovery. Settle into a composed final frame.\nVOICE-OVER / SUBTITLE (exact): \"But the search continues.\"","notes":"Owner requested 2026-11-05, planning time 19:30 WIB, total 10s / 3 scenes. Six standalone portrait reference images generated in the conversation (three per episode); not attached to repository calendar. Scientific source checked 24 Oct 2026: https://science.nasa.gov/uap/faqs/. Recheck alien evidence before publication. Owner review required. No rendered video or recorded voice-over yet."},{"date":"2026-11-07","id":"yt26-20261107-pluto-dwarf","title":"Why Is Pluto No Longer a Planet?","caption":"Pluto is a dwarf planet under the IAU definition: it orbits the Sun and is nearly round, but has not cleared its orbital neighborhood. That means it does not gravitationally dominate that region—not that a planet's orbit must be empty. #OrbitAndOcean #Pluto #SpaceFacts #Shorts","source":"https://science.nasa.gov/dwarf-planets/pluto/facts/","shots":[["0–2s","Slow orbit around recognizable Pluto, rust-brown and cream icy terrain, pale heart-shaped Tombaugh Regio, dramatic low sunlight. Pluto does not shrink or change shape.","Why was Pluto reclassified?"],["2–6s","Pull back to reveal several distant separate Kuiper belt icy bodies around Pluto's orbital region. Vast separation, conceptual compressed spatial view, not to scale. No crowded asteroid swarm or rings. Show lack of gravitational dominance, not a collision.","It hasn't cleared its orbital neighborhood."],["6–10s","Return to a dignified Pluto hero view with small Charon off to one side. Gently drift toward the heart-shaped terrain, then hold the final frame.","It's a dwarf planet."]],"time":"19:30","format":"Shorts · 10s","status":"Prompt Ready","platform":"youtube","approved":false,"mediaName":"","youtubeId":"","prompt":"Vertical 9:16, cinematic photorealistic space documentary CGI, navy/cyan/gold grade. Exactly 10 seconds TOTAL across three shots (not 10 seconds per shot). Use reference images in scene order. Same warm clear English narrator, natural pace. Voice foreground, quiet original ambient space music, subtle transition whooshes. English subtitles exactly matching voice-over, lower safe area, large white type, max two lines. No extra speech, logos or watermark. Hold ending and gently fade music during last 0.5 seconds. No cropped words. If the selected Gemini video model does not offer 10s, render a supported length then edit to the specified 10s timeline; preserve full narration.\n\nTITLE: Why Is Pluto No Longer a Planet?\n\nSCENE 1 | 0–2s\nVISUAL PROMPT: Slow orbit around recognizable Pluto, rust-brown and cream icy terrain, pale heart-shaped Tombaugh Regio, dramatic low sunlight. Pluto does not shrink or change shape.\nVOICE-OVER / SUBTITLE (exact): \"Why was Pluto reclassified?\"\n\nSCENE 2 | 2–6s\nVISUAL PROMPT: Pull back to reveal several distant separate Kuiper belt icy bodies around Pluto's orbital region. Vast separation, conceptual compressed spatial view, not to scale. No crowded asteroid swarm or rings. Show lack of gravitational dominance, not a collision.\nVOICE-OVER / SUBTITLE (exact): \"It hasn't cleared its orbital neighborhood.\"\n\nSCENE 3 | 6–10s\nVISUAL PROMPT: Return to a dignified Pluto hero view with small Charon off to one side. Gently drift toward the heart-shaped terrain, then hold the final frame.\nVOICE-OVER / SUBTITLE (exact): \"It's a dwarf planet.\"","notes":"Owner requested 2026-11-07, planning time 19:30 WIB, total 10s / 3 scenes. Six standalone portrait reference images generated in the conversation (three per episode); not attached to repository calendar. Scientific source checked 24 Oct 2026: https://science.nasa.gov/dwarf-planets/pluto/facts/. Recheck alien evidence before publication. Owner review required. No rendered video or recorded voice-over yet."},{"id":"yt26-20261108-satellites-orbit","date":"2026-11-08","time":"19:30","title":"Why Don't Satellites Fall?","format":"Shorts · 10s","status":"Prompt Ready","platform":"youtube","caption":"Satellites ARE falling! Earth's gravity pulls them inward, while their sideways speed keeps them falling around Earth instead of hitting the ground. That's an orbit. 🛰️🌍 #OrbitAndOcean #Satellites #SpaceFacts #Science #Shorts","prompt":"ORBIT & OCEAN — WHY DON'T SATELLITES FALL?\nCreate a visually gripping science YouTube Short.\nFINAL EDIT: exactly 10 seconds. Vertical 9:16.\n\nSTYLE: Photorealistic cinematic space CGI, realistic blue Earth, thin atmospheric rim, dramatic sunrise, detailed silver satellite with two dark-blue solar panels. Maintain the SAME satellite, Earth lighting and orbital direction in all shots. Premium documentary look, no cartoon style.\n\nSCENE 1 | 0.0–2.0 seconds | HOOK\nOpen close behind the satellite above Earth's curved horizon. Track alongside it as sunlight flashes across its solar panels. Earth fills the lower frame.\nVOICE-OVER: \"Why don't satellites fall?\"\n\nSCENE 2 | 2.0–5.5 seconds | SURPRISE\nPull back smoothly. Reveal the satellite's curved path around Earth. Briefly show a subtle inward arrow pointing toward Earth's center and a tangential arrow showing sideways motion. These are educational graphics, not physical beams. No outward force arrow.\nVOICE-OVER: \"They do! Gravity pulls them down.\"\n\nSCENE 3 | 5.5–10.0 seconds | ANSWER\nContinue the pullback into a clear conceptual orbital view. The satellite moves sideways along a curved path while Earth's surface curves away beneath it. Use tasteful time compression, not a full real-time orbit in seconds. Finish on a majestic satellite-and-Earth frame.\nVOICE-OVER: \"But they move sideways fast enough to keep missing Earth.\"\n\nAUDIO: One warm, engaging English narrator, clear and natural at about 140–150 words per minute. Speak only the exact lines above. Finish the final word by 9.5 seconds. Low original cinematic ambient music, subtle transition sound, no external engine noise in vacuum. Gently resolve music over the final half-second.\n\nSUBTITLES: Large readable English subtitles matching the narration exactly, white with subtle shadow, maximum two lines in the lower safe area. Keep them away from the bottom and right-side YouTube controls.\n\nSCIENCE: Gravity remains active in orbit. A satellite is continually falling toward Earth while moving sideways. No hovering, antigravity, atmospheric flight, constant rocket flames, collisions, cables, extra spacecraft, logos or watermarks.\n","notes":"Owner requested 8 November 2026, space topic: satellites. Planning time 19:30 WIB, English VO/subtitles, 3 scenes, 10-second final edit. Google Flow production brief. Source checked 24 October 2026: https://spaceplace.nasa.gov/orbits/en/ . If the selected Flow model does not offer a 10-second output, generate supported-length clips and edit to this 10-second timeline; do not truncate narration. No generated video or recorded VO attached. Owner review required before upload.","approved":false,"mediaName":"","youtubeId":""},{"id":"yt26-20261109-ufo","date":"2026-11-10","time":"20:30","title":"UFO","format":"Shorts · 10s","status":"Prompt Ready","platform":"youtube","caption":"Does UFO mean aliens? UFO stands for unidentified flying object. Unidentified does not automatically mean extraterrestrial. Visuals are AI-generated illustrations, not real sighting footage. #OrbitAndOcean #UFO #Space #Science #Shorts","prompt":"ORBIT & OCEAN — UFO\nCreate a 10-second final YouTube Short, vertical 9:16, photorealistic cinematic educational reconstruction. Use the three supplied scene images in order, consistent mountain night landscape, navy/cyan/gold palette, slow elegant camera movement. This is an illustration, not authentic sighting footage.\n\nSCENE 1 | 0–2 seconds | HOOK\nSlow push toward a single distant unresolved white light above the mountain ridge. Keep it small and shapeless; no spaceship reveal or impossible acceleration.\nVOICE-OVER: \"Does UFO mean aliens?\"\n\nSCENE 2 | 2–6 seconds | EXPLANATION\nCut to the camera on its tripod aimed toward the light. Subtle focus pull from the lens to the sky; suggest scientific observation. Do not invent readable data or a detected signal.\nVOICE-OVER: \"It means unidentified flying object.\"\n\nSCENE 3 | 6–10 seconds | PAYOFF\nPull back into the wide Milky Way mountain view. Preserve a tiny distant unresolved light if visible, without revealing what it is. Calm steady final frame.\nVOICE-OVER: \"Unidentified doesn't mean extraterrestrial.\"\n\nAUDIO: One warm, curious, articulate English narrator. Say only the exact lines above, naturally and clearly, finishing all words by 9 seconds. Quiet original mysterious ambient music, gentle atmospheric wind, no alien or spaceship noises. Resolve music during the final half-second.\nSUBTITLES: Exact English narration in large white letters with a subtle shadow, max two lines, lower safe area clear of YouTube controls. Add a small readable \"Illustration\" label in the upper safe area throughout.\nNo extra dialogue, logos, watermarks, alien creatures, flying saucers, fabricated real evidence, government seals or fake news.\nFINAL DURATION: 10 seconds total, not per scene. If the selected Flow model does not offer 10 seconds, generate supported-length clips and edit to the timeline above without cutting narration.","notes":"Owner requested UFO topic, 10s, 3 scene photos and Google Flow voice-over prompts. Owner corrected publication date to 10 November 2026. Planning time retained at 20:30 WIB. Three separate portrait reference images generated in conversation; not attached to this calendar entry. Science sources checked 24 October 2026: https://astrobiology.nasa.gov/ask-an-astrobiologist/ and https://science.nasa.gov/uap/faqs/ . Owner review required. No rendered video or recorded audio attached.","approved":false,"mediaName":"","youtubeId":""}];
SEED.items.youtube.push(...SCHEDULE_2026);
const INTRO_2026={"id":"yt-orbit-ocean-intro-20261011","date":"2026-10-11","time":"20:30","title":"Welcome to Orbit & Ocean 🌍🌊 | Small Videos. Big Wonders.","format":"Shorts · 10s","status":"Prompt Ready","platform":"youtube","caption":"Welcome to Orbit & Ocean! 🌊🪐 From the mysteries of the ocean to the wonders of space, we bring one surprising science discovery at a time. Small Videos. Big Wonders. #OrbitAndOcean #ScienceShorts #Shorts","prompt":"ORBIT & OCEAN · ANIMATED SCIENCE SHORT · CREATIVE STANDARD V2\nGenerate EXACTLY 10 seconds. VERTICAL PORTRAIT 9:16 composition natively. Keep the main subject centered in the middle 60% of the frame so a landscape export can be center-cropped safely. One clear science fact only.\nVISUAL STYLE: charming premium stylized 3D animation with expressive rounded characters, polished colorful cartoon environments, cinematic light but NEVER photorealistic/live-action. Soft friendly shapes and smooth clear motion, visually engaging and suitable for all ages. This is an educational cartoon, NOT a wildlife documentary, surgery scene, medical cutaway, or anatomical reconstruction. NO exposed internal organs, bloody tissue, veins, dissection, translucent skin, x-rays, grotesque realism, or scary imagery. Scientific mechanisms must use separate simple floating symbols, soft glow, arrows, or harmless diagrams outside the animal. Avoid tiny hard-to-read details.\nSHOT PLAN (exactly three readable beats, no abrupt final cut):\n0.0–1.5 sec — HOOK: A friendly stylized blue Earth appears in starry space; playful light rays.\n1.5–6.5 sec — EXPLAIN: The camera dives toward a vivid cartoon ocean, with a cute octopus and coral scenery, then rising bubbles turn into stars.\n6.5–10.0 sec — PAYOFF AND CLOSURE: Saturn's colorful rings appear in a playful illustrated cosmic vista; finish holding the complete scene with a gentle musical resolve. Last 1.5 seconds hold a composed final image, no new exposition or scene introduced.\nVOICE-OVER: Speak EXACTLY this single short English line, nothing added: \"From oceans to planets, discover new wonders. Welcome to Orbit and Ocean!\"\nTIMING IS MANDATORY: use one warm, articulate natural English narrator, slightly energetic but NEVER rushed. Begin speaking at 0.4 seconds; COMPLETE the whole line by 7.2 seconds. Do not start any new spoken words after 7.2 seconds. Reserve 7.2–10.0 seconds for visual payoff and light music/SFX only. Never crop, abruptly fade, truncate, or trail off the end of any word. If speech cannot fit, prioritize finishing the exact line cleanly and leave the last seconds silent; DO NOT invent extra narration.\nAUDIO: voice clearly louder than understated original instrumental music; gentle underwater/space/nature effects; finish music with a gentle resolved fade between 9.5 and 10.0 seconds, not an abrupt cut.\nOUTPUT QUALITY: coherent animation throughout, objects move naturally, easy to understand on a phone, strong single central hero shot, no jump cuts near the end. No on-screen writing, captions, logos, watermark, fake news/documentary footage, or unfinished sentence.","notes":"PILOT INTRO (11 October 2026). Channel: Orbit & Ocean. Tagline: Small Videos. Big Wonders. Gemini handles visual+audio generation. 10 seconds; native vertical 9:16; review narration and transitions. Publishing time 20:30 WIB is provisional ONLY, not a committed auto-publish job. Do not publish until final video is uploaded and approved.\nCREATIVE QA V2: review cartoon style (not realistic anatomy), narration fully finished by 7.2s, educational visual clear, no cut-off or abrupt ending. Regenerate if any fail.","approved":false,"mediaName":"","youtubeId":""};
SEED.items.youtube.unshift(INTRO_2026);
const STORAGE='bima-content-studio-v3';
const CHANNEL_ORDER=['youtube','tiktok','shopee','instagram','facebook','x'];
const PLATFORM_COPY={youtube:{name:'YouTube',label:'ACTIVE'},tiktok:{name:'TikTok',label:'PHASE 2'},shopee:{name:'Shopee Affiliate',label:'PHASE 2'},instagram:{name:'Instagram',label:'LATER'},facebook:{name:'Facebook',label:'LATER'},x:{name:'X',label:'LATER'}};
const $=id=>document.getElementById(id);
const clone=v=>JSON.parse(JSON.stringify(v));
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const dateStr=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
const V1_PROMPT_HASHES={"yt-octopus-001":"f96de30b","yt-mantis-002":"94092d4c","yt26-20261014":"f46ca8a8","yt26-20261019":"59b3b53b","yt26-20261021":"1de92a9d","yt26-20261023":"e6cf2268","yt26-20261026":"9e3a14b0","yt26-20261028":"4d019f3d","yt26-20261030":"2ae16e4a","yt26-20261102":"768b3de5","yt26-20261104":"85a0a67f","yt26-20261106":"b3ae6c6c","yt26-20261109":"bbfd4124","yt26-20261111":"d15e4afe","yt26-20261113":"1e1f91b8","yt26-20261116":"8c520652","yt26-20261118":"9c5a0a8b","yt26-20261120":"6822e8d6","yt26-20261123":"bf8f62ad","yt26-20261125":"5f0efa08","yt26-20261127":"4faef85e","yt26-20261130":"8742736","yt26-20261202":"f1300574","yt26-20261204":"71536d1d","yt26-20261207":"34ac4a9d","yt26-20261209":"10a36974","yt26-20261211":"65bfdd3d","yt26-20261214":"4a3ff37b","yt26-20261216":"8a0fe528","yt26-20261218":"11e5865c","yt26-20261221":"6d06b076","yt26-20261223":"348eb9eb","yt26-20261225":"83d2716a","yt26-20261228":"2a90caac","yt26-20261230":"12d22936","yt26-20261231":"ad18c8b8","yt-orbit-ocean-intro-20261011":"cf0211be"};
function contentPromptHash(value){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
function migrateLegacyCreativePrompts(data){
  const revised=new Map([...SEED.items.youtube,...SCHEDULE_2026,INTRO_2026].map(item=>[item.id,item]));
  let changed=0;
  for(const draft of data.items.youtube){
    const latest=revised.get(draft.id);
    if(!latest||draft.approved||draft.youtubeId||draft.prompt===latest.prompt)continue;
    // Never silently replace custom prompts or any approved/uploaded publication.
    if(typeof draft.prompt!=="string"||contentPromptHash(draft.prompt)!==V1_PROMPT_HASHES[draft.id])continue;
    draft.prompt=latest.prompt;
    draft.notes=(draft.notes||"")+"\nCREATIVE QA V2: prompt updated to stylized animation with a complete 10-second narrated ending. Existing MP4 is unchanged: review or regenerate it before approval.";
    changed++;
  }
  if(changed){try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch(e){console.warn("Cannot persist creative prompt refresh",e);}}
  return data;
}
// One-time recovery requested by the owner on 12 October 2026.
function recoverOctober12Draft(data){
 const recovery='octopus-20261012-owner-request-v1';
 if(data.deletedItemIds?.includes('yt-octopus-001')||data.recoveries?.includes(recovery))return data;
 const original=SEED.items.youtube.find(item=>item.id==='yt-octopus-001');
 if(original&&!data.items.youtube.some(item=>item.id===original.id)){
   data.items.youtube.push(clone(original));
   data.active='youtube';data.selected=original.date;data.month=original.date.slice(0,7);data.selectedItem=original.id;
 }
 data.recoveries=[...(Array.isArray(data.recoveries)?data.recoveries:[]),recovery];
 try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch(e){console.warn('Could not persist recovered October 12 draft',e);}
 return data;
}
function migrateOct19Pufferfish(data){
 const old=data?.items?.youtube?.find(i=>i.id==="yt26-20261019");
 const updated=SCHEDULE_2026.find(i=>i.id==="yt26-20261019");
 if(old&&updated&&old.title==="A Day on Venus Is Longer Than Its Year"&&!old.approved&&!old.youtubeId&&!old.mediaName&&!old.filePath&&
    (!old.episodePlan||/venus/i.test(JSON.stringify(old.episodePlan)))){
   Object.assign(old,{title:updated.title,caption:updated.caption,prompt:updated.prompt,notes:updated.notes,status:"Prompt Ready"});
   delete old.episodePlan;
   try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch(e){console.warn("Oct19 migration could not save",e);}
 }
 return data;
}
const EXTRA_YOUTUBE_DRAFT_20261019={"id":"yt26-20261019-how-stars-are-born-extra","date":"2026-10-20","time":"19:30","title":"HOW STARS ARE BORN","format":"Shorts · 20s","status":"Draft","platform":"youtube","caption":"How are stars born? 🌌 Deep inside clouds of gas and dust, gravity creates a protostar. When nuclear fusion begins, a new star shines. ✨ #OrbitAndOcean #Space #Astronomy #ScienceShorts #Shorts","prompt":"ORBIT & OCEAN | HOW STARS ARE BORN | 20-SECOND YOUTUBE SHORT\n\nProduce TWO consecutive 10-second clips, vertical 9:16, 4K photorealistic cinematic astrophysics documentary, consistent orange-blue nebula and golden protostar. English documentary voice-over, synchronized white English captions in lower safe area, deep cinematic atmospheric music. No cartoons, logos, watermarks, or fantasy explosions.\n\nCLIP 1 (0–10s)\n0–3s: Fly through spectacular orange and blue interstellar nebula, realistic gas clouds, dust and stars.\n3–7s: Gravity draws dense gas inward; cloud contracts and rotates, a glowing protostar emerges.\n7–10s: Slow push toward the protostar and its rotating dusty accretion disk.\nVOICE-OVER: \"Stars are born inside giant clouds of gas and dust. Gravity pulls the material together, making it hotter.\"\n\nCLIP 2 (10–20s)\nContinue directly from final frame of clip 1, identical protostar and environment.\n10–14s: Young protostar becomes hotter and denser, dusty disk swirls; scientifically plausible time-lapse over millions of years.\n14–17s: Core reaches nuclear fusion; star stabilizes and radiates golden-white light, no explosion.\n17–20s: Camera pulls back showing newborn star surrounded by remaining gas and dust, where planets may one day form.\nVOICE-OVER: \"Eventually, nuclear fusion begins. A new star shines, and leftover material may one day form planets.\"\n\nSUBTITLES\n00:00–00:04 Stars are born inside giant clouds of gas and dust.\n00:04–00:10 Gravity pulls the material together, making it hotter.\n00:10–00:15 Eventually, nuclear fusion begins.\n00:15–00:20 A new star shines, and leftover material may one day form planets.\n\nUse last frame of Clip 1 as reference for Clip 2. Combine both in CapCut if necessary. Adjust VO/subtitle timing to fit exactly 20 seconds.","notes":"ADDITIONAL OWNER-REQUESTED CONTENT · 20 Oct 2026. Draft only; not approved, scheduled, or published. 2 × 10s Google Flow clips. Photorealistic space documentary; owner reviews final MP4 and captions before approval."};
function addRequestedStarsDraft(data){
 if(!data?.items?.youtube)return data;
 const existing=data.items.youtube.find(i=>i.id===EXTRA_YOUTUBE_DRAFT_20261019.id);
 if(existing&&existing.date==='2026-10-19'&&!existing.approved&&!existing.youtubeId&&!existing.mediaName&&!existing.filePath){
  existing.date='2026-10-20';
  try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch(e){console.warn('Draft date migration could not persist',e);}
 }
 if(!data.items.youtube.some(i=>i.id===EXTRA_YOUTUBE_DRAFT_20261019.id||String(i.title||'').trim().toLowerCase()==='how stars are born')){
  data.items.youtube.push(clone(EXTRA_YOUTUBE_DRAFT_20261019));
  try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch(e){console.warn('Stars draft could not persist',e);}
 }
 return data;
}
function load(){try{const txt=localStorage.getItem(STORAGE);if(txt){const data=JSON.parse(txt);if(data?.version===3&&data?.items?.youtube&&data?.channels){const ufoDateCorrection=data.items.youtube.find(x=>x.id==="yt26-20261109-ufo");if(ufoDateCorrection&&ufoDateCorrection.date==="2026-11-09"){ufoDateCorrection.date="2026-11-10";ufoDateCorrection.notes=(ufoDateCorrection.notes||"")+"\nOwner corrected date to 10 November 2026; time retained at 20:30 WIB.";try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch(e){console.warn("Could not persist UFO date correction",e);}}const sunDateCorrection=data.items.youtube.find(x=>x.id==="yt26-20261024-sun");if(sunDateCorrection&&sunDateCorrection.date==="2026-10-24"){sunDateCorrection.date="2026-10-25";sunDateCorrection.notes="Owner requested 25 October 2026. Sun episode moved to 25 October per owner's corrected date; Mars remains on 24 October. Planning time 20:30 WIB. Three separate portrait reference illustrations generated in the conversation: full Sun, solar limb close-up, sunlit Earth. English voice-over script and synchronized captions included. Images are available in the conversation, not attached to this calendar entry. No rendered video or recorded audio attached. Not approved for automatic upload.";try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch(e){console.warn("Could not persist Sun date correction",e);}}const ids=new Set(data.items.youtube.map(x=>x.id));let newPlanned=0;for(const planned of [INTRO_2026,...SCHEDULE_2026]){if(!ids.has(planned.id)&&!data.deletedItemIds?.includes(planned.id)){data.items.youtube.push(clone(planned));newPlanned++;}}if(newPlanned){try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch(e){console.warn("Could not persist new calendar entries",e);}}if(data.selectedItem==="yt26-20261013-piapi-pilot")data.selectedItem="yt26-20261013-moon";return addRequestedStarsDraft(recoverOctober12Draft(migrateOct19Pufferfish(migrateLegacyCreativePrompts(data))))}}}catch(e){console.warn('Local storage unavailable',e)}const initial=clone(SEED);if(initial.selectedItem==="yt26-20261013-piapi-pilot")initial.selectedItem="yt26-20261013-moon";return addRequestedStarsDraft(recoverOctober12Draft(initial))}
let state=load();let liveFileURL='';let previewId='';let videoSelectionSerial=0;
const MEDIA_DB_NAME='bima-content-studio-v4-assets';
function openMediaDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(Error('IndexedDB unavailable'));const req=indexedDB.open(MEDIA_DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('videos'))db.createObjectStore('videos')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Database open failed'))})}
async function mediaDB(kind,id,blob=null){const db=await openMediaDB();return new Promise((resolve,reject)=>{const tx=db.transaction('videos',kind==='get'?'readonly':'readwrite'),store=tx.objectStore('videos');let req;if(kind==='put')req=store.put(blob,id);else if(kind==='del')req=store.delete(id);else req=store.get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Media storage failed'));tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error||Error('Database transaction failed'))})}
function clearPreview(){videoSelectionSerial++;if(liveFileURL){URL.revokeObjectURL(liveFileURL);liveFileURL=''}previewId='';const v=$('videoPreview');v.pause();v.removeAttribute('src');v.load();$('mediaPreviewWrap').classList.add('hidden');$('videoSpecs').replaceChildren()}
function setFileInfo(text){$('fileFeedback').textContent=text}
function humanSize(bytes){return bytes?((bytes/1024/1024).toFixed(1)+' MB'):'—'}
async function loadVideoForSelection(){const i=getSelected(),id=i?.id||'';clearPreview();const serial=videoSelectionSerial;if(!id){$('uploadTitle').textContent='Select a draft before uploading';setFileInfo('Buat draft baru, lalu pilih video.');return}if(!i.mediaName){$('uploadTitle').textContent='Tarik video ke sini, atau pilih dari komputer';setFileInfo('Belum ada video pada draft ini.');return}setFileInfo('Loading stored video…');try{const f=await mediaDB('get',id);if(serial!==videoSelectionSerial || id!==getSelected()?.id)return;if(!f){setFileInfo('Video tidak ditemukan di browser ini. Pilih ulang file asli agar siap untuk review.');return}previewId=id;liveFileURL=URL.createObjectURL(f);const v=$('videoPreview');v.src=liveFileURL;$('mediaPreviewWrap').classList.remove('hidden');$('uploadTitle').textContent='Ganti file video';setFileInfo(i.mediaName+' · '+humanSize(i.mediaSize||f.size)+' · tersimpan lokal di browser ini (belum server)');$('videoSpecs').innerHTML='<div><strong>'+humanSize(f.size)+'</strong><small>File size</small></div><div><strong id="durationVal">Reading…</strong><small>Duration</small></div><div><strong id="resolutionVal">Reading…</strong><small>Resolution</small></div>';v.onloadedmetadata=()=>{if(previewId!==id)return;const dur=Number.isFinite(v.duration)?v.duration.toFixed(1)+' seconds':'Unknown';$('durationVal').textContent=dur;$('resolutionVal').textContent=v.videoWidth+' × '+v.videoHeight;if(i.format.startsWith('Shorts')&&v.videoWidth>v.videoHeight)setFileInfo(i.mediaName+' · WARNING: landscape video; Shorts should be vertical (9:16). No upload performed.')};}catch(e){setFileInfo('Browser media access failed: '+e.message+'; use HTTPS/browser with IndexedDB available.')}}
async function storeSelectedVideo(file){let i=getSelected();if(!i){setFileInfo('Please create/select a draft before choosing a video.');return}const ext=file.name.split('.').pop()?.toLowerCase();if(!['mp4','mov','webm'].includes(ext||'')){setFileInfo('Unsupported video. Choose MP4, MOV or WebM.');return}if(file.size>500*1024*1024){setFileInfo('File is over 500 MB. This prototype uses browser storage. Secure server upload is required for larger media.');return}setFileInfo('Saving '+file.name+' to browser storage…');try{await mediaDB('put',i.id,file);i.mediaName=file.name;i.mediaSize=file.size;i.mediaLocal=true;i.approved=false;if(i.status==='Approved'||i.status==='QA Pass')i.status='Generated';persist();$('copyMsg').textContent='Video saved for local review only. Re-approve after checking the replacement.';}catch(e){setFileInfo('Cannot save video locally: '+e.message+'. Try MP4 or free browser storage.');}}
async function removeSelectedVideo(){const i=getSelected();if(!i)return;try{await mediaDB('del',i.id)}catch(e){console.warn('Could not remove local video',e)}i.mediaName='';i.mediaSize=0;i.mediaLocal=false;i.approved=false;if(i.status==='Approved')i.status='Draft';clearPreview();persist();setFileInfo('Video removed from this draft. Not uploaded to YouTube.')}

function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(e){$('copyMsg').textContent='Storage blocked. Please export backup JSON.';}render()}
function today(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v={};parts.forEach(x=>{v[x.type]=x.value});return `${v.year}-${v.month}-${v.day}`}
function human(d){return new Date(d+'T12:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}
function gotoChannel(ch){state.active=ch;render();try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch(e){}}
function renderChannels(){const bar=$('channelBar');if(bar.dataset.bimaChannelsReady==='1'&&bar.childElementCount===CHANNEL_ORDER.length){for(const b of bar.children)b.classList.toggle('active',b.dataset.channel===state.active);return;}bar.replaceChildren();bar.dataset.bimaChannelsReady='1';for(const ch of CHANNEL_ORDER){const cfg=PLATFORM_COPY[ch],b=document.createElement('button');b.className='channel'+(state.active===ch?' active':'');b.type='button';b.dataset.channel=ch;const img=document.createElement('img');img.src=ASSETS[ch]||'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect width="72" height="72" rx="18" fill="#ee661e"/><path d="M22 27h28l3 30H19z" fill="white"/><path d="M29 27v-7a7 7 0 0 1 14 0v7" fill="none" stroke="white" stroke-width="5"/><text x="36" y="48" font-family="Arial" font-size="21" font-weight="bold" text-anchor="middle" fill="#ee661e">S</text></svg>');img.alt='';const name=document.createElement('span');name.innerHTML=`<strong>${cfg.name}</strong><small>${ch==='youtube'?'Faceless Shorts':ch==='tiktok'?'TikTok Shop':ch==='shopee'?'Shopee Video':'Not active yet'}</small>`;const badge=document.createElement('span');badge.className='tag';badge.textContent=cfg.label;b.append(img,name,badge);b.addEventListener('click',()=>gotoChannel(ch));bar.appendChild(b)}}
function remoteFor(id){
 const alias=id==='yt26-20261013-moon'?'yt26-20261013-moon-final-with-voice':id;
 const owner=window.BIMA_REMOTE_CONTENT?.[alias]||window.BIMA_REMOTE_CONTENT?.[id];
 const publicItem=window.BIMA_PUBLIC_UPLOADS?.[alias]||window.BIMA_PUBLIC_UPLOADS?.[id];
 const ownerNewer=!!owner&&!window.BIMA_REMOTE_STALE&&(window.BIMA_REMOTE_AT||0)>=(window.BIMA_PUBLIC_AT||0);
 return owner||publicItem?{...(owner||{}),...(!ownerNewer?publicItem||{}:{} )}:null;
}
function itemStatus(item){const status=remoteFor(item?.id)?.status;return ({published:'Published',scheduled:'Scheduled',private_uploaded:'Uploaded Private',uploading:'Uploading',needs_review:'Needs review',approved:'Approved on Railway',draft_with_video:'Video on Railway'})[status]||item?.status||'No draft';}
function items(){return [...new Map(state.items.youtube.filter(x=>x.id!=="yt26-20261013-piapi-pilot").map(x=>[x.id,x])).values()];}
function deduplicateDayItems(entries){
 const chosen=new Map();
 const normalize=t=>String(t||"").toLowerCase().replace(/\b(?:why|does|do|the|a|an|how|what|is|have|has)\b/g,"").replace(/\bchanges\b/g,"change").replace(/[^a-z0-9]/g,"");
 const score=i=>{
   const remote=remoteFor(i.id);
   const st=remote?.status||i.status;
   return ({published:100,scheduled:95,private_uploaded:90,approved:70,Approved:70,"Prompt Ready":20})[st]||10;
 };
 for(const i of entries){
   const key=normalize(i.title),prior=chosen.get(key);
   if(!prior||score(i)>score(prior))chosen.set(key,i);
 }
 return [...chosen.values()];
}
function displayItemsOn(date){return deduplicateDayItems(items().filter(i=>i.date===date));}

function renderCalendar(){const [y,m]=state.month.split('-').map(Number);const label=new Date(y,m-1,1).toLocaleDateString('id-ID',{month:'long',year:'numeric'});$('monthLabel').textContent=label;const grid=$('calendar');grid.replaceChildren();const dow=new Date(y,m-1,1).getDay(),total=new Date(y,m,0).getDate();
// One pass through monthly data instead of rescanning all items for each of 42 cells.
const calendarItemsByDate=new Map();
for(const item of items()){
  if(typeof item.date!=="string")continue;
  let day=calendarItemsByDate.get(item.date);
  if(!day){day=[];calendarItemsByDate.set(item.date,day);}
  day.push(item);
}
for(const [date,day] of calendarItemsByDate)calendarItemsByDate.set(date,deduplicateDayItems(day));
const currentDate=today();
for(let n=0;n<42;n++){const d=n-dow+1;const inMonth=d>=1&&d<=total;const actual=new Date(y,m-1,d);const date=dateStr(actual.getFullYear(),actual.getMonth()+1,actual.getDate());const list=calendarItemsByDate.get(date)||[];const el=document.createElement('button');el.className='day'+(!inMonth?' muted':'')+(date===state.selected?' selected':'')+(date===currentDate?' today':'');el.type='button';el.setAttribute('aria-label',human(date)+(list.length?' · '+list.length+' konten':''));el.setAttribute('aria-pressed',String(date===state.selected));const day=document.createElement('span');day.className='date';day.textContent=String(actual.getDate());const count=document.createElement('span');count.className='count';count.textContent=list.length?list.length+' video planned':'';el.append(day,count);for(const i of list.slice(0,2)){const bubble=document.createElement('span');bubble.className='event';bubble.dataset.itemId=i.id;bubble.title=i.title;bubble.textContent=i.title;el.append(bubble)}window.BIMA_THUMBNAILS?.calendarTile(el,list);el.addEventListener('click',e=>{state.selected=date;state.month=date.slice(0,7);const clickedId=e.target.closest('[data-item-id]')?.dataset.itemId;const first=list.find(i=>i.id===clickedId)||list[0];state.selectedItem=first?.id||'';persist()});grid.appendChild(el)}}
function renderDay(){const dayItems=displayItemsOn(state.selected);$('selectedLabel').textContent=human(state.selected);const list=$('dayList');list.replaceChildren();if(!dayItems.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='Belum ada konten YouTube untuk tanggal ini. Klik + New Short untuk membuat draft.';list.appendChild(empty);return}for(const i of dayItems){const remote=remoteFor(i.id);const confirmed=['published','scheduled','private_uploaded'].includes(remote?.status);const displayStatus=remote?.status==='published'?'Published':remote?.status==='scheduled'?'Scheduled':remote?.status==='private_uploaded'?'Uploaded Private':i.status;const btn=document.createElement('button');btn.type='button';btn.className='item'+(i.id===state.selectedItem?' active':'');btn.innerHTML=`<div class="item-title">${escapeHTML(i.title)}</div><div class="item-meta">${escapeHTML(i.format)} · ${escapeHTML(i.time)} WIB</div><div class="chips"><span class="chip">${escapeHTML(displayStatus)}</span><span class="chip ${i.approved?'green':''}">${confirmed?'YouTube confirmed':i.approved?'Approved':'Awaiting approval'}</span></div>`;window.BIMA_THUMBNAILS?.dayRow(btn,i);btn.addEventListener('click',()=>{state.selectedItem=i.id;render()});list.appendChild(btn)}}
function getSelected(){return items().find(i=>i.id===state.selectedItem)||null}
function renderEditor(){const i=getSelected();$('draftStatus').textContent=itemStatus(i);$('fTitle').value=i?.title||'';$('fDate').value=i?.date||state.selected;$('fTime').value=i?.time||state.channels.youtube.defaultTime;if(i?.format&&![...$('fFormat').options].some(o=>o.value===i.format))$('fFormat').add(new Option(i.format,i.format));$('fFormat').value=i?.format||'Shorts · 10s';$('fStatus').value=i?.status==='Approved'?'QA Pass':(i?.status||'Draft');$('fPrompt').value=i?.prompt||'';$('fCaption').value=i?.caption||'';$('fNotes').value=i?.notes||'';const approval=$('approvalState');if(approval){approval.textContent=i?.approved?'Approved · Saved locally':'Awaiting approval';approval.style.color=i?.approved?'#9deecb':'#ffdcad';}const approvalButton=$('approve');if(approvalButton&&!approvalButton.disabled)approvalButton.textContent=i?.approved?'✓ Approved':'Mark Approved';loadVideoForSelection();document.dispatchEvent(new CustomEvent('bima:episode-selected',{detail:{id:i?.id||null}}))}
function renderQueue(){
 const body=$('queueBody');body.replaceChildren();
 const rows=[...items()];
 // Deduplicate equivalent titles on the same calendar date, including legacy
 // browser drafts and backend-published copies. Distinct topics remain separate.
 const canonicalTitle=t=>String(t||"").toLowerCase()
   .replace(/\b(?:why|does|do|the|a|an|how|what|is|have|has)\b/g,"")
   .replace(/\bchanges\b/g,"change").replace(/[^a-z0-9]/g,"");
 const rank=i=>{
   const remote=remoteFor(i.id);
   const status=remote?.status||i.status;
   return ({published:100,scheduled:95,private_uploaded:90,approved:70,Approved:70,"Prompt Ready":20,"Research Required":5})[status]||10;
 };
 const dedup=new Map();
 for(const item of rows){
   const key=item.date+"|"+canonicalTitle(item.title);
   const old=dedup.get(key);
   if(!old||rank(item)>rank(old))dedup.set(key,item);
 }
 rows.splice(0,rows.length,...dedup.values());
 rows.sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time));
 if(!rows.length){const tr=document.createElement('tr');tr.innerHTML='<td colspan="5">No YouTube drafts yet.</td>';body.append(tr)}
 for(const i of rows){
   const remote=remoteFor(i.id);
   const remoteStatus=remote?.status||null;
   const statusText=remoteStatus==='published'?'Published · Public confirmed'
     :remoteStatus==='scheduled'?'Uploaded by BIMA · Scheduled'
     :remoteStatus==='private_uploaded'?'Uploaded by BIMA · Private'
     :remoteStatus==='uploading'?'BIMA uploading…'
     :remoteStatus==='needs_review'?'Requires review · Do not resubmit'
     :remoteStatus==='approved'?'Approved on Railway · Not yet uploaded'
     :remoteStatus==='draft_with_video'?'Saved on Railway · Awaiting server approval'
     :remoteStatus==='draft'?'Railway draft'
     :i.mediaName?'Local MP4 · Upload status not yet verified':'No MP4';
   const tr=document.createElement('tr');
   for(const value of [i.date+' '+i.time,i.title,itemStatus(i),remoteStatus==='published'?'Published':remoteStatus==='scheduled'?'Scheduled':i.approved?'Approved':'Awaiting review',statusText]){
     const td=document.createElement('td');td.textContent=value;tr.appendChild(td);
   }
   const titleCell=tr.children[1];titleCell.replaceChildren();const open=document.createElement('button');open.type='button';open.className='queue-open';open.dataset.openItem=i.id;open.textContent=i.title;open.setAttribute('aria-label','Buka konten: '+i.title);titleCell.append(open);
   if(remote?.youtubeId){
     const youtubeId=remote.youtubeId;
     const link=document.createElement('a');
     link.href='https://studio.youtube.com/video/'+encodeURIComponent(youtubeId)+'/edit';
     link.target='_blank';link.rel='noopener noreferrer';link.textContent=' · Open in Studio ↗';
     tr.lastElementChild.append(link);
   }
   if(remoteStatus&&window.BIMA_REMOTE_STALE){
     tr.lastElementChild.append(document.createTextNode(' · Last verified'));
   }
   body.appendChild(tr);
 }
 document.dispatchEvent(new Event('bima:render-status'));
}

const AFF_STORAGE='bima_affiliate_campaigns_v1';
function affiliateRead(){try{const a=JSON.parse(localStorage.getItem(AFF_STORAGE)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
function affiliateWrite(rows){try{localStorage.setItem(AFF_STORAGE,JSON.stringify(rows));return true}catch(e){alert('Penyimpanan browser penuh/tidak tersedia. Simpan backup sebelum melanjutkan.');return false}}
function affiliateFormValue(id){return document.getElementById(id)?.value?.trim()||''}

function affiliateDesk(channel){
 const root=$('affiliateProductionDesk');if(!root)return;
 const active=['shopee','tiktok'].includes(channel);root.classList.toggle('hidden',!active);if(!active)return;
 const rows=affiliateRead(),title=channel==='shopee'?'Shopee Video':'TikTok Shop';
 const own=rows.filter(r=>r.platform===channel||(!r.platform&&(channel==='shopee'?!!r.shopeeUrl:!!r.tiktokUrl)));
 root.innerHTML='<div class="line"><div><h2>'+title+' · Product Research & Production</h2><p class="sub">Kandidat produk dan video khusus platform; tidak otomatis cross-post.</p></div><button class="btn" id="affExport">Export JSON</button></div>'
 +'<div class="fields" id="shopeeResearch">'+
 [['affName','Nama produk / campaign','text'],['affProductUrl','Link produk '+title,'url'],['affPrice','Harga (Rp)','number'],['affCommission','Komisi (%) sesuai akun affiliate','number'],['affSales','Penjualan (jika tersedia)','number'],['affRating','Rating produk (0–5)','number'],['affDate','Tanggal rencana posting','date'],['affVideo','Nama file video 9:16','text']].map(([id,label,type])=>'<div class="field"><label>'+label+'</label><input id="'+id+'" type="'+type+'"'+(type==='number'?' min="0" step="any"':'')+'></div>').join('')
 +'<div class="field full"><label>Bukti riset & alasan produk layak diuji</label><textarea id="affAngle" rows="2"></textarea></div>'
 +'<div class="field full"><label>Storyboard & voice-over</label><textarea id="affScript" rows="3"></textarea></div>'
 +'<div class="field full"><label>Caption '+title+'</label><textarea id="affCaption" rows="2"></textarea></div></div>'
 +'<p class="hint">Catat bukti penjualan, komisi, review, dan sumbernya. Tidak ada klaim winning otomatis. Semua data tersimpan lokal di browser.</p>'
 +'<button class="btn primary" id="affAdd">+ Simpan kandidat '+title+'</button><h3 id="shopeeQueue" style="margin-top:22px">Research / Production / Publishing Queue ('+own.length+')</h3>'
 +(own.length?'<div class="queue"><table><thead><tr><th>Produk</th><th>Produksi & jadwal</th><th>Status '+title+'</th><th>Brief</th></tr></thead><tbody>'+own.map(r=>{const status=r.platform?r.status||'research':r[channel]||'draft';return '<tr><td><b>'+escapeHTML(r.name)+'</b><div class="hint">'+escapeHTML(r.commission||'—')+'% komisi · '+escapeHTML(r.price||'—')+' Rp</div></td><td>'+escapeHTML(r.video||'Belum ada MP4')+'<div class="hint">'+escapeHTML(r.date||'Belum dijadwalkan')+'</div></td><td><select data-aff-stage="'+escapeHTML(r.id)+'" data-aff-platform="'+channel+'">'+[['research','Research'],['validated','Validated'],['production','Production'],['review','Awaiting review'],['ready','Ready for manual upload'],['published','Published (manual)']].map(([v,label])=>'<option value="'+v+'"'+(status===v?' selected':'')+'>'+label+'</option>').join('')+'</select></td><td><button class="btn" data-aff-copy="'+escapeHTML(r.id)+'">Copy Brief</button></td></tr>'}).join('')+'</tbody></table></div>':'<p class="hint">Belum ada produk. Mulai dari riset dan validasi.</p>')
 +'<div id="shopeePublishing" style="margin-top:16px;padding:16px;border:1px solid rgba(148,163,255,.22);border-radius:14px"><b>Checklist publikasi '+title+'</b><p class="hint">'+(channel==='shopee'?'Akun Shopee Affiliate aktif → unggah ke Shopee Video → tambah produk relevan → cek caption/tag produk → posting → konfirmasi manual.':'Akun TikTok Shop Creator Affiliate aktif → cek produk dalam showcase → unggah video → tag produk/keranjang kuning bila memenuhi syarat → posting → konfirmasi manual.')+'</p><p class="hint">Belum ada auto-upload, sinkronisasi komisi, atau koneksi platform. Video lintas platform dapat digunakan ulang hanya setelah kecocokan produk dan materi diperiksa.</p></div>';
}
document.addEventListener('click',event=>{
 if(event.target?.id==='affAdd'){
  const name=affiliateFormValue('affName'),platform=state.active;if(!name)return alert('Nama produk wajib diisi.');
  const rows=affiliateRead();rows.push({id:'aff-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),platform,name,productUrl:affiliateFormValue('affProductUrl'),price:affiliateFormValue('affPrice'),commission:affiliateFormValue('affCommission'),sales:affiliateFormValue('affSales'),rating:affiliateFormValue('affRating'),date:affiliateFormValue('affDate'),video:affiliateFormValue('affVideo'),angle:affiliateFormValue('affAngle'),script:affiliateFormValue('affScript'),caption:affiliateFormValue('affCaption'),status:'research',createdAt:new Date().toISOString()});if(affiliateWrite(rows))affiliateDesk(platform);
 }
 if(event.target?.id==='affExport'){const blob=new Blob([JSON.stringify({version:2,campaigns:affiliateRead()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='bima-affiliate-campaigns.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 const id=event.target?.dataset?.affCopy;if(id){const r=affiliateRead().find(x=>x.id===id);if(r){const brief=['Product: '+r.name,'Platform: '+(r.platform||'legacy shared'),'Product URL: '+(r.productUrl||r.shopeeUrl||r.tiktokUrl||''),'Price: '+(r.price||''),'Commission: '+(r.commission||''),'Evidence: '+(r.angle||''),'Video: '+(r.video||''),'Story: '+(r.script||''),'Caption: '+(r.caption||'')].join('\n');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(brief).catch(()=>prompt('Copy brief',brief));else prompt('Copy brief',brief)}}
});
document.addEventListener('change',event=>{
 const el=event.target;if(!el?.dataset?.affStage)return;
 const rows=affiliateRead(),r=rows.find(x=>x.id===el.dataset.affStage);if(!r)return;
 if(r.platform)r.status=el.value;else r[el.dataset.affPlatform]=el.value;
 affiliateWrite(rows);
});
function renderFuture(){
 const isYT=state.active==='youtube';$('ytWorkspace').classList.toggle('hidden',!isYT);$('futureWorkspace').classList.toggle('hidden',isYT);if(isYT)return;
 const ch=state.active;$('affiliateProductionDesk').classList.add('hidden');
 if(ch==='shopee'||ch==='tiktok'){$('futureTitle').textContent=(ch==='shopee'?'Shopee Video':'TikTok Shop')+' — Independent Affiliate Workflow';$('futureText').textContent='Riset produk, video, caption, dan status upload per platform. Reuse video dari platform lain hanya jika produk yang sama lolos validasi.';$('futurePlan').innerHTML='<b>Workflow:</b> Research → Validated → Production → Review → Manual publish → Performance tracking. <p class="muted-note">Konten lama dan data campaign tidak dihapus. Integrasi akun dan auto-upload belum diaktifkan.</p>'}
 else{$('futureTitle').textContent=PLATFORM_COPY[ch].name+' — Later';$('futureText').textContent='Platform belum terhubung.';$('futurePlan').textContent='Belum ada workflow aktif.'}
}
function render(){renderChannels();renderFuture();if(state.active!=='youtube')return;renderCalendar();renderDay();renderEditor();renderQueue();$('defaultTime').value=state.channels.youtube.defaultTime}
function newDraft(){const id='yt-'+Math.random().toString(36).slice(2,10);const i={id,platform:'youtube',date:state.selected,time:state.channels.youtube.defaultTime,title:'New YouTube Short',format:'Shorts · 10s',status:'Draft',caption:'',prompt:'',notes:'',approved:false,mediaName:'',youtubeId:''};state.items.youtube.push(i);state.selectedItem=id;persist();$('fTitle').focus()}
function currentDraftFields(){return {date:$('fDate').value||state.selected,time:$('fTime').value||state.channels.youtube.defaultTime,title:$('fTitle').value.trim()||'Untitled Short',format:$('fFormat').value,prompt:$('fPrompt').value,caption:$('fCaption').value,notes:$('fNotes').value}}
function saveDraft(){let i=getSelected();if(!i){newDraft();i=getSelected()}const updates=currentDraftFields();const fieldsChanged=Object.entries(updates).some(([key,value])=>String(i[key]||'')!==String(value));const requestedStatus=$('fStatus').value;const keepApproved=!!i.approved&&!fieldsChanged&&requestedStatus==='QA Pass';Object.assign(i,updates);i.approved=keepApproved;i.status=keepApproved?'Approved':requestedStatus;state.selected=updates.date;const [y,m]=updates.date.split('-');state.month=`${y}-${m}`;persist();$('copyMsg').textContent=keepApproved?'Approved draft saved with no changes. Approval remains valid.':fieldsChanged?'Draft changes saved. Review and click Mark Approved again before server upload.':'Draft saved locally. Not uploaded to YouTube.';$('copyMsg').dataset.result=keepApproved?'success':'info';}
function approvalNotice(message,result='info'){const notice=$('copyMsg');notice.textContent=message;notice.dataset.result=result;const status=$('approvalState');if(status){status.textContent=result==='success'?'Approved · Saved locally':result==='error'?'Approval blocked':result==='pending'?'Checking video…':'Awaiting approval';status.style.color=result==='success'?'#9deecb':result==='error'?'#ffa7a7':'#ffdcad';}}
function preflightDraftQA(item,fields){
 const problems=[];
 if(!item)return ["No draft selected"];
 const title=(fields.title||item.title||"").toLowerCase();
 const text=[fields.caption||"",fields.prompt||"",item.episodePlan?.objective||"",item.episodePlan?.voice||"",...(item.episodePlan?.scenes||[])].join(" ").toLowerCase();
 const venus=/\bvenus\b/.test(title),mantis=/\bmantis shrimp\b/.test(title);
 if(venus&&/\bmantis shrimp\b/.test(text))problems.push("Venus title mixed with mantis shrimp content");
 if(mantis&&/\bvenus\b/.test(text))problems.push("Mantis shrimp title mixed with Venus content");
 if(item.episodePlan&&(item.episodePlan.sourceItemId!==item.id||item.episodePlan.sourceTitle!==item.title))
   problems.push("Saved storyboard belongs to an old or unidentified draft; review and re-save its workflow");
 if(item.sourceSchedule==="mixed-81"&&/research required/i.test(item.status||""))
   problems.push("Editorial research required before approval");
 if(!fields.caption?.trim()||/editorial research draft — do not publish before verification/i.test(fields.caption))
   problems.push("Description is missing or still a generic research placeholder");
 if(item.format?.startsWith("Video · 180s")&&item.episodePlan?.duration<=32)
   problems.push("Long-form video has a Shorts storyboard");
 return problems;
}
async function approve(){const button=$('approve');if(button?.disabled)return;const i=getSelected();if(!i){approvalNotice('Select a YouTube draft before approving.','error');return;}const id=i.id;const updates=currentDraftFields();const issues=preflightDraftQA(i,updates);
 if(issues.length){approvalNotice("Approval blocked: "+issues.join("; "),"error");return;}
 if(!updates.title||!updates.title.trim()||!updates.prompt.trim()){approvalNotice('Approval blocked: fill in Video title and Gemini video prompt first.','error');return;}if(!i.mediaName){approvalNotice('Approval blocked: attach a final MP4 to this draft first.','error');return;}const player=$('videoPreview');if(i.format?.startsWith('Shorts')&&player?.videoWidth&&player.videoWidth>=player.videoHeight){approvalNotice('Approval blocked: this Shorts file is landscape. Convert to full-screen 9:16 first.','error');return;}if(button){button.disabled=true;button.textContent='Checking video…';}approvalNotice('Checking saved MP4 in browser storage…','pending');try{const file=await mediaDB('get',id);if(!(file instanceof Blob)||file.size<1024)throw Error('The MP4 is missing from browser storage. Re-select the video file before approving.');if(!/\.mp4$/i.test(i.mediaName))throw Error('The final video must be an MP4 for YouTube.');if(getSelected()?.id!==id)throw Error('The selected draft changed. Select the same draft again.');Object.assign(i,updates);i.approved=true;i.status='Approved';state.selected=updates.date;const [y,m]=updates.date.split('-');state.month=`${y}-${m}`;persist();approvalNotice('✓ Approved! Final MP4 accepted and saved locally. Next: open Publishing → Save selected video to server. No YouTube upload has happened.','success');}catch(e){approvalNotice('Approval blocked: '+(e.message||e),'error');}finally{if(button){button.disabled=false;button.textContent=getSelected()?.approved?'✓ Approved':'Mark Approved';}}}
async function removeDraft(){const i=getSelected();if(!i)return;if(!confirm('Delete this local YouTube draft and attached video from this browser?'))return;try{await mediaDB('del',i.id)}catch(e){console.warn(e)}state.deletedItemIds=[...new Set([...(state.deletedItemIds||[]),i.id])];state.items.youtube=state.items.youtube.filter(x=>x.id!==i.id);state.selectedItem=items().find(x=>x.date===state.selected)?.id||'';clearPreview();persist()}
async function copyPrompt(){const txt=$('fPrompt').value.trim();if(!txt){$('copyMsg').textContent='Prompt is empty.';return}try{await navigator.clipboard.writeText(txt);$('copyMsg').textContent='Gemini prompt copied!'}catch(e){const el=$('fPrompt');el.focus();el.select();try{document.execCommand('copy');$('copyMsg').textContent='Prompt copied!'}catch(e2){$('copyMsg').textContent='Copy blocked — select and copy manually.'}}}
function backup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download='bima-content-studio-v3-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function importBackup(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const obj=JSON.parse(reader.result);if(obj.version!==3||!Array.isArray(obj?.items?.youtube)||!obj.channels)throw Error('Invalid backup version');state=obj;state.active='youtube';persist()}catch(e){alert('Invalid V3 backup JSON.')}};reader.readAsText(file)}
$('prev').addEventListener('click',()=>{const [y,m]=state.month.split('-').map(Number);const d=new Date(y,m-2,1);state.month=dateStr(d.getFullYear(),d.getMonth()+1,1).slice(0,7);persist()});
$('next').addEventListener('click',()=>{const [y,m]=state.month.split('-').map(Number);const d=new Date(y,m,1);state.month=dateStr(d.getFullYear(),d.getMonth()+1,1).slice(0,7);persist()});
$('newContent').addEventListener('click',newDraft);$('save').addEventListener('click',saveDraft);$('copy').addEventListener('click',copyPrompt);$('approve').addEventListener('click',approve);$('delete').addEventListener('click',removeDraft);
$('export').addEventListener('click',backup);$('import').addEventListener('click',()=>$('importFile').click());$('importFile').addEventListener('change',e=>{importBackup(e.target.files?.[0]);e.target.value=''});
$('defaultTime').addEventListener('change',e=>{state.channels.youtube.defaultTime=e.target.value;persist()});$('backToYoutube').addEventListener('click',()=>gotoChannel('youtube'));
$('videoFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)storeSelectedVideo(f);e.target.value=''});
$('dropzone').addEventListener('dragover',e=>{e.preventDefault();e.currentTarget.classList.add('dragover')});
$('dropzone').addEventListener('dragleave',e=>{e.currentTarget.classList.remove('dragover')});
$('dropzone').addEventListener('drop',e=>{e.preventDefault();e.currentTarget.classList.remove('dragover');const f=e.dataTransfer.files?.[0];if(f)storeSelectedVideo(f)});
$('dropzone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('videoFile').click()}});
$('removeVideo').addEventListener('click',removeSelectedVideo);

/* Secure Railway integration: no Google secrets or long-lived refresh tokens in browser. */
(function initSecureAutomation(){
 const byId=id=>document.getElementById(id);
 const urlEl=byId("apiEndpoint"),message=byId("apiServerMessage"),chip=byId("apiStatusChip");
 const tokenKey="bima_content_server_session";
 let serverStatus=null;
 function paintServerStatus(){
   const channel=serverStatus?.channel, status=byId("connectionStatus"),detail=byId("connectionDetail");
   const googleAuthorized=!!(channel||serverHealth?.youtubeConnected);
   // Owner-only /api/status and public /health may reach this page independently.
   // The backend only exposes channelVerified after comparing the stored Google channel ID to the Railway allowlist.
   const verified=!!(channel?.verified||serverHealth?.channelVerified);
   const uploadsEnabled=!!serverHealth?.uploadsEnabled;
   status.textContent=verified?"Connected":googleAuthorized?"Google authorized":"Not connected";
   status.dataset.state=verified?"connected":googleAuthorized?"pending":"disconnected";
   const legacy=byId("legacyYoutubeStatus");
   if(legacy){legacy.textContent=verified?(uploadsEnabled?"Channel verified · Private upload enabled":"Channel verified · Private upload disabled"):googleAuthorized?(serverHealth?.channelLocked?"Google authorized · Verify locked channel":"Google authorized · Verify channel"):"Google not authorized";legacy.style.color=verified?"#9deecb":"#ffdcad";}
   detail.textContent=verified?(channel?.name||"Orbit & Ocean")+" · Verified on Railway":
     channel?(channel.name||"YouTube")+" · The authorized Channel ID does not match the expected Railway channel.":
     googleAuthorized?(serverHealth?.channelLocked?"Google authorized and channel locked on Railway. Sign in as owner to verify the match.":"Google authorized on Railway. Sign in to verify your YouTube channel.") :
     serverHealth?.oauthConfigured?"Google OAuth available. Connect YouTube to authorize channel.":
     "Hubungkan akun Google untuk memulai.";
   const footer=byId("connectionFooter");
   if(footer)footer.textContent="BIMA Content Studio · "+(verified?"YouTube channel verified":googleAuthorized?"Google authorized · Channel verification pending":"YouTube not authorized")+" · "+(uploadsEnabled?"Private upload enabled":"Private upload disabled");
   const loginButton=byId("apiGoogle");
   if(loginButton)loginButton.textContent=googleAuthorized?"Sign in as YouTube owner (Google)":"Connect YouTube (Google OAuth)";
   if(serverStatus){
     const all=serverStatus.items||[];
     const uploads=all.filter(i=>!!i.youtubeId);
     byId("publishedCount").textContent=String(uploads.length);
     const queued=all.filter(i=>i.status==="scheduled"&&i.youtubeId);
     const confirmedPublic=uploads.filter(i=>i.status==="published").length;
     const upcoming=queued.map(i=>i.publishAt).filter(Boolean).sort()[0];
     const publishWib=upcoming&&!Number.isNaN(Date.parse(upcoming))
       ? new Date(upcoming).toLocaleString("id-ID",{timeZone:"Asia/Jakarta",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:false})+" WIB"
       : "";
     const scheduledInfo=byId("scheduledInfo");
     if(scheduledInfo){
       scheduledInfo.textContent="Scheduled: "+queued.length+" · Public: "+confirmedPublic+(queued.length&&publishWib?" · "+publishWib:"");
       scheduledInfo.style.color=queued.length?"#9deecb":"#a6b3d9";
     }
   }
 }
 let serverHealth=null;
 document.addEventListener("bima:render-status",paintServerStatus);
 document.addEventListener("bima:remote-status",event=>{
   const incoming=event.detail;
   if(!incoming||!Array.isArray(incoming.items))return;
   serverStatus=incoming;
   paintServerStatus();
 });
 async function refreshStatus(){
 serverStatus=await call("/api/status");
 window.BIMA_REMOTE_CONTENT=Object.fromEntries((serverStatus.items||[]).map(item=>[item.id,item]));
 window.BIMA_REMOTE_STALE=false;window.BIMA_REMOTE_AT=Date.now();
 renderQueue();paintServerStatus();
 document.dispatchEvent(new CustomEvent("bima:server-state",{detail:{items:(serverStatus.items||[]).map(({id,status,publishAt,youtubeId,youtubePrivacyStatus,youtubeUploadStatus})=>({id,status,publishAt,youtubeId,youtubePrivacyStatus,youtubeUploadStatus}))}}));
 return serverStatus;
}
 const endpointKey="bima_content_server_url";
 let session=sessionStorage.getItem(tokenKey)||"";
 const hash=new URLSearchParams(location.hash.replace(/^#/,""));
 if(hash.has("bima_session")){
   session=hash.get("bima_session")||"";
   sessionStorage.setItem(tokenKey,session);
   history.replaceState(null,"",location.pathname+location.search);
 }
 urlEl.value=localStorage.getItem(endpointKey)||"https://content-studio-api-production-3fe2.up.railway.app";
 const say=(s,good=false)=>{message.textContent=s;chip.textContent=good?"Server connected":"Needs attention";};
 const syncOwnerSession=()=>{
   session=sessionStorage.getItem(tokenKey)||"";
   document.dispatchEvent(new CustomEvent("bima:owner-session",{detail:{signedIn:!!session}}));
   return session;
 };
 const base=()=>{
   const input=urlEl.value.trim().replace(/\/$/,"");
   if(!/^https:\/\/[a-zA-Z0-9.-]+\.up\.railway\.app$/.test(input))throw Error("Enter the full HTTPS Railway service URL (up.railway.app), not GitHub Pages.");
   localStorage.setItem(endpointKey,input);return input;
 };
 async function call(path,method="GET",body=null,mime="application/json"){
   const currentToken=syncOwnerSession();
   if(!currentToken)throw Error("owner_session_required");
   const headers={Authorization:"Bearer "+currentToken};
   if(body!==null)headers["Content-Type"]=mime;
   const r=await fetch(base()+path,{method,headers,body:body===null?undefined:body});
   let data;try{data=await r.json();}catch{throw Error("Invalid server response ("+r.status+").");}
   if(r.status===401){
     sessionStorage.removeItem(tokenKey);syncOwnerSession();
     throw Error("owner_session_expired");
   }
   if(!r.ok)throw Error(data.error||"HTTP "+r.status);
   return data;
 }
 const safeRun=fn=>async(event)=>{
   const button=event?.currentTarget;if(button?.disabled)return;
   if(button)button.disabled=true;
   try{await fn();}
   catch(e){
     const code=String(e?.message||e);
     if(code==="owner_session_required"||code==="owner_session_expired"){
       message.textContent="Owner session needed. Use Sign in as YouTube owner at the top of Publishing, then retry. The approved MP4 remains stored in this browser.";
       chip.textContent=serverHealth?.status==="online"?"Server connected":"Needs attention";
       document.dispatchEvent(new CustomEvent("bima:owner-session",{detail:{signedIn:false}}));
     }else say("Action blocked: "+code);
   }finally{if(button)button.disabled=false;}
 };
 byId("apiCheck").addEventListener("click",safeRun(async()=>{
    const r=await fetch(base()+"/health");const data=await r.json();
    serverHealth=data;paintServerStatus();
    say("Backend "+data.status+" · Google "+(data.youtubeConnected?"authorized":"not authorized")+
      " · Channel "+(data.channelVerified?"verified":data.channelLocked?"locked, awaiting verification":"not verified")+
      " · Upload "+(data.uploadsEnabled?"enabled":"disabled"),data.status==="online");
    if(session)await refreshStatus();
 }));
 byId("apiGoogle").addEventListener("click",safeRun(async()=>{
    const r=await fetch(base()+"/health");const v=await r.json();
    if(!v.oauthConfigured)throw Error("Set backend OAuth variables in Railway first. Do not paste secrets here.");
    location.href=base()+"/auth/google/start";
 }));
 byId("apiSend").addEventListener("click",safeRun(async()=>{
    const item=getSelected();
    if(!item)throw Error("Select a YouTube calendar draft first.");
    // Do not call saveDraft() here: that intentionally resets item.approved.
    // Guard against unsaved editor changes instead, requiring explicit re-approval.
    const unchanged=[
      ["fDate","date"],["fTime","time"],["fTitle","title"],
      ["fFormat","format"],["fPrompt","prompt"],["fCaption","caption"],["fNotes","notes"]
    ].every(([field,key])=>{
      const current=byId(field)?.value||"";
      const saved=String(item[key]||"");
      return field==="fTitle"?current.trim()===saved:current===saved;
    });
    if(!unchanged)throw Error("Draft has unsaved changes. Click Save Draft, then Mark Approved again before sending to Railway.");
    if(!item.approved)throw Error("Review the final MP4, then click Mark Approved in Shorts Production Desk before sending to Railway.");
    if(!item.mediaName)throw Error("Attach the final MP4 through Shorts Production Desk first.");
    const localFile=await mediaDB("get",item.id);
    if(!(localFile instanceof Blob))throw Error("Video is missing from browser storage.");
    if(localFile.type!=="video/mp4" && !String(item.mediaName).toLowerCase().endsWith(".mp4"))throw Error("Only MP4 is supported by the server. Convert final video first.");
    if(localFile.size>150000000)throw Error("Video exceeds server 150MB limit.");
    const date=item.date,clock=item.time||"19:30";
    const time=new Date(date+"T"+clock+":00+07:00");
    if(!Number.isFinite(time.getTime()))throw Error("Invalid publish date or time.");
    await call("/api/content","POST",JSON.stringify({
      id:item.id,title:item.title,description:item.caption||"",
      publishAt:time.toISOString(),
      madeForKids:byId("apiMadeForKids").value==="true",
      containsSyntheticMedia:byId("apiSynthetic").checked
    }));
    say("Sending "+item.mediaName+" to private Railway storage (not YouTube)…");
    const b=await call("/api/content/"+encodeURIComponent(item.id)+"/media","POST",localFile,"video/mp4");
    say("Stored on Railway: "+((b.item.mediaSize/1048576)||0).toFixed(1)+" MB · server draft ready.",true);await refreshStatus();
 }));
 byId("apiApprove").addEventListener("click",safeRun(async()=>{
    const i=getSelected();if(!i)throw Error("Select a draft.");
    if(!i.approved)throw Error("First mark Approved in the local editor after completing video QA.");
    const r=await call("/api/content/"+encodeURIComponent(i.id)+"/approve","POST","{}");
    say("Server approved "+r.item.title+" for "+new Date(r.item.publishAt).toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})+" WIB.",true);await refreshStatus();
 }));
 byId("apiSubmit").addEventListener("click",safeRun(async()=>{
    const i=getSelected();if(!i)throw Error("Select a draft.");
    if(!confirm("Upload this OWNER-APPROVED video to the authorized YouTube channel now? Google may keep it Private until your project passes verification."))return;
    const r=await call("/api/content/"+encodeURIComponent(i.id)+"/submit","POST","{}");
    say("Upload submitted. Server is processing; use Check Backend / Verify on YouTube to confirm the result.",true);
 }));
 byId("apiVerify").addEventListener("click",safeRun(async()=>{
    const i=getSelected();if(!i)throw Error("Select a draft.");
    const r=await call("/api/content/"+encodeURIComponent(i.id)+"/verify","POST","{}");
    await refreshStatus();
    say("YouTube verified: "+r.item.status+" · "+(r.item.youtubeId?"https://youtube.com/watch?v="+r.item.youtubeId:"No video ID"),true);
 }));
 fetch(base()+"/health").then(async r=>{
   if(!r.ok)throw Error("Backend HTTP "+r.status);
   serverHealth=await r.json();paintServerStatus();
   if(serverHealth.status==="online"){
     chip.textContent="Server connected";
     message.textContent="Railway online · Google "+(serverHealth.youtubeConnected?"authorized":"not authorized")+" · YouTube "+(serverHealth.channelVerified?"verified":serverHealth.channelLocked?"locked (owner verification needed)":"not verified")+" · Private upload "+(serverHealth.uploadsEnabled?"enabled":"disabled")+".";
   }
 }).catch(()=>{if(!session)byId("connectionDetail").textContent="Cannot reach Railway. Try Check Backend.";chip.textContent="Needs attention";});
 if(session){
   refreshStatus().then(r=>{const connected=!!r.channel?.verified; const channel=r.channel; paintServerStatus(); const pub=document.getElementById("publishedCount");if(pub)pub.textContent=(r.items||[]).filter(x=>!!x.youtubeId).length; say("Google authorized: "+(channel?.name||"owner")+" · Channel ID: "+(channel?.id||"pending")+" · "+(connected?"verified target":"set EXPECTED_YOUTUBE_CHANNEL_ID in Railway after checking this is Orbit & Ocean")+".",connected);})
     .catch(e=>{
       const msg=String(e?.message||e);
       if(msg==="owner_session_expired"){sessionStorage.removeItem(tokenKey);syncOwnerSession();say("Owner session expired. Sign in again to continue.");}
       else {say("Could not verify owner session: "+msg+". Check Backend and try again.");}
     });
 }
})();

render();
</script>
<script>
/* Unified navigation: URLs, back/forward and draft selection share one route. */
(function(){
 const VIEWS=['ringkasan','kalender','desk','publishing','analytics'];
 const labels={ringkasan:'Ringkasan',kalender:'Kalender',desk:'Production Desk',publishing:'Publishing',analytics:'YouTube Analytics'};
 const content=document.querySelector('.content');
 const bar=document.createElement('div');bar.className='workspace-bar';
 bar.innerHTML='<div><span class="overline">ORBIT &amp; OCEAN</span><h1 id="workspaceTitle" tabindex="-1"></h1></div><label class="draft-picker">Konten aktif<select id="activeDraft" aria-label="Pilih konten aktif"></select></label>';
 content.prepend(bar);
 const picker=document.getElementById('activeDraft');
 let dirty=false;
 document.addEventListener('input',e=>{if(e.target.matches('#fTitle,#fDate,#fTime,#fFormat,#fStatus,#fCaption,#fNotes'))dirty=true});
 document.addEventListener('bima:episode-selected',()=>{dirty=false});
 function mayLeave(){
   const event=new CustomEvent('bima:before-navigate',{cancelable:true});document.dispatchEvent(event);
   if(!dirty&&!event.defaultPrevented)return true;
   return confirm('Ada perubahan yang belum disimpan. Klik Cancel untuk menyimpan draft / Use workflow in draft, atau OK untuk meninggalkan perubahan.');
 }
 document.addEventListener('click',e=>{
   if(!e.target.closest('[data-go],[data-open-item],#calendar .day,#dayList .item,#channelBar .channel,#prev,#next,#newContent,#backToYoutube'))return;
   if(!mayLeave()){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 window.addEventListener('beforeunload',e=>{const event=new CustomEvent('bima:before-navigate',{cancelable:true});document.dispatchEvent(event);if(dirty||event.defaultPrevented){e.preventDefault();e.returnValue=''}});
 const empty=document.createElement('div');empty.className='empty';empty.id='deskEmpty';
 empty.innerHTML='<strong>Belum ada konten dipilih</strong><p>Pilih konten di atas, atau buka Kalender untuk membuat Short baru.</p><button class="btn primary" type="button" data-go="kalender">Buka Kalender</button>';
 document.querySelector('[data-panel="desk"] .editor-head').after(empty);

 function sync(){
   let id=getSelected()?.id||'';
   const values=[...new Set(items().map(i=>i.date))].flatMap(displayItemsOn).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
   picker.replaceChildren(new Option('Pilih konten…',''));
   for(const i of values)picker.add(new Option(i.date+' · '+i.title,i.id));
   if(id&&!values.some(i=>i.id===id)){const selected=getSelected();id=values.find(i=>i.date===selected?.date&&i.title===selected?.title)?.id||id;}picker.value=id;
   empty.hidden=!!id;document.body.classList.toggle('no-selected-draft',!id);
   bar.classList.toggle('future-channel',state.active!=='youtube');
   document.body.dataset.channel=state.active;
   const isYouTube=state.active==='youtube';
   bar.querySelector('.overline').textContent=isYouTube?'ORBIT & OCEAN':'CHANNEL WORKSPACE';
   document.getElementById('workspaceTitle').textContent=isYouTube?labels[document.body.dataset.view]:PLATFORM_COPY[state.active].name;
   document.querySelectorAll('.menu-item[data-go]').forEach(b=>{const on=isYouTube&&b.dataset.go===document.body.dataset.view;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
   const dd=document.getElementById('deskDate');if(dd)dd.textContent=human(state.selected);
 }
 function route(v,replace=false){
   const params=new URLSearchParams({view:v,date:state.selected,month:state.month});
   if(getSelected())params.set('item',getSelected().id);
   const hash='#'+params.toString();
   if(location.hash!==hash)history[replace?'replaceState':'pushState'](null,'',hash);
 }
 function setView(v,top=true,write=true){
   if(!VIEWS.includes(v))v='ringkasan';
   if(state.active!=='youtube')gotoChannel('youtube');
   document.body.dataset.view=v;
   document.querySelectorAll('.menu-item[data-go]').forEach(b=>{
     const on=b.dataset.go===v;b.classList.toggle('active',on);
     if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
   });
   document.getElementById('workspaceTitle').textContent=labels[v];
   picker.closest('label').hidden=!['desk','publishing'].includes(v);
   sync();
   if(write)route(v);
   try{sessionStorage.setItem('bimaView',v)}catch(_){}
   if(top){window.scrollTo({top:0,behavior:'auto'});content.scrollTop=0;document.getElementById('workspaceTitle').focus({preventScroll:true});}
 }
 window.BIMA_NAVIGATE=setView;
 function openItem(id,v='desk'){
   const i=items().find(i=>i.id===id);if(!i)return;
   state.active='youtube';state.selectedItem=id;state.selected=i.date;state.month=i.date.slice(0,7);
   persist();setView(v);
 }
 picker.addEventListener('change',()=>{if(!mayLeave()){picker.value=getSelected()?.id||'';return}if(picker.value)openItem(picker.value,document.body.dataset.view)});
 document.addEventListener('click',e=>{
   const b=e.target.closest('[data-go]');if(b)setView(b.dataset.go);
 });
 document.getElementById('dayList').addEventListener('click',e=>{if(e.target.closest('.item'))setView('desk')});
 document.getElementById('newContent').addEventListener('click',()=>setView('desk'));
 document.getElementById('calendar').addEventListener('click',e=>{if(!e.target.closest('.day'))return;if(getSelected())setView('desk');else route('kalender')});
 for(const id of ['prev','next'])document.getElementById(id).addEventListener('click',()=>route('kalender'));
 const todayButton=document.createElement('button');todayButton.type='button';todayButton.className='btn ghost';todayButton.textContent='Hari ini';
 document.getElementById('next').after(todayButton);
 todayButton.addEventListener('click',()=>{if(!mayLeave())return;state.selected=today();state.month=state.selected.slice(0,7);state.selectedItem=items().find(i=>i.date===state.selected)?.id||'';persist();route('kalender')});
 document.getElementById('queueBody').addEventListener('click',e=>{const b=e.target.closest('[data-open-item]');if(b)openItem(b.dataset.openItem)});
 const back=document.createElement('button');back.type='button';back.className='btn ghost';back.dataset.go='desk';back.textContent='‹ Kembali ke Production Desk';document.getElementById('publishingQuickActions').prepend(back);
 const create=document.createElement('button');create.type='button';create.className='btn primary';create.textContent='+ Buat konten';document.querySelector('[data-panel="ringkasan"] .controls').prepend(create);
 create.addEventListener('click',()=>{if(!mayLeave())return;state.selected=today();newDraft();setView('desk')});
 document.addEventListener('bima:episode-selected',sync);
 document.addEventListener('bima:render-status',renderDay);
 document.getElementById('channelBar').addEventListener('click',sync);
 document.getElementById('backToYoutube').addEventListener('click',()=>setView('ringkasan'));
 function restore(){
   const params=new URLSearchParams(location.hash.slice(1)),id=params.get('item');
   if(id&&items().some(i=>i.id===id)){const i=items().find(i=>i.id===id);state.selectedItem=id;state.selected=i.date;state.month=i.date.slice(0,7);render();}
   if(/^\d{4}-\d{2}-\d{2}$/.test(params.get('date')||'')){state.selected=params.get('date');if(!id)state.selectedItem='';}
   if(/^\d{4}-\d{2}$/.test(params.get('month')||''))state.month=params.get('month');
   render();setView(params.get('view')||'ringkasan',false,false);
 }
 window.addEventListener('popstate',()=>{if(mayLeave())restore();else route(document.body.dataset.view,true)});
 if(location.hash.startsWith('#view='))restore();else{let saved;try{saved=sessionStorage.getItem('bimaView')}catch(_){}setView(saved||'ringkasan',false,false);route(document.body.dataset.view,true)}
})();
</script>
<script src="content-settings.js?v=20261014-sync1" defer></script>
<script src="shorts-ui.js?v=20261011-fullscreen-crop3" defer></script>
<script src="production-steps.js?v=20261014-sync1" defer></script>
<script src="bima-one-click-publish.js?v=20261019-network-diagnostics" defer></script>
<script src="bima-public-status.js?v=20261014-sync1" defer></script>
<script src="episode-workflow.js?v=20261014-sync1" defer></script>
<script src="auto-thumbnails.js?v=20261019-frame-recovery-v3" defer></script>
<script src="affiliate-workspace.js?v=20261014-split1" defer></script>
<script src="tiktok-affiliate.js?v=20261014-first-sale1" defer></script>
<script src="tiktok-connection.js?v=20261016-settings" defer></script>
<script src="tiktok-quick-import.js?v=20261014-quick-import1" defer></script>
<script src="tiktok-production-pack.js?v=20261014-production-pack1" defer></script>
<script src="tiktok-google-review.js?v=20261015-simple3" defer></script>
<script src="tiktok-showcase.js?v=20261016-review1" defer></script>
<script src="shopee-affiliate.js?v=20261014-split1" defer></script>
<script src="shopee-studio.js?v=20261025-production1" defer></script>
<script src="youtube-analytics.js?v=20261023-independent-views6" defer></script>
<script src="channel-navigation.js?v=20261022-analytics" defer></script>
<script src="autonomous-planner.js?v=20261014-sync1" defer></script>
<script src="mixed-calendar-sync.js?v=20261013-idea-bank-cleanup1" defer></script>
<script src="auto-video-pipeline.js?v=20261012-autonomous1" defer></script>
<script src="piapi-pilot.js?v=20261013-episode-scoped-review" defer></script>
</body></html>
