import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createGoogleAffiliateWorker} from '../backend/tiktok-google-worker.mjs';
import {createGoogleAffiliateProvider} from '../backend/tiktok-google-provider.mjs';
import {validateCues,assembleGoogleAffiliate,runMedia} from '../backend/tiktok-google-media.mjs';

const image=Buffer.alloc(1600);Buffer.from('89504e470d0a1a0a','hex').copy(image);
const input={product:{id:'test-product',name:'kipas meja',fact:'Perhatikan bentuk dan detail produk ini.',url:'https://shop.example/product/1',factsVerified:true,assetsLicensed:true,evidence:'Verified test fixture only'},imageData:'data:image/png;base64,'+image.toString('base64')};
async function setup(t,changes={}){
  const dir=await mkdtemp(path.join(os.tmpdir(),'tt-google-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const db=changes.db||{};const calls={submit:0,audit:0,assemble:0};
  const provider={submit:async()=>{calls.submit++;return 'operations/test'+calls.submit;},poll:async()=>({done:true,uri:'https://generativelanguage.googleapis.com/v1beta/files/test'}),download:async(_uri,file)=>writeFile(file,'clip'),audit:async({scene,final})=>{calls.audit++;return {pass:true,issues:[],...(final?{}:{cues:[{start:0.4,end:6.5,text:scene.voice}]})};},...changes.provider};
  const assemble=async({outputPath})=>{calls.assemble++;await writeFile(outputPath,'final-video');return {hasAudio:true,duration:24};};
  const env={ENABLE_TIKTOK_GOOGLE:'true',GEMINI_API_KEY:'test',TIKTOK_GOOGLE_BUDGET_CENTS:'600',...changes.env};
  let saved;const persist=async()=>{saved=JSON.parse(JSON.stringify(db));};
  const worker=createGoogleAffiliateWorker({db,persist,mediaDir:dir,env,provider,assemble});
  return {worker,db,calls,provider,dir,env,assemble,snapshot:()=>saved};
}
test('three scene submissions automatically reach final QA and owner review',async t=>{
  const x=await setup(t);const j=await x.worker.enqueue(input);
  for(let i=0;i<8;i++)await x.worker.tick();
  const result=x.worker.job(j.id);assert.equal(result.status,'ready_for_review');
  assert.equal(x.calls.submit,3);assert.equal(x.calls.audit,4);assert.equal(x.calls.assemble,1);
  assert.equal(x.db.tiktokGoogle.reservedCents,300);assert.ok(result.hash);
  assert.equal(x.worker.overview().jobs[0].published,false);
  await assert.rejects(x.worker.review(j.id,{decision:'approve',mediaHash:'old'}),/current_reviewable/);
  await x.worker.review(j.id,{decision:'approve',mediaHash:result.hash});assert.equal(result.status,'approved');
});
test('API key alone never activates spending; budget isolated from YouTube',async t=>{
  const x=await setup(t,{env:{ENABLE_TIKTOK_GOOGLE:'false',VEO_PILOT_BUDGET_CENTS:'9999'}});
  await x.worker.enqueue(input);await x.worker.tick();assert.equal(x.calls.submit,0);
  x.env.ENABLE_TIKTOK_GOOGLE='true';x.env.TIKTOK_GOOGLE_BUDGET_CENTS='0';await x.worker.tick();
  assert.equal(x.calls.submit,0);assert.equal(x.worker.overview().jobs[0].status,'blocked_budget');
});
test('duplicate intake and concurrent ticks cannot duplicate a paid request',async t=>{
  const x=await setup(t);const one=await x.worker.enqueue(input),two=await x.worker.enqueue(input);
  assert.equal(one.id,two.id);await Promise.all([x.worker.tick(),x.worker.tick()]);assert.equal(x.calls.submit,1);
});
test('uncertain paid submission remains locked across restart',async t=>{
  const x=await setup(t,{provider:{submit:async()=>{throw Error('network timeout');}}});
  const j=await x.worker.enqueue(input);await x.worker.tick();assert.equal(x.worker.job(j.id).status,'requires_reconciliation');
  const restored=createGoogleAffiliateWorker({db:x.snapshot(),persist:async()=>{},mediaDir:x.dir,env:x.env,provider:x.provider,assemble:x.assemble});
  await restored.tick();assert.equal(restored.job(j.id).status,'requires_reconciliation');
});
test('restart resumes an existing operation without new paid submission',async t=>{
  const x=await setup(t);const j=await x.worker.enqueue(input);await x.worker.tick();
  const restored=createGoogleAffiliateWorker({db:x.snapshot(),persist:async()=>{},mediaDir:x.dir,env:x.env,provider:x.provider,assemble:x.assemble});
  await restored.tick();assert.equal(x.calls.submit,1);assert.equal(restored.job(j.id).scenes[0].status,'complete');
});
test('bad audio/product QA blocks later scene spend and approval',async t=>{
  const x=await setup(t,{provider:{audit:async()=>({pass:false,issues:['narration mismatch']})}});
  const j=await x.worker.enqueue(input);for(let i=0;i<5;i++)await x.worker.tick();
  assert.equal(x.worker.job(j.id).status,'qa_failed');assert.equal(x.calls.submit,1);assert.equal(x.calls.assemble,0);
  await assert.rejects(x.worker.review(j.id,{decision:'approve'}),/current_reviewable/);
});
test('revision preserves previous video and queues a separate bounded job',async t=>{
  const x=await setup(t);const j=await x.worker.enqueue(input);for(let i=0;i<8;i++)await x.worker.tick();
  const original=x.worker.job(j.id);const hash=original.hash;
  const revision=await x.worker.review(j.id,{decision:'request_revision',mediaHash:hash,notes:'Buat kamera lebih pelan.'});
  assert.notEqual(revision.id,j.id);assert.equal(original.hash,hash);assert.equal(original.status,'revision_requested');
  x.env.TIKTOK_GOOGLE_BUDGET_CENTS='300';await x.worker.tick();assert.equal(x.worker.job(revision.id).status,'blocked_budget');assert.equal(x.calls.submit,3);
});
test('reference-only screenshots cannot be promoted to commercial products',async t=>{
  const x=await setup(t);await assert.rejects(x.worker.enqueue({...input,product:{...input.product,assetsLicensed:false}}),/verification_evidence/);
  await assert.rejects(x.worker.enqueue({...input,imageData:'data:image/jpeg;base64,'+image.toString('base64')}),/signature/);
  assert.equal(Object.keys(x.db.tiktokGoogle.jobs).length,0);
});
test('subtitle timing and transcript must match actual narration',()=>{
  assert.throws(()=>validateCues([{start:0,end:9,text:'hello'}],'hello'),/timing/);
  assert.throws(()=>validateCues([{start:0,end:4,text:'not the speech'}],'expected speech'),/mismatch/);
  assert.throws(()=>validateCues([{start:0,end:4,text:'hello'},{start:3,end:5,text:'there'}],'hello there'),/timing/);
});
test('Google request uses image reference, portrait and audio-capable Veo',async()=>{
  let request;const p=createGoogleAffiliateProvider({key:'secret',fetchImpl:async(url,opts)=>{request={url,opts};return {ok:true,json:async()=>({name:'operations/test'})};}});
  await p.submit({scene:{prompt:'Indonesian product with narration and music'},image,mimeType:'image/png'});
  const body=JSON.parse(request.opts.body);assert.equal(body.parameters.aspectRatio,'9:16');assert.equal(body.parameters.durationSeconds,8);
  assert.equal(body.instances[0].image.inlineData.mimeType,'image/png');assert.ok(request.url.includes('veo-3.1-fast'));
  await assert.rejects(p.poll('../secrets'),/invalid_google_operation/);
});
test('Google download refuses attacker origin before sending credentials',async()=>{
  let called=false;const p=createGoogleAffiliateProvider({key:'secret',fetchImpl:async()=>{called=true;}});
  await assert.rejects(p.download('https://attacker.test/video','/tmp/not-written.mp4'),/invalid_google_media_url/);assert.equal(called,false);
});
test('real ffmpeg assembly preserves audio, burns wrapped captions and outputs 24s portrait',async t=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'tt-google-media-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const clips=[];
  for(let i=0;i<3;i++){
    const file=path.join(dir,i+'.mp4');clips.push(file);
    await runMedia(['-y','-v','error','-f','lavfi','-i',`color=c=${['red','green','blue'][i]}:s=720x1280:r=24:d=8`,'-f','lavfi','-i','sine=frequency=200:duration=8','-c:v','libx264','-preset','ultrafast','-c:a','aac','-shortest',file]);
  }
  const scenes=clips.map(()=>({voice:'Lihat detail produk sebelum membeli.',qa:{cues:[{start:0.4,end:5,text:'Lihat detail produk sebelum membeli.'}]}}));
  const outputPath=path.join(dir,'final.mp4');const result=await assembleGoogleAffiliate({clips,scenes,outputPath});
  assert.equal(result.duration,24);assert.equal(result.hasAudio,true);assert.equal(result.width,720);assert.ok((await readFile(outputPath)).length>10000);
});
