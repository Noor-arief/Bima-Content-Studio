import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import vm from 'node:vm';
import ffmpeg from 'ffmpeg-static';
import {inspectFlowVideo,createShopeeStudio,seedDraft} from '../shopee-studio.mjs';
test('Flow prompt uses exact reference and requests motion, speech and music without fake testimony',async()=>{
 const ctx={window:{}};vm.runInNewContext(await fs.readFile(new URL('../../shopee-flow.js',import.meta.url),'utf8'),ctx);
 for(const mode of ['Review','Unboxing']){const p=ctx.window.BimaShopeeFlowPrompt(seedDraft(),mode);assert.ok(p.startsWith('/'+mode));assert.match(p,/41561442154/);assert.match(p,/Indonesian narration/);assert.match(p,/background music/);assert.match(p,/not proof of personal use/);}
});
test('final Flow MP4 keeps exact video/audio bytes and resets approval; silent or landscape rejected',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bima-flow-test-'));
 try {
  const exec=promisify(execFile),video=path.join(dir,'flow.mp4');
  await exec(ffmpeg,['-v','error','-f','lavfi','-i','testsrc2=s=180x320:r=12','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','6','-c:v','libx264','-threads','2','-c:a','aac','-y',video]);
  const bytes=await fs.readFile(video),db={},out=[];
  const studio=createShopeeStudio({db,mediaDir:dir,persist:async()=>{},readJSON:async()=>({}),respond:(_r,status,body)=>out.push({status,body}),error:(_r,status,code)=>out.push({status,code})});
  const d=await studio.saveDraft(seedDraft());d.stage='approved';d.review={decision:'approve'};
  const request=Readable.from([bytes]);request.method='POST';request.headers={'content-type':'video/mp4'};
  await studio.handle(request,{},new URL('http://test/api/shopee/studio/drafts/'+d.id+'/assets/final'));
  assert.equal(out.at(-1).status,201);assert.equal(d.stage,'review');assert.equal(d.review,null);assert.equal(d.render.revision,d.revision);assert.equal(d.render.audioIncluded,true);assert.equal(d.render.durationSeconds,6);assert.equal(d.render.source,'google_flow_import');
  assert.deepEqual(await fs.readFile(d.outputFile),bytes);assert.equal(out.at(-1).body.draft.assets.final.file,undefined);assert.equal(out.at(-1).body.draft.outputFile,undefined);
  const silent=path.join(dir,'silent.mp4');await exec(ffmpeg,['-v','error','-i',video,'-an','-c:v','copy',silent]);await assert.rejects(inspectFlowVideo(silent),/flow_video_needs_audio/);
  const landscape=path.join(dir,'landscape.mp4');await exec(ffmpeg,['-v','error','-i',video,'-vf','scale=320:180','-filter_threads','1','-c:v','libx264','-threads','2','-c:a','copy',landscape]);await assert.rejects(inspectFlowVideo(landscape),/flow_video_needs_portrait/);
 } finally {await fs.rm(dir,{recursive:true,force:true});}
});
