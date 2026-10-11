import test from 'node:test';import assert from 'node:assert/strict';
import {validId,validateListing,publicListing} from '../lib/catalog.mjs';
const fixture={id:'sample-homebrew',title:'Sample Homebrew',description:'An indie demo',version:'1.0',filename:'game.zip',sha256:'f'.repeat(64),bytes:1000,rights:'original',rightsSource:'Created by author',objectKey:`packages/sample-homebrew/${'f'.repeat(64)}/game.zip`};
test('published original game metadata produces safe, limited listing',()=>{const entry=publicListing(fixture);assert.equal(entry.id,fixture.id);assert.equal(entry.downloadPath,'/api/catalog-download?id=sample-homebrew');assert.equal(entry.objectKey,undefined);assert.equal(entry.rightsSource,undefined);});
test('metadata rejects unauthorized rights',()=>{assert.throws(()=>validateListing({...fixture,rights:'abandoned'}),/rights/);assert.throws(()=>validateListing({...fixture,rights:'written-permission',rightsSource:''}),/reference/);});
test('metadata rejects object path spoofing and malformed file',()=>{assert.throws(()=>validateListing({...fixture,objectKey:'other.zip'}),/identity/);assert.throws(()=>validateListing({...fixture,filename:'../evil.exe'}),/filename/);});
test('strict identifiers block traversal',()=>{assert.equal(validId('../foo'),false);assert.equal(validId('cool-game'),true);});
