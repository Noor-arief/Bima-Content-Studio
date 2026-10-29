(()=>{'use strict';
function boot(){
 const channels=document.getElementById('channelBar'),side=document.querySelector('.sidebar'),main=document.querySelector('.content');
 if(!channels||!side||!main||document.getElementById('bimaTikTokUnifiedPanel'))return;
 document.getElementById('bimaTikTokInsightsLink')?.remove();
 const nav=document.createElement('nav');nav.id='bimaTikTokUnifiedNav';nav.setAttribute('aria-label','TikTok workspace');
 const icons={research:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',production:'<rect x="3" y="5" width="13" height="14" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',bank:'<rect x="3" y="4" width="18" height="5" rx="2"/><path d="M5 9v10h14V9M9 13h6"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/>',analytics:'<path d="M4 3v17h17M9 16v-5m5 5V7m5 9V4"/>'};
 nav.innerHTML='<div class="tt-nav-heading">TikTok Studio</div><div class="tt-nav-links">'+[['research','Riset'],['production','Produksi'],['bank','Bank Konten'],['calendar','Kalender'],['analytics','Analitik']].map(([k,v])=>'<button type="button" class="menu-item" data-tt-page="'+k+'"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[k]+'</svg><span>'+v+'</span><span class="tt-nav-indicator" aria-hidden="true"></span></button>').join('')+'</div>';

 channels.insertAdjacentElement('afterend',nav);
 const panel=document.createElement('section');panel.id='bimaTikTokUnifiedPanel';panel.style.cssText='width:100%;min-width:0;';
 panel.innerHTML='<iframe id="bimaTikTokUnifiedFrame" title="TikTok BIMA Production and Analytics" loading="eager" src="./tiktok-insights.html?v=20261029-bank1" style="display:block;width:100%;min-height:900px;height:calc(100vh - 90px);border:1px solid #294b59;border-radius:14px;background:#080e20"></iframe>';
 main.appendChild(panel);
 const style=document.createElement('style');style.textContent='body.bima-tiktok-unified .content > :not(#bimaTikTokUnifiedPanel){display:none!important}body:not(.bima-tiktok-unified) #bimaTikTokUnifiedPanel,body:not(.bima-tiktok-unified) #bimaTikTokUnifiedNav{display:none!important}body.bima-tiktok-unified #bimaTikTokUnifiedPanel{display:block!important}body.bima-tiktok-unified .sidebar nav.menu,body.bima-tiktok-unified .sidebar .tt-calendar-menu{display:none!important}#bimaTikTokUnifiedNav .menu-item.active{background:#18777a;border-color:#59ccc6;color:white}';document.head.appendChild(style);
 const isTikTok=()=>channels.querySelector('[data-channel].active')?.dataset.channel==='tiktok';
 let wasTikTok=false;
 function sync(){const active=isTikTok();document.body.classList.toggle('bima-tiktok-unified',active);document.documentElement.removeAttribute('data-bima-start-channel');if(active&&!wasTikTok)restoreTab();wasTikTok=active}
 function restoreTab(){const p=new URLSearchParams(location.hash.slice(1));setTab(p.get('channel')==='tiktok'?p.get('tab')||'production':sessionStorage.getItem('bimaTikTokTab')||'production',false)}
 function setTab(tab,write=true){
 if(!['research','production','bank','calendar','analytics','report'].includes(tab))tab='production';
 nav.querySelectorAll('[data-tt-page]').forEach(b=>{const on=b.dataset.ttPage===tab;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 try{sessionStorage.setItem('bimaTikTokTab',tab)}catch(_){}
 if(write&&isTikTok()){const hash='#'+new URLSearchParams({channel:'tiktok',tab});if(location.hash!==hash)history.pushState(null,'',hash)}
 const target=panel.querySelector('iframe');try{const button=target.contentDocument?.querySelector('[data-tab="'+tab+'"]');if(button){if(!button.classList.contains('active'))button.click();return}}catch(_){}target.contentWindow?.postMessage({type:'bima:tiktok:set-tab',tab},window.location.origin)
 }
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==panel.querySelector('iframe').contentWindow||e.data?.type!=='bima:tiktok:tab-changed')return;setTab(e.data.tab,false)});
 window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.hash.slice(1));if(p.get('channel')==='tiktok'){if(!isTikTok())channels.querySelector('[data-channel="tiktok"]')?.click();restoreTab()}});
 const frame=panel.querySelector('iframe');
 const loading=document.createElement('p');loading.setAttribute('role','status');loading.textContent='Memuat TikTok Studio…';panel.prepend(loading);
 frame.style.visibility='hidden';
 frame.addEventListener('load',()=>{loading.hidden=true;frame.style.visibility='visible';});
 frame.addEventListener('error',()=>{loading.textContent='TikTok Studio gagal dimuat. Muat ulang halaman untuk mencoba lagi.';});
 frame.addEventListener('load',()=>{try{
 const doc=frame.contentDocument;if(!doc)return;
 const css=doc.createElement('style');css.textContent='html{overflow-x:hidden}body{padding:18px;max-width:none}body>.head{display:none}.tabs{margin:0 0 16px}.panel{min-width:0}.grid>*{min-width:0}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #7ff2e2;outline-offset:3px}@media(max-width:600px){body{padding:10px}.panel{padding:14px}h2{font-size:19px}.grid{grid-template-columns:minmax(0,1fr)}.tabs button{flex:1;min-height:44px}#ttMonthGrid button{padding:6px 2px;font-size:11px;overflow-wrap:anywhere}}';doc.head.append(css);
 const emit=()=>{const tab=doc.querySelector('#tabs button.active')?.dataset.tab;if(tab&&tab!==nav.querySelector('[aria-current="page"]')?.dataset.ttPage)setTab(tab)};
 doc.getElementById('tabs')?.addEventListener('click',()=>queueMicrotask(emit));
 }catch(_){}});
 const extra=document.createElement('style');extra.textContent='button:focus-visible,a:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid #71dfd4;outline-offset:3px}body.bima-tiktok-unified .content{height:auto!important;overflow:visible!important}#bimaTikTokUnifiedFrame{min-height:720px!important;height:calc(100dvh - 55px)!important}#bimaTikTokUnifiedNav{margin:8px 0}#bimaTikTokUnifiedNav .menu-item{min-height:44px}@media(max-width:900px){.sidebar{position:relative!important}#bimaTikTokUnifiedNav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}#bimaTikTokUnifiedNav>div{grid-column:1/-1}#bimaTikTokUnifiedNav .menu-item{margin:0!important;font-size:12px}#bimaTikTokUnifiedFrame{min-height:680px!important}}';document.head.append(extra);
 const menuStyle=document.createElement('style');menuStyle.textContent="#bimaTikTokUnifiedNav{margin:18px 0 8px!important;padding:0 2px!important;display:block!important}#bimaTikTokUnifiedNav .tt-nav-heading{color:#8290b2;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:0 12px;margin:0 0 10px}#bimaTikTokUnifiedNav .tt-nav-links{display:flex;flex-direction:column;gap:4px}#bimaTikTokUnifiedNav .menu-item{display:flex!important;align-items:center;gap:11px;width:100%;min-height:44px!important;padding:11px 12px!important;margin:0!important;border:1px solid transparent!important;border-radius:10px!important;background:transparent!important;box-shadow:none!important;color:#9ba8c8!important;font:600 13px/1.4 \"Plus Jakarta Sans\",sans-serif!important;text-align:left;transition:background .15s,color .15s}#bimaTikTokUnifiedNav .menu-item svg{width:18px;height:18px;flex:none;opacity:.85}#bimaTikTokUnifiedNav .menu-item:hover{background:rgba(130,154,210,.07)!important;color:#e3eafa!important}#bimaTikTokUnifiedNav .menu-item.active{background:rgba(71,210,192,.10)!important;border-color:rgba(71,210,192,.17)!important;color:#86e7d9!important}#bimaTikTokUnifiedNav .tt-nav-indicator{width:5px;height:5px;border-radius:50%;background:transparent;margin-left:auto;flex:none}#bimaTikTokUnifiedNav .active .tt-nav-indicator{background:#68dccb;box-shadow:0 0 8px #68dccb40}@media(max-width:900px){#bimaTikTokUnifiedNav .tt-nav-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}#bimaTikTokUnifiedNav .menu-item{justify-content:center;padding:10px 8px!important;font-size:12px!important;gap:7px}#bimaTikTokUnifiedNav .tt-nav-indicator{display:none}}@media(max-width:420px){#bimaTikTokUnifiedNav .tt-nav-links{grid-template-columns:repeat(2,minmax(0,1fr))}}";document.head.append(menuStyle);
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-tt-page]');if(b)setTab(b.dataset.ttPage)});
 panel.querySelector('iframe').addEventListener('load',()=>setTab(nav.querySelector('.active')?.dataset.ttPage||'production',false));
 const obs=new MutationObserver(sync);obs.observe(channels,{subtree:true,attributes:true,attributeFilter:['class','aria-pressed'],childList:true});channels.addEventListener('click',e=>{
 const channel=e.target.closest('[data-channel]')?.dataset.channel;if(!channel)return;
 queueMicrotask(()=>{
  sync();
  if(channel==='tiktok')setTab(nav.querySelector('[aria-current="page"]')?.dataset.ttPage||'production');
  else if(new URLSearchParams(location.hash.slice(1)).get('channel')==='tiktok'){
   const params=channel==='youtube'?new URLSearchParams({view:document.body.dataset.view||'ringkasan'}):new URLSearchParams({channel});
   history.pushState(null,'','#'+params);
  }
 });
});sync();restoreTab();if(new URLSearchParams(location.hash.slice(1)).get('channel')==='tiktok')channels.querySelector('[data-channel="tiktok"]')?.click();
}
if(document.getElementById('channelBar'))boot();else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();

