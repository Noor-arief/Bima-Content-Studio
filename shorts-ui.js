(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const actions = $('mediaPreviewWrap')?.querySelector('.media-actions');
  if (!actions || !$('apiEndpoint') || typeof getSelected !== 'function' || typeof mediaDB !== 'function') return;

  const style = document.createElement('style');
  style.textContent = '.shorts-mode{max-width:190px;min-height:34px;padding:6px 9px;background:#111b3d;color:#e6edff;border:1px solid #344372;border-radius:8px;font-size:12px}.shorts-note{font-size:11.5px;line-height:1.55;color:#b9c9f5;display:block;margin-top:8px}.media-actions .shorts-convert{background:linear-gradient(135deg,#7766ef,#597cff);color:#fff;font-weight:700}.media-actions .shorts-convert:disabled{opacity:.5;cursor:wait}';
  document.head.append(style);

  const convert = document.createElement('button');
  convert.type = 'button'; convert.className='btn shorts-convert'; convert.id='convertShorts';
  convert.textContent='Auto Convert 9:16';
  const mode = document.createElement('select');
  mode.className='shorts-mode'; mode.id='shortsMode'; mode.setAttribute('aria-label','Shorts conversion mode');
  mode.innerHTML='<option value="blur">Blur background (safe)</option><option value="crop">Crop to fill</option>';
  const restore = document.createElement('button');
  restore.type='button'; restore.id='restoreOriginal'; restore.className='btn ghost';restore.textContent='Restore original';restore.hidden=true;
  const download = document.createElement('button');
  download.type='button';download.className='btn ghost';download.textContent='Download MP4';
  const note = document.createElement('small');
  note.className='shorts-note';note.id='shortsConversionMessage';note.setAttribute('role','status');note.setAttribute('aria-live','polite');
  note.textContent='Auto Convert uses your private Railway server (up to 30 MB / 65 seconds). It does not publish or upload to YouTube.';
  actions.prepend(convert,mode,restore,download);actions.after(note);

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

  convert.addEventListener('click',async()=>{
    if(convert.disabled)return;
    convert.disabled=true;
    try{
      const item=getSelected();if(!item?.mediaName)throw Error('Choose a saved Gemini video first.');
      const itemId=item.id;
      const session=sessionStorage.getItem('bima_content_server_session');
      if(!session)throw Error('Use Sign in as YouTube owner (Google) first. The conversion endpoint is private.');
      const saved=await mediaDB('get',itemId);
      if(!saved)throw Error('Saved MP4 is missing from this browser. Attach the Gemini export again.');
      const backup=wasConverted(item)?await mediaDB('get',backupKey(itemId)).catch(()=>null):null;
      const source=backup||saved;
      const filename=source.name||item.mediaName;
      if(!/\.mp4$/i.test(filename))throw Error('Only MP4 is supported. Please export Gemini video as MP4.');
      if(source.size>30*1024*1024)throw Error('Video exceeds the 30 MB conversion limit.');
      const choice=mode.value;
      status('Converting to portrait 1080×1920 on Railway. Keep this tab open. No YouTube upload is happening.');
      const response=await fetch(server()+'/api/convert-shorts?mode='+encodeURIComponent(choice),{
        method:'POST',headers:{Authorization:'Bearer '+session,'Content-Type':'video/mp4'},body:source
      });
      if(!response.ok){const err=await response.json().catch(()=>({}));throw Error(err.error||('HTTP '+response.status));}
      const blob=await response.blob();
      if(blob.size<1000 || blob.type!=='video/mp4')throw Error('Railway did not return a valid converted MP4.');
      if(getSelected()?.id!==itemId)throw Error('The selected draft changed. Select the original draft and convert again.');
      if(!backup)await mediaDB('put',backupKey(itemId),saved);
      const newName=filename.replace(/\.mp4$/i,'')+'-Shorts-9x16.mp4';
      await storeSelectedVideo(new File([blob],newName,{type:'video/mp4'}));
      status('Done — 1080×1920, '+choice+', '+humanSize(blob.size)+'. Original preserved in this browser. Preview and Mark Approved before private upload.');
      syncButtons();
    }catch(e){status('Conversion failed: '+(e.message||e)+'. Original video remains saved; nothing was uploaded to YouTube.');}
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