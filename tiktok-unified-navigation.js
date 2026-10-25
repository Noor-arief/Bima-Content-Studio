(()=>{'use strict';
function boot(){
 const channels=document.getElementById('channelBar'),side=document.querySelector('.sidebar'),main=document.querySelector('.content');
 if(!channels||!side||!main)return;
 document.getElementById('bimaTikTokInsightsLink')?.remove();
 const nav=document.createElement('nav');nav.id='bimaTikTokUnifiedNav';nav.setAttribute('aria-label','TikTok workspace');
 nav.innerHTML='<div style="font-size:12px;color:#80e7db;font-weight:800;margin:9px 0">TIKTOK STUDIO</div>'+[['research','01 · Research'],['production','02 · Production'],['calendar','03 · Calendar'],['analytics','04 · Analytics']].map(([k,v])=>'<button type="button" class="menu-item" data-tt-page="'+k+'" style="display:block;width:100%;margin:5px 0;text-align:left">'+v+'</button>').join('');
 channels.insertAdjacentElement('afterend',nav);
 const panel=document.createElement('section');panel.id='bimaTikTokUnifiedPanel';panel.style.cssText='width:100%;min-width:0;';
 panel.innerHTML='<iframe id="bimaTikTokUnifiedFrame" title="TikTok BIMA Production and Analytics" src="./tiktok-insights.html?v=20261025-pajama-oct28-v19" style="display:block;width:100%;min-height:900px;height:calc(100vh - 90px);border:1px solid #294b59;border-radius:14px;background:#080e20"></iframe>';
 main.appendChild(panel);
 const style=document.createElement('style');style.textContent='body.bima-tiktok-unified .content > :not(#bimaTikTokUnifiedPanel){display:none!important}body:not(.bima-tiktok-unified) #bimaTikTokUnifiedPanel,body:not(.bima-tiktok-unified) #bimaTikTokUnifiedNav{display:none!important}body.bima-tiktok-unified #bimaTikTokUnifiedPanel{display:block!important}body.bima-tiktok-unified .sidebar nav.menu,body.bima-tiktok-unified .sidebar .tt-calendar-menu{display:none!important}#bimaTikTokUnifiedNav .menu-item.active{background:#18777a;border-color:#59ccc6;color:white}';document.head.appendChild(style);
 const isTikTok=()=>!!channels.querySelector('[data-channel="tiktok"][aria-pressed="true"],[data-channel="tiktok"].active');
 function sync(){document.body.classList.toggle('bima-tiktok-unified',isTikTok())}
 function setTab(tab){nav.querySelectorAll('[data-tt-page]').forEach(b=>b.classList.toggle('active',b.dataset.ttPage===tab));panel.querySelector('iframe').contentWindow?.postMessage({type:'bima:tiktok:set-tab',tab},window.location.origin)}
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-tt-page]');if(b)setTab(b.dataset.ttPage)});
 panel.querySelector('iframe').addEventListener('load',()=>setTab(nav.querySelector('.active')?.dataset.ttPage||'research'));
 const obs=new MutationObserver(sync);obs.observe(channels,{subtree:true,attributes:true,attributeFilter:['class','aria-pressed'],childList:true});channels.addEventListener('click',()=>queueMicrotask(sync));sync();setTab('research');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
