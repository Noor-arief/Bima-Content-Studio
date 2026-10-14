/* TikTok one-step share import. No unofficial TikTok API, inferred commissions or fake product claims. */
(() => {
 'use strict';
 const root=document.getElementById('tiktokWorkspace');
 if(!root || document.getElementById('tt-quick-import'))return;
 const panel=document.createElement('section');
 panel.id='tt-quick-import';panel.className='aff-card';panel.dataset.secs='ringkasan';
 panel.innerHTML='<h3>Impor produk dari TikTok · 1 langkah</h3><p class="aff-muted">Di TikTok, buka produk Showcase → Bagikan → Salin tautan. Tempelkan teks atau link di sini; BIMA membuat draft secara otomatis. Harga, komisi, penjualan, dan klaim yang tidak tersedia tetap ditandai belum diverifikasi.</p><label for="tt-import-text">Tautan atau teks yang disalin dari TikTok</label><textarea id="tt-import-text" rows="3" style="width:100%;margin-top:6px" placeholder="Tempel link produk atau teks bagikan dari TikTok"></textarea><div class="aff-actions"><button type="button" id="tt-import-clipboard">Tempel clipboard</button><button type="button" id="tt-import-go" class="aff-primary">Buat draft otomatis</button></div><p id="tt-import-result" role="status" aria-live="polite"></p>';
 const after=document.getElementById('bima-tiktok-connection')||root.querySelector('.aff-notice');
 after?.insertAdjacentElement('afterend',panel);
 const source=panel.querySelector('#tt-import-text'),status=panel.querySelector('#tt-import-result');
 const parse=(raw)=>{
   const text=String(raw||'').trim();
   const links=text.match(/https?:\/\/[^\s<>"']+/gi)||[];
   const url=links.map(x=>x.replace(/[)\],.;]+$/g,'')).find(x=>{try{const u=new URL(x);return /(^|\.)(tiktok\.com|tiktokshop\.com)$/.test(u.hostname)||/(^|\.)shop\.tiktok\.com$/.test(u.hostname);}catch{return false;}});
   if(!url)return null;
   const title=text.replace(/https?:\/\/[^\s<>"']+/gi,'').replace(/^(?:Check out|Lihat|Bagikan|Produk|Shop now|Temukan)[:\s-]*/i,'').split(/[\n\r]/).map(x=>x.trim()).filter(Boolean)[0]||'Produk TikTok · periksa nama di listing';
   return {url,title:title.slice(0,150)};
 };
 const set=(key,val)=>{const e=document.getElementById('aff-tiktok-f-'+key);if(!e)return; e.value=val; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));};
 panel.querySelector('#tt-import-clipboard').addEventListener('click',async()=>{
   try{source.value=await navigator.clipboard.readText();status.textContent='Teks clipboard siap. Klik Buat draft otomatis.';}
   catch{source.focus();status.textContent='Akses clipboard ditolak browser. Tempel teks dengan Ctrl+V.';}
 });
 panel.querySelector('#tt-import-go').addEventListener('click',()=>{
   const product=parse(source.value);
   if(!product){status.textContent='Belum ada link TikTok yang valid. Salin tautan produk dari Showcase lalu tempel di sini.';return;}
   const create=root.querySelector('[data-secs="ringkasan"] [data-act="new"]');
   if(!create){status.textContent='Tombol membuat draft belum tersedia.';return;}
   create.click();
   set('product',product.title);set('productUrl',product.url);set('account','@noor_arief');
   set('facts','');
   status.textContent='Draft dibuat dari tautan TikTok. Nama produk perlu dicek di listing; fakta, harga, komisi belum diverifikasi. BIMA tidak akan mengarang datanya.';
   source.value='';
   root.dispatchEvent(new Event('change',{bubbles:true}));
 });
})();
