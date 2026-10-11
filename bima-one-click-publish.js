/* BIMA one-action publishing flow. Source of truth: authenticated Railway API.
   Never resubmits an item that already has a YouTube upload or ambiguous status. */
(() => {
  'use strict';
  const el=id=>document.getElementById(id);
  const panel=el('publishingQuickActions');
  const editorNext=el('continuePublishing');
  if(!panel || !editorNext || typeof getSelected!=='function' || typeof mediaDB!=='function')return;

  const style=document.createElement('style');
  style.textContent=[
    '#bimaSimplePublish{padding:16px;margin:13px 0 17px;border:1px solid rgba(139,123,255,.34);border-radius:14px;background:rgba(105,96,220,.055)}',
    '#bimaSimplePublish h3{font-size:16px;margin:0 0 4px;color:#f2f4ff}',
    '#bimaSimplePublish p{font-size:12px;line-height:1.65;color:#aebde3;margin:6px 0 10px}',
    '.bima-publish-action{background:linear-gradient(110deg,#7867ee,#5c83ff);border:1px solid #8982ff;border-radius:10px;color:white;padding:11px 18px;font-weight:800;min-height:42px}',
    '.bima-publish-action:disabled{opacity:.7;cursor:wait}',
    '#bimaPublishStatus{font-size:12px;line-height:1.65;margin-top:10px;color:#b9c7e9;overflow-wrap:anywhere}',
    '#bimaPublishStatus[data-kind="success"]{color:#a1f1d1}',
    '#bimaPublishStatus[data-kind="error"]{color:#ffb7bd}',
    '#bimaEditorPublish[hidden],#continuePublishing{display:none!important}',
    '#bimaEditorPublish{margin-left:4px}',
    '#bimaAdvancedToggle{margin-left:10px;background:transparent;border:1px solid rgba(145,161,232,.35);border-radius:10px;color:#aebde3;padding:10px 14px;font-size:12px}',
    'body[data-view="publishing"]:not(.bima-show-advanced) #serverAutomation,body[data-view="publishing"]:not(.bima-show-advanced) .content-grid [data-panel="publishing"],body[data-view="publishing"]:not(.bima-show-advanced) .bima-legacy-publish-actions{display:none!important}',
    '#bimaEditorStatus{font-size:11px;color:#a6b3d9;margin-left:4px}',
    '#bimaSimplePublish .bima-action-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '@media(max-width:600px){#bimaSimplePublish .bima-publish-action{flex:1 1 auto}#bimaAdvancedToggle{margin-left:0}}'
  ].join('\n');
  document.head.appendChild(style);
  const legacy=el('publishingSend')?.parentElement;
  if(legacy)legacy.classList.add('bima-legacy-publish-actions');
  editorNext.hidden=true;

  const card=document.createElement('div');card.id='bimaSimplePublish';
  card.innerHTML='<h3>Publish via BIMA</h3><p>Review MP4 sekali. BIMA mengurus pengiriman ke Railway, approval server, upload YouTube, dan jadwalnya. Tidak perlu upload manual.</p><div class="bima-action-row"><button type="button" class="bima-publish-action" id="bimaPublishNow">Publish with BIMA</button><button type="button" id="bimaAdvancedToggle" aria-expanded="false">Advanced settings ▾</button></div><div id="bimaPublishStatus" role="status" aria-live="polite">Memeriksa status YouTube…</div>';
  panel.insertBefore(card,el('publishingSelected'));
  const main=el('bimaPublishNow'),advanced=el('bimaAdvancedToggle'),message=el('bimaPublishStatus');
  const editorButton=document.createElement('button');
  editorButton.type='button';editorButton.className='btn primary';editorButton.id='bimaEditorPublish';
  editorButton.textContent='Publish with BIMA';
  const editorStatus=document.createElement('span');editorStatus.id='bimaEditorStatus';editorStatus.setAttribute('role','status');
  editorNext.insertAdjacentElement('afterend',editorButton);
  editorButton.insertAdjacentElement('afterend',editorStatus);

  let busy=false;
  let latest=null;
  let currentItems={};
  let lastChecked=0;
  const verifiedDue=new Map();
  const key='bima_content_server_session';
  const cacheKey='bima_youtube_status_cache_v1';
  function saveStatusCache(data){
    try{
      const items=(data.items||[]).filter(item=>typeof item.id==='string'&&typeof item.status==='string')
        .map(({id,status,youtubeId,publishAt,youtubePrivacyStatus,youtubeUploadStatus})=>({id,status,youtubeId,publishAt,youtubePrivacyStatus,youtubeUploadStatus}));
      localStorage.setItem(cacheKey,JSON.stringify({at:Date.now(),items}));
    }catch(_){}
  }
  function restoreStatusCache(){
    try{
      const saved=JSON.parse(localStorage.getItem(cacheKey)||'null');
      if(!saved||!Number.isFinite(saved.at)||Date.now()-saved.at>7*86400000||!Array.isArray(saved.items))return;
      currentItems=Object.fromEntries(saved.items.filter(i=>typeof i.id==='string'&&typeof i.status==='string').map(i=>[i.id,i]));
      window.BIMA_REMOTE_CONTENT=currentItems;
      window.BIMA_REMOTE_STALE=true;
      if(typeof renderQueue==='function')renderQueue();
      const count=el('publishedCount'),scheduled=el('scheduledInfo');
      if(count)count.textContent=String(saved.items.filter(i=>i.status==='published').length);
      if(scheduled){
        const queued=saved.items.filter(i=>i.status==='scheduled');
        const stamp=new Date(saved.at).toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit'});
        scheduled.textContent=queued.length+' Scheduled · Last verified '+stamp+' WIB · Sign in to refresh';
      }
    }catch(_){}
  }
  const finalStatuses=['scheduled','published','private_uploaded','uploading','needs_review'];
  function say(text,kind='info'){message.textContent=text;message.dataset.kind=kind;editorStatus.textContent=text.length>94?text.slice(0,92)+'…':text;}
  function backend(){
    const url=(el('apiEndpoint')?.value||'').trim().replace(/\/$/,'');
    if(!/^https:\/\/[a-zA-Z0-9.-]+\.up\.railway\.app$/.test(url))throw Error('Railway URL invalid. Open Advanced settings to check it.');
    return url;
  }
  function token(){return sessionStorage.getItem(key)||'';}
  function wib(iso){const t=Date.parse(iso||'');return Number.isFinite(t)?new Date(t).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' WIB':'jadwal belum valid';}
  async function api(path,method='GET',data=null,mime='application/json'){
    const owner=token();
    if(!owner)throw Error('LOGIN_REQUIRED');
    const headers={Authorization:'Bearer '+owner};
    if(data!==null)headers['Content-Type']=mime;
    const response=await fetch(backend()+path,{method,headers,body:data===null?undefined:data,cache:'no-store'});
    const result=await response.json().catch(()=>({}));
    if(response.status===401){sessionStorage.removeItem(key);throw Error('LOGIN_REQUIRED');}
    if(!response.ok)throw Error(result.error||('Railway HTTP '+response.status));
    return result;
  }
  function updateRemote(data){
    latest=data;
    currentItems=Object.fromEntries((data.items||[]).map(item=>[item.id,item]));
    window.BIMA_REMOTE_CONTENT=currentItems;
    window.BIMA_REMOTE_STALE=false;
    saveStatusCache(data);
    document.dispatchEvent(new CustomEvent('bima:remote-status',{detail:data}));
    if(typeof renderQueue==='function')renderQueue();
    document.dispatchEvent(new CustomEvent('bima:server-state',{detail:{items:(data.items||[]).map(({id,status,publishAt,youtubeId,youtubePrivacyStatus,youtubeUploadStatus})=>({id,status,publishAt,youtubeId,youtubePrivacyStatus,youtubeUploadStatus}))}}));
    lastChecked=Date.now();
    syncUI();
  }
  async function refresh(){const status=await api('/api/status');updateRemote(status);return status;}
  // At publish time, BIMA can verify visibility without requiring another manual button click.
  // Never resubmit or modify a video here; /verify only reads YouTube status.
  async function verifyDue(){
    if(busy||!token())return;
    const now=Date.now();
    const targets=Object.values(currentItems).filter(item=>
      item.status==='scheduled' && item.youtubeId && Date.parse(item.publishAt||'')<=now &&
      now-(verifiedDue.get(item.id)||0)>60000).slice(0,2);
    for(const item of targets){
      verifiedDue.set(item.id,now);
      try{
        await api('/api/content/'+encodeURIComponent(item.id)+'/verify','POST','{}');
        await refresh();
      }catch(e){say('Unable to verify current Public status yet; BIMA will keep the scheduled record unchanged.','error');}
    }
  }
  function detailFor(item){
    if(!item)return 'Belum ada konten terpilih.';
    const entry=currentItems[item.id];
    const stale=window.BIMA_REMOTE_STALE?' · Last verified state; sign in to refresh.':'';
    if(entry?.status==='published')return '✓ Published on YouTube · '+(entry.youtubeId||'')+' · BIMA selesai.'+stale;
    if(entry?.status==='scheduled')return '✓ BIMA sudah upload & schedule · '+wib(entry.publishAt)+' · Video ID '+(entry.youtubeId||'')+'. Menunggu konfirmasi Public.'+stale;
    if(entry?.status==='private_uploaded')return '✓ BIMA berhasil upload Private · '+(entry.youtubeId||'')+'. Publikasi Public belum terjadwal atau terkonfirmasi.';
    if(entry?.status==='uploading')return 'BIMA sedang upload… jangan klik ulang.';
    if(entry?.status==='needs_review')return 'Upload perlu investigasi; BIMA tidak akan mencoba ulang agar tidak menduplikasi video.';
    if(entry?.status==='approved')return 'Sudah approved di Railway · siap upload melalui BIMA.';
    if(entry?.status==='draft_with_video')return 'MP4 sudah tersimpan di Railway · siap server approval + upload.';
    return item.approved?'MP4 approved lokal · siap diproses BIMA.':'Review MP4 lalu Mark Approved terlebih dahulu.';
  }
  function syncUI(){
    const item=getSelected();
    const entry=currentItems[item?.id];
    const authenticated=!!token();
    const terminal=entry&&finalStatuses.includes(entry.status);
    const ready=!!item?.approved;
    const text=terminal?(entry.status==='scheduled'?'✓ Scheduled by BIMA':entry.status==='published'?'✓ Published':entry.status==='private_uploaded'?'✓ Uploaded Private':entry.status==='needs_review'?'Needs review':'Uploading…'):authenticated?'Publish with BIMA':'Sign in once to publish';
    main.textContent=text;editorButton.textContent=text;
    main.disabled=busy||!!terminal||!ready&&!authenticated;
    editorButton.disabled=busy||!!terminal||!ready&&!authenticated;
    editorButton.hidden=!ready;
    if(!busy && message.dataset.kind!=='error')say(detailFor(item),entry?.status==='scheduled'||entry?.status==='published'?'success':entry?.status==='needs_review'?'error':'info');
  }
  async function action(){
    if(busy)return;
    busy=true;main.disabled=true;editorButton.disabled=true;
    try{
      const item=getSelected();
      if(!item?.approved)throw Error('Video belum Approved. Buka Production Desk → Mark Approved.');
      if(!token()){
        say('Login pemilik satu kali diperlukan. Setelah Google kembali ke BIMA, klik Publish with BIMA lagi.','error');
        el('apiGoogle')?.click();return;
      }
      say('Memeriksa status Railway & YouTube…');
      await refresh();
      const server=currentItems[item.id];
      if(server&&finalStatuses.includes(server.status)){
        say(detailFor(item),server.status==='needs_review'?'error':'success');return;
      }
      const current=[['fDate','date'],['fTime','time'],['fTitle','title'],['fFormat','format'],['fPrompt','prompt'],['fCaption','caption'],['fNotes','notes']];
      if(current.some(([field,name])=>(el(field)?.value||'')!==String(item[name]||'')))throw Error('Ada perubahan draft yang belum disetujui. Save Draft dan Mark Approved lagi.');
      const dt=new Date(item.date+'T'+(item.time||'19:30')+':00+07:00');
      if(!Number.isFinite(dt.getTime())||dt.getTime()<Date.now()+15*60000){
        if(!server||!['approved','draft_with_video'].includes(server.status))throw Error('Jadwal harus >15 menit dari sekarang. Ubah jadwal, Save Draft dan Mark Approved lagi.');
      }
      if(!server||!['draft','draft_with_video','approved'].includes(server.status)){
        say('Membuat draft server…');
        await api('/api/content','POST',JSON.stringify({
          id:item.id,title:item.title,description:item.caption||'',publishAt:dt.toISOString(),
          madeForKids:el('apiMadeForKids')?.value==='true',containsSyntheticMedia:!!el('apiSynthetic')?.checked
        }));
      }
      if(!server||server.status==='draft'){
        say('Mengirim MP4 ke Railway… (tanpa upload manual)');
        const blob=await mediaDB('get',item.id);
        if(!(blob instanceof Blob)||blob.size<1024)throw Error('MP4 tidak ditemukan di browser. Pilih video yang sudah selesai.');
        if(blob.size>150000000)throw Error('MP4 melebihi limit 150 MB.');
        await api('/api/content/'+encodeURIComponent(item.id)+'/media','POST',blob,'video/mp4');
      }
      if(!server||server.status!=='approved'){
        say('Memvalidasi approval server…');
        await api('/api/content/'+encodeURIComponent(item.id)+'/approve','POST','{}');
      }
      say('BIMA sedang mengirim video ke YouTube. Jangan klik ulang…');
      const submitted=await api('/api/content/'+encodeURIComponent(item.id)+'/submit','POST','{}');
      if(submitted.status!=='upload_started')throw Error('Server tidak mengonfirmasi upload_started.');
      for(let i=0;i<9;i++){
        await new Promise(resolve=>setTimeout(resolve,1400));
        await refresh();
        const stage=currentItems[item.id]?.status;
        if(['scheduled','published','private_uploaded','needs_review'].includes(stage))break;
      }
      await refresh();
      const outcome=currentItems[item.id];
      if(!outcome)throw Error('Status server belum tersedia. Periksa Publishing, jangan submit ulang.');
      if(outcome.status==='needs_review')throw Error(detailFor(item));
      if(outcome.status==='uploading'||outcome.status==='approved')say('BIMA menerima upload. Pemrosesan masih berjalan. Tunggu status server sebelum mencoba tindakan lain.');
      else say(detailFor(item),'success');
    }catch(e){
      const msg=e?.message||String(e);
      if(msg==='LOGIN_REQUIRED'){
        say('Owner session kedaluwarsa. Sign in sekali melalui tombol ini, lalu lanjutkan. Video tidak perlu diupload ulang.','error');
        return;
      }
      say('BIMA: '+msg+'. Status YouTube tidak diubah otomatis.','error');
      // Re-fetch the server state after any uncertainty to avoid duplicate submissions.
      if(token())try{await refresh()}catch(_){}
    }finally{busy=false;syncUI();}
  }
  advanced.addEventListener('click',()=>{
    const shown=document.body.classList.toggle('bima-show-advanced');
    advanced.setAttribute('aria-expanded',String(shown));
    advanced.textContent=shown?'Hide advanced settings ▴':'Advanced settings ▾';
  });
  main.addEventListener('click',action);
  editorButton.addEventListener('click',action);
  document.addEventListener('bima:render-status',syncUI);
  document.addEventListener('bima:server-state',e=>{
    // Existing back-end controls can update the same status without a reload.
    const arr=e.detail?.items;
    if(!Array.isArray(arr))return;
    for(const item of arr)currentItems[item.id]={...(currentItems[item.id]||{}),...item};
    window.BIMA_REMOTE_CONTENT=currentItems;
    syncUI();
  });
  const checkWhenVisible=()=>{
    if(!token()){syncUI();return;}
    if(!busy&&Date.now()-lastChecked>30000)void refresh()
      .then(()=>verifyDue())
      .catch(()=>{say('Railway status unavailable; approval and videos remain unchanged.','error');});
    else void verifyDue();
  };
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkWhenVisible();});
  window.addEventListener('pageshow',checkWhenVisible);
  restoreStatusCache();
  syncUI();
  checkWhenVisible();
  setInterval(()=>{if(!document.hidden)checkWhenVisible();},60000);
})();