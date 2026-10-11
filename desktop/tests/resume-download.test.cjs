const test=require('node:test'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {verifiedDownload}=require('../src/core/verified-download.cjs');
const text='hello trusted data xyz';const data=Buffer.from(text);
const sha256=crypto.createHash('sha256').update(data).digest('hex');
const params={url:'https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com/b?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc',sha256,fileName:'demo.zip',signedR2:true};
test('resumes verified R2 download with Content-Range and SHA-256',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'revive-resume-test-'));
 try{
  fs.writeFileSync(path.join(folder,`.revive-${sha256.slice(0,18)}-demo.zip.part`),data.subarray(0,6));
  const mock=async(_url,options)=>{
   assert.equal(options.headers.Range,'bytes=6-');
   return new Response(data.subarray(6),{status:206,headers:{'content-range':`bytes 6-${data.length-1}/${data.length}`,'content-length':String(data.length-6)}});
  };
  const result=await verifiedDownload(params,folder,{resume:true,request:mock});
  assert.equal(result.resumedBytes,6);
  assert.equal(fs.readFileSync(result.file,'utf8'),text);
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
});
test('R2 resume restarts when server ignores Range',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'revive-resume-test-'));
 try{
  fs.writeFileSync(path.join(folder,`.revive-${sha256.slice(0,18)}-demo.zip.part`),Buffer.from('junk'));
  const result=await verifiedDownload(params,folder,{resume:true,request:async()=>new Response(data,{status:200})});
  assert.equal(result.resumedBytes,0);assert.equal(fs.readFileSync(result.file,'utf8'),text);
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
});

test('a fully received partial file finishes validation without another network request',async t=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'revive-complete-part-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 fs.writeFileSync(path.join(folder,`.revive-${sha256.slice(0,18)}-demo.zip.part`),data);
 const result=await verifiedDownload(params,folder,{resume:true,request:async()=>{throw Error('Should not request already complete bytes');}});
 assert.equal(result.resumedBytes,data.length);assert.equal(fs.readFileSync(result.file,'utf8'),text);
});
test('range no longer satisfiable restarts once and verifies the complete response',async t=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'revive-range-expired-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 fs.writeFileSync(path.join(folder,`.revive-${sha256.slice(0,18)}-demo.zip.part`),Buffer.from('old-broken-part'));
 let count=0;const result=await verifiedDownload(params,folder,{resume:true,request:async(_url,options)=>{count++;if(count===1)return new Response(null,{status:416});assert.deepEqual(options.headers,{});return new Response(data,{status:200});}});
 assert.equal(count,2);assert.equal(result.resumedBytes,0);assert.equal(fs.readFileSync(result.file,'utf8'),text);
});
test('a dropped streaming connection preserves cloud partial bytes for a verified resume',async t=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'revive-dropped-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const body=new ReadableStream({start(controller){controller.enqueue(data.subarray(0,6));setTimeout(()=>controller.error(Object.assign(new TypeError('terminated'),{cause:{code:'UND_ERR_SOCKET'}})),20);}});
 await assert.rejects(verifiedDownload(params,folder,{resume:true,request:async()=>new Response(body)}),/terminated/);
 const partial=path.join(folder,`.revive-${sha256.slice(0,18)}-demo.zip.part`);assert.equal(fs.statSync(partial).size,6);
 const result=await verifiedDownload(params,folder,{resume:true,request:async()=>new Response(data.subarray(6),{status:206,headers:{'content-range':`bytes 6-${data.length-1}/${data.length}`}})});
 assert.equal(fs.readFileSync(result.file,'utf8'),text);
});
