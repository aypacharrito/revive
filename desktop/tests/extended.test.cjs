'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const crypto=require('node:crypto');
const {profileFor}=require('../src/core/profiles.cjs');
const {validateDownload,verifiedDownload}=require('../src/core/verified-download.cjs');
const {collectCode}=require('../src/core/source-review.cjs');
test('Blur supported LAN, Sunset PC not falsely presented as multiplayer ready',()=>{assert.equal(profileFor('Blur').mode,'lan');assert.equal(profileFor('Sunset Overdrive').mode,'research');});
test('verified download requires expected hash and safe filename',()=>{assert.throws(()=>validateDownload({url:'https://example.com',sha256:'bad',fileName:'mod.zip'}));assert.throws(()=>validateDownload({url:'https://example.com',sha256:'a'.repeat(64),fileName:'../x.exe'}));});
test('verified download hashes streamed bytes and discards mismatch',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'revive-download-'));const data=Buffer.from('test payload');const hash=crypto.createHash('sha256').update(data).digest('hex');
 const request=async()=>new Response(data,{status:200,headers:{'content-length':String(data.length)}});
 try{
  const result=await verifiedDownload({url:'https://example.com/patch',sha256:hash,fileName:'test.zip'},folder,{request});assert.deepEqual(fs.readFileSync(result.file),data);
  await assert.rejects(verifiedDownload({url:'https://example.com/patch',sha256:'a'.repeat(64),fileName:'bad.zip'},folder,{request}),/mismatch/);
  assert.equal(fs.existsSync(path.join(folder,'bad.zip')),false);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
test('code review excludes .env and node_modules',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'revive-code-'));try{fs.writeFileSync(path.join(dir,'app.js'),"const apiKey = 'sk-EXAMPLESECRETVALUE';");fs.writeFileSync(path.join(dir,'.env'),'PASSWORD=wrong');fs.mkdirSync(path.join(dir,'node_modules'));fs.writeFileSync(path.join(dir,'node_modules','index.js'),'bad');const report=collectCode(dir);assert.equal(report.files.length,1);assert.match(report.files[0].content,/\[REDACTED\]/);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('LAN adapter inspector does not mistake all normal networks for virtual LAN',()=>{const {networkReadiness}=require('../src/core/network.cjs');const r=networkReadiness({'Ethernet':[{family:'IPv4',internal:false,address:'192.168.1.2'}],'ZeroTier One':[{family:'IPv4',internal:false,address:'10.147.0.2'}],'Loopback':[{family:'IPv4',internal:true,address:'127.0.0.1'}]});assert.equal(r.adapters.length,2);assert.equal(r.possibleVirtualAdapters,1);});
