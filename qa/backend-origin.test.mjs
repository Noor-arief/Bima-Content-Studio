import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const primary='https://content-studio-api-production-3fe2.up.railway.app';
const code=read('backend-endpoints.js');
function makeContext({standbys=[],saved=null,session='test-owner-session'}={}) {
  const local=new Map(saved===null?[]:[['bima_content_server_url',saved]]);
  const sessions=new Map([['bima_content_server_session',session]]);
  const store=m=>({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});
  const window={localStorage:store(local),sessionStorage:store(sessions)};
  const instance=standbys.length?code.replace('const APPROVED_STANDBYS=Object.freeze([]);', 'const APPROVED_STANDBYS=Object.freeze('+JSON.stringify(standbys)+');'):code;
  runInNewContext(instance,{window,URL});
  return {api:window.BIMA_BACKEND_ENDPOINTS,local,sessions};
}
test('defaults only to the approved primary; never a wildcard host',()=>{
  const {api}=makeContext();
  assert.equal(api.current(),primary);
  assert.deepEqual(Array.from(api.approvedOrigins),[primary]);
  assert.equal(api.validate(primary+'/'),primary);
  assert.equal(api.validate(' '+primary+'  '),primary);
});
test('rejects any unapproved, insecure or deceptive origin, even another Railway host',()=>{
  const {api}=makeContext();
  for(const url of ['http://'+primary.slice(8), 'http://127.0.0.1:3000', 'https://localhost',
     'https://fake.up.railway.app','https://fake.onrender.com',
     primary+'/private',primary+'?token=x',primary+'#hash',
     'https://evil.com@content-studio-api-production-3fe2.up.railway.app',
     primary+':443','javascript:alert(1)','']) {
    assert.throws(()=>api.validate(url),/backend_not_approved|invalid_backend/,url);
  }
});
test('previously saved arbitrary backend URL fails closed instead of leaking auth',()=>{
  const {api,sessions}=makeContext({saved:'https://fake.up.railway.app'});
  assert.throws(()=>api.current(),/backend_not_approved/);
  assert.equal(sessions.get('bima_content_server_session'),'test-owner-session');
});
test('verified standby can be selected only when exactly allowlisted; switch logs out owner session',()=>{
  const standby='https://verified-standby.example.com';
  const {api,local,sessions}=makeContext({standbys:[standby]});
  assert.equal(api.select(standby+'/'),standby);
  assert.equal(api.current(),standby);
  assert.equal(local.get('bima_content_server_url'),standby);
  assert.equal(sessions.has('bima_content_server_session'),false);
  sessions.set('bima_content_server_session','new-standby-owner-session');
  assert.equal(api.select(standby),standby);
  assert.equal(sessions.get('bima_content_server_session'),'new-standby-owner-session');
});
test('frontend loads origin registry before owner API code; analytics/status use shared validation',()=>{
  const index=read('index.html'),analytics=read('youtube-analytics.js'),status=read('bima-public-status.js');
  assert.ok(index.indexOf('<script src="backend-endpoints.js?')>=0);
  assert.ok(index.indexOf('<script src="backend-endpoints.js?')<index.indexOf('(function initSecureAutomation()'));
  assert.match(index,/BIMA_BACKEND_ENDPOINTS\.select\(urlEl\.value\)/);
  assert.match(analytics,/BIMA_BACKEND_ENDPOINTS\.current\(\)/);
  assert.match(status,/BIMA_BACKEND_ENDPOINTS\.current\(\)/);
  assert.doesNotMatch(analytics,/\.up\\\.railway\\\.app\$\/\.test\(value\)/);
});
