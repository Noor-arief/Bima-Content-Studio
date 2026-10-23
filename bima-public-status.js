/* Read-only, public-safe YouTube upload counts and per-item upload badges.
   No tokens, video titles, or unpublished URLs are exposed. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const stateKey='bima_public_upload_summary_v1';
  let latest=null;
  function apply(data,{cached=false}={}){
    if(!data||!Number.isInteger(data.uploaded)||!Number.isInteger(data.scheduled)||
      !Number.isInteger(data.published)||!Array.isArray(data.uploadIndicators))return;
    latest=data;window.BIMA_PUBLIC_AT=cached?0:Date.now();
    window.BIMA_PUBLIC_UPLOADS=Object.fromEntries(
      data.uploadIndicators.filter(i=>i&&typeof i.id==='string'&&
        ['scheduled','published','private_uploaded','uploading','needs_review'].includes(i.status))
        .map(({id,status})=>[id,{id,status}])
    );
    const count=$('publishedCount'),info=$('scheduledInfo');
    if(count)count.textContent=String(data.uploaded);
    if(info){
      const stamp=cached?' · Last confirmed (offline)':'';
      info.textContent='Scheduled: '+data.scheduled+' · Public: '+data.published+stamp;
      info.style.color='#9deecb';
    }
    if(typeof renderQueue==='function')renderQueue();
    if(typeof renderCalendar==='function')renderCalendar();
  }
  function restore(){
    try{
      const x=JSON.parse(localStorage.getItem(stateKey)||'null');
      if(x&&Date.now()-x.at<24*3600000&&x.data)apply(x.data,{cached:true});
    }catch(_){}
  }
  async function refresh(){
    let base;
    try{base=window.BIMA_BACKEND_ENDPOINTS.current();}catch{return;}
    try{
      const res=await fetch(base+'/public/stats',{cache:'no-store'});
      if(!res.ok)throw Error('stats unavailable');
      const value=await res.json();
      if(!Number.isInteger(value.uploaded)||value.uploaded<0||
        !Number.isInteger(value.scheduled)||value.scheduled<0||
        !Number.isInteger(value.published)||value.published<0||
        !Array.isArray(value.uploadIndicators))throw Error('invalid stats');
      apply(value);
      try{localStorage.setItem(stateKey,JSON.stringify({at:Date.now(),data:value}));}catch(_){}
    }catch(_){
      if(!latest){
        const info=$('scheduledInfo');
        if(info)info.textContent='Backend status unavailable · Retry on refresh';
      }
    }
  }
  restore();
  void refresh();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
  setInterval(()=>{if(!document.hidden)void refresh();},60000);
})();