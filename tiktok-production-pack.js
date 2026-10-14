/* TikTok affiliate production pack: deterministic drafts, no false product claims or AI-render claims. */
(() => {
'use strict';
const root=document.getElementById('tiktokWorkspace');
if(!root||document.getElementById('tt-production-pack'))return;
const key='bima-tiktok-affiliate-v1';
const panel=document.createElement('section');
panel.className='aff-card';panel.id='tt-production-pack';
panel.dataset.secs='desk';
panel.innerHTML='<h3>Production Pack · BIMA</h3><p class="aff-muted">BIMA menyiapkan storyboard 3 adegan, voice-over, subtitle SRT, dan caption dari draft TikTok yang dipilih. Tidak membuat klaim produk yang belum diverifikasi. MP4 belum digenerate otomatis.</p><div class="aff-actions"><button id="tt-pack-build" type="button" class="aff-primary">Siapkan paket produksi</button><button id="tt-pack-srt" type="button">Download subtitle SRT</button><button id="tt-pack-json" type="button">Download storyboard JSON</button></div><p id="tt-pack-status" role="status" aria-live="polite"></p><label>Voice-over (review sebelum dipakai)<textarea rows="4" id="tt-pack-voice" readonly style="width:100%;margin-top:8px"></textarea></label><label>Storyboard 3 adegan<textarea rows="9" id="tt-pack-story" readonly style="width:100%;margin-top:8px"></textarea></label>';
const desk=root.querySelector('[data-secs="desk publishing"]');
desk?.insertAdjacentElement('afterend',panel);
const voicePreview=document.createElement('div');
voicePreview.id='tt-voice-preview';
voicePreview.innerHTML='<h4 style="margin:12px 0 6px">Voice-over · Dengar & evaluasi</h4><p class="aff-muted">Preview suara menggunakan speech synthesis dari browser. Ini bukan file VO final dan belum dirender ke MP4.</p><div class="aff-actions"><button type="button" id="tt-voice-play">▶ Dengarkan narasi</button><button type="button" id="tt-voice-stop">■ Stop</button></div><p id="tt-voice-status" role="status" aria-live="polite"></p><p class="aff-muted">Tahapan TikTok: 1 Status → 2 Kalender → 3 Produk & Produksi → 4 Publikasi. Produksi MP4 otomatis masih menunggu integrasi aset, suara dan musik berlisensi.</p>';
panel.append(voicePreview);
const renderCard=document.createElement('div');
renderCard.id='tt-render-card';
renderCard.innerHTML='<h4>Final MP4 · Owner Review</h4><p class="aff-muted">Membutuhkan aset produk terverifikasi, musik berlisensi, dan model suara Indonesia yang dikonfigurasi di server. Tidak menggunakan kredit Gemini atau PiAPI.</p><p id="tt-render-status" role="status" aria-live="polite">Memeriksa kesiapan renderer…</p><div class="aff-actions"><button type="button" id="tt-render-refresh">Periksa kesiapan</button><button type="button" id="tt-render-start" disabled>Generate MP4 untuk review</button></div><video id="tt-render-video" controls playsinline style="display:none;width:100%;max-width:320px;margin-top:12px" aria-label="Preview video TikTok"></video>';
panel.append(renderCard);
const renderLabel=renderCard.querySelector('#tt-render-status');
const refreshRender=renderCard.querySelector('#tt-render-refresh');
const generateRender=renderCard.querySelector('#tt-render-start');
const renderVideo=renderCard.querySelector('#tt-render-video');
const endpoint='https://content-studio-api-production-3fe2.up.railway.app';
const auth=()=>sessionStorage.getItem('bima_content_server_session');
async function renderRequest(path,options={}){
 const token=auth();
 if(!token)throw Error('Login owner BIMA belum aktif.');
 const res=await fetch(endpoint+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers}});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(data.error||'HTTP '+res.status);
 return data;
}
async function refreshRenderStatus(){
 refreshRender.disabled=true;
 try{
 const state=await renderRequest('/api/tiktok/production/status');
 generateRender.disabled=!state.ready||state.busy||state.videoReady;
 renderLabel.textContent=state.videoReady?'MP4 siap untuk review (belum dipublikasikan).':state.busy?'Sedang merender MP4…':state.ready?'Renderer siap. Pilih draft, lalu generate video untuk review.':state.configured?'Izin aset atau musik belum terverifikasi di server.':'Belum siap: model suara, tiga aset produk dan musik harus dipasang di backend.';
 if(state.requirements&&!state.ready){
   const labels={voiceModel:'Model suara Indonesia',image1:'Foto produk 1',image2:'Foto produk 2',image3:'Foto produk 3',music:'File musik',productRights:'Izin penggunaan foto produk',musicRights:'Lisensi musik komersial',voiceRights:'Lisensi model suara'};
   const missing=Object.entries(labels).filter(([key])=>state.requirements[key]!==true).map(([,name])=>name);
   if(missing.length)renderLabel.textContent='Belum siap: '+missing.join(' · ')+'.';
 }
 if(state.error)renderLabel.textContent+=' Error: '+state.error;
 if(state.videoReady){const response=await fetch(endpoint+'/api/tiktok/production/video',{headers:{Authorization:'Bearer '+auth()}});if(response.ok){const video=await response.blob();if(renderVideo.dataset.url)URL.revokeObjectURL(renderVideo.dataset.url);const url=URL.createObjectURL(video);renderVideo.dataset.url=url;renderVideo.src=url;renderVideo.style.display='block';}}
 }catch(err){renderLabel.textContent=String(err.message||err);generateRender.disabled=true;}
 finally{refreshRender.disabled=false;}
}
refreshRender.addEventListener('click',refreshRenderStatus);
generateRender.addEventListener('click',async()=>{
 if(!last)build();
 if(!last){renderLabel.textContent='Pilih produk dan siapkan storyboard terlebih dahulu.';return;}
 if(!confirm('Buat MP4 hanya untuk owner review? Pastikan produk, aset, musik dan izin sudah sesuai.'))return;
 generateRender.disabled=true;
 try{await renderRequest('/api/tiktok/production/generate',{method:'POST',body:JSON.stringify({confirmProduction:true,scenes:last.scenes.map(s=>s.voice)})});renderLabel.textContent='Job diterima. Klik Periksa kesiapan untuk memantau hasil.';}
 catch(err){renderLabel.textContent=String(err.message||err);}
});
refreshRenderStatus();
const result=panel.querySelector('#tt-pack-status'), voiceEl=panel.querySelector('#tt-pack-voice'),storyEl=panel.querySelector('#tt-pack-story');
let last=null;
const productionBlockedReason='AUTO BLOCKED: BIMA belum memiliki sumber katalog Affiliate Creator yang terotorisasi dan belum dapat memverifikasi product attachment/keranjang kuning. Draft boleh ditinjau, tetapi bukan kandidat otomatis yang siap diproduksi atau dipublikasikan.';
const clean=s=>String(s||'').replace(/[\r\n\t]+/g,' ').trim().slice(0,220);
const getDraft=()=>{try{const d=JSON.parse(localStorage.getItem(key)||'{}');return {all:d,selected:d.drafts?.find(x=>x.id===d.selected)};}catch{return {all:null,selected:null};}};
const make=(d)=>{
 const name=clean(d.product);if(!name||!d.productUrl)return null;
 const facts=clean(d.facts);
 const factual=Boolean(facts);
 const scripts=factual?[
  `Ini ${name}. Yuk lihat detail produknya.`,
  `Menurut informasi produk: ${facts.slice(0,90)}.`,
  'Cek informasi, varian, dan harga terbaru lewat keranjang kuning.'
 ]:[
  `Lagi cari ${name}? Yuk lihat produknya.`,
  `Perhatikan detail dan pilihan ${name} sebelum membeli.`,
  'Buka keranjang kuning untuk cek deskripsi, varian, dan harga terbaru.'
 ];
 const scenes=[
  {start:0,end:8,visual:`Close-up produk ${name} memakai foto referensi asli seller. Tampilkan hanya bentuk dan warna yang terbukti, jangan buat desain sendiri.`,voice:scripts[0]},
  {start:8,end:16,visual:factual?`Sorot bagian produk yang sesuai sumber listing: ${facts.slice(0,120)}. Jangan buat klaim fungsi baru.`:'Perlihatkan sudut atau foto produk lain yang benar-benar disediakan seller. Jangan mendemonstrasikan fungsi yang belum terbukti.',voice:scripts[1]},
  {start:16,end:24,visual:'Tutup dengan close-up produk asli, akhir mulus. CTA cukup melalui voice-over; jangan membuat grafis keranjang kuning palsu.',voice:scripts[2]}
 ];
 const stamp=s=>`00:00:${String(s).padStart(2,'0')},000`;
 const srt=scenes.map((s,i)=>`${i+1}\n${stamp(s.start)} --> ${stamp(s.end)}\n${s.voice}\n`).join('\n');
 const genre=(()=>{const txt=(name+' '+facts).toLowerCase();if(/skincare|serum|parfum|perfume|makeup|kosmetik|beauty/.test(txt))return {mood:'clean, soft, chic',bpm:[85,110]};if(/fashion|baju|hijab|sepatu|tas|ootd|dress/.test(txt))return {mood:'stylish, upbeat',bpm:[105,125]};if(/kipas|charger|gadget|headset|powerbank|elektronik|lampu/.test(txt))return {mood:'sleek, modern, punchy',bpm:[100,120]};if(/dapur|rumah|organizer|storage|kitchen/.test(txt))return {mood:'cozy, satisfying',bpm:[85,105]};return {mood:'light, rhythmic, product-focused',bpm:[90,115]};})();
 const music={mode:'hybrid-vo-first',mood:genre.mood,bpmRange:genre.bpm,source:'Approved commercial-use audio only; no track automatically licensed or downloaded',licenseVerified:false,trackSelected:false,plan:[{from:0,to:2,musicGainDb:-17},{from:2,to:21,musicGainDb:-25,voicePriority:true},{from:21,to:24,musicGainDb:-27,voicePriority:true,fadeOut:true}],qualityChecks:['No lyrics competing with speech','Music follows edit pace','Voice remains clear through CTA','Commercial-use rights verified before final export','No unauthorized trending sound baked into MP4']};
 const caption=`Kenali ${name}. Cek detail produk, pilihan varian, dan harga terbaru di keranjang kuning. Konten affiliate; saya dapat memperoleh komisi dari pembelian. ${factual?'Informasi produk wajib dicocokkan dengan listing. ':''}#TikTokShop #Affiliate`;
 return {id:d.id,product:name,source:d.productUrl,verifiedFacts:factual,missing:factual?['Review kecocokan aset produk','Review narasi dan visual']:['Fakta produk belum diverifikasi','Foto referensi seller belum dikonfirmasi','Review kecocokan aset produk'],durationSeconds:24,aspectRatio:'9:16',scenes,voice:scripts.join(' '),srt,caption,music,rendered:false};
};
const download=(name,content,type)=>{const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
const build=()=>{
 const {selected}=getDraft();
 if(!selected){result.textContent='Pilih atau impor satu produk TikTok terlebih dahulu.';last=null;return;}
 last=make(selected);
 if(!last){result.textContent='Nama dan tautan produk TikTok belum tersedia di draft.';return;}
 voiceEl.value=last.voice;
 storyEl.value=last.scenes.map((s,i)=>`SCENE ${i+1} · ${s.start}–${s.end}s\nVISUAL: ${s.visual}\nVO: ${s.voice}`).join('\n\n');
 result.textContent=productionBlockedReason+' · Music direction: '+last.music.mood+' ('+last.music.bpmRange.join('–')+' BPM); track/licence belum dipilih. · Paket konsep siap ditinjau · MP4 belum dibuat · '+(last.verifiedFacts?'Fakta dari draft perlu dicocokkan dengan listing.':'Fakta belum terverifikasi: narasi sengaja tanpa klaim performa produk.');
};
panel.querySelector('#tt-pack-build').addEventListener('click',build);
const gate=document.createElement('p');gate.id='tt-automation-gate';gate.setAttribute('role','status');gate.style.cssText='margin:10px 0;font-weight:700';gate.textContent=productionBlockedReason;panel.insertBefore(gate,panel.firstChild.nextSibling);
panel.querySelector('#tt-pack-srt').addEventListener('click',()=>{if(!last)build();if(last)download('tiktok-'+last.id+'.srt',last.srt,'text/plain');});
panel.querySelector('#tt-pack-json').addEventListener('click',()=>{if(!last)build();if(last)download('tiktok-'+last.id+'-storyboard.json',JSON.stringify(last,null,2),'application/json');});
const voiceStatus=voicePreview.querySelector('#tt-voice-status');
voicePreview.querySelector('#tt-voice-play').addEventListener('click',()=>{
 if(!last)build();
 if(!last)return;
 if(!('speechSynthesis' in window)){voiceStatus.textContent='Preview suara tidak tersedia pada browser ini.';return;}
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(last.voice);
 utterance.lang='id-ID';utterance.rate=1.02;utterance.pitch=1;
 const voices=window.speechSynthesis.getVoices();
 const indonesian=voices.find(v=>v.lang.toLowerCase()==='id-id')||voices.find(v=>v.lang.toLowerCase().startsWith('id'));
 if(indonesian)utterance.voice=indonesian;
 utterance.onstart=()=>voiceStatus.textContent='Memutar preview narasi · suara bergantung pada browser/perangkat.';
 utterance.onend=()=>voiceStatus.textContent='Preview selesai. Evaluasi intonasi sebelum menghasilkan VO final.';
 utterance.onerror=()=>voiceStatus.textContent='Preview gagal pada perangkat ini. Naskah tetap tersedia.';
 window.speechSynthesis.speak(utterance);
});
voicePreview.querySelector('#tt-voice-stop').addEventListener('click',()=>{
 if('speechSynthesis' in window)window.speechSynthesis.cancel();
 voiceStatus.textContent='Preview dihentikan.';
});
document.addEventListener('bima:tiktok-imported',()=>{build();});
})();
