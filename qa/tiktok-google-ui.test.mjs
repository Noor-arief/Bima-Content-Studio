import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {JSDOM}=require(process.env.BIMA_UI_TEST_DEPENDENCIES?process.env.BIMA_UI_TEST_DEPENDENCIES+'/jsdom':'jsdom');
const script=await readFile(new URL('../tiktok-google-review.js',import.meta.url),'utf8');
const wait=()=>new Promise(r=>setTimeout(r,15));
function page(t,data,authenticated=false){
  const dom=new JSDOM('<div id="youtube">Unchanged</div><div id="tiktokWorkspace"><div class="aff-notice"></div></div><div id="shopee">Unchanged</div>',{url:'https://noor-arief.github.io/Bima-Content-Studio/',runScripts:'outside-only'});
  t.after(()=>dom.window.close());const calls=[];
  dom.window.URL.revokeObjectURL=()=>{};
  if(authenticated)dom.window.sessionStorage.setItem('bima_content_server_session','test-session');
  dom.window.fetch=async(url,options)=>{calls.push({url,options});if(options.method==='POST'){data.jobs=[];}return {ok:true,json:async()=>data};};
  dom.window.eval(script);return {dom,calls,doc:dom.window.document};
}
test('anonymous readiness cannot start production or expose owner actions',async t=>{
  const p=page(t,{blockers:['google_budget_not_available'],estimateUsd:3});await wait();
  assert.match(p.doc.querySelector('[data-blockers]').textContent,/Anggaran API Google/);
  assert.equal(p.calls.length,1);assert.match(p.calls[0].url,/\/public\/tiktok\/google\/status$/);
  assert.equal([...p.doc.querySelectorAll('#tt-google-review button')].some(b=>b.textContent==='Approve'),false);
  assert.equal(p.doc.querySelector('#youtube').textContent,'Unchanged');assert.equal(p.doc.querySelector('#shopee').textContent,'Unchanged');
});
test('owner approval submits only the current video hash; product text is escaped',async t=>{
  const job={id:'a'.repeat(24),product:'<img src=x onerror=alert(1)>',status:'ready_for_review',scenes:[],videoReady:false,mediaHash:'current-video-hash'};
  const p=page(t,{blockers:[],estimateUsd:3,jobs:[job]},true);await wait();
  assert.equal(p.doc.querySelectorAll('#tt-google-review img').length,0);
  const approve=[...p.doc.querySelectorAll('button')].find(b=>b.textContent==='Approve');assert.ok(approve);approve.click();await wait();
  const posts=p.calls.filter(x=>x.options.method==='POST');assert.equal(posts.length,1);
  const body=JSON.parse(posts[0].options.body);assert.equal(body.decision,'approve');assert.equal(body.mediaHash,'current-video-hash');
  assert.equal(posts[0].options.headers.Authorization,'Bearer test-session');
});
test('failed QA cannot expose an approve action',async t=>{
  const p=page(t,{blockers:[],estimateUsd:3,jobs:[{id:'b'.repeat(24),product:'Fixture',status:'qa_failed',scenes:[],qa:{issues:['Bad narration']}}]},true);await wait();
  assert.match(p.doc.querySelector('[data-jobs]').textContent,/pemeriksaan belum lolos/);
  assert.equal([...p.doc.querySelectorAll('#tt-google-review button')].some(b=>b.textContent==='Approve'),false);
});
