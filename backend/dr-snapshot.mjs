/* Offline, encrypted, consistent-state snapshots. No third-party packages.
   DOES NOT upload backups to another provider; external storage must be configured separately.
   Never run while the live writer is active: DR_SOURCE_QUIESCED is operator assertion only. */
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { lstat, readdir, readFile, writeFile, mkdir, rm, rename } from 'node:fs/promises';
import { dirname, basename, join, relative, resolve, sep, posix, isAbsolute } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';

function keyFromHex(value) {
  if (typeof value!=='string' || !/^[\da-f]{64}$/i.test(value))
    throw Error('DR_BACKUP_KEY_HEX must be a private 32-byte hex key');
  return Buffer.from(value,'hex');
}
const iv=()=>randomBytes(12);
const hex=b=>b.toString('hex');
const digest=()=>createHash('sha256');
const fileId=n=>String(n+1).padStart(6,'0')+'.enc';

async function walk(root,dir='',list=[]) {
  for (const name of (await readdir(join(root,dir))).sort()) {
    const rel=dir?posix.join(dir,name):name, absolute=join(root,rel);
    const st=await lstat(absolute);
    if(st.isSymbolicLink())throw Error('symlink_not_supported: '+rel);
    if(st.isDirectory())await walk(root,rel,list);
    else if(st.isFile())list.push({rel,size:st.size});
    else throw Error('special_file_not_supported: '+rel);
  }
  return list;
}
function validateRel(rel) {
  if(typeof rel!=='string' || !rel || rel.includes('\\') || rel.includes('\0') ||
     rel.startsWith('/') || isAbsolute(rel) || rel.split('/').some(part=>!part || part==='.' || part==='..') ||
     posix.normalize(rel)!==rel) throw Error('unsafe_backup_path');
  return rel;
}
function sealed(buf,key) {
  const nonce=iv(),c=createCipheriv('aes-256-gcm',key,nonce);
  return {blob:Buffer.concat([c.update(buf),c.final()]),iv:hex(nonce),tag:hex(c.getAuthTag())};
}
function opened(blob,key,nonce,tag) {
  const d=createDecipheriv('aes-256-gcm',key,Buffer.from(nonce,'hex'));
  d.setAuthTag(Buffer.from(tag,'hex'));
  return Buffer.concat([d.update(blob),d.final()]);
}
export async function backupDirectory({source,destination,keyHex,quiesced=false}={}) {
  if(!quiesced)throw Error('source_must_be_quiesced');
  const key=keyFromHex(keyHex),from=resolve(source),target=resolve(destination);
  if(target===from || target.startsWith(from+sep))throw Error('backup_destination_inside_source');
  await lstat(from).then(st=>{if(!st.isDirectory())throw Error('source_not_directory');});
  try{await lstat(target);throw Error('destination_already_exists');}catch(e){if(e.code!=='ENOENT')throw e;}
  await mkdir(dirname(target),{recursive:true});
  const tmp=target+'.partial-'+randomUUID();
  await mkdir(tmp,{mode:0o700});
  try {
    const files=await walk(from),entries=[];
    if(!files.length)throw Error('source_empty');
    for(const [i,item] of files.entries()) {
      const nonce=iv(),cipher=createCipheriv('aes-256-gcm',key,nonce),hash=digest();
      let bytes=0;
      const tap=new Transform({transform(chunk,_encoding,next){hash.update(chunk);bytes+=chunk.length;next(null,chunk);}});
      await pipeline(createReadStream(join(from,item.rel)),tap,cipher,
        createWriteStream(join(tmp,fileId(i)),{flags:'wx',mode:0o600}));
      if(bytes!==item.size)throw Error('source_modified_during_snapshot');
      entries.push({path:item.rel,file:fileId(i),size:bytes,sha256:hex(hash.digest()),
        iv:hex(nonce),tag:hex(cipher.getAuthTag())});
    }
    const manifest=sealed(Buffer.from(JSON.stringify({version:1,files:entries})),key);
    await writeFile(join(tmp,'manifest.enc'),manifest.blob,{mode:0o600,flag:'wx'});
    await writeFile(join(tmp,'archive.json'),JSON.stringify({version:1,algorithm:'aes-256-gcm',createdAt:new Date().toISOString(),fileCount:entries.length,iv:manifest.iv,tag:manifest.tag})+'\n',
      {mode:0o600,flag:'wx'});
    await rename(tmp,target);
    return {destination:target,fileCount:entries.length};
  }catch(e){await rm(tmp,{recursive:true,force:true});throw e;}
}
export async function restoreDirectory({archive,destination,keyHex}={}) {
  const key=keyFromHex(keyHex),from=resolve(archive),target=resolve(destination);
  try{await lstat(target);throw Error('destination_already_exists');}catch(e){if(e.code!=='ENOENT')throw e;}
  const header=JSON.parse(await readFile(join(from,'archive.json'),'utf8'));
  if(header.version!==1 || header.algorithm!=='aes-256-gcm' ||
     !/^[\da-f]{24}$/i.test(header.iv)||!/^[\da-f]{32}$/i.test(header.tag))throw Error('bad_archive_header');
  const manifest=JSON.parse(opened(await readFile(join(from,'manifest.enc')),key,header.iv,header.tag).toString('utf8'));
  if(manifest.version!==1 || !Array.isArray(manifest.files) || manifest.files.length!==header.fileCount)
    throw Error('bad_backup_manifest');
  await mkdir(dirname(target),{recursive:true});
  const tmp=target+'.restoring-'+randomUUID(),seen=new Set();
  await mkdir(tmp,{mode:0o700});
  try {
    for(const item of manifest.files) {
      const rel=validateRel(item.path);
      if(seen.has(rel)||!/^\d{6}\.enc$/.test(item.file)||!Number.isSafeInteger(item.size)||
          item.size<0 || !/^[\da-f]{64}$/i.test(item.sha256) ||
          !/^[\da-f]{24}$/i.test(item.iv) || !/^[\da-f]{32}$/i.test(item.tag))throw Error('bad_backup_entry');
      seen.add(rel);
      const out=resolve(tmp,...rel.split('/'));
      if(!out.startsWith(tmp+sep))throw Error('unsafe_backup_path');
      await mkdir(dirname(out),{recursive:true});
      const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(item.iv,'hex'));
      decipher.setAuthTag(Buffer.from(item.tag,'hex'));
      const hash=digest();let size=0;
      const tap=new Transform({transform(chunk,_encoding,next){hash.update(chunk);size+=chunk.length;next(null,chunk);}});
      await pipeline(createReadStream(join(from,item.file)),decipher,tap,createWriteStream(out,{flags:'wx',mode:0o600}));
      if(size!==item.size || hex(hash.digest())!==item.sha256)throw Error('backup_checksum_failed');
    }
    await rename(tmp,target);
    return {destination:target,fileCount:seen.size};
  }catch(e){await rm(tmp,{recursive:true,force:true});throw e;}
}
if(process.argv[1] && basename(process.argv[1])==='dr-snapshot.mjs') {
  const [mode,arg1,arg2]=process.argv.slice(2);
  const opts={keyHex:process.env.DR_BACKUP_KEY_HEX};
  try {
    let result;
    if(mode==='backup'&&arg1&&arg2)result=await backupDirectory({...opts,source:arg1,destination:arg2,quiesced:process.env.DR_SOURCE_QUIESCED==='true'});
    else if(mode==='restore'&&arg1&&arg2&&process.env.DR_RESTORE_APPROVED==='true')
      result=await restoreDirectory({...opts,archive:arg1,destination:arg2});
    else throw Error('usage: backup SOURCE DEST [DR_SOURCE_QUIESCED=true], restore ARCHIVE EMPTY_DEST [DR_RESTORE_APPROVED=true]');
    console.log(JSON.stringify({ok:true,...result})); // No key, manifest, content or tokens printed.
  } catch (e) { console.error('DR snapshot failed:',e.message);process.exitCode=1; }
}
