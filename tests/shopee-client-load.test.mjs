import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('../shopee-studio.js',import.meta.url),'utf8');
const load=source.slice(source.indexOf('async function load(){'),source.indexOf('\nfunction download('));
function context(response){
 const c={loading:false,dirty:false,online:false,drafts:[{id:'cached'}],bank:null,selected:'cached',view:'research',messages:[],json:async()=>response,cache(){},draw(){},d(){return c.drafts.find(x=>x.id===c.selected);},message(text,bad){c.messages.push({text,bad});}};
 vm.createContext(c);vm.runInContext(load,c);return c;
}
test('studio loads compatible releases without an exact deployment version pin',async()=>{
 for(const version of ['20261025-production1','20261025-render-font1','20261025-flow1','future-release']){
  const c=context({version,capabilities:{render:true},drafts:[{id:'server-draft',revision:7}],bank:{today:'2026-10-25'}});
  await c.load();assert.equal(c.online,true);assert.equal(c.loading,false);assert.equal(c.selected,'server-draft');assert.equal(c.drafts[0].revision,7);assert.equal(c.messages.at(-1).bad,undefined);
 }
});
test('malformed studio response preserves cached drafts and reports failure',async()=>{
 for(const response of [{drafts:[]},{capabilities:{render:true},drafts:null}]){
  const c=context(response);await c.load();assert.equal(c.online,false);assert.equal(c.drafts[0].id,'cached');assert.equal(c.loading,false);assert.equal(c.messages.at(-1).bad,true);
 }
});
