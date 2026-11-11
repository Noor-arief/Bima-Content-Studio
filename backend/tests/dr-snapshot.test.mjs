import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {backupDirectory,restoreDirectory} from '../dr-snapshot.mjs';

const correctKey=randomBytes(32).toString('hex');
const wrongKey=randomBytes(32).toString('hex');

test('snapshot requires operator quiescence and a private 32-byte encryption key',async()=>{
  await assert.rejects(backupDirectory({source:'/data',destination:'/backup',keyHex:correctKey}),/source_must_be_quiesced/);
  await assert.rejects(backupDirectory({source:'/data',destination:'/backup',keyHex:'bad',quiesced:true}),/DR_BACKUP_KEY_HEX/);
});

test('encrypted snapshot restores JSON state and binary media without exposing plaintext',async()=>{
  const root=await mkdtemp(join(tmpdir(),'bima-dr-test-'));
  try{
    const source=join(root,'source'),archive=join(root,'archive'),dest=join(root,'restored');
    await mkdir(join(source,'media'),{recursive:true});
    const secretFixture='FAKE_GOOGLE_REFRESH_TOKEN_TEST_ONLY';
    const state=JSON.stringify({content:{id:'test-video'},oauth:{refreshToken:secretFixture}});
    const media=randomBytes(210_000);
    await writeFile(join(source,'state.json'),state);
    await writeFile(join(source,'media','example.mp4'),media);
    const snapshot=await backupDirectory({source,destination:archive,keyHex:correctKey,quiesced:true});
    assert.equal(snapshot.fileCount,2);
    const names=await readdir(archive);
    assert.ok(names.includes('manifest.enc'));
    assert.ok(names.includes('archive.json'));
    assert.ok(!names.includes('state.json'));
    for(const name of names)assert.ok(!(await readFile(join(archive,name))).toString('utf8').includes(secretFixture));
    await assert.rejects(restoreDirectory({archive,destination:join(root,'wrong'),keyHex:wrongKey}),/auth|authenticate|Unsupported state/i);
    assert.equal((await readdir(root)).includes('wrong'),false);
    const result=await restoreDirectory({archive,destination:dest,keyHex:correctKey});
    assert.equal(result.fileCount,2);
    assert.equal(await readFile(join(dest,'state.json'),'utf8'),state);
    assert.deepEqual(await readFile(join(dest,'media','example.mp4')),media);
    await assert.rejects(restoreDirectory({archive,destination:dest,keyHex:correctKey}),/destination_already_exists/);
    await assert.rejects(backupDirectory({source,destination:archive,keyHex:correctKey,quiesced:true}),/destination_already_exists/);
  }finally{await rm(root,{recursive:true,force:true});}
});
