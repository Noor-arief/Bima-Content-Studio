/* Orbit & Ocean — deterministic Shorts cover generator.
   No external API, no remote assets, no media/video/upload mutation. */
(() => {
 'use strict';
 const CUTOFF='2026-10-19';
 const $=id=>document.getElementById(id);
 if(typeof getSelected!=='function'||typeof items!=='function')return;
 const entries=[
 ['Venus','VENUS vs TIME','🟠','space','#161a52','#ef8a4a','SPACE'],
 ['Fireflies','HOW FIREFLIES GLOW','🪲','nature','#082940','#1acbaf','NATURE'],
 ['Fly Backward','FLY BACKWARD?!','🐦','nature','#18355b','#ffb457','WILDLIFE'],
 ['Rock That','FLOATING ROCK?!','🪨','ocean','#073d54','#46c8f2','SCIENCE'],
 ['Owls','SILENT FLYERS','🦉','nature','#17325e','#a990ff','WILDLIFE'],
 ['Frog','FROZEN BUT ALIVE','🐸','nature','#123d56','#8fe39f','WILDLIFE'],
 ['Jellyfish','NO BRAIN?!','🪼','ocean','#0a235a','#9b75ff','OCEAN'],
 ['Polar Bears','BLACK SKIN?!','🐻‍❄️','ice','#163a66','#7bd9ee','WILDLIFE'],
 ['Bees','THE BEE DANCE','🐝','nature','#37345c','#faca4e','NATURE'],
 ['Saturn','SATURN’S ICE RINGS','🪐','space','#161640','#b48bff','SPACE'],
 ['Pine Cones','PINE CONE SECRET','🌲','nature','#153f3b','#a3d46f','NATURE'],
 ['Seahorses','DAD GIVES BIRTH?!','🐠','ocean','#04475b','#ffaf76','OCEAN'],
 ['Space Is Silent','SPACE IS SILENT','🌌','space','#0c163c','#a1a5ff','SPACE'],
 ['Moonquake','THE MOON SHAKES','🌕','space','#131c51','#bac8ff','SPACE'],
 ['Red Disappears','WHERE DID RED GO?','🌊','ocean','#023b62','#28a7e8','OCEAN'],
 ['Cuttlefish','COLOR CHANGERS','🦑','ocean','#123e64','#f08fb5','OCEAN'],
 ['Wombat','CUBE-SHAPED POOP?!','🐾','nature','#5a3343','#f9bf75','WILDLIFE'],
 ['Whales','WHALES CAN SING','🐋','ocean','#06395f','#83c4ff','OCEAN'],
 ['Coral Is','CORAL IS ALIVE','🪸','ocean','#073a65','#ff8db0','OCEAN'],
 ['Dolphins','HALF-ASLEEP?!','🐬','ocean','#0a3c70','#7fcff6','OCEAN'],
 ['Northern Lights','SKY LIGHT SHOW','🌌','space','#10355b','#62f5d9','SPACE'],
 ['Snowflakes','SIX-ARM SNOWFLAKES','❄️','ice','#163d6e','#a5e8ff','SCIENCE'],
 ['Sharks','NO BONES?!','🦈','ocean','#053556','#73c9de','OCEAN'],
 ['Antifreeze','FISH THAT DON’T FREEZE','🐟','ice','#174e70','#b8e5ef','OCEAN'],
 ['Jupiter','JUPITER’S BIG STORM','🟤','space','#3c295f','#eea276','SPACE'],
 ['Arctic Fox','CHANGING COATS','🦊','ice','#25537c','#d8edff','WILDLIFE'],
 ['Deep Currents','THE OCEAN MOVES','🌊','ocean','#08486e','#79e2cc','OCEAN'],
 ['Winter Days','SHORTER WINTER DAYS','🌗','space','#212b61','#ffc68b','SPACE'],
 ['Penguins','DRINKING SALT WATER?','🐧','ice','#1f496a','#96ddeb','WILDLIFE'],
 ['Evergreen','ALWAYS GREEN','🌲','nature','#144c3b','#8ee0a1','NATURE'],
 ['Tallest Volcano','MARS GIANT VOLCANO','🌋','space','#492a60','#f89e71','SPACE'],
 ['Tardigrades','TINY SURVIVORS','🔬','nature','#174d56','#80d2ae','SCIENCE'],
 ['Leap Days','WHY LEAP DAYS?','🌍','space','#14325c','#ffc278','SPACE']
 ];
 const customByDate={
  '2026-10-19':['VENUS vs TIME','🟠'], '2026-10-21':['HOW FIREFLIES GLOW','🪲'],
  '2026-10-23':['FLY BACKWARD?!','🐦'], '2026-10-26':['FLOATING ROCK?!','🪨'],
  '2026-10-28':['SILENT FLYERS','🦉'], '2026-10-30':['FROZEN BUT ALIVE','🐸'],
  '2026-11-02':['NO BRAIN?!','🪼'],'2026-11-04':['BLACK SKIN?!','🐻‍❄️'],
  '2026-11-06':['THE BEE DANCE','🐝'],'2026-11-09':['SATURN’S ICE RINGS','🪐'],
  '2026-11-11':['PINE CONE SECRET','🌲'],'2026-11-13':['DAD GIVES BIRTH?!','🐠'],
  '2026-11-16':['SPACE IS SILENT','🌌'],'2026-11-18':['THE MOON SHAKES','🌕'],
  '2026-11-20':['WHERE DID RED GO?','🌊'],'2026-11-23':['COLOR CHANGERS','🦑'],
  '2026-11-25':['CUBE-SHAPED POOP?!','🐾'],'2026-11-27':['WHALES CAN SING','🐋'],
  '2026-11-30':['CORAL IS ALIVE','🪸'],'2026-12-02':['HALF-ASLEEP?!','🐬'],
  '2026-12-04':['SKY LIGHT SHOW','🌌'],'2026-12-07':['SIX-ARM SNOWFLAKES','❄️'],
  '2026-12-09':['NO BONES?!','🦈'],'2026-12-11':['FISH THAT DON’T FREEZE','🐟'],
  '2026-12-14':['JUPITER’S BIG STORM','🟤'],'2026-12-16':['CHANGING COATS','🦊'],
  '2026-12-18':['THE OCEAN MOVES','🌊'],'2026-12-21':['SHORTER WINTER DAYS','🌗'],
  '2026-12-23':['DRINKING SALT WATER?','🐧'],'2026-12-25':['ALWAYS GREEN','🌲'],
  '2026-12-28':['MARS GIANT VOLCANO','🌋'],'2026-12-30':['TINY SURVIVORS','🔬'],
  '2026-12-31':['WHY LEAP DAYS?','🌍']
 };
 const isEligible=i=>!!i&&typeof i.date==='string'&&i.date>=CUTOFF;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pad=n=>String(n).padStart(2,'0');
 const hash=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)}return x>>>0;};
 function smartHeadline(title){
   const words=String(title||'SCIENCE SURPRISE').toUpperCase().replace(/[?!.]/g,'').split(/\s+/)
    .filter(x=>x&&!['A','AN','THE','THAT','IS','DOES','WITH','AND','OUR','ITS','OF'].includes(x));
   return (words.slice(0,5).join(' ')||'SCIENCE SURPRISE').slice(0,36);
 }
 function theme(item){
   const title=String(item.title||'');
   const matched=entries.find(x=>title.toLowerCase().includes(x[0].toLowerCase()));
   const hints=matched||['Science Surprise','SCIENCE SURPRISE','✨','space','#141e55','#7a8bff','SCIENCE'];
   // A date is not a permanent topic identifier. User title edits must regenerate the art.
   const planned=typeof SCHEDULE_2026!=='undefined'&&Array.isArray(SCHEDULE_2026)
     ? SCHEDULE_2026.find(i=>i.id===item.id):null;
   const original=!!planned&&planned.title===title&&planned.date===item.date;
   const preset=original?customByDate[item.date]:null;
   return {headline:item.thumbnailHeadline||preset?.[0]||smartHeadline(title),
     icon:preset?.[1]||hints[2],category:hints[6],kind:hints[3],dark:hints[4],light:hints[5]};
 }
 function wrapTitle(value){
   const words=String(value).trim().toUpperCase().split(/\s+/).filter(Boolean);
   const lines=[];let line='';
   for(const word of words){
     if((line+' '+word).trim().length>15&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();
   }
   if(line)lines.push(line);
   return lines.slice(0,3);
 }
 const svgCache=new Map();
 function svg(item){
   if(!isEligible(item))return '';
   const t=theme(item),sig=item.id+'|'+item.date+'|'+t.headline+'|'+t.icon+'|'+t.dark+'|'+t.light;
   if(svgCache.has(sig))return svgCache.get(sig);
   const seed=hash(item.id),lines=wrapTitle(t.headline),font=lines.some(l=>l.length>13)?104:122;
   const letter=lines.map((l,n)=>'<text x="76" y="'+(1280+124*n)+'" font-family="Arial,Helvetica,sans-serif" font-size="'+font+'" font-weight="900" letter-spacing="-3" fill="#ffffff" paint-order="stroke" stroke="#0b1630" stroke-width="3">'+esc(l)+'</text>').join('');
   const stars=Array.from({length:30},(_,i)=>{const x=32+((seed+i*173+((i*i*47)%541))%1016),y=115+((seed+i*283+((i*i*19)%929))%1080),size=i%4===0?6:2.6;return '<circle cx="'+x+'" cy="'+y+'" r="'+size+'" fill="#fff" opacity="'+(0.16+((i%5)*.12))+'"/>';}).join('');
   const waves=t.kind==='ocean'
    ?'<path d="M0 1060 Q250 1000 540 1078 T1080 1048 V1920 H0Z" fill="#12b7b8" opacity=".12"/><path d="M0 1130 Q220 1060 540 1150 T1080 1115" fill="none" stroke="#a8fff2" stroke-width="9" opacity=".25"/>'
    :t.kind==='nature'?'<path d="M0 1015 Q235 940 540 1050 Q790 980 1080 1040 V1920H0Z" fill="#9dffba" opacity=".09"/>'
    :'<ellipse cx="565" cy="820" rx="470" ry="350" fill="#adb6ff" opacity=".07"/>';
   // Science-specific vector art avoids misleading iconography (e.g. rings on Venus/Jupiter).
   const topic=String(item.title||'').toLowerCase();
   const artwork=topic.includes('venus')
      ? '<g><circle cx="540" cy="765" r="230" fill="#f9b36f" stroke="#ffdaaa" stroke-width="9"/><path d="M338 690 Q510 600 722 690 M320 760 Q540 700 768 765 M350 830 Q530 760 730 830 M385 900 Q540 875 690 890" stroke="#ed885d" stroke-width="30" fill="none" opacity=".72"/><ellipse cx="465" cy="659" rx="70" ry="25" fill="#fff3cf" opacity=".26" transform="rotate(-22 465 659)"/></g>'
      :topic.includes('jupiter')
      ? '<g><circle cx="540" cy="765" r="232" fill="#d49a75" stroke="#f4d4aa" stroke-width="10"/><path d="M333 665 Q545 710 747 665 M314 743 Q539 697 766 743 M319 818 Q546 860 758 818 M355 898 Q545 866 718 900" stroke="#f7d1ab" stroke-width="40" fill="none" opacity=".75"/><ellipse cx="640" cy="828" rx="65" ry="34" fill="#c95f56" stroke="#f1aa8b" stroke-width="9"/></g>'
      :topic.includes('seahorse')
      ? '<g transform="translate(0 -10)"><path d="M586 545 Q745 565 724 664 L680 688 Q746 729 700 815 L632 844 Q667 903 620 955 Q575 1000 523 966 Q485 941 515 896 Q538 869 572 899 Q572 928 549 923 Q578 945 595 914 Q610 888 582 870 Q480 820 515 754 Q470 723 496 672 L460 649 Q458 594 524 584 Q540 543 586 545Z" fill="#ffb56d" stroke="#ffddaa" stroke-width="12"/><circle cx="561" cy="612" r="17" fill="#112944"/><circle cx="568" cy="607" r="5" fill="white"/><path d="M703 665 L754 664" stroke="#ffd1a6" stroke-width="22" stroke-linecap="round"/><path d="M631 665 L659 677 M636 716 L668 725 M624 764 L655 779" stroke="#f17d67" stroke-width="13" stroke-linecap="round"/></g>'
      :'<text x="540" y="950" font-size="430" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,Arial" text-anchor="middle">'+esc(t.icon)+'</text>';
   const date=item.date.split('-');
   const out='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="'+esc(item.title)+' cover">'+
   '<defs><linearGradient id="bg" x1="0" y1="0" x2=".95" y2="1"><stop offset="0" stop-color="'+t.dark+'"/><stop offset=".6" stop-color="'+t.light+'"/><stop offset="1" stop-color="#090e2a"/></linearGradient>'+
   '<radialGradient id="halo"><stop offset="0" stop-color="#fff" stop-opacity=".52"/><stop offset=".45" stop-color="#b4effe" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'+
   '<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#080d27" stop-opacity="0"/><stop offset=".45" stop-color="#080d27" stop-opacity=".4"/><stop offset="1" stop-color="#080d27" stop-opacity=".97"/></linearGradient></defs>'+
   '<rect width="1080" height="1920" fill="url(#bg)"/>'+stars+waves+
   '<circle cx="540" cy="800" r="420" fill="url(#halo)"/>'+
   '<circle cx="540" cy="770" r="318" fill="none" stroke="#fff" stroke-opacity=".27" stroke-width="4"/>'+
   '<circle cx="540" cy="770" r="360" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="2" stroke-dasharray="16 20"/>'+
   artwork+
   '<rect x="0" y="990" width="1080" height="930" fill="url(#shade)"/>'+
   '<text x="77" y="119" fill="#e8f3ff" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="41" letter-spacing="10">ORBIT &amp; OCEAN</text>'+
   '<rect x="77" y="161" width="325" height="8" rx="4" fill="#7ce7d5"/>'+
   '<text x="76" y="1180" font-family="Arial,Helvetica,sans-serif" font-size="36" letter-spacing="8" font-weight="700" fill="#aef5e4">'+esc(t.category)+' · SHORTS</text>'+letter+
   '<text x="80" y="1703" font-family="Arial,Helvetica,sans-serif" font-size="36" font-weight="700" fill="#c6d4ef">SMALL VIDEOS. BIG WONDERS.</text>'+
   '<rect x="80" y="1750" width="920" height="2" fill="#fff" opacity=".3"/>'+
   '<text x="80" y="1815" font-family="Arial,Helvetica,sans-serif" font-size="30" letter-spacing="3" fill="#fff" opacity=".78">'+esc(date[2]+' / '+date[1]+' / '+date[0])+'</text>'+
   '<text x="1000" y="1815" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="30" fill="#aaf3dd">SCIENCE EXPLAINED</text>'+
   '</svg>';
   if(svgCache.size>150)svgCache.clear();
   svgCache.set(sig,out);return out;
 }

 // Final cover is ALWAYS derived from the final MP4. Before that, only a labeled concept.
 const DB_NAME='bima-video-matched-thumbnail-v1';
 const STORE_NAME='covers';
 const coverMemory=new Map();
 const pending=new Map();
 let selectedId='',shownPreviewUrl='',session=0;
 function signature(item){
   return [item?.id,item?.title,item?.date,item?.mediaName,item?.mediaSize,'actual-frame-v1'].join('|');
 }
 function src(item){return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg(item));}
 function openCoverDB(){
   return new Promise((resolve,reject)=>{
     if(!('indexedDB'in window))return reject(Error('Browser thumbnail storage unavailable'));
     const req=indexedDB.open(DB_NAME,1);
     req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE_NAME))req.result.createObjectStore(STORE_NAME)};
     req.onsuccess=()=>resolve(req.result);
     req.onerror=()=>reject(req.error||Error('Cover storage unavailable'));
   });
 }
 async function coverStore(mode,id,value){
   const db=await openCoverDB();
   return new Promise((resolve,reject)=>{
     const tx=db.transaction(STORE_NAME,mode==='get'?'readonly':'readwrite');
     const store=tx.objectStore(STORE_NAME);
     const req=mode==='get'?store.get(id):mode==='put'?store.put(value,id):store.delete(id);
     req.onsuccess=()=>resolve(req.result);
     req.onerror=()=>reject(req.error||Error('Thumbnail storage failed'));
     tx.oncomplete=()=>db.close();
     tx.onerror=()=>reject(tx.error||Error('Thumbnail transaction failed'));
   });
 }
 async function readCover(item){
   if(!isEligible(item)||!item.mediaName)return null;
   const sig=signature(item);
   const cached=coverMemory.get(item.id);
   if(cached&&cached.signature===sig)return cached;
   const row=await coverStore('get',item.id).catch(()=>null);
   if(row?.signature===sig&&row.blob instanceof Blob){
     coverMemory.set(item.id,row);return row;
   }
   return null;
 }
 async function removeCover(id){
   coverMemory.delete(id);
   await coverStore('del',id).catch(()=>{});
 }
 function previewFromBlob(img,blob,item){
   const url=URL.createObjectURL(blob);
   const sig=signature(item);
   img.addEventListener('load',()=>URL.revokeObjectURL(url),{once:true});
   if(img.dataset)img.dataset.coverSignature=sig;
   img.src=url;
 }
 function image(item,cls){
   const img=document.createElement('img');
   img.className=cls;img.alt='Concept thumbnail: '+item.title;
   img.decoding='async';img.loading='lazy';img.src=src(item);
   if(img.dataset)img.dataset.coverKind='concept';
   if(item.mediaName){
     void readCover(item).then(row=>{
       if(!row||!img.isConnected||row.signature!==signature(item))return;
       img.alt='Final thumbnail taken from actual video: '+item.title;
       if(img.dataset)img.dataset.coverKind='final';
       previewFromBlob(img,row.blob,item);
     }).catch(()=>{});
   }
   return img;
 }
 function calendarTile(day,list){
   const item=list.find(isEligible);if(!item)return;
   day.classList.add('has-auto-cover');
   const thumb=image(item,'auto-calendar-thumb');
   day.appendChild(thumb);
   const tag=document.createElement('span');
   tag.className='auto-thumb-status';tag.textContent='CONCEPT';
   day.appendChild(tag);
   if(item.mediaName)void readCover(item).then(row=>{
     if(row&&tag.isConnected&&row.signature===signature(item))tag.textContent='VIDEO FRAME';
   });
   day.title='Concept before MP4 · Final cover uses actual frame of the video';
 }
 function dayRow(btn,item){
   if(!isEligible(item))return;
   btn.classList.add('has-auto-cover');
   btn.prepend(image(item,'auto-list-thumb'));
   const tag=document.createElement('span');tag.className='auto-list-label';tag.textContent='CONCEPT';
   btn.appendChild(tag);
   if(item.mediaName)void readCover(item).then(row=>{
     if(row&&tag.isConnected&&row.signature===signature(item))tag.textContent='VIDEO FRAME';
   });
 }
 function frame(canvas,ctx,video){
   const sw=video.videoWidth,sh=video.videoHeight,w=canvas.width,h=canvas.height;
   if(!sw||!sh)throw Error('Video dimensions unavailable');
   const ratio=Math.max(w/sw,h/sh),cw=w/ratio,ch=h/ratio;
   ctx.drawImage(video,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,w,h);
 }
 async function seek(video,time){
   return new Promise((resolve,reject)=>{
     let done=false;
     const finish=(e)=>{if(done)return;done=true;clearTimeout(timer);
       video.removeEventListener('seeked',ok);video.removeEventListener('error',fail);
       e?reject(e):resolve();
     };
     const ok=()=>finish(),fail=()=>finish(Error('Could not decode video frame'));
     const timer=setTimeout(()=>finish(Error('Video frame extraction timed out')),7500);
     video.addEventListener('seeked',ok,{once:true});
     video.addEventListener('error',fail,{once:true});
     try{video.currentTime=time;}catch(e){finish(e);}
   });
 }
 function rating(canvas,ctx){
   const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let count=0,sum=0,sq=0,sat=0,black=0;
   for(let y=35;y<canvas.height-45;y+=5){
     for(let x=20;x<canvas.width-20;x+=5){
       const i=(y*canvas.width+x)*4,r=data[i],g=data[i+1],b=data[i+2];
       const l=.2126*r+.7152*g+.0722*b;
       sum+=l;sq+=l*l;sat+=Math.max(r,g,b)-Math.min(r,g,b);black+=l<22?1:0;count++;
     }
   }
   const average=sum/count,contrast=Math.sqrt(Math.max(0,sq/count-average*average));
   return contrast*.9+(sat/count)*.42-(black/count)*80-(average<30?30:0);
 }
 function wordWrap(ctx,title,maxWidth){
   const list=String(title).trim().toUpperCase().split(/\s+/);
   const lines=[],buffer=[];
   for(const word of list){
     if(buffer.length&&ctx.measureText([...buffer,word].join(' ')).width>maxWidth){
       lines.push(buffer.join(' '));buffer.length=0;
     }
     buffer.push(word);
   }
   if(buffer.length)lines.push(buffer.join(' '));
   return lines.slice(0,3);
 }
 function drawFinal(video,item){
   const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
   frame(canvas,ctx,video);
   const top=ctx.createLinearGradient(0,0,0,500);
   top.addColorStop(0,'rgba(6,12,34,.72)');top.addColorStop(1,'rgba(6,12,34,0)');
   ctx.fillStyle=top;ctx.fillRect(0,0,1080,500);
   const bottom=ctx.createLinearGradient(0,1020,0,1920);
   bottom.addColorStop(0,'rgba(5,11,29,0)');
   bottom.addColorStop(.3,'rgba(5,11,29,.62)');
   bottom.addColorStop(1,'rgba(5,11,29,.97)');
   ctx.fillStyle=bottom;ctx.fillRect(0,1020,1080,900);
   ctx.fillStyle='#fff';ctx.font='bold 46px Arial,sans-serif';ctx.fillText('ORBIT & OCEAN',72,122);
   ctx.fillStyle='#7ce7d5';ctx.fillRect(72,151,290,8);
   ctx.font='bold 34px Arial,sans-serif';ctx.fillText('SMALL VIDEOS · BIG WONDERS',73,1825);
   const title=theme(item).headline;
   ctx.font='900 116px Arial,sans-serif';
   let lines=wordWrap(ctx,title,900);
   if(lines.length>3||lines.some(l=>ctx.measureText(l).width>920)){
     ctx.font='900 92px Arial,sans-serif';lines=wordWrap(ctx,title,915);
   }
   ctx.textBaseline='alphabetic';ctx.lineJoin='round';
   lines.forEach((line,i)=>{
     const y=1360+130*i;
     ctx.lineWidth=12;ctx.strokeStyle='rgba(5,12,31,.92)';ctx.strokeText(line,75,y,910);
     ctx.fillStyle='#fff';ctx.fillText(line,75,y,910);
   });
   return canvas;
 }
 function toPng(canvas){
   return new Promise((resolve,reject)=>canvas.toBlob(
     blob=>blob?resolve(blob):reject(Error('PNG export failed')),'image/png'));
 }
 async function buildCover(item,forced=false){
   if(!isEligible(item)||!item.mediaName)return null;
   const expected=signature(item);
   if(!forced){const row=await readCover(item);if(row)return row;}
   const file=await mediaDB('get',item.id);
   if(!(file instanceof Blob)||file.size<1024)throw Error('Final MP4 is not available in this browser. Reattach the video.');
   const url=URL.createObjectURL(file),v=document.createElement('video');
   v.preload='auto';v.muted=true;v.playsInline=true;v.crossOrigin='anonymous';
   try{
     await new Promise((resolve,reject)=>{
       let done=false;
       const finish=e=>{if(done)return;done=true;clearTimeout(timer);
         v.removeEventListener('loadedmetadata',ok);v.removeEventListener('error',bad);
         e?reject(e):resolve();
       };
       const ok=()=>finish(),bad=()=>finish(Error('Cannot decode MP4 metadata'));
       const timer=setTimeout(()=>finish(Error('Video metadata timed out')),15000);
       v.addEventListener('loadedmetadata',ok,{once:true});
       v.addEventListener('error',bad,{once:true});
       v.src=url;v.load();
     });
     if(!Number.isFinite(v.duration)||v.duration<=0)throw Error('MP4 duration unavailable');
     const candidates=[.16,.32,.49,.65,.78];
     const prior=await readCover(item);
     const next=forced&&prior?((candidates.findIndex(q=>Math.abs(q-prior.ratio)<.005)+1)%candidates.length):-1;
     const sample=document.createElement('canvas');sample.width=180;sample.height=320;
     const ctx=sample.getContext('2d',{willReadFrequently:true});
     if(!ctx)throw Error('Canvas frame extraction unavailable');
     let choices=[];
     for(let i=0;i<candidates.length;i++){
       const fraction=candidates[i],seconds=Math.max(.1,Math.min(v.duration-.07,v.duration*fraction));
       try{await seek(v,seconds);frame(sample,ctx,v);choices.push({ratio:fraction,score:rating(sample,ctx)});}
       catch(e){if(!choices.length&&i===candidates.length-1)throw e;}
     }
     if(!choices.length)throw Error('No decodable video frames found');
     choices.sort((a,b)=>b.score-a.score);
     const picked=next<0?choices[0]:choices.find(x=>x.ratio===candidates[next])||choices[0];
     await seek(v,Math.max(.1,Math.min(v.duration-.07,v.duration*picked.ratio)));
     const blob=await toPng(drawFinal(v,item));
     if(signature(item)!==expected)return null;
     const saved={signature:expected,ratio:picked.ratio,blob,createdAt:Date.now()};
     coverMemory.set(item.id,saved);
     await coverStore('put',item.id,saved).catch(e=>{console.warn('Thumbnail saved in memory only',e)});
     return saved;
   }finally{
     v.pause();v.removeAttribute('src');v.load();URL.revokeObjectURL(url);
   }
 }
 async function ensureFinal(item,force=false){
   if(!isEligible(item)||!item.mediaName)return null;
   if(!force){
     const cached=await readCover(item);
     if(cached)return cached;
   }
   if(pending.has(item.id))return pending.get(item.id);
   const task=buildCover(item,force).finally(()=>pending.delete(item.id));
   pending.set(item.id,task);return task;
 }
 const style=document.createElement('style');
 style.textContent=[
   '.day.has-auto-cover{position:relative;padding-right:50px}',
   '.day .auto-calendar-thumb{position:absolute;right:6px;top:28px;width:39px;height:59px;object-fit:cover;border:1px solid rgba(183,218,247,.34);border-radius:5px}',
   '.day .auto-thumb-status{position:absolute;right:3px;bottom:3px;font-size:7px;letter-spacing:.01em;color:#dcdefe;background:#101c40;border-radius:3px;padding:1px 3px;pointer-events:none}',
   '.item.has-auto-cover{position:relative;padding-left:74px;min-height:89px}',
   '.item .auto-list-thumb{position:absolute;top:10px;left:13px;width:49px;height:67px;object-fit:cover;border:1px solid rgba(183,218,247,.4);border-radius:7px}',
   '.item .auto-list-label{display:inline-block;margin-top:6px;color:#8fe8c9;font-size:10px}',
   '#thumbnailAutoPanel{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,190px) 1fr;gap:18px;background:rgba(97,114,210,.07);border:1px solid rgba(142,156,238,.33);border-radius:14px;padding:16px;margin:4px 0 14px}',
   '#thumbnailAutoPanel[hidden]{display:none!important}',
   '#thumbnailAutoPanel .auto-preview{width:100%;max-width:190px;aspect-ratio:9/16;object-fit:contain;border-radius:9px;border:1px solid rgba(182,220,250,.25)}',
   '#thumbnailAutoPanel h3{color:#eef4ff;font-size:16px;margin:0 0 8px}',
   '#thumbnailAutoPanel p{font-size:12px;line-height:1.6;color:#aebce1;margin:7px 0}',
   '#thumbnailAutoPanel .auto-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:12px 0}',
   '#thumbnailAutoPanel .auto-btn{border:1px solid rgba(146,163,247,.33);border-radius:9px;background:#1c2950;color:#f2f4ff;padding:9px 13px;font:inherit;font-size:12px;font-weight:650;min-height:36px;cursor:pointer}',
   '#thumbnailAutoPanel .auto-btn-primary{background:linear-gradient(120deg,#7467ed,#668cff);color:white}',
   '#thumbnailAutoPanel .auto-btn:disabled{opacity:.5;cursor:not-allowed}',
   '#thumbnailAutoPanel .auto-msg{color:#94edce;min-height:20px}',
   '@media(max-width:650px){#thumbnailAutoPanel{grid-template-columns:120px 1fr;padding:11px;gap:12px}#thumbnailAutoPanel .auto-preview{max-width:120px}.day .auto-calendar-thumb{width:28px;height:45px;top:44px}.day.has-auto-cover{padding-right:35px}}'
 ].join('\n');
 document.head.append(style);
 const field=$('fCaption')?.closest('.field')||$('fTitle')?.closest('.field');
 const panel=document.createElement('section');panel.id='thumbnailAutoPanel';panel.hidden=true;
 panel.setAttribute('aria-label','Video-matched YouTube Shorts thumbnail');
 panel.innerHTML='<img class="auto-preview" id="autoThumbPreview" alt="Preview of video thumbnail"/>'+
 '<div><h3>Thumbnail · Matched to Video</h3>'+
 '<p id="autoThumbTitle">Waiting for selected content…</p>'+
 '<p id="autoThumbMode">CONCEPT PREVIEW · Final thumbnail will use an actual MP4 frame.</p>'+
 '<div class="auto-actions"><button type="button" id="autoThumbDownload" class="auto-btn auto-btn-primary" disabled>Download Final PNG</button>'+
 '<button type="button" id="autoThumbRefresh" class="auto-btn">Try another video frame</button></div>'+
 '<p id="autoThumbMessage" class="auto-msg" role="status" aria-live="polite"></p>'+
 '<p>Before MP4: concept only, not final. After MP4: actual video frame, same character, colors and background; 1080 × 1920 PNG. Does not auto-upload to YouTube.</p></div>';
 if(field)field.insertAdjacentElement('beforebegin',panel);
 function note(text){const n=$('autoThumbMessage');if(n)n.textContent=text;}
 function updatePanelImage(item,row,check){
   if(session!==check||item.id!==getSelected()?.id)return;
   const button=$('autoThumbDownload'),mode=$('autoThumbMode'),preview=$('autoThumbPreview');
   if(row){
     previewFromBlob(preview,row.blob,item);
     mode.textContent='FINAL · FRAME FROM YOUR MP4 · Matched to video';
     button.disabled=false;
     note('✓ Video-matched thumbnail ready. Download PNG or try another frame.');
     if(typeof renderCalendar==='function')renderCalendar();
     if(typeof renderDay==='function')renderDay();
   }else{
     preview.src=src(item);mode.textContent='CONCEPT PREVIEW · Not taken from video';
     button.disabled=true;
   }
 }
 async function showPanel(){
   const item=getSelected();session++;
   const check=session;selectedId=item?.id||'';
   if(!panel.isConnected||!isEligible(item)){panel.hidden=true;return;}
   panel.hidden=false;
   $('autoThumbPreview').src=src(item);
   $('autoThumbDownload').disabled=true;
   $('autoThumbTitle').textContent=theme(item).headline+' · '+item.date+' · '+item.title;
   $('autoThumbMode').textContent='CONCEPT PREVIEW · Not taken from video';
   if(!item.mediaName){note('Concept only. Attach your FINAL MP4 in Production Desk to generate the matching thumbnail.');return;}
   note('Checking saved video and generating a matching frame thumbnail…');
   try{
     const row=await ensureFinal(item);
     if(row)updatePanelImage(item,row,check);
   }catch(e){
     if(session===check)note('Final cover not ready: '+e.message+'. The concept is not a publish-ready thumbnail.');
   }
 }
 async function download(){
   const item=getSelected();if(!isEligible(item))return;
   const button=$('autoThumbDownload');button.disabled=true;
   try{
     const row=await readCover(item);
     if(!row)throw Error('No final video frame yet. Attach the final MP4 first.');
     const url=URL.createObjectURL(row.blob);
     const a=document.createElement('a');a.href=url;
     a.download='orbit-ocean-'+item.date+'-'+item.id.replace(/[^a-zA-Z0-9-]/g,'')+'-video-matched-9x16.png';
     document.body.appendChild(a);a.click();a.remove();
     setTimeout(()=>URL.revokeObjectURL(url),15000);
     note('✓ Final 1080 × 1920 PNG downloaded. Video itself was not changed.');
   }catch(e){note('Download blocked: '+e.message);}
   finally{button.disabled=false;}
 }
 async function refresh(){
   const item=getSelected();if(!isEligible(item))return;
   const check=++session;
   if(!item.mediaName){note('Attach a final MP4 first. Concept covers cannot be downloaded as final.');return;}
   $('autoThumbRefresh').disabled=true;note('Selecting another frame from the actual MP4…');
   try{
     const row=await ensureFinal(item,true);
     if(row)updatePanelImage(item,row,check);
   }catch(e){if(check===session)note('Could not choose another frame: '+e.message);}
   finally{$('autoThumbRefresh').disabled=false;}
 }
 $('autoThumbDownload')?.addEventListener('click',()=>void download());
 $('autoThumbRefresh')?.addEventListener('click',()=>void refresh());
 // New file invalidates previous final thumbnail, even if replacement has the same name/size.
 $('videoFile')?.addEventListener('change',()=>{
   const selected=getSelected();if(!selected)return;
   void removeCover(selected.id);
   if(isEligible(selected))note('New MP4 selected. The final thumbnail will be regenerated from this video.');
 });
 document.addEventListener('bima:episode-selected',()=>void showPanel());
 document.addEventListener('bima:render-status',()=>{
   const id=getSelected()?.id||'';
   if(id!==selectedId)void showPanel();
 });
 window.BIMA_THUMBNAILS={isEligible,svg,src,calendarTile,dayRow,showPanel,readCover,ensureFinal};
 if(typeof renderCalendar==='function'&&typeof renderDay==='function'){
   renderCalendar();renderDay();
 }
 void showPanel();

})();