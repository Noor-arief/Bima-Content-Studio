import test from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {createShopeeStudio,validateDraft,seedDraft,subtitles,renderShopeeDraft} from '../shopee-studio.mjs';

test('Shopee draft validation rejects hostile URLs, invalid schedules and oversized scenes',()=>{
 const d=seedDraft();assert.equal(validateDraft(d).videoCommission,10);
 for(const url of ['file:///etc/passwd','https://shopee.co.id.evil.test/x','https://evil.test/x'])assert.throws(()=>validateDraft({...d,productUrl:url}),/invalid_shopee_link/);
 assert.throws(()=>validateDraft({...d,time:'25:00'}),/invalid_schedule/);
 assert.throws(()=>validateDraft({...d,videoCommission:101}),/invalid_product_economics/);
 assert.throws(()=>validateDraft({...d,scenes:[{text:'x'.repeat(151),visual:''},...d.scenes.slice(1)]}),/invalid_scene/);
 assert.match(subtitles(d.scenes),/00:00:16,000 --> 00:00:24,000/);
});

test('server persists isolated drafts, redacts private paths and invalidates approval on edits',async()=>{
 let saved=0;const db={content:{youtube:'untouched'}};const studio=createShopeeStudio({db,persist:async()=>saved++,mediaDir:'/data/media'});
 const d=await studio.saveDraft(seedDraft());d.stage='approved';d.review={revision:d.revision};d.render={revision:d.revision};d.outputFile='/private/file.mp4';d.assets.scene1={file:'/private/photo.png',mime:'image/png',size:50};
 const safe=studio.publicDraft(d);assert.equal(safe.outputFile,undefined);assert.equal(safe.assets.scene1.file,undefined);
 await studio.saveDraft({...d,caption:'Edited after approval'});assert.equal(d.stage,'draft');assert.equal(d.review,null);assert.equal(d.render,null);assert.equal(d.revision,2);assert.equal(saved,2);assert.equal(db.content.youtube,'untouched');
 await assert.rejects(studio.saveDraft({...seedDraft(),id:'../../bad'}),/invalid_draft_id/);
});

test('owner review cannot approve a stale render or export unapproved content',async()=>{
 const d=seedDraft();d.render={revision:0};d.outputFile='/private/file.mp4';d.stage='review';const db={shopeeStudio:{drafts:{[d.id]:d}}};const responses=[];
 const studio=createShopeeStudio({db,persist:async()=>{},mediaDir:'/data/media',respond:(_r,status,body)=>responses.push({status,body}),error:(_r,status,code)=>responses.push({status,code}),readJSON:async()=>({decision:'approve',visualChecked:true,audioChecked:true,productChecked:true})});
 await studio.handle({method:'POST'},{},new URL('http://test/api/shopee/studio/drafts/'+d.id+'/review'));assert.equal(responses.at(-1).code,'render_before_review');
 d.render.revision=d.revision;await studio.handle({method:'GET'},{},new URL('http://test/api/shopee/studio/drafts/'+d.id+'/package'));assert.equal(responses.at(-1).code,'approve_before_export');
 await studio.handle({method:'POST'},{},new URL('http://test/api/shopee/studio/drafts/'+d.id+'/review'));assert.equal(responses.at(-1).body.draft.stage,'approved');
});

test('renders an actual 24-second portrait MP4 with literal captions and no paid provider',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'shopee-render-test-'));
 try{
  const image=path.join(dir,'product.ppm');await fs.writeFile(image,Buffer.concat([Buffer.from('P6\n160 120\n255\n'),Buffer.alloc(160*120*3,160)]));
  const draft=seedDraft();draft.scenes[0].text="Stainless 100%? Cek fakta: jangan buat klaim palsu.";for(let i=1;i<=3;i++)draft.assets['scene'+i]={file:image,mime:'image/png'};
  const output=path.join(dir,'finished.mp4');const r=await renderShopeeDraft({draft,directory:dir,outputPath:output});
  assert.equal(r.published,false);assert.equal(r.subtitlesBurned,true);assert.equal(r.voiceIncluded,false);assert.ok((await fs.stat(output)).size>10000);
  const probe=spawnSync(ffmpeg,['-hide_banner','-i',output],{encoding:'utf8'}).stderr;assert.match(probe,/720x1280/);assert.match(probe,/Duration: 00:00:24/);assert.match(probe,/Audio: aac/);
  const audio=path.join(dir,'voice.wav');assert.equal(spawnSync(ffmpeg,['-loglevel','error','-f','lavfi','-i','sine=frequency=440:duration=3','-y',audio]).status,0);
  draft.assets.voice={file:audio,mime:'audio/wav'};draft.assets.music={file:audio,mime:'audio/wav'};
  const withAudio=await renderShopeeDraft({draft,directory:dir,outputPath:path.join(dir,'with-audio.mp4')});assert.equal(withAudio.voiceIncluded,true);assert.equal(withAudio.musicIncluded,true);
  const audioProbe=spawnSync(ffmpeg,['-hide_banner','-i',path.join(dir,'with-audio.mp4')],{encoding:'utf8'}).stderr;assert.match(audioProbe,/Duration: 00:00:24/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
