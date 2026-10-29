(()=>{'use strict';
function boot(){
 const channels=document.getElementById('channelBar'),side=document.querySelector('.sidebar'),main=document.querySelector('.content');
 if(!channels||!side||!main||document.getElementById('bimaTikTokUnifiedPanel'))return;
 document.getElementById('bimaTikTokInsightsLink')?.remove();
 const nav=document.createElement('nav');nav.id='bimaTikTokUnifiedNav';nav.setAttribute('aria-label','TikTok workspace');
 nav.innerHTML='<div style="font-size:12px;color:#80e7db;font-weight:800;margin:9px 0">TIKTOK STUDIO</div>'+[['research','01 · Research'],['production','02 · Production'],['calendar','03 · Calendar'],['analytics','04 · Analytics']].map(([k,v])=>'<button type="button" class="menu-item" data-tt-page="'+k+'" style="display:block;width:100%;margin:5px 0;text-align:left">'+v+'</button>').join('');
 channels.insertAdjacentElement('afterend',nav);
 const panel=document.createElement('section');panel.id='bimaTikTokUnifiedPanel';panel.style.cssText='width:100%;min-width:0;';
 panel.innerHTML='<iframe id="bimaTikTokUnifiedFrame" title="TikTok BIMA Production and Analytics" loading="eager" src="./tiktok-insights.html?v=20261029-ads-brief-v55" style="display:block;width:100%;min-height:900px;height:calc(100vh - 90px);border:1px solid #294b59;border-radius:14px;background:#080e20"></iframe>';
 main.appendChild(panel);
 const style=document.createElement('style');style.textContent='body.bima-tiktok-unified .content > :not(#bimaTikTokUnifiedPanel){display:none!important}body:not(.bima-tiktok-unified) #bimaTikTokUnifiedPanel,body:not(.bima-tiktok-unified) #bimaTikTokUnifiedNav{display:none!important}body.bima-tiktok-unified #bimaTikTokUnifiedPanel{display:block!important}body.bima-tiktok-unified .sidebar nav.menu,body.bima-tiktok-unified .sidebar .tt-calendar-menu{display:none!important}#bimaTikTokUnifiedNav .menu-item.active{background:#18777a;border-color:#59ccc6;color:white}';document.head.appendChild(style);
 const isTikTok=()=>channels.querySelector('[data-channel].active')?.dataset.channel==='tiktok';
 let wasTikTok=false;
 function sync(){const active=isTikTok();document.body.classList.toggle('bima-tiktok-unified',active);document.documentElement.removeAttribute('data-bima-start-channel');if(active&&!wasTikTok)restoreTab();wasTikTok=active}
 function restoreTab(){const p=new URLSearchParams(location.hash.slice(1));setTab(p.get('channel')==='tiktok'?p.get('tab')||'production':sessionStorage.getItem('bimaTikTokTab')||'production',false)}
 function setTab(tab,write=true){
 if(!['research','production','calendar','analytics','report'].includes(tab))tab='production';
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
