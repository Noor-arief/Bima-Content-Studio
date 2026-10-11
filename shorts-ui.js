(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const actions = $('mediaPreviewWrap')?.querySelector('.media-actions');
  if (!actions || !$('apiEndpoint') || typeof getSelected !== 'function' || typeof mediaDB !== 'function') return;

  const style = document.createElement('style');
  style.textContent = '.shorts-mode{max-width:190px;min-height:34px;padding:6px 9px;background:#111b3d;color:#e6edff;border:1px solid #344372;border-radius:8px;font-size:12px}.shorts-note{font-size:11.5px;line-height:1.55;color:#b9c9f5;display:block;margin-top:8px}.media-actions .shorts-convert{background:linear-gradient(135deg,#7766ef,#597cff);color:#fff;font-weight:700}.media-actions .shorts-convert:disabled{opacity:.5;cursor:wait}#restoreOriginal[hidden],#shortsOwnerLogin[hidden]{display:none!important}.shorts-auth-pill{display:inline-flex;align-items:center;border:1px solid #344372;border-radius:999px;padding:6px 10px;color:#b9c9f5;font-size:11.5px;background:#141d3b}.media-preview-wrap video.is-shorts-portrait{display:block!important;width:min(100%,260px)!important;max-height:480px!important;aspect-ratio:9/16;object-fit:contain;margin:0 auto}';
  document.head.append(style);

  const convert = document.createElement('button');
  convert.type = 'button'; convert.className='btn shorts-convert'; convert.id='convertShorts';
  convert.textContent='Auto Convert 9:16';
  const mode = document.createElement('select');
  mode.className='shorts-mode'; mode.id='shortsMode'; mode.setAttribute('aria-label','Shorts conversion mode');
  mode.innerHTML='<option value="crop" selected>Full-screen 9:16 (crop)</option><option value="blur">Keep full landscape (blur)</option>';
  const restore = document.createElement('button');
  restore.type='button'; restore.id='restoreOriginal'; restore.className='btn ghost';restore.textContent='Restore original';restore.hidden=true;
  const download = document.createElement('button');
  download.type='button';download.className='btn ghost';download.textContent='Download MP4';
  const signin = document.createElement('button');
  signin.type='button';signin.id='shortsOwnerLogin';signin.className='btn ghost';signin.textContent='Sign in to convert';
  signin.addEventListener('click',()=>{ $('apiGoogle')?.click(); });
  const sessionBadge=document.createElement('span');
  sessionBadge.className='shorts-auth-pill';sessionBadge.id='shortsAuthStatus';
  sessionBadge.textContent='Checking owner session…';
  const note = document.createElement('small');
  note.className='shorts-note';note.id='shortsConversionMessage';note.setAttribute('role','status');note.setAttribute('aria-live','polite');
  note.textContent='Default Full-screen 9:16 fills the phone screen by cropping the left and right edges. Blur mode keeps the complete landscape image with blurred borders. Nothing is published to YouTube.';
  actions.prepend(convert,mode,signin,restore,download,sessionBadge);actions.after(note);
  const preview=$('videoPreview');
  const updatePortraitPreview=()=>{if(preview)preview.classList.toggle('is-shorts-portrait',preview.videoWidth>0&&preview.videoHeight>preview.videoWidth);};
  preview?.addEventListener('loadedmetadata',updatePortraitPreview);
  updatePortraitPreview();
  const sessionKey='bima_content_server_session';
  const authState=active=>{
    signin.hidden=active;
    sessionBadge.textContent=active?'Owner session active · Convert ready':'Channel connected · Owner sign-in needed';
    sessionBadge.style.color=active?'#9deecb':'#ffdcad';
  };
  // Connected = Railway has verified channel; owner session is separate and tab-scoped.
  // Confirm authorization without transmitting any private video.
  async function checkOwnerSession(){
    const token=sessionStorage.getItem(sessionKey);
    if(!token){authState(false);return false;}
    try{
      const response=await fetch(server()+'/api/status',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
      if(response.ok){authState(true);return true;}
      if(response.status===401){sessionStorage.removeItem(sessionKey);authState(false);return false;}
      authState(false);status('Cannot verify owner login (HTTP '+response.status+'). Try Check Backend, then sign in.');
      return false;
    }catch(e){authState(false);status('Cannot check owner session: '+e.message);return false;}
  }
  authState(!!sessionStorage.getItem(sessionKey));

  const wasConverted = item => !!item?.mediaName && /-Shorts-9x16\.mp4$/i.test(item.mediaName);
  const syncButtons = () => { const item=getSelected();restore.hidden=!wasConverted(item);download.disabled=!item?.mediaName; };
  syncButtons();
  new MutationObserver(syncButtons).observe($('mediaPreviewWrap'),{attributes:true,attributeFilter:['class']});

  const status = message => {note.textContent=message;};
  function server(){
    const value=$('apiEndpoint').value.trim().replace(/\/$/,'');
    if(!/^https:\/\/[a-zA-Z0-9.-]+\.up\.railway\.app$/.test(value))throw Error('Check the Railway HTTPS backend URL first.');
    return value;
  }
  const backupKey = id => id+'::original';
  void checkOwnerSession();

  convert.addEventListener('click',async()=>{
    if(convert.disabled)return;
    convert.disabled=true;
    try{
      const item=getSelected();if(!item?.mediaName)throw Error('Choose a saved Gemini video first.');
      const itemId=item.id;
      const validSession=await checkOwnerSession();
      if(!validSession){
        status('The YouTube channel is connected, but this browser tab is not signed in as its owner. Click Sign in to convert, then retry. No file was sent.');
        signin.focus();
        return;
      }
      const session=sessionStorage.getItem(sessionKey);
      const saved=await mediaDB('get',itemId);
      if(!saved)throw Error('Saved MP4 is missing from this browser. Attach the Gemini export again.');
      const isConverted=wasConverted(item);
      const backup=isConverted?await mediaDB('get',backupKey(itemId)).catch(()=>null):null;
      // Never crop the already letterboxed 9:16 version: we must go back to Gemini's source video.
      if(isConverted&&!backup)throw Error('Original Gemini MP4 backup was not found. Select the original landscape MP4 again before converting.');
      const source=backup||saved;
      const filename=source.name||item.mediaName;
      if(!/\.mp4$/i.test(filename))throw Error('Only MP4 is supported. Please export Gemini video as MP4.');
      if(source.size>30*1024*1024)throw Error('Video exceeds the 30 MB conversion limit.');
      const choice=mode.value;
      status((choice==='crop'?'Producing full-screen portrait 9:16 (cropping sides)':'Producing 9:16 with blurred borders')+' on Railway… Keep this tab open. YouTube upload stays disabled.');
      const response=await fetch(server()+'/api/convert-shorts?mode='+encodeURIComponent(choice),{
        method:'POST',headers:{Authorization:'Bearer '+session,'Content-Type':'video/mp4'},body:source
      });
      if(!response.ok){
        const err=await response.json().catch(()=>({}));
        if(response.status===401){
          sessionStorage.removeItem(sessionKey);
          authState(false);
          throw Error('Owner session expired. Click Sign in to convert and retry.');
        }
        throw Error(err.error||('HTTP '+response.status));
      }
      const blob=await response.blob();
      if(blob.size<1000 || blob.type!=='video/mp4')throw Error('Railway did not return a valid converted MP4.');
      // Prevent replacing the saved source unless the final output truly has a 9:16 frame.
      const validationUrl=URL.createObjectURL(blob);
      try{
        const dimensions=await new Promise((resolve,reject)=>{
          const video=document.createElement('video');
          video.preload='metadata';video.muted=true;
          const timeout=setTimeout(()=>{video.removeAttribute('src');video.load();reject(Error('Converted video preview timed out.'));},15000);
          video.onloadedmetadata=()=>{clearTimeout(timeout);const data={width:video.videoWidth,height:video.videoHeight};video.removeAttribute('src');video.load();resolve(data);};
          video.onerror=()=>{clearTimeout(timeout);reject(Error('Converted video cannot be played by this browser.'));};
          video.src=validationUrl;
        });
        if(dimensions.width!==1080||dimensions.height!==1920)throw Error('Converted video resolution is '+dimensions.width+'×'+dimensions.height+'; expected 1080×1920.');
      }finally{URL.revokeObjectURL(validationUrl);}
      if(getSelected()?.id!==itemId)throw Error('The selected draft changed. Select the original draft and convert again.');
      if(!backup)await mediaDB('put',backupKey(itemId),saved);
      const newName=filename.replace(/\.mp4$/i,'')+'-Shorts-9x16.mp4';
      await storeSelectedVideo(new File([blob],newName,{type:'video/mp4'}));
      status((choice==='crop'?'Full-screen 9:16 ready':'Blur-border 9:16 ready')+' — verified 1080×1920, '+humanSize(blob.size)+'. Re-watch the entire video before Mark Approved. Original Gemini MP4 is safely preserved in this browser.');
      syncButtons();
    }catch(e){status('Conversion did not complete: '+(e.message||e)+'. Your original video is safe; YouTube was not touched.');}
    finally{convert.disabled=false;}
  });
  restore.addEventListener('click',async()=>{
    const item=getSelected();if(!item)return;
    try{
      const blob=await mediaDB('get',backupKey(item.id));if(!blob)throw Error('No original backup found.');
      await storeSelectedVideo(blob);
      await mediaDB('del',backupKey(item.id));
      status('Original Gemini video restored. Review it before approving.');syncButtons();
    }catch(e){status('Restore failed: '+e.message);}
  });
  download.addEventListener('click',async()=>{
    const item=getSelected();if(!item)return;
    try{
      const blob=await mediaDB('get',item.id);if(!blob)throw Error('No video found.');
      const link=document.createElement('a');const url=URL.createObjectURL(blob);
      link.href=url;link.download=item.mediaName||'orbit-ocean-shorts.mp4';document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),20000);
    }catch(e){status('Download failed: '+e.message);}
  });
  $('removeVideo')?.addEventListener('click',()=>{
    const item=getSelected();if(item)mediaDB('del',backupKey(item.id)).catch(()=>{});
    status('Video removed from local draft. No YouTube upload.');
  },true);
})();