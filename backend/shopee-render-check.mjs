// Deployment check: render a real catalog fixture without touching owner drafts.
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {seedDraft,renderShopeeDraft} from './shopee-studio.mjs';
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'bima-render-check-'));
try {
 const draft=seedDraft();
 const file=fileURLToPath(new URL('./catalog-media/41561442154.jpg',import.meta.url));
 draft.assets=Object.fromEntries(['scene1','scene2','scene3'].map(key=>[key,{file,mime:'image/jpeg'}]));
 const outputPath=path.join(directory,'check.mp4');
 const result=await renderShopeeDraft({draft,directory,outputPath});
 const bytes=(await fs.stat(outputPath)).size;
 if(bytes<10000)throw Error('render_check_empty_output');
 console.log('shopee_renderer_check',JSON.stringify({status:'PASS',...result,bytes}));
} catch(e) {
 console.error('shopee_renderer_check',JSON.stringify({status:'FAIL',code:e.message,diagnostic:String(e.cause||'').slice(-1800)}));
 process.exitCode=1;
} finally { await fs.rm(directory,{recursive:true,force:true}); }
