import test from 'node:test';
import assert from 'node:assert/strict';
import {createTikTokLtxWorker} from '../backend/tiktok-ltx-worker.mjs';
function fixture(status='submitted'){
 let clock=100000,checks=0,downloads=0;
 const db={tiktokLtx:{id:'job-test',status,referenceReady:true,referenceFile:'/private/ref.bin'}};
 const statuses=['pending','processing','completed'];
 const worker=createTikTokLtxWorker({db,mediaDir:'/private',persist:async()=>{},now:()=>clock,
  env:{LTX_API_KEY:'test',LTX_VIDEO_DOWNLOAD_HOSTS:'video.example'},
  check:async()=>{checks++;const s=statuses.shift()||'completed';return {status:s,ready:s==='completed',resultAvailable:s==='completed',videoUrl:s==='completed'?'https://video.example/result.mp4':null};},
  save:async()=>{downloads++;}});
 return {db,worker,advance:()=>clock+=15000,counts:()=>({checks,downloads})};
}
test('pending and processing continue to completion without dashboard or new submissions',async()=>{
 const f=fixture();
 await f.worker.tick();assert.equal(f.db.tiktokLtx.status,'pending');
 await f.worker.tick();assert.equal(f.counts().checks,1);
 f.advance();await f.worker.tick();assert.equal(f.db.tiktokLtx.status,'processing');
 f.advance();await f.worker.tick();assert.equal(f.db.tiktokLtx.status,'media_downloaded');
 assert.equal(f.db.tiktokLtx.referenceFile,'/private/ref.bin');
 assert.equal(f.worker.state().creativeQaPassed,false);
 f.advance();await f.worker.tick();assert.deepEqual(f.counts(),{checks:3,downloads:1});
});
test('unknown submission and failed jobs are never automatically retried',async()=>{
 for(const status of ['submitting','requires_reconciliation','failed','media_downloaded']){
  const f=fixture(status);await f.worker.tick();assert.equal(f.counts().checks,0);
 }
});
test('transient poll error retains resumable state and private reference',async()=>{
 const db={tiktokLtx:{id:'job-test',status:'processing',referenceFile:'/private/ref.bin'}};
 const w=createTikTokLtxWorker({db,persist:async()=>{},mediaDir:'/private',check:async()=>{throw Error('secret remote URL');}});
 await w.tick();assert.equal(db.tiktokLtx.status,'processing');assert.equal(w.state().error,'ltx_status_check_failed');
 assert.equal(JSON.stringify(w.state()).includes('/private'),false);
});
test('unapproved media host blocks download without leaking signed URL',async()=>{
 const db={tiktokLtx:{id:'job-test',status:'completed'}};
 const w=createTikTokLtxWorker({db,persist:async()=>{},mediaDir:'/private',env:{},
 check:async()=>({status:'completed',ready:true,resultAvailable:true,videoUrl:'https://cdn.example/video?secret=token'}),
 save:async()=>assert.fail('unapproved download')});
 await w.tick();assert.equal(w.state().status,'media_host_approval_required');
 assert.equal(w.state().downloadHostRequired,'cdn.example');assert.equal(JSON.stringify(w.state()).includes('token'),false);
});
