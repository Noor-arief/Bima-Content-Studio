import {promises as fs, createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {catalogFor,catalogImageFile} from './shopee-catalog.mjs';
import {createProductBank,wibDate,validDate} from './shopee-bank.mjs';
import {createShopeeAnalytics} from './shopee-analytics.mjs';

const SLOTS=['scene1','scene2','scene3','voice','music','final'];
const TYPES={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','video/mp4':'.mp4','audio/mpeg':'.mp3','audio/wav':'.wav','audio/x-wav':'.wav','audio/mp4':'.m4a','audio/aac':'.aac'};
const ID=/^[a-zA-Z0-9_-]{3,80}$/;
const fail=(code,status=422)=>Object.assign(Error(code),{status});
export const SHOPEE_STUDIO_VERSION='20261025-flow1';
export const seedDraft=()=>({id:'shopee-tumbler-41561442154',product:'Botol Tumbler 900ml Stainless Steel',productUrl:'https://shopee.co.id/product/607593297/41561442154',affLink:'https://s.shopee.co.id/9APfQhgJ4X',price:63990,videoCommission:10,socialCommission:11.5,rating:4.8,salesLabel:'10RB+',researchAt:'2026-10-25',researchSource:'Dashboard Shopee Affiliate · Rincian Tawaran Produk',facts:'Nama listing: Botol Tumbler 900ml Stainless Steel Tahan Panas Dingin. Harga saat riset Rp63.990; rating 4,8; 10RB+ terjual. Komisi Shopee Video 10%, media sosial hingga 11,5%. Harga dan komisi dapat berubah. Performa tahan suhu belum diuji sendiri.',scenes:[{text:'Cari tumbler untuk menemani aktivitas harian?',visual:'Foto produk asli: tampilan utuh, bentuk dan varian sesuai listing.'},{text:'Kenali tumbler stainless dengan kapasitas 900 ml ini.',visual:'Detail tutup, pegangan, dan bodi dari foto atau rekaman produk asli.'},{text:'Cek detail dan pilihan variannya lewat tag produk di video ini.',visual:'Hero shot produk asli. Tag produk ditambahkan di aplikasi Shopee.'}],caption:'Tumbler stainless 900 ml untuk dilihat lebih dekat. Cek detail dan pilihan varian pada tag produk.\n\nKonten affiliate; saya dapat menerima komisi dari pembelian. #ShopeeVideo #Affiliate #Tumbler',date:'',time:'19:00',stage:'draft',revision:1,assets:{},review:null});

export function validateDraft(input){
 const text=(key,max)=>{const s=String(input[key]??'').trim();if(s.length>max)throw fail('draft_text_too_long');return s;};
 const out={};
 for(const [k,max] of Object.entries({product:180,productUrl:1000,affLink:1000,facts:3000,caption:2200,date:10,time:5}))out[k]=text(k,max);
 if(!out.product)throw fail('product_name_required');
 for(const k of ['productUrl','affLink'])if(out[k]){let u;try{u=new URL(out[k]);}catch{throw fail('invalid_shopee_link');}if(u.protocol!=='https:'||!['shopee.co.id','s.shopee.co.id','shp.ee'].includes(u.hostname))throw fail('invalid_shopee_link');}
 if(out.date&&!/^\d{4}-\d{2}-\d{2}$/.test(out.date))throw fail('invalid_schedule');
 if(out.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(out.time))throw fail('invalid_schedule');
 for(const k of ['price','videoCommission','socialCommission']){if(input[k]===''||input[k]==null){out[k]=null;continue;}const n=Number(input[k]);if(!Number.isFinite(n)||n<0||(k!=='price'&&n>100))throw fail('invalid_product_economics');out[k]=n;}
 if(!Array.isArray(input.scenes)||input.scenes.length!==3)throw fail('three_scenes_required');
 out.scenes=input.scenes.map(s=>{if(!s||typeof s.text!=='string'||!s.text.trim()||s.text.length>150||typeof s.visual!=='string'||s.visual.length>500)throw fail('invalid_scene');return {text:s.text.trim(),visual:s.visual.trim()};});
 return out;
}
export function subtitles(scenes){const stamp=n=>`00:00:${String(n).padStart(2,'0')},000`;return scenes.map((s,i)=>`${i+1}\n${stamp(i*8)} --> ${stamp((i+1)*8)}\n${s.text}\n`).join('\n');}
function wrap(text){const lines=[];let row='';for(const word of text.replace(/[\r\n\u0000-\u001f]/g,' ').split(/\s+/)){if(row&&(row+' '+word).length>32){lines.push(row);row='';}row+=(row?' ':'')+word;}if(row)lines.push(row);return lines.join('\n');}
function run(args,timeout=180000,allowFailure=false){return new Promise((resolve,reject)=>{const p=spawn(ffmpeg,['-nostdin','-hide_banner','-protocol_whitelist','file,pipe',...args],{stdio:['ignore','ignore','pipe']});let msg='',done=false;const t=setTimeout(()=>p.kill('SIGKILL'),timeout);p.stderr.on('data',b=>msg=(msg+String(b)).slice(-3000));p.on('error',()=>{if(done)return;done=true;clearTimeout(t);reject(fail('renderer_unavailable',503));});p.on('close',code=>{if(done)return;done=true;clearTimeout(t);if(code===0||allowFailure)resolve(msg);else reject(Object.assign(fail('render_failed_check_source_media',422),{cause:msg}));});});}
export async function renderShopeeDraft({draft,directory,outputPath}){
 await fs.mkdir(directory,{recursive:true,mode:0o700});
 const parts=[];
 for(let i=0;i<3;i++){
  const a=draft.assets['scene'+(i+1)];if(!a)throw fail('three_product_assets_required');
  const textfile=path.join(directory,`caption-${i}.txt`);await fs.writeFile(textfile,wrap(draft.scenes[i].text),{mode:0o600});
  const part=path.join(directory,`part-${i}.mp4`);parts.push(part);
  // Owner assets only. Preserve the entire product rather than cropping its edges.
  const source=a.mime.startsWith('image/')?['-loop','1']:['-stream_loop','-1'];
  const fontfile=fileURLToPath(new URL('./fonts/DejaVuSans-Latin.ttf',import.meta.url));
  const vf=`scale=720:1060:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0x131927,setsar=1,drawtext=fontfile=${fontfile}:textfile=${textfile}:expansion=none:fontsize=29:fontcolor=white:box=1:boxcolor=black@0.72:boxborderw=12:x=(w-text_w)/2:y=h-text_h-100,format=yuv420p`;
  await run(['-loglevel','error','-y','-threads','2',...source,'-i',a.file,'-t','8','-an','-vf',vf,'-filter_threads','1','-r','24','-c:v','libx264','-threads','2','-preset','veryfast','-crf','24',part]);
 }
 const list=path.join(directory,'parts.txt');await fs.writeFile(list,parts.map(p=>`file '${p}'`).join('\n'),{mode:0o600});
 const args=['-loglevel','error','-y','-f','concat','-safe','0','-i',list];let input=1,voice,music;
 if(draft.assets.voice){const meta=await run(['-i',draft.assets.voice.file],15000,true);const m=meta.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);const seconds=m?Number(m[1])*3600+Number(m[2])*60+Number(m[3]):0;if(!/Audio:/.test(meta)||seconds<=0||seconds>24)throw fail('voice_must_fit_24_seconds');voice=input++;args.push('-i',draft.assets.voice.file);}
 if(draft.assets.music){music=input++;args.push('-i',draft.assets.music.file);}
 if(!voice&&!music)args.push('-f','lavfi','-i','anullsrc=r=48000:cl=stereo');
 args.push('-filter_complex_threads','1','-map','0:v','-c:v','copy');
 if(voice&&music)args.push('-filter_complex',`[${voice}:a]apad,atrim=duration=24[v];[${music}:a]aloop=loop=-1:size=2147483647,volume=0.12,atrim=duration=24[m];[v][m]amix=inputs=2:duration=first:normalize=0[a]`,'-map','[a]');
 else if(voice||music){const idx=voice||music;args.push('-filter_complex',`[${idx}:a]${music?'aloop=loop=-1:size=2147483647,volume=0.16,':''}apad,atrim=duration=24[a]`,'-map','[a]');}
 else{args.push('-map',`${input}:a`);}
 args.push('-t','24','-c:a','aac','-b:a','128k','-movflags','+faststart',outputPath);
 await run(args);await fs.chmod(outputPath,0o600);
 return {width:720,height:1280,durationSeconds:24,subtitlesBurned:true,voiceIncluded:!!voice,musicIncluded:!!music,visualSource:'owner_product_assets',published:false};
}


export async function inspectFlowVideo(file){
 const meta=await run(['-i',file],15000,true);
 const duration=meta.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
 const dimensions=meta.match(/Video:[^\n]*?\b(\d{2,5})x(\d{2,5})\b/);
 const seconds=duration?Number(duration[1])*3600+Number(duration[2])*60+Number(duration[3]):0;
 if(!dimensions||seconds<5||seconds>60)throw fail('flow_video_duration_or_format');
 const width=Number(dimensions[1]),height=Number(dimensions[2]);
 if(Math.abs(width/height-9/16)>0.025||/rotation of (?:-?90|270)/.test(meta))throw fail('flow_video_needs_portrait');
 if(!/Audio:/.test(meta))throw fail('flow_video_needs_audio');
 // Decode the full video and audio, so a truncated container is not accepted.
 await run(['-loglevel','error','-xerror','-i',file,'-map','0:v:0','-map','0:a:0','-f','null','-'],60000);
 return {width,height,durationSeconds:seconds,subtitlesBurned:false,audioIncluded:true,voiceIncluded:null,musicIncluded:null,visualSource:'google_flow_import'};
}

// All routes run only after server.mjs has verified the existing owner session.
export function createShopeeStudio({db,persist,mediaDir,respond,error,readJSON}){
 let busy=false;
 const root=path.resolve(mediaDir,'shopee-studio');
 const state=()=>db.shopeeStudio||=( {drafts:{}} );
 const publicDraft=d=>{const {outputFile,...safe}=d;return {...safe,catalog:catalogFor(d.productUrl),assets:Object.fromEntries(Object.entries(d.assets||{}).map(([key,{file,...asset}])=>[key,asset])),render:d.render?{...d.render,available:!!d.outputFile}:null};};
 const invalidate=d=>{d.revision=(d.revision||0)+1;d.review=null;d.stage='draft';d.render=null;d.outputFile=null;d.updatedAt=new Date().toISOString();};
 const saveDraft=async input=>{const id=input.id||'shopee-'+randomUUID();if(!ID.test(id))throw fail('invalid_draft_id');let d=state().drafts[id];if(d?.stage==='rendering')throw fail('render_in_progress',409);const valid=validateDraft(input);if(!d)d=state().drafts[id]={id,revision:0,assets:{}};Object.assign(d,valid);invalidate(d);await persist();return d;};
 const analytics=createShopeeAnalytics({state,persist});
 const bank=createProductBank({state,persist,saveDraft,publicDraft,publications:analytics.publications});
 async function handle(req,res,u){
  if(!u.pathname.startsWith('/api/shopee/studio'))return false;
  try{
   if(u.pathname==='/api/shopee/studio'&&req.method==='GET'){
    // Reconcile interrupted renders after a process restart; never regenerate automatically.
    for(const d of Object.values(state().drafts))if(d.stage==='rendering'&&!busy){d.stage='failed';d.renderError='render_interrupted_retry';await persist();}
    await bank.tick();
    respond(res,200,{bank:bank.snapshot(),version:SHOPEE_STUDIO_VERSION,capabilities:{render:true,autoUpload:false,affiliateApi:false,publishMode:'shopee_app'},drafts:Object.values(state().drafts).map(publicDraft)});return true;
   }
   if(u.pathname==='/api/shopee/studio/analytics'&&req.method==='GET'){respond(res,200,analytics.snapshot(u.searchParams.get('days')||28));return true;}
   if(u.pathname==='/api/shopee/studio/analytics/rows'&&req.method==='POST'){await analytics.saveRow(await readJSON(req,6000));respond(res,200,{saved:true});return true;}
   if(u.pathname==='/api/shopee/studio/analytics/import'&&req.method==='POST'){respond(res,200,await analytics.importCSV(await readJSON(req,1100000)));return true;}
   if(u.pathname==='/api/shopee/studio/analytics/publications'&&req.method==='POST'){respond(res,200,{publication:await analytics.logPublication(await readJSON(req,4000))});return true;}
   if(u.pathname==='/api/shopee/studio/bank/products'&&req.method==='POST'){respond(res,200,{bank:await bank.upsert(await readJSON(req,12000))});return true;}
   if(u.pathname==='/api/shopee/studio/bank/settings'&&req.method==='POST'){respond(res,200,{bank:await bank.settings(await readJSON(req,1000))});return true;}
   if(u.pathname==='/api/shopee/studio/bank/refresh'&&req.method==='POST'){await bank.tick();respond(res,200,{bank:bank.snapshot()});return true;}
   if(u.pathname==='/api/shopee/studio/bank/open'&&req.method==='POST'){respond(res,200,await bank.open(await readJSON(req,1000)));return true;}
   if(u.pathname==='/api/shopee/studio/drafts'&&req.method==='POST'){respond(res,201,{draft:publicDraft(await saveDraft(await readJSON(req,20000)))});return true;}
   const m=/^\/api\/shopee\/studio\/drafts\/([a-zA-Z0-9_-]{3,80})\/(assets\/(scene[123]|voice|music|final)|catalog-assets|render|review|video|subtitles|package|publication|performance)$/.exec(u.pathname);
   if(!m){error(res,404,'shopee_route_not_found');return true;}
   const d=state().drafts[m[1]];if(!d){error(res,404,'draft_not_found');return true;}const action=m[2];
   if(action==='catalog-assets'&&req.method==='POST'){
    await readJSON(req,1000);
    if(d.stage==='rendering')throw fail('render_in_progress',409);const catalog=catalogFor(d.productUrl);if(!catalog)throw fail('catalog_photo_not_available',404);
    const bytes=await fs.readFile(catalogImageFile),dir=path.join(root,d.id);await fs.mkdir(dir,{recursive:true,mode:0o700});const next={},created=[];
    try{for(const slot of ['scene1','scene2','scene3']){const file=path.join(dir,slot+'-'+randomUUID()+'.jpg');await fs.writeFile(file,bytes,{mode:0o600});created.push(file);next[slot]={file,mime:'image/jpeg',size:bytes.length,uploadedAt:new Date().toISOString(),source:'catalog',catalogId:catalog.id};}}catch(e){await Promise.all(created.map(f=>fs.rm(f,{force:true}).catch(()=>{})));throw e;}
    const old=['scene1','scene2','scene3'].map(slot=>d.assets[slot]?.file).filter(Boolean);Object.assign(d.assets,next);invalidate(d);await persist();await Promise.all(old.map(f=>fs.rm(f,{force:true}).catch(()=>{})));respond(res,200,{draft:publicDraft(d)});return true;
   }
   if(action.startsWith('assets/')&&req.method==='POST'){
    if(d.stage==='rendering')throw fail('render_in_progress',409);
    const slot=m[3],mime=String(req.headers['content-type']||'').split(';')[0],ext=TYPES[mime];if(!ext||(slot==='final'?mime!=='video/mp4':slot.startsWith('scene')?!/^(image\/|video\/mp4)/.test(mime):!mime.startsWith('audio/')))throw fail('unsupported_asset_type');
    const max=30*1024*1024,list=[];let n=0;for await(const chunk of req){n+=chunk.length;if(n>max)throw fail('asset_max_30mb',413);list.push(chunk);}if(!n)throw fail('empty_asset');
    const dir=path.join(root,d.id);await fs.mkdir(dir,{recursive:true,mode:0o700});const file=path.join(dir,slot+'-'+randomUUID()+ext);
    const bytes=Buffer.concat(list);
    const valid= mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:
      mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
      mime==='image/webp'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP':
      mime==='video/mp4'||mime==='audio/mp4'?bytes.toString('ascii',4,8)==='ftyp':
      mime.includes('wav')?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE':
      bytes.toString('ascii',0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224);
    if(!valid)throw fail('asset_content_mismatch');
    await fs.writeFile(file,bytes,{mode:0o600});
    if(slot==='final'){
     let metadata;try{metadata=await inspectFlowVideo(file);}catch(e){await fs.rm(file,{force:true});throw e;}
     const old=d.assets.final?.file;invalidate(d);d.assets.final={file,mime,size:n,uploadedAt:new Date().toISOString()};
     d.outputFile=file;d.stage='review';d.renderError=null;d.render={...metadata,revision:d.revision,finishedAt:new Date().toISOString(),source:'google_flow_import',published:false};
     await persist();if(old&&old!==file)await fs.rm(old,{force:true}).catch(()=>{});respond(res,201,{draft:publicDraft(d)});return true;
    }
    const old=d.assets[slot]?.file;d.assets[slot]={file,mime,size:n,uploadedAt:new Date().toISOString()};invalidate(d);await persist();if(old)await fs.rm(old,{force:true}).catch(()=>{});respond(res,201,{draft:publicDraft(d)});return true;
   }
   if(action.startsWith('assets/')&&req.method==='DELETE'){
    if(d.stage==='rendering')throw fail('render_in_progress',409);const old=d.assets[m[3]]?.file;delete d.assets[m[3]];invalidate(d);await persist();if(old)await fs.rm(old,{force:true});respond(res,200,{draft:publicDraft(d)});return true;
   }
   if(action==='render'&&req.method==='POST'){
    const b=await readJSON(req,1000);if(b.assetsConfirmed!==true)throw fail('confirm_product_asset_rights');if((d.assets.music||d.assets.voice)&&b.audioConfirmed!==true)throw fail('confirm_audio_rights');
    if(busy||d.stage==='rendering')throw fail('renderer_busy',409);if(!['scene1','scene2','scene3'].every(s=>d.assets[s]))throw fail('three_product_assets_required');
    busy=true;try{d.stage='rendering';d.review=null;d.render=null;d.outputFile=null;d.renderError=null;await persist();
    const rev=d.revision,dir=path.join(root,d.id,'render-'+randomUUID());await fs.mkdir(dir,{recursive:true,mode:0o700});const output=path.join(dir,'shopee-video.mp4');
    void renderShopeeDraft({draft:structuredClone(d),directory:dir,outputPath:output}).then(async result=>{d.stage='review';d.outputFile=output;d.render={...result,revision:rev,finishedAt:new Date().toISOString()};await persist();}).catch(async e=>{console.error('shopee_render_failed',JSON.stringify({draftId:d.id,code:e.message,diagnostic:String(e.cause||'').slice(-1800)}));d.stage='failed';d.renderError=e.status?e.message:'render_failed';await persist();}).finally(()=>{busy=false;});
    respond(res,202,{draft:publicDraft(d)});return true;
    }catch(e){busy=false;d.stage='failed';d.renderError='render_setup_failed';await persist();throw e;}
   }
   if(action==='review'&&req.method==='POST'){
    const b=await readJSON(req,1500);if(!d.outputFile||!d.render||d.render.revision!==d.revision||!['review','approved','revision'].includes(d.stage))throw fail('render_before_review',409);
    if(!['approve','revision'].includes(b.decision))throw fail('invalid_review_decision');const notes=String(b.notes||'').trim();if(notes.length>600||b.decision==='revision'&&notes.length<5)throw fail('revision_notes_required');
    if(b.decision==='approve'&&(b.visualChecked!==true||b.audioChecked!==true||b.productChecked!==true||!d.affLink))throw fail('complete_review_checks');
    d.stage=b.decision==='approve'?'approved':'revision';d.review={decision:b.decision,notes,revision:d.revision,at:new Date().toISOString()};await persist();respond(res,200,{draft:publicDraft(d)});return true;
   }
   if(action==='publication'&&req.method==='POST'){
    const b=await readJSON(req,2000);if(d.stage!=='approved'||d.render?.revision!==d.revision)throw fail('approve_before_publication_record',409);
    let link;try{link=new URL(b.url);}catch{throw fail('invalid_publication_url');}if(link.protocol!=='https:'||!['shopee.co.id','s.shopee.co.id','shp.ee'].includes(link.hostname)||b.tagChecked!==true)throw fail('confirm_shopee_video_and_product_tag');
    const publishedDate=b.publishedDate||wibDate();if(!validDate(publishedDate)||publishedDate>wibDate()||publishedDate<'2020-01-01')throw fail('invalid_publication_date');
    d.publication={publishedDate,url:link.href,confirmedAt:new Date().toISOString(),revision:d.revision,verification:'owner_confirmed'};d.stage='published';await persist();respond(res,200,{draft:publicDraft(d)});return true;
   }
   if(action==='performance'&&req.method==='POST'){
    const b=await readJSON(req,1000),metrics={};for(const k of ['views','clicks','orders','earned']){if(b[k]==null||b[k]===''){metrics[k]=null;continue;}const n=Number(b[k]);if(!Number.isFinite(n)||n<0)throw fail('invalid_performance');metrics[k]=n;}
    d.performance={...metrics,source:'owner_input',updatedAt:new Date().toISOString()};await persist();respond(res,200,{draft:publicDraft(d)});return true;
   }
   if(['video','subtitles','package'].includes(action)&&req.method==='GET'){
    if(!d.outputFile||!d.render||d.render.revision!==d.revision)throw fail('render_not_ready',409);
    if(action==='package'&&!['approved','published'].includes(d.stage))throw fail('approve_before_export',409);
    if(action==='video'){const st=await fs.stat(d.outputFile);res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':st.size,'Cache-Control':'private,no-store','Content-Disposition':'inline; filename=shopee-video.mp4'});createReadStream(d.outputFile).pipe(res);return true;}
    if(action==='subtitles'){res.writeHead(200,{'Content-Type':'application/x-subrip; charset=utf-8','Cache-Control':'private,no-store'});res.end(subtitles(d.scenes));return true;}
    respond(res,200,{product:d.product,productUrl:d.productUrl,affLink:d.affLink,caption:d.caption,date:d.date,time:d.time,videoCommission:d.videoCommission,review:d.review,uploaded:false,instructions:['Unduh MP4 dan buka Shopee Video di aplikasi Shopee.','Unggah video, tempel caption, tambahkan produk yang sama lewat Tambah Produk.','Periksa varian dan tag produk sebelum memilih Posting.','Catat URL tayang di BIMA setelah benar-benar dipublikasikan.']});return true;
   }
   throw fail('method_not_allowed',405);
  }catch(e){error(res,e.status||500,e.status?e.message:'shopee_studio_error');return true;}
 }
 return {handle,saveDraft,publicDraft,tick:bank.tick};
}
