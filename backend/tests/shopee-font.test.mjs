import test from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
test('production render works without any system font discovery',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bima-no-fonts-'));
 try {
  const config=path.join(dir,'fonts.conf');
  await fs.writeFile(config,'<?xml version="1.0"?><fontconfig></fontconfig>');
  const {stdout}=await promisify(execFile)(process.execPath,['shopee-render-check.mjs'],{
   cwd:new URL('..',import.meta.url),timeout:60000,
   env:{...process.env,FONTCONFIG_FILE:config,FONTCONFIG_PATH:dir}
  });
  const result=JSON.parse(stdout.trim().replace(/^shopee_renderer_check /,''));
  assert.equal(result.status,'PASS');assert.equal(result.durationSeconds,24);
  assert.equal(result.published,false);assert.ok(result.bytes>10000);
 } finally {await fs.rm(dir,{recursive:true,force:true});}
});
