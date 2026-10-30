import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createStudioBackups,validateBackup} from '../studio-backups.mjs';
const bytes=Buffer.from('private media bytes'),hash=createHash('sha256').update(bytes).digest('hex');
function manifest(){return {format:'bima-complete-v1',origin:'https://mycontentstudio.site',createdAt:new Date().toISOString(),local:{'bima-content-studio-v3':JSON.stringify({items:{youtube:[{id:'yt',status:'Draft'}]}}),'bima-tiktok-market-intel-v1':JSON.stringify({content:[{id:'tt',publishedManually:true}]})},session:{bimaView:'calendar'},counts:{youtube:1,tiktok:1,tiktokLive:1},media:[{sha256:hash,offset:0,size:bytes.length}],databases:[{name:'bima-tiktok-production-media-v1',store:'files',version:1,rows:[{key:{t:'scalar',v:'tt:video'},value:{t:'blob',i:0,size:bytes.length,name:'clip.mp4',type:'video/mp4',lastModified:1}}]}]}}
async function setup(t,{reserveBytes=0}={}){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'bima-backup-test-')),stateFile=path.join(directory,'source-state.json');await fs.writeFile(stateFile,'{"oauth":"sealed-test-value"}');const args={directory:path.join(directory,'backups'),stateFile,reserveBytes,access:req=>req.headers.authorization==='Bearer test-owner'};let route=createStudioBackups(args);const server=http.createServer((req,res)=>route(req,res,new URL(req.url,'http://localhost')).then(handled=>{if(!handled){res.writeHead(404);res.end()}}));await new Promise(ok=>server.listen(0,'127.0.0.1',ok));t.after(async()=>{server.closeAllConnections();await new Promise(ok=>server.close(ok));await fs.rm(directory,{recursive:true,force:true})});const base='http://127.0.0.1:'+server.address().port;return {directory,reset:()=>{route=createStudioBackups(args)},call:(p,options={})=>fetch(base+'/api/backups/'+p,{...options,headers:{Authorization:'Bearer test-owner',...(options.body&&!Buffer.isBuffer(options.body)?{'Content-Type':'application/json'}:{}),...options.headers}})}}
test('owner-only backup verifies chunks, deduplicates media, persists across restart, rejects stale commits',async t=>{
 const s=await setup(t),m=manifest();assert.equal((await s.call('status',{headers:{Authorization:''}})).status,401);assert.equal((await s.call('blobs/'+hash,{headers:{Authorization:''}})).status,401);
 m.media.push({...m.media[0],offset:bytes.length});
 let r=await s.call('plan',{method:'POST',body:JSON.stringify({manifest:m})});const firstPlan=await r.json();assert.deepEqual(firstPlan.missing,[hash]);assert.equal(firstPlan.requiredBytes,bytes.length,'duplicate content only reserves space once');
 r=await s.call('commit',{method:'POST',body:JSON.stringify({manifest:m,deviceId:'test-device-123456',baseRevision:null})});assert.equal(r.status,409);
 r=await s.call('blobs/'+hash+'?offset=0&total='+bytes.length,{method:'PUT',body:bytes.subarray(0,3)});assert.equal((await r.json()).offset,3);
 r=await s.call('plan',{method:'POST',body:JSON.stringify({manifest:m})});assert.equal((await r.json()).requiredBytes,bytes.length-3,'resume reserves only remaining bytes');
 r=await s.call('blobs/'+hash+'?offset=0&total='+bytes.length,{method:'PUT',body:bytes});assert.equal(r.status,409);assert.equal((await r.json()).offset,3);
 r=await s.call('blobs/'+hash+'?offset=3&total='+bytes.length,{method:'PUT',body:bytes.subarray(3)});assert.equal((await r.json()).complete,true);
 r=await s.call('commit',{method:'POST',body:JSON.stringify({manifest:m,deviceId:'test-device-123456',baseRevision:null})});assert.equal(r.status,200);const saved=await r.json();
 const stateCopy=await fs.readFile(path.join(s.directory,'backups','versions',saved.revision+'.server-state.json'),'utf8');assert.match(stateCopy,/sealed-test-value/);
 s.reset();r=await s.call('latest');assert.equal((await r.json()).revision,saved.revision);r=await s.call('blobs/'+hash);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);
 r=await s.call('plan',{method:'POST',body:JSON.stringify({manifest:m})});assert.deepEqual((await r.json()).missing,[]);
 r=await s.call('commit',{method:'POST',body:JSON.stringify({manifest:m,deviceId:'test-device-123456',baseRevision:null})});assert.equal(r.status,409);
 r=await s.call('commit',{method:'POST',body:JSON.stringify({manifest:m,deviceId:'test-device-123456',baseRevision:saved.revision})});assert.equal((await r.json()).unchanged,true);
 m.local['bima-tiktok-market-intel-v1']=JSON.stringify({content:[{id:'tt',publishedManually:false}]});r=await s.call('commit',{method:'POST',body:JSON.stringify({manifest:m,deviceId:'test-device-123456',baseRevision:saved.revision})});assert.equal(r.status,200);assert.notEqual((await r.json()).revision,saved.revision);assert.ok((await fs.readdir(path.join(s.directory,'backups','versions'))).includes(saved.revision+'.json'));
});
test('invalid checksum never becomes a usable blob and capacity errors preserve existing data',async t=>{
 const s=await setup(t),badHash='a'.repeat(64);let r=await s.call('blobs/'+badHash+'?offset=0&total='+bytes.length,{method:'PUT',body:bytes});assert.equal(r.status,400);assert.equal((await s.call('blobs/'+badHash)).status,404);
 const full=await setup(t,{reserveBytes:Number.MAX_SAFE_INTEGER});r=await full.call('plan',{method:'POST',body:JSON.stringify({manifest:manifest()})});assert.equal(r.status,507);const capacity=await r.json();assert.equal(capacity.requiredBytes,bytes.length);assert.ok(Number.isFinite(capacity.freeBytes));assert.equal(capacity.reserveBytes,Number.MAX_SAFE_INTEGER);
});
test('manifest rejects credentials, unknown databases and blob references',()=>{
 let m=manifest();m.local.bima_content_server_session='secret';assert.throws(()=>validateBackup(m));
 m=manifest();m.session.bima_content_server_session='secret';assert.throws(()=>validateBackup(m));
 m=manifest();m.databases[0].name='other-application';assert.throws(()=>validateBackup(m));
 m=manifest();m.databases[0].rows[0].value.i=99;assert.throws(()=>validateBackup(m));
});
