'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { importExecutable, readLibrary, writeLibrary, inspectGame, candidateExecutables } = require('../src/core/library.cjs');
const { packSaveDirectory, unpackSaveDirectory, createSnapshot, restoreSnapshot, validRelative } = require('../src/core/backups.cjs');
const { validateEndpoint } = require('../src/core/cloud.cjs');
function temp(){return fs.mkdtempSync(path.join(os.tmpdir(),'revive-test-'));}
test('imports a selected .exe and stores library locally',()=>{const root=temp();const exe=path.join(root,'Blur.exe');fs.writeFileSync(exe,'test game');const imported=importExecutable(exe,[]);assert.equal(imported.game.title,'Blur');assert.equal(importExecutable(exe,imported.games).existed,true);const file=path.join(root,'library.json');writeLibrary(file,imported.games);assert.equal(readLibrary(file)[0].exe,exe);const info=inspectGame(imported.game);assert.equal(info.fileCount>=1,true);assert.equal(info.exeSha256.length,64);});
test('folder scan excludes uninstaller executables',()=>{const root=temp();fs.writeFileSync(path.join(root,'setup.exe'),'a');fs.writeFileSync(path.join(root,'Game.exe'),'a');assert.deepEqual(candidateExecutables(root),[path.join(root,'Game.exe')]);});
test('backup archive round-trip restores nested saves',()=>{const root=temp();const save=path.join(root,'saves');const nested=path.join(save,'slot');fs.mkdirSync(nested,{recursive:true});fs.writeFileSync(path.join(nested,'progress.save'),'level=8');const buf=packSaveDirectory(save);fs.writeFileSync(path.join(nested,'progress.save'),'level=1');assert.equal(unpackSaveDirectory(buf,save),1);assert.equal(fs.readFileSync(path.join(nested,'progress.save'),'utf8'),'level=8');const game={id:'1',saveDir:save};const storage=path.join(root,'backups');const snapshot=createSnapshot(game,storage);fs.writeFileSync(path.join(nested,'progress.save'),'level=9');restoreSnapshot(game,storage,snapshot.name);assert.equal(fs.readFileSync(path.join(nested,'progress.save'),'utf8'),'level=8');});
test('rejects unsafe path names and insecure cloud endpoint',()=>{assert.equal(validRelative('../secret'),false);assert.equal(validRelative('a/../../b'),false);assert.equal(validRelative('C:/windows'),false);assert.equal(validRelative('save/file.sav'),true);assert.throws(()=>validateEndpoint('http://example.com/saves/'),/HTTPS/);assert.ok(validateEndpoint('https://cloud.example.com/saves/'));});

test('rejects traversal attempts inside compressed save archives',()=>{
 const zlib=require('node:zlib');const dest=temp();
 const malicious=zlib.gzipSync(Buffer.from(JSON.stringify({format:'revive-save-v1',files:[{path:'../escape.txt',content:Buffer.from('bad').toString('base64')}]})));
 assert.throws(()=>unpackSaveDirectory(malicious,dest),/Unsafe/);
 assert.equal(fs.existsSync(path.join(dest,'..','escape.txt')),false);
});

test('WebDAV latest-save uploads and downloads over loopback',async()=>{
 const http=require('node:http');
 const {uploadLatest,downloadLatest}=require('../src/core/cloud.cjs');
 let saved=null;
 const server=http.createServer((req,res)=>{
  if(req.headers.authorization !== `Basic ${Buffer.from('owner:secret').toString('base64')}`) {res.writeHead(401).end();return;}
  if(req.method==='PUT'){const chunks=[];req.on('data',c=>chunks.push(c));req.on('end',()=>{saved=Buffer.concat(chunks);res.writeHead(201).end();});return;}
  if(req.method==='GET'&&saved){res.writeHead(200,{'Content-Length':saved.length});res.end(saved);return;}
  res.writeHead(404).end();
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 try {
  const root=temp(),file=path.join(root,'back.revive');fs.writeFileSync(file,'hello');
  const cfg={url:`http://127.0.0.1:${server.address().port}/backups/`,user:'owner',password:'secret'};
  await uploadLatest(cfg,'123',file);
  const roundtrip=await downloadLatest(cfg,'123');
  assert.equal(roundtrip.toString(),'hello');
 } finally {await new Promise(done=>server.close(done));}
});
