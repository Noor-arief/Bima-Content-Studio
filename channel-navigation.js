/* Channel-scoped navigation. Keeps each channel's menu and active section explicit. */
(() => {
'use strict';
const sidebar=document.querySelector('.sidebar'),menu=sidebar?.querySelector('nav.menu'),channels=document.getElementById('channelBar');
if(!sidebar||!menu||!channels)return;
const labels=[...sidebar.querySelectorAll('.side-label')];
const menuLabel=labels[0],channelLabel=labels[1];
channelLabel.textContent='Pilih channel';
// Keep workspace navigation above the channel switcher.
menu.after(channelLabel,channels);
const context=document.createElement('div');context.className='channel-menu-context';context.setAttribute('aria-live','polite');
context.innerHTML='<span class="channel-menu-dot" aria-hidden="true"></span><div><strong></strong><small></small></div>';
sidebar.insertBefore(context,menuLabel);
const names={youtube:{ringkasan:'Ringkasan YouTube',kalender:'Kalender YouTube',desk:'Produksi Shorts',publishing:'Publishing YouTube'},tiktok:{ringkasan:'Ringkasan Affiliate',kalender:'Jadwal Affiliate',desk:'Produk & Video AI',publishing:'Review & Keranjang'}};
let tiktokSection='ringkasan';
for(const button of menu.querySelectorAll('[data-go]')){
 const icon=button.querySelector('.ico');const text=document.createElement('span');text.className='channel-menu-name';
 button.replaceChildren(...(icon?[icon]:[]),text);
}
function sync(){
 const ch=state.active,known=!!names[ch],yt=ch==='youtube';
 sidebar.dataset.menuChannel=ch;
 context.querySelector('strong').textContent=PLATFORM_COPY[ch]?.name||ch;
 context.querySelector('small').textContent=yt?'Orbit & Ocean · Faceless Shorts':ch==='tiktok'?'AI product videos · Affiliate':'Workspace belum dibuka';
 menuLabel.textContent='Menu '+(PLATFORM_COPY[ch]?.name||ch);
 menuLabel.hidden=!known;menu.hidden=!known;
 menu.setAttribute('aria-label','Menu '+(PLATFORM_COPY[ch]?.name||ch));
 for(const b of menu.querySelectorAll('[data-go]')){
  b.querySelector('.channel-menu-name').textContent=names[ch]?.[b.dataset.go]||b.dataset.go;
  const active=known&&b.dataset.go===(yt?document.body.dataset.view:tiktokSection);
  b.classList.toggle('active',active);
  if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 }
 for(const b of channels.querySelectorAll('[data-channel]'))b.setAttribute('aria-pressed',String(b.dataset.channel===ch));
}
const style=document.createElement('style');style.textContent=`
.channel-menu-context{display:flex;align-items:center;gap:10px;margin:17px 4px 0;padding:13px 10px;border:1px solid #5c394d;border-radius:11px;background:rgba(156,64,82,.12)}
.channel-menu-context strong{display:block;font-size:13px;color:#f3f5ff}.channel-menu-context small{display:block;font-size:10px;line-height:1.5;color:#b8c7e1;margin-top:4px}.channel-menu-dot{width:9px;height:9px;border-radius:50%;background:#ff737e;flex-shrink:0}
.sidebar[data-menu-channel="youtube"] .menu-item.active{border-color:#92525e;background:linear-gradient(115deg,rgba(177,68,83,.26),rgba(99,44,63,.15));box-shadow:none}.sidebar[data-menu-channel="youtube"] .menu-item.active .ico{background:#963b50}
.sidebar[data-menu-channel="tiktok"] .channel-menu-context{border-color:#356e70;background:rgba(47,154,150,.1)}.sidebar[data-menu-channel="tiktok"] .channel-menu-dot{background:#6be6d7}.sidebar[data-menu-channel="tiktok"] .menu-item.active{border-color:#427f80;background:linear-gradient(115deg,rgba(44,150,148,.25),rgba(39,71,95,.16));box-shadow:none}.sidebar[data-menu-channel="tiktok"] .menu-item.active .ico{background:#287b7d}
.sidebar nav.menu[hidden],.sidebar .side-label[hidden]{display:none!important}
/* Compact sidebar with a consistent violet active state. */
.sidebar .channel-menu-context{margin:4px 0 8px;padding:11px 12px}
.sidebar[data-menu-channel="youtube"] .channel-menu-context{border-color:rgba(139,123,255,.3);background:rgba(139,123,255,.08)}
.sidebar[data-menu-channel="youtube"] .channel-menu-dot{background:#a99bff}
.sidebar[data-menu-channel="youtube"] .menu-item.active{border-color:rgba(139,123,255,.5);background:rgba(139,123,255,.16)}
.sidebar[data-menu-channel="youtube"] .menu-item.active .ico{background:#6757c5}
.sidebar .side-label{margin:12px 10px 5px}
.sidebar .channels{gap:5px}
.sidebar .channel{padding:8px 10px;min-height:49px;border-radius:10px}
.sidebar .channel>div{min-width:0;flex:1}
.sidebar .channel small{font-size:10px;line-height:1.4}
.sidebar .channel img{width:27px;height:27px;flex-shrink:0}
.sidebar .channel .tag{font-size:8px;padding:4px 5px;flex-shrink:0}
.sidebar .channel:not(.active){background:transparent}
@media(max-width:900px){.sidebar .menu{order:0}.sidebar .channels{display:flex;flex-direction:row;overflow-x:auto}.sidebar .channel{min-width:126px}.sidebar .channel-menu-context{display:none}.sidebar .side-label{display:none}.sidebar .channels{gap:6px}.channel-menu-context{margin:0;padding:8px 11px}.channel-menu-context small{display:inline;margin-left:8px}.channel-menu-context strong{display:inline}.sidebar .menu-item{font-size:11px}.channel-menu-name{white-space:normal}}
`;document.head.append(style);
channels.addEventListener('click',()=>queueMicrotask(sync));
document.addEventListener('bima:episode-selected',()=>queueMicrotask(sync));
document.addEventListener('bima:channel-section',e=>{tiktokSection=e.detail;sync();});
document.addEventListener('click',e=>{if(e.target.closest('[data-go]'))queueMicrotask(sync);});
window.addEventListener('popstate',()=>queueMicrotask(sync));
// Programmatic navigation (calendar, queue and production shortcuts) must
// update the channel menu as reliably as direct menu clicks.
new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-view','data-channel']});
sync();
})();
