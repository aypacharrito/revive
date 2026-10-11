import test from 'node:test';import assert from 'node:assert/strict';
import {validImportUrl,importAuthorizedUrl} from '../scripts/import-authorized-url.mjs';
test('owner URL import requires HTTPS and no credentials',()=>{
 assert.throws(()=>validImportUrl('http://mediafire.com/file.zip'));
 assert.throws(()=>validImportUrl('https://user:pass@files.example.com/a.zip'));
 assert.equal(validImportUrl('https://files.example.com/a.zip').hostname,'files.example.com');
});
test('owner URL import blocks packages without distribution permission',async()=>{
 await assert.rejects(()=>importAuthorizedUrl({url:'https://example.com/a.zip',filename:'a.zip',rights:'abandoned',title:'A'}),/Distribution rights/);
});
