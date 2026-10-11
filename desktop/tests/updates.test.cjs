'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeProgress, transition, isSafeRestart } = require('../src/core/update-policy.cjs');
test('update percent is bounded and supports unknown lengths', () => {
  assert.deepEqual(normalizeProgress({transferred:75,total:100,bytesPerSecond:20}), {percent:75,transferred:75,total:100,bytesPerSecond:20});
  assert.equal(normalizeProgress({percent:230}).percent,100);
  assert.equal(normalizeProgress({percent:-30}).percent,0);
});
test('downloaded state records version and ready-to-install status', () => {
  const initial = {phase:'current',version:'0.4.0',progress:null};
  const checking=transition(initial,'checking');
  const available=transition(checking,'available',{version:'0.5.0'});
  const transferring=transition(available,'downloading',{transferred:1024,total:2048});
  const ready=transition(transferring,'ready',{version:'0.5.0'});
  assert.equal(ready.phase,'ready');assert.equal(ready.version,'0.5.0');assert.equal(ready.progress.percent,100);
});
test('errors are bounded and do not embed multiline log floods', () => {
  assert.equal(transition({phase:'checking'},'error',{message:'x'.repeat(800)}).message.length,220);
});
test('never restart into installation while a game is still running', () => {
  assert.equal(isSafeRestart(1,'ready'),false);
  assert.equal(isSafeRestart(0,'downloading'),false);
  assert.equal(isSafeRestart(0,'ready'),true);
});
test('packaged updates use explicitly configured GitHub owner and NSIS per-user installer', () => {
  const pkg=require('../package.json');
  assert.deepEqual(pkg.build.publish[0],{provider:'github',owner:'aypacharrito',repo:'revive',releaseType:'release'});
  assert.equal(pkg.build.nsis.perMachine,false);
  assert.equal(pkg.build.nsis.oneClick,true);
  assert.equal(pkg.dependencies['electron-updater'] !== undefined,true);
});
test('preload exposes update status, check and restart methods', () => {
  const fs=require('node:fs');const preload=fs.readFileSync(require('node:path').join(__dirname,'../src/preload.cjs'),'utf8');
  for(const name of ['updateStatus','checkUpdates','installUpdate','onUpdateState'])assert.match(preload,new RegExp(name+':'));
});

const {EventEmitter} = require('node:events');
const {createUpdateService} = require('../src/update-service.cjs');
test('simulated packaged app downloads update and defers install while game is running',async()=>{
  const updater=new EventEmitter();const events=[];const sessions=new Set([123]);
  updater.checkForUpdates=async()=>{
    updater.emit('checking-for-update');
    updater.emit('update-available',{version:'0.4.1'});
    updater.emit('download-progress',{transferred:75,total:100,bytesPerSecond:200});
    updater.emit('update-downloaded',{version:'0.4.1'});
  };
  let installations=0;updater.quitAndInstall=()=>{installations++};
  const service=createUpdateService({app:{isPackaged:true,getVersion:()=> '0.4.0'},platform:'win32',injectedUpdater:updater,emit:s=>events.push(s),sessions});
  await service.check();
  assert.equal(service.status().phase,'ready');
  assert.equal(service.status().progress.percent,100);
  assert.deepEqual(events.map(x=>x.phase),['checking','available','downloading','ready']);
  assert.throws(()=>service.installNow(),/Close your running games/);
  assert.equal(installations,0);
  sessions.clear();
  service.stop();
});
test('source mode has no automatic network or installation attempts',async()=>{
  const svc=createUpdateService({app:{isPackaged:false,getVersion:()=> '0.4.0'},platform:'win32',emit:()=>{throw Error('unexpected')},sessions:new Set()});
  await svc.check();
  svc.start();
  assert.equal(svc.status().phase,'development');
  assert.throws(()=>svc.installNow(),/No fully downloaded/);
  svc.stop();
});
