'use strict';
(() => {
const DBS = {'bima-content-studio-v4-assets':['videos'],'bima-video-matched-thumbnail-v1':['covers'],'bima-tiktok-production-media-v1':['files']};
const keyAllowed=k=>/^(bima-content-studio-|bima-tiktok-|bima-shopee-|bima_affiliate_|bima_content_server_url$|bima_youtube_|bima_piapi_|bima_public_)/.test(k);
const sessionAllowed=k=>k==='bimaView'||k.startsWith('bimaTikTok');
const $=id=>document.getElementById(id),say=s=>{$('status').textContent=s};
let prepared=null;
function storageData(storage,allowed){const result={};for(let i=0;i<storage.length;i++){const k=storage.key(i);if(allowed(k))result[k]=storage.getItem(k)}return result}
function open(name){return new Promise((ok,bad)=>{const r=indexedDB.open(name);r.onupgradeneeded=()=>r.transaction.abort();r.onsuccess=()=>ok(r.result);r.onerror=()=>{if(r.error?.name==='AbortError')ok(null);else bad(r.error)}})}
function records(db,store){return new Promise((ok,bad)=>{const out=[],r=db.transaction(store).objectStore(store).openCursor();r.onsuccess=()=>{const c=r.result;if(!c)return ok(out);out.push({key:c.key,value:c.value});c.continue()};r.onerror=()=>bad(r.error)})}
async function sha(blob){const result=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());return [...new Uint8Array(result)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function encode(value,blobs){
 if(value instanceof Blob){const index=blobs.length;blobs.push(value);return {t:'blob',i:index,name:value.name||null,type:value.type,size:value.size,lastModified:value.lastModified||null}}
 if(value instanceof Date)return {t:'date',v:value.toISOString()};
 if(value===undefined)return {t:'undefined'};
 if(value===null||['string','number','boolean'].includes(typeof value))return {t:'scalar',v:value};
 if(Array.isArray(value))return {t:'array',v:await Promise.all(value.map(x=>encode(x,blobs)))};
 if(Object.getPrototypeOf(value)===Object.prototype){const out=[];for(const [k,v] of Object.entries(value))out.push([k,await encode(v,blobs)]);return {t:'object',v:out}}
 throw Error('Tipe data belum didukung; backup dibatalkan agar tidak kehilangan data.');
}
function decode(value,blobs){switch(value.t){case 'blob':{const b=blobs[value.i];if(!b||b.size!==value.size)throw Error('Media tidak lengkap');return value.name?new File([b],value.name,{type:value.type,lastModified:value.lastModified||0}):new Blob([b],{type:value.type})}case 'date':return new Date(value.v);case 'undefined':return undefined;case 'scalar':return value.v;case 'array':return value.v.map(x=>decode(x,blobs));case 'object':return Object.fromEntries(value.v.map(([k,v])=>[k,decode(v,blobs)]));default:throw Error('Format data tidak valid')}}
function counts(local){const yt=JSON.parse(local['bima-content-studio-v3']||'{}').items?.youtube||[],tt=JSON.parse(local['bima-tiktok-market-intel-v1']||'{}').content||[];return {youtube:yt.length,youtubeLive:yt.filter(x=>/published/i.test(x.status||'')).length,tiktok:tt.length,tiktokLive:tt.filter(x=>x.publishedManually===true||x.status==='Published manually').length}}
async function snapshot(){
 const local=storageData(localStorage,keyAllowed),session=storageData(sessionStorage,sessionAllowed),blobs=[],databases=[];
 for(const [name,stores] of Object.entries(DBS)){const db=await open(name);if(!db)continue;try{for(const store of stores){if(!db.objectStoreNames.contains(store))continue;const rows=[];for(const r of await records(db,store))rows.push({key:await encode(r.key,blobs),value:await encode(r.value,blobs)});databases.push({name,store,version:db.version,rows})}}finally{db.close()}}
 if(JSON.stringify(local)!==JSON.stringify(storageData(localStorage,keyAllowed)))throw Error('Data berubah saat backup. Tutup tab BIMA lain dan ulangi.');
 const media=[];let offset=0;for(let i=0;i<blobs.length;i++){say('Memverifikasi media '+(i+1)+'/'+blobs.length+'…');const b=blobs[i];media.push({offset,size:b.size,sha256:await sha(b)});offset+=b.size}
 return {manifest:{format:'bima-complete-v1',origin:location.origin,createdAt:new Date().toISOString(),local,session,databases,media,counts:counts(local)},blobs};
}
function archive(pack){const header=new TextEncoder().encode(JSON.stringify(pack.manifest)),length=new Uint8Array(4);new DataView(length.buffer).setUint32(0,header.length,true);return new Blob(['BIMAFULL',length,header,...pack.blobs],{type:'application/octet-stream'})}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}
async function readArchive(file){
 if(await file.slice(0,8).text()!=='BIMAFULL')throw Error('Pilih backup lengkap .bimabackup, bukan backup TikTok lama.');
 const length=new DataView(await file.slice(8,12).arrayBuffer()).getUint32(0,true);if(length>64*1024*1024||length+12>file.size)throw Error('Header backup tidak valid');
 const manifest=JSON.parse(await file.slice(12,12+length).text());if(manifest.format!=='bima-complete-v1'||!Array.isArray(manifest.databases)||!Array.isArray(manifest.media)||manifest.origin!=='https://noor-arief.github.io')throw Error('Sumber/format backup tidak sesuai');
 for(const [k,v] of Object.entries(manifest.local))if(!keyAllowed(k)||typeof v!=='string')throw Error('Pengaturan backup tidak valid');
 for(const k of Object.keys(manifest.session))if(!sessionAllowed(k))throw Error('Session backup tidak valid');
 const blobs=[];let offset=0;for(const m of manifest.media){if(m.offset!==offset||!Number.isSafeInteger(m.size)||m.size<0)throw Error('Urutan media tidak valid');const b=file.slice(12+length+offset,12+length+offset+m.size);if(b.size!==m.size||await sha(b)!==m.sha256)throw Error('File backup rusak/tidak lengkap');blobs.push(b);offset+=m.size}
 if(12+length+offset!==file.size)throw Error('Ukuran backup tidak sesuai');
 for(const d of manifest.databases){if(!DBS[d.name]?.includes(d.store)||d.version!==1||!Array.isArray(d.rows))throw Error('Database backup tidak valid');for(const r of d.rows){decode(r.key,blobs);decode(r.value,blobs)}}
 if(JSON.stringify(counts(manifest.local))!==JSON.stringify(manifest.counts))throw Error('Jumlah konten tidak sesuai');
 return {manifest,blobs};
}
function putRows(db,store,rows){return new Promise((ok,bad)=>{const tx=db.transaction(store,'readwrite'),s=tx.objectStore(store);for(const r of rows){if(r.remove)s.delete(r.key);else s.put(r.value,r.key)}tx.oncomplete=ok;tx.onabort=()=>bad(tx.error||Error('Transaksi dibatalkan'));tx.onerror=()=>bad(tx.error)})}
function createDB(name,store){return new Promise((ok,bad)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{for(const s of DBS[name])if(!r.result.objectStoreNames.contains(s))r.result.createObjectStore(s)};r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)})}
async function restore(pack){
 const beforeLocal=storageData(localStorage,keyAllowed),beforeSession=storageData(sessionStorage,sessionAllowed),undo=[];
 try{
  for(const d of pack.manifest.databases){const db=await createDB(d.name,d.store);try{const previous=await records(db,d.store),rollback=[],incoming=d.rows.map(r=>({key:decode(r.key,pack.blobs),value:decode(r.value,pack.blobs)}));for(const r of incoming){const old=previous.find(x=>indexedDB.cmp(x.key,r.key)===0);rollback.push(old||{key:r.key,remove:true})}await putRows(db,d.store,incoming);undo.push({name:d.name,store:d.store,rows:rollback});const actual=await records(db,d.store);for(const r of d.rows){const key=decode(r.key,pack.blobs),actualRow=actual.find(x=>indexedDB.cmp(x.key,key)===0);if(!actualRow)throw Error('Media gagal disimpan');const actualBlobs=[],encoded=await encode(actualRow.value,actualBlobs),expectedBlobs=[],expected=await encode(decode(r.value,pack.blobs),expectedBlobs);if(JSON.stringify(encoded)!==JSON.stringify(expected))throw Error('Metadata media berbeda');for(let i=0;i<actualBlobs.length;i++)if(await sha(actualBlobs[i])!==await sha(expectedBlobs[i]))throw Error('Verifikasi media gagal')}}finally{db.close()}}
  for(const [k,v] of Object.entries(pack.manifest.local))localStorage.setItem(k,v);
  for(const [k,v] of Object.entries(pack.manifest.session))sessionStorage.setItem(k,v);
  for(const [k,v] of Object.entries(pack.manifest.local))if(localStorage.getItem(k)!==v)throw Error('Verifikasi pengaturan gagal');
 }catch(e){for(const d of undo.reverse()){const db=await open(d.name);if(db){try{await putRows(db,d.store,d.rows)}finally{db.close()}}}for(const k of Object.keys(pack.manifest.local)){if(k in beforeLocal)localStorage.setItem(k,beforeLocal[k]);else localStorage.removeItem(k)}for(const k of Object.keys(pack.manifest.session)){if(k in beforeSession)sessionStorage.setItem(k,beforeSession[k]);else sessionStorage.removeItem(k)}throw e}
}
function busy(on){for(const id of ['backup','inspect','restore','file'])$(id).disabled=on;}
$('backup').onclick=async()=>{busy(true);try{const pack=await snapshot();if(!pack.manifest.local['bima-content-studio-v3']||!pack.manifest.local['bima-tiktok-market-intel-v1'])throw Error('Data YouTube/TikTok belum ditemukan di alamat ini. Gunakan alamat lama dan profil browser asli.');download(archive(pack),'bima-lengkap-'+Date.now()+'.bimabackup');say('Backup lengkap dibuat. Simpan file, lalu pilih file tersebut di bawah untuk pemeriksaan sebelum domain dipindahkan.\n'+JSON.stringify(pack.manifest.counts,null,2)+'\nMedia: '+pack.blobs.length+' file.\nToken login tidak dimasukkan ke file backup.')}catch(e){say(e.message)}finally{busy(false)}};
$('inspect').onclick=async()=>{busy(true);try{if(!$('file').files[0])throw Error('Pilih file backup lengkap');prepared=await readArchive($('file').files[0]);say('BACKUP VALID — seluruh checksum media cocok.\n'+JSON.stringify(prepared.manifest.counts,null,2)+'\nMedia: '+prepared.blobs.length+' file.\n'+(location.origin==='https://noor-arief.github.io'?'Kirim hasil pemeriksaan ini sebelum domain dipasang.':'Klik Pulihkan untuk memindahkan data ke domain ini.'))}catch(e){prepared=null;say(e.message)}finally{busy(false)}};
$('file').onchange=()=>{prepared=null};
$('restore').onclick=async()=>{busy(true);try{if(location.origin!=='https://mycontentstudio.site')throw Error('Pemulihan hanya di domain baru; alamat lama tidak diubah.');if(!prepared)throw Error('Periksa file backup terlebih dahulu');const before=await snapshot();download(archive(before),'bima-tujuan-sebelum-impor-'+Date.now()+'.bimabackup');say('Memulihkan dan memverifikasi konten serta media…');await restore(prepared);say('PEMULIHAN TERVERIFIKASI\n'+JSON.stringify(prepared.manifest.counts,null,2)+'\nMedia: '+prepared.blobs.length+' file.\nBuka BIMA. Koneksi channel YouTube di server tetap dipertahankan; sesi owner browser mungkin perlu login kembali.')}catch(e){say('Belum selesai: '+e.message)}finally{busy(false)}};
say('Alamat: '+location.origin+'\n'+JSON.stringify(counts(storageData(localStorage,keyAllowed)),null,2)+'\nBackup lengkap mencakup konten, status tayang, jadwal, pengaturan, video YouTube, thumbnail dan media TikTok.');
})();
