/* BIMA Shorts Production workflow — navigation and status only.
   Never sends or approves media automatically. */
(() => {
  'use strict';
  const stepper = document.getElementById('productionStepper');
  const hint = document.getElementById('stepperHint');
  const buttons = stepper ? [...stepper.querySelectorAll('button[data-production-step]')] : [];
  const nextButton=document.getElementById('continuePublishing');
  const publishingPanel=document.getElementById('publishingQuickActions');
  const sendButton=document.getElementById('publishingSend');
  const approveServerButton=document.getElementById('publishingApprove');
  const result=document.getElementById('publishingResult');
  const selected=document.getElementById('publishingSelected');
  const badge=document.getElementById('publishingReadyBadge');
  const ownerBadge=document.getElementById('publishingOwnerStatus');
  const ownerSignIn=document.getElementById('publishingSignIn');
  if (!stepper || !hint || buttons.length !== 3 || !publishingPanel || !sendButton || !approveServerButton || !nextButton || !selected || !badge || !result || !ownerBadge || !ownerSignIn || typeof getSelected !== 'function') return;

  let serverItems = [];
  let ownerReady=false;
  let ownerCheckPending=false;
  const sessionKey='bima_content_server_session';
  function ownerUI(text,ready){
    ownerReady=ready;
    ownerBadge.textContent=text;
    ownerBadge.style.color=ready?'#9deecb':'#ffdcad';
    ownerSignIn.hidden=ready;
    updateSteps();
  }
  async function checkOwner(){
    if(ownerCheckPending)return ownerReady;
    const token=sessionStorage.getItem(sessionKey);
    if(!token){
      ownerUI('Owner sign-in required · Railway still connected',false);
      return false;
    }
    const endpoint=document.getElementById('apiEndpoint')?.value.trim().replace(/\/$/,'')||'';
    if(!/^https:\/\/[a-zA-Z0-9.-]+\.up\.railway\.app$/.test(endpoint)){
      ownerUI('Railway URL needs attention',false);
      return false;
    }
    ownerCheckPending=true;
    ownerBadge.textContent='Checking owner session…';
    try{
      const r=await fetch(endpoint+'/api/status',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
      if(r.status===401){
        sessionStorage.removeItem(sessionKey);
        ownerUI('Owner session expired · Sign in again',false);
        return false;
      }
      if(!r.ok){
        ownerUI('Could not check session (HTTP '+r.status+')',false);
        return false;
      }
      const payload=await r.json();
      serverItems=Array.isArray(payload?.items)?payload.items.filter(item=>item&&typeof item.id==='string'&&typeof item.status==='string').map(({id,status})=>({id,status})):[];
      ownerUI('Owner session active · Ready to send MP4',true);
      return true;
    }catch(e){
      ownerUI('Session check unavailable · Check Backend',false);
      return false;
    }finally{ownerCheckPending=false;}
  }
  ownerSignIn.addEventListener('click',()=>{
    if(ownerReady)return;
    result.textContent='Opening Google owner sign-in. After returning to BIMA, you can resume with the same approved video; nothing is uploaded automatically.';
    document.getElementById('apiGoogle')?.click();
  });
  let lastSelectedId = null;
  function currentServerItem(id) {
    return serverItems.find(item => item.id === id) || null;
  }
  function updateSteps() {
    const item = getSelected();
    const id = item?.id || '';
    if (lastSelectedId !== id) lastSelectedId = id;
    const media = !!item?.mediaName;
    const approved = !!item?.approved;
    const server = currentServerItem(id);
    const uploaded = !!server && ['private_uploaded', 'scheduled', 'published'].includes(server.status);
    nextButton.hidden=!approved;
    sendButton.disabled=!ownerReady||!approved||!!server&&['private_uploaded','scheduled','published','uploading','needs_review'].includes(server.status);
    approveServerButton.disabled=!ownerReady||!approved||server?.status!=='draft_with_video'; 
    approveServerButton.textContent=server?.status==='approved'?'✓ Server Approved — Completed':'2 · Approve server-side schedule';
    badge.textContent=server?.status==='approved'?'✓ Server Approved':server?.status==='draft_with_video'?'Video on Railway':approved?'Approved · Local only':'Awaiting local approval';
    badge.style.color=server?.status==='approved'||approved?'#9deecb':'#ffdcad';
    const confirmed=document.getElementById('serverApprovalConfirmed');
    if(confirmed){
      const ok=server?.status==='approved';
      confirmed.hidden=!ok;
      confirmed.textContent=ok
        ? '✓ SERVER APPROVAL CONFIRMED · '+(item?.title||'Selected video')+' · Video stored on Railway. This is NOT a YouTube upload or public schedule.'
        : '';
    }
    const manual=document.getElementById('publishingManualNotice');
    if(manual)manual.textContent=server?.status==='approved'
      ? 'Public auto-scheduling is still disabled. To publish at 20:30 WIB today, download the approved MP4 and use YouTube Studio → Upload videos → Visibility → Schedule. Do not assume BIMA has published it.'
      : 'BIMA server approval does not publish the video. Use YouTube Studio for a guaranteed manual scheduling path while automation is disabled.';
    selected.textContent= item
      ? ('Selected: '+item.title+' · '+(item.mediaName?'MP4 attached':'No MP4')+' · '+(approved?'Approved locally':'Not approved')+(server?' · Railway: '+server.status:' · Not stored on Railway'))
      : 'No YouTube draft is selected. Open Kalender and select a draft first.';
    const stage = !media ? 1 : !approved ? 2 : 3;
    const messages = {
      1:'Tahap 1: pilih dan simpan MP4 final di browser, lalu review videonya.',
      2:'Tahap 2: periksa judul, deskripsi, video dan suara. Klik Mark Approved setelah siap.',
      3:'Tahap 3: draft sudah Approved secara lokal. Buka Publishing untuk menyimpan MP4 ke Railway, lalu approve jadwal di server. YouTube belum di-upload.'
    };
    let message = messages[stage];
    if (server?.status === 'draft_with_video') message = 'Video sudah tersimpan di Railway. Lanjutkan Approve server-side schedule pada menu Publishing.';
    if (server?.status === 'approved') message = 'Server-side approval selesai. Private upload tetap harus diaktifkan dan dijalankan secara terpisah oleh pemilik.';
    if (server?.status === 'private_uploaded') message = 'Video sudah ter-upload sebagai Private. Periksa hasilnya di YouTube Studio.';
    if (server?.status === 'scheduled') message = 'Jadwal tersimpan di server. Verifikasi status sesungguhnya di YouTube Studio.';
    if (server?.status === 'published') message = 'Video terkonfirmasi Published oleh backend YouTube.';
    if (server?.status === 'needs_review') message = 'Perlu pemeriksaan manual di YouTube Studio sebelum mencoba upload apa pun lagi.';
    hint.textContent = message;
    buttons.forEach(button => {
      const n = Number(button.dataset.productionStep);
      const done = n === 1 ? media : n === 2 ? approved : uploaded;
      const active = n === stage && !done;
      button.classList.toggle('done', done);
      button.classList.toggle('active', active);
      button.removeAttribute('aria-current');
      if (active) button.setAttribute('aria-current','step');
      const label = n === 1 ? 'Upload MP4' : n === 2 ? 'Review & approve' : 'Publishing';
      button.textContent = (done ? '✓' : String(n).padStart(2,'0')) + ' · ' + label;
      button.title = n === 1 ? 'Lihat file MP4 yang dipilih' :
        n === 2 ? 'Ke formulir review dan approval' : 'Buka menu Publishing tanpa mengunggah video';
    });
  }
  function scrollToId(id) {
    const node = document.getElementById(id);
    if (node) node.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function goPublishing(){
    document.querySelector('.menu-item[data-go="publishing"]')?.click();
    // The Publishing action panel is now the first visible element in that view.
    updateSteps();
    void checkOwner();
  }
  document.getElementById('openYouTubeStudio')?.addEventListener('click',()=>window.open('https://studio.youtube.com/','_blank','noopener,noreferrer'));
  document.getElementById('manualDownloadMp4')?.addEventListener('click',()=>{
    const download=[...document.querySelectorAll('.media-actions button')].find(button=>button.textContent?.trim()==='Download MP4');
    if(!download){result.textContent='Open Production Desk and click Download MP4 under the video preview.';return;}
    download.click();
    result.textContent='Saving MP4 to your computer; open YouTube Studio to schedule it manually. This does not send a YouTube API upload.';
  });
  nextButton.addEventListener('click',goPublishing);
  sendButton.addEventListener('click',()=>{
    const item=getSelected();if(!item?.approved){result.textContent='Review MP4 and click Mark Approved before sending to Railway.';return;}
    const original=document.getElementById('apiSend');
    if(!original){result.textContent='Secure Backend action unavailable. Reload dashboard.';return;}
    result.textContent='Requesting secure transfer to Railway… wait for server confirmation. No YouTube upload.';
    original.click(); // Forward only this explicit user click to existing secured action.
  });
  approveServerButton.addEventListener('click',()=>{
    const item=getSelected(),entry=currentServerItem(item?.id);
    if(!item?.approved||entry?.status!=='draft_with_video'){
      result.textContent='Save the approved MP4 to Railway first, then use Approve server-side schedule.';return;
    }
    const original=document.getElementById('apiApprove');
    if(!original){result.textContent='Server approval control unavailable. Reload dashboard.';return;}
    result.textContent='Requesting server-side approval…';
    original.click(); // Never touches Upload Private / Schedule.
  });
  const serverMessage=document.getElementById('apiServerMessage');
  if(serverMessage){
    const mirror=()=>{if(serverMessage.textContent?.trim())result.textContent=serverMessage.textContent.trim();};
    new MutationObserver(mirror).observe(serverMessage,{childList:true,subtree:true,characterData:true});
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    const step = Number(button.dataset.productionStep);
    if (step === 1) {
      scrollToId('dropzone');
    } else if (step === 2) {
      scrollToId('fTitle');
    } else if (step === 3) {
      const item = getSelected();
      const banner = document.getElementById('apiServerMessage');
      if (banner) banner.textContent = item?.approved ?
        'Approved lokal ✓. Berikutnya Save selected video to server → Approve server-side schedule. Jangan upload ke YouTube sebelum Private Upload diaktifkan untuk pengujian.' :
        'Langkah sebelumnya belum selesai: pilih MP4 dan klik Mark Approved di Production Desk. Jangan upload sebelum disetujui.';
      goPublishing();
    }
    updateSteps();
  }));

  document.addEventListener('bima:owner-session', e=>{
    if(!e.detail?.signedIn)ownerUI('Owner sign-in required · Railway still connected',false);
    else void checkOwner();
  });
  document.addEventListener('bima:render-status', updateSteps);
  document.addEventListener('bima:server-state', event => {
    const data = event.detail || {};
    serverItems = Array.isArray(data.items) ? data.items.filter(item =>
      item && typeof item.id === 'string' && typeof item.status === 'string'
    ) : [];
    updateSteps();
  });
  updateSteps();
  void checkOwner();
})();