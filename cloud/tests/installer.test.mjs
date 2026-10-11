import test from 'node:test';import assert from 'node:assert/strict';
import {selectInstaller,officialInstaller} from '../lib/installer.mjs';
const release={tag_name:'v1.2.0-preview.1',prerelease:true,assets:[{name:'REVIVE-Setup-1.2.0.exe',size:4000000,browser_download_url:'https://github.com/aypacharrito/revive/releases/download/v1.2.0-preview.1/REVIVE-Setup-1.2.0.exe'}]};
test('installer lookup selects a real public EXE and excludes drafts, source zips and other repositories',()=>{
 const spoof={...release,assets:[{...release.assets[0],browser_download_url:'https://github.com/other/revive/releases/download/tag/setup.exe'}]};
 const source={...release,assets:[{...release.assets[0],name:'source.zip'}]};
 assert.deepEqual(selectInstaller([{...release,draft:true},spoof,source,release]),release);
 assert.equal(selectInstaller([source,spoof]),null);
});
test('release proxy handles GitHub errors without producing an invented installer',async()=>{
 await assert.rejects(officialInstaller(async()=>new Response('',{status:403})),/unavailable/);
 const result=await officialInstaller(async()=>Response.json([release]));assert.equal(result.assets[0].name,'REVIVE-Setup-1.2.0.exe');
});
