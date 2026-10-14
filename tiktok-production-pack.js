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
const result=panel.querySelector('#tt-pack-status'), voiceEl=panel.querySelector('#tt-pack-voice'),storyEl=panel.querySelector('#tt-pack-story');
let last=null;
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
 const caption=`Kenali ${name}. Cek detail produk, pilihan varian, dan harga terbaru di keranjang kuning. Konten affiliate; saya dapat memperoleh komisi dari pembelian. ${factual?'Informasi produk wajib dicocokkan dengan listing. ':''}#TikTokShop #Affiliate`;
 return {id:d.id,product:name,source:d.productUrl,verifiedFacts:factual,missing:factual?['Review kecocokan aset produk','Review narasi dan visual']:['Fakta produk belum diverifikasi','Foto referensi seller belum dikonfirmasi','Review kecocokan aset produk'],durationSeconds:24,aspectRatio:'9:16',scenes,voice:scripts.join(' '),srt,caption,rendered:false};
};
const download=(name,content,type)=>{const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
const build=()=>{
 const {selected}=getDraft();
 if(!selected){result.textContent='Pilih atau impor satu produk TikTok terlebih dahulu.';last=null;return;}
 last=make(selected);
 if(!last){result.textContent='Nama dan tautan produk TikTok belum tersedia di draft.';return;}
 voiceEl.value=last.voice;
 storyEl.value=last.scenes.map((s,i)=>`SCENE ${i+1} · ${s.start}–${s.end}s\nVISUAL: ${s.visual}\nVO: ${s.voice}`).join('\n\n');
 result.textContent='Production Pack siap ditinjau · MP4 belum dibuat · '+(last.verifiedFacts?'Fakta dari draft perlu dicocokkan dengan listing.':'Fakta belum terverifikasi: narasi sengaja tanpa klaim performa produk.');
};
panel.querySelector('#tt-pack-build').addEventListener('click',build);
panel.querySelector('#tt-pack-srt').addEventListener('click',()=>{if(!last)build();if(last)download('tiktok-'+last.id+'.srt',last.srt,'text/plain');});
panel.querySelector('#tt-pack-json').addEventListener('click',()=>{if(!last)build();if(last)download('tiktok-'+last.id+'-storyboard.json',JSON.stringify(last,null,2),'application/json');});
document.addEventListener('bima:tiktok-imported',()=>{build();});
})();
