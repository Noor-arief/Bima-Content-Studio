import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {convertShortsVideo} from '../shorts.mjs';

const ff=process.env.FFMPEG_PATH || (await import('ffmpeg-static')).default;

test('converts landscape video and preserves audio in 9:16 mp4',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'bima-test-'));
 try{
  const original=join(dir,'input.mp4'),out=join(dir,'output.mp4');
  const gen=spawnSync(ff,['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=640x360:rate=15','-f','lavfi','-i','sine=frequency=500:sample_rate=44100','-t','1','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac',original]);
  assert.equal(gen.status,0,gen.stderr?.toString());
  const metadata=await convertShortsVideo(original,out);
  assert.equal(metadata.width,1080);
  const n=await stat(out);assert.ok(n.size>1000);
  const probe=spawnSync(ff,['-hide_banner','-i',out]);
  const output=probe.stderr.toString();
  assert.match(output,/1080x1920/);
  assert.match(output,/Audio: aac/);
 } finally {await rm(dir,{recursive:true,force:true})}
},{timeout:180000});

test('rejects invalid conversion mode',async()=>{
  await assert.rejects(convertShortsVideo('/none','/none',{mode:'bad'}),/invalid_conversion_mode/);
});
