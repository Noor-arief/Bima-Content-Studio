import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedFrontendOrigin,frontendReturnURL} from '../frontend-origins.mjs';
test('only original and custom BIMA origins can access browser APIs',()=>{
 for(const origin of ['https://mycontentstudio.site','https://noor-arief.github.io'])assert.equal(allowedFrontendOrigin(origin),true);
 for(const origin of [undefined,'null','https://evil.example','https://mycontentstudio.site.evil.example','http://mycontentstudio.site'])assert.equal(allowedFrontendOrigin(origin),false);
});
test('OAuth callback returns only to an approved frontend URL',()=>{
 assert.equal(frontendReturnURL('https://mycontentstudio.site'),'https://mycontentstudio.site/');
 assert.equal(frontendReturnURL('https://noor-arief.github.io'),'https://noor-arief.github.io/Bima-Content-Studio/');
 assert.equal(frontendReturnURL('https://evil.example'),'https://noor-arief.github.io/Bima-Content-Studio/');
});
