import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('TikTok Shop callback is isolated and does not consume untrusted OAuth codes',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'bima-tiktok-shop-callback-'));
 const port=39187;
 const proc=spawn(process.execPath,['backend/server.mjs'],{env:{...process.env,DATA_DIR:dir,PORT:String(port),ENABLE_UPLOADS:'false',ENABLE_PUBLIC_SCHEDULING:'false'},stdio:'ignore'});
 try{
  const base='http://127.0.0.1:'+port;
  let ready=false;
  for(let i=0;i<60;i++){
   try {const r=await fetch(base+'/health');if(r.ok){ready=true;break;}}catch{}
   await new Promise(r=>setTimeout(r,150));
  }
  assert.ok(ready,'backend must start');
  const shop=await fetch(base+'/auth/tiktok-shop/callback?code=never-trust&state=forged');
  assert.equal(shop.status,400);
  assert.equal((await shop.json()).error,'tiktok_shop_creator_authorization_not_configured');
  const login=await fetch(base+'/auth/tiktok/callback?code=never-trust&state=forged');
  assert.equal(login.status,400);
  assert.equal((await login.json()).error,'tiktok_state_invalid');
 } finally{proc.kill('SIGTERM');await rm(dir,{recursive:true,force:true});}
});
