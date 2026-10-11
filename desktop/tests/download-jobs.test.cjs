'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createDownloadManager}=require('../src/core/download-jobs.cjs');
const hash='a'.repeat(64);
const direct={url:'https://example.com/game.zip',fileName:'game.zip',sha256:hash};
const signed=signature=>({...direct,url:`https://${'a'.repeat(32)}.r2.cloudflarestorage.com/game.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=${signature}`});
function setup(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'revive-jobs-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return {file:path.join(root,'history.json'),folder:path.join(root,'downloads')};}
async function settle(manager,id,status){for(let i=0;i<100;i++){if(manager.list().find(x=>x.id===id)?.status===status)return;await new Promise(r=>setTimeout(r,5));}throw Error(`Download never reached ${status}`);}
test('completed download history survives restart and clearing history keeps files',async t=>{
 const options=setup(t);const manager=createDownloadManager({...options,transfer:async(_d,folder)=>{fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'game.zip'),'game');return {bytes:4};}});
 const job=manager.start(direct);await settle(manager,job.id,'complete');
 const restarted=createDownloadManager(options);assert.equal(restarted.list()[0].status,'complete');assert.equal(restarted.list()[0].bytes,4);
 assert.equal(restarted.reveal(job.id),path.join(options.folder,'game.zip'));restarted.clearFinished();assert.equal(restarted.list().length,0);assert.ok(fs.existsSync(path.join(options.folder,'game.zip')));
});
test('pause waits for file closure, survives restart and renews signed URL on resume',async t=>{
 const options=setup(t);let calls=0,seen=[];
 const manager=createDownloadManager({...options,resolveCatalog:async()=>signed('secret-'+ ++calls),transfer:async(d,_f,{signal,resume})=>{
  seen.push({url:d.url,resume});return new Promise((_ok,reject)=>{signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
 }});
 const job=await manager.startCatalog('demo-game');await settle(manager,job.id,'downloading');await manager.pause(job.id);
 assert.equal(manager.list()[0].status,'paused');assert.equal(seen[0].resume,true);assert.doesNotMatch(fs.readFileSync(options.file,'utf8'),/secret-|X-Amz|cloudflarestorage/);
 const restart=createDownloadManager({...options,resolveCatalog:async()=>signed('fresh-signature'),transfer:async d=>{assert.match(d.url,/fresh-signature/);return {bytes:5};}});
 assert.equal(restart.list()[0].status,'paused');restart.retry(job.id);await settle(restart,job.id,'complete');assert.equal(restart.list()[0].bytes,5);
});
test('interrupted direct transfer is retryable but cannot pretend to resume',async t=>{
 const options=setup(t);const manager=createDownloadManager({...options,transfer:async(_d,_f,{signal})=>new Promise((_r,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}))});
 const job=manager.start(direct);await settle(manager,job.id,'downloading');await assert.rejects(manager.pause(job.id),/Only cloud/);manager.shutdown();await settle(manager,job.id,'interrupted');
 const reload=createDownloadManager({...options,transfer:async(_d,_f,o)=>{assert.equal(o.resume,false);return {bytes:2};}});reload.retry(job.id);await settle(reload,job.id,'complete');
});
test('duplicate target reservations prevent concurrent writers and failed jobs retry',async t=>{
 const options=setup(t);const manager=createDownloadManager({...options,transfer:async()=>{throw Error('Offline');}});
 const job=manager.start(direct);assert.throws(()=>manager.start({...direct,fileName:'GAME.zip'}),/already downloading/);await settle(manager,job.id,'error');
 const retry=createDownloadManager({...options,transfer:async()=>({bytes:42})});retry.retry(job.id);await settle(retry,job.id,'complete');
});
test('resume refuses a changed published package',async t=>{
 const options=setup(t);let changed=false;
 const manager=createDownloadManager({...options,resolveCatalog:async()=>({...signed('valid'),sha256:changed?'b'.repeat(64):hash}),transfer:async()=>{throw Error('Offline');}});
 const job=await manager.startCatalog('demo-game');await settle(manager,job.id,'error');changed=true;manager.retry(job.id);await settle(manager,job.id,'error');assert.match(manager.list()[0].error,/package changed/);
});
