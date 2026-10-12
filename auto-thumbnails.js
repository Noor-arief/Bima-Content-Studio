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
 function src(item){return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg(item));}
 function image(item,cls){
   const img=document.createElement('img');img.className=cls;img.alt='Thumbnail otomatis: '+item.title;
   img.decoding='async';img.loading='lazy';img.src=src(item);return img;
 }
 function calendarTile(day,list){
   const item=list.find(isEligible);if(!item)return;
   day.classList.add('has-auto-cover');
   day.appendChild(image(item,'auto-calendar-thumb'));
   day.title='Thumbnail otomatis tersedia · '+item.title;
 }
 function dayRow(btn,item){
   if(!isEligible(item))return;
   btn.classList.add('has-auto-cover');
   btn.prepend(image(item,'auto-list-thumb'));
 }
 const style=document.createElement('style');
 style.textContent=[
   '.day.has-auto-cover{position:relative;padding-right:50px}',
   '.day .auto-calendar-thumb{position:absolute;right:6px;top:29px;width:39px;height:59px;object-fit:cover;border:1px solid rgba(183,218,247,.34);border-radius:5px;box-shadow:0 5px 12px rgba(0,0,0,.32)}',
   '.item.has-auto-cover{position:relative;padding-left:74px;min-height:89px}',
   '.item .auto-list-thumb{position:absolute;top:10px;left:13px;width:49px;height:67px;object-fit:cover;border:1px solid rgba(183,218,247,.4);border-radius:7px}',
   '#thumbnailAutoPanel{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,190px) 1fr;gap:18px;background:rgba(97,114,210,.07);border:1px solid rgba(142,156,238,.33);border-radius:14px;padding:16px;margin:4px 0 14px;align-items:start}',
   '#thumbnailAutoPanel[hidden]{display:none!important}',
   '#thumbnailAutoPanel .auto-preview{width:100%;max-width:190px;aspect-ratio:9/16;object-fit:contain;border-radius:9px;border:1px solid rgba(182,220,250,.25)}',
   '#thumbnailAutoPanel h3{color:#eef4ff;font-size:16px;margin:0 0 8px}',
   '#thumbnailAutoPanel p{font-size:12px;line-height:1.6;color:#aebce1;margin:7px 0}',
   '#thumbnailAutoPanel .auto-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:12px 0}',
   '#thumbnailAutoPanel .auto-btn{border:1px solid rgba(146,163,247,.33);border-radius:9px;background:#1c2950;color:#f2f4ff;padding:9px 13px;font:inherit;font-size:12px;font-weight:650;min-height:36px;cursor:pointer}',
   '#thumbnailAutoPanel .auto-btn-primary{background:linear-gradient(120deg,#7467ed,#668cff);color:white}',
   '#thumbnailAutoPanel .auto-btn:disabled{cursor:wait;opacity:.55}',
   '#thumbnailAutoPanel .auto-msg{color:#94edce;min-height:20px}',
   '@media(max-width:650px){#thumbnailAutoPanel{grid-template-columns:120px 1fr;padding:11px;gap:12px}#thumbnailAutoPanel .auto-preview{max-width:120px}.day .auto-calendar-thumb{width:28px;height:45px;top:44px}.day.has-auto-cover{padding-right:35px}}'
 ].join('\n');
 document.head.append(style);
 const field=$('fCaption')?.closest('.field')||$('fTitle')?.closest('.field');
 const panel=document.createElement('section');panel.id='thumbnailAutoPanel';panel.hidden=true;
 panel.setAttribute('aria-label','Generated YouTube Shorts cover');
 panel.innerHTML='<img class="auto-preview" id="autoThumbPreview" alt="Cover thumbnail 9:16"/>'+
 '<div><h3>Thumbnail · Auto Generated</h3><p id="autoThumbTitle">Loading…</p>'+
 '<p>Cover otomatis sesuai judul, warna, dan tema Orbit &amp; Ocean. Format 9:16 · PNG 1080 × 1920.</p>'+
 '<div class="auto-actions"><button type="button" id="autoThumbDownload" class="auto-btn auto-btn-primary">Download PNG</button><button type="button" id="autoThumbRefresh" class="auto-btn">Refresh cover</button></div>'+
 '<p id="autoThumbMessage" class="auto-msg" role="status" aria-live="polite"></p>'+
 '<p>Thumbnail di kalender dibuat otomatis. Ini aset cover grafis, bukan adegan AI atau upload otomatis ke YouTube.</p></div>';
 if(field)field.insertAdjacentElement('beforebegin',panel);
 let activeId='';
 function showPanel(){
   const item=getSelected();
   if(!panel.isConnected||!isEligible(item)){panel.hidden=true;activeId='';return;}
   panel.hidden=false;activeId=item.id;
   $('autoThumbPreview').src=src(item);
   $('autoThumbTitle').textContent=(item.thumbnailHeadline||theme(item).headline)+' · '+item.date+' · '+item.title;
   $('autoThumbMessage').textContent='✓ Cover 9:16 tersedia otomatis untuk draft ini.';
 }
 async function download(){
   const item=getSelected();if(!isEligible(item))return;
   const button=$('autoThumbDownload');button.disabled=true;
   const note=$('autoThumbMessage');note.textContent='Preparing 1080 × 1920 PNG…';
   let url='';
   try{
     const raw=svg(item);url=URL.createObjectURL(new Blob([raw],{type:'image/svg+xml;charset=utf-8'}));
     const img=new Image();
     await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Preview rendering failed'));img.src=url;});
     const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
     const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
     ctx.drawImage(img,0,0,canvas.width,canvas.height);
     const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG export unavailable')),'image/png'));
     const fileUrl=URL.createObjectURL(blob);
     const anchor=document.createElement('a');anchor.href=fileUrl;
     anchor.download='orbit-ocean-'+item.date+'-'+item.id.replace(/[^a-zA-Z0-9-]/g,'')+'-cover-9x16.png';
     document.body.append(anchor);anchor.click();anchor.remove();
     setTimeout(()=>URL.revokeObjectURL(fileUrl),15000);
     note.textContent='✓ PNG 1080 × 1920 siap · '+(blob.size/1048576).toFixed(1)+' MB.';
   }catch(e){
     note.textContent='PNG could not be exported: '+e.message+'. Try Chrome/Edge desktop.';
   }finally{if(url)URL.revokeObjectURL(url);button.disabled=false;}
 }
 $('autoThumbDownload')?.addEventListener('click',()=>void download());
 $('autoThumbRefresh')?.addEventListener('click',()=>{
   const item=getSelected();if(!item)return;
   svgCache.clear();showPanel();$('autoThumbMessage').textContent='✓ Cover refreshed from this title and topic.';
 });
 document.addEventListener('bima:episode-selected',showPanel);
 document.addEventListener('bima:render-status',()=>{if(getSelected()?.id!==activeId)showPanel();});
 window.BIMA_THUMBNAILS={isEligible,svg,src,calendarTile,dayRow,showPanel};
 if(typeof renderCalendar==='function'&&typeof renderDay==='function'){
   renderCalendar();renderDay();
 }
 showPanel();
})();