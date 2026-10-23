/* Channel-scoped navigation. Keeps each channel's menu and active section explicit. */
(() => {
'use strict';
const sidebar=document.querySelector('.sidebar'),menu=sidebar?.querySelector('nav.menu'),channels=document.getElementById('channelBar');
if(!sidebar||!menu||!channels)return;
const labels=[...sidebar.querySelectorAll('.side-label')];
const menuLabel=labels[0],channelLabel=labels[1];
channelLabel.textContent='Pilih channel';
sidebar.insertBefore(channelLabel,menuLabel);sidebar.insertBefore(channels,menuLabel);
const context=document.createElement('div');context.className='channel-menu-context';context.setAttribute('aria-live','polite');
context.innerHTML='<span class="channel-menu-dot" aria-hidden="true"></span><div><strong></strong><small></small></div>';
sidebar.insertBefore(context,menuLabel);
const names={youtube:{analytics:'Analytics YouTube',ringkasan:'Ringkasan YouTube',kalender:'Kalender YouTube',desk:'Produksi Shorts',publishing:'Publishing YouTube'},tiktok:{ringkasan:'TikTok Production 2',desk:'TikTok Production 1',kalender:'Owner Section',publishing:'Pengaturan'},shopee:{ringkasan:'Ringkasan',kalender:'Jadwal Shopee Video',desk:'Riset & Produksi',publishing:'Publikasi & Performa'}};
let tiktokSection='ringkasan',shopeeSection='ringkasan';
for(const button of menu.querySelectorAll('[data-go]')){
 const icon=button.querySelector('.ico');const text=document.createElement('span');text.className='channel-menu-name';
 button.replaceChildren(...(icon?[icon]:[]),text);
}
const originalItems=[...menu.querySelectorAll('[data-go]')];
const calendarButton=document.createElement('button');calendarButton.type='button';calendarButton.className='menu-item tt-calendar-menu';calendarButton.dataset.tiktokCalendar='true';calendarButton.innerHTML='<span class="ico" aria-hidden="true">04</span><span class="channel-menu-name">TikTok Calendar &amp; Live</span>';
calendarButton.hidden=true;calendarButton.addEventListener('click',()=>{tiktokSection='tt-calendar';const root=document.getElementById('tiktokWorkspace');if(root){root.dataset.sec='tt-calendar';document.dispatchEvent(new CustomEvent('bima:channel-section',{detail:'tt-calendar'}));}sync();});
function orderMenus(channel){
 const target=channel==='tiktok'?['desk','ringkasan','kalender','publishing']:originalItems.map(b=>b.dataset.go);
 for(const id of target){const b=originalItems.find(n=>n.dataset.go===id);if(b)menu.appendChild(b);}
 if(channel==='tiktok')for(const [id,label] of Object.entries({desk:'01',ringkasan:'02',kalender:'03',publishing:'05'})){const b=originalItems.find(n=>n.dataset.go===id);const icon=b?.querySelector('.ico');if(icon)icon.textContent=label;}
 else for(const b of originalItems){const icon=b.querySelector('.ico');if(icon&&icon.dataset.originalIcon!==undefined)icon.textContent=icon.dataset.originalIcon;}
}
for(const b of originalItems){const icon=b.querySelector('.ico');if(icon)icon.dataset.originalIcon=icon.textContent;}
let lastOrdered='';
function sync(){
 const ch=state.active,known=!!names[ch],yt=ch==='youtube';
 if(ch!==lastOrdered){orderMenus(ch);lastOrdered=ch;}
 calendarButton.hidden=ch!=='tiktok';if(ch==='tiktok'&& !calendarButton.isConnected){const settings=originalItems.find(b=>b.dataset.go==='publishing');settings?.before(calendarButton);}calendarButton.classList.toggle('active',ch==='tiktok'&&tiktokSection==='tt-calendar');if(ch==='tiktok'&&tiktokSection==='tt-calendar')calendarButton.setAttribute('aria-current','page');else calendarButton.removeAttribute('aria-current');
 sidebar.dataset.menuChannel=ch;
 context.querySelector('strong').textContent=PLATFORM_COPY[ch]?.name||ch;
 context.querySelector('small').textContent=yt?'Orbit & Ocean · Faceless Shorts':ch==='tiktok'?'BIMA riset & produksi · Kamu review':ch==='shopee'?'Shopee Video · Affiliate':'Workspace belum dibuka';
 menuLabel.textContent='Menu '+(PLATFORM_COPY[ch]?.name||ch);
 menuLabel.hidden=!known;menu.hidden=!known;
 menu.setAttribute('aria-label','Menu '+(PLATFORM_COPY[ch]?.name||ch));
 for(const b of menu.querySelectorAll('[data-go]')){
  b.querySelector('.channel-menu-name').textContent=names[ch]?.[b.dataset.go]||b.dataset.go;
  const active=known&&b.dataset.go===(yt?document.body.dataset.view:ch==='shopee'?shopeeSection:tiktokSection);
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
.sidebar[data-menu-channel="shopee"] .channel-menu-context{border-color:#ed7841;background:rgba(238,102,30,.1)}.sidebar[data-menu-channel="shopee"] .channel-menu-dot{background:#ee661e}.sidebar[data-menu-channel="shopee"] .menu-item.active{border-color:#ed7841;background:rgba(238,102,30,.18)}

.sidebar nav.menu[hidden],.sidebar .side-label[hidden]{display:none!important}
@media(max-width:900px){.channel-menu-context{margin:0;padding:8px 11px}.channel-menu-context small{display:inline;margin-left:8px}.channel-menu-context strong{display:inline}.sidebar .menu-item{font-size:11px}.channel-menu-name{white-space:normal}}
`;document.head.append(style);
channels.addEventListener('click',()=>queueMicrotask(sync));
document.addEventListener('bima:episode-selected',()=>queueMicrotask(sync));
document.addEventListener('bima:channel-section',e=>{if(state.active==='shopee')shopeeSection=e.detail;else tiktokSection=e.detail;sync();});
document.addEventListener('click',e=>{if(e.target.closest('[data-go]'))queueMicrotask(sync);});
window.addEventListener('popstate',()=>queueMicrotask(sync));
sync();
})();
