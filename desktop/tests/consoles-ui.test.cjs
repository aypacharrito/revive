'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
test('Consoles screen wires real import and configure actions',async()=>{
  const {consolesView}=await import('../ui/views/consoles.mjs');
  const html=consolesView({emulators:{engines:[{id:'retroarch',label:'RetroArch',description:'Core required',url:'https://www.retroarch.com/',configured:true,path:'C:\\retroarch.exe',systems:[{id:'gba',label:'Game Boy Advance',coreConfigured:false}]}]},gpu:{vendor:'NVIDIA',name:'Test',note:'Automatic'}});
  assert.match(html,/data-action="emulator-config"/);assert.match(html,/data-action="emulator-core"/);assert.match(html,/data-action="console-import"/);assert.match(html,/Nintendo Switch/);assert.match(html,/NVIDIA/);
});
test('windows source package separates GitHub importer from application startup',()=>{
  const root=path.resolve(__dirname,'../..');
  const importer=fs.readFileSync(path.join(root,'RUN_NOW.bat'),'utf8');
  const runner=fs.readFileSync(path.join(root,'START_REVIVE_APP.bat'),'utf8');
  const ps=fs.readFileSync(path.join(root,'scripts','IMPORT_TO_GITHUB.ps1'),'utf8');
  assert.match(importer,/IMPORT_TO_GITHUB\.ps1/);
  assert.doesNotMatch(importer,/npm\.cmd/);
  assert.match(runner,/npm\.cmd --prefix desktop install/);
  assert.match(runner,/npm\.cmd --prefix desktop start/);
  assert.match(ps,/Get-FileHash/);
  assert.match(ps,/REVIVE Backups/);
  assert.match(ps,/Test-Path -LiteralPath \(Join-Path \$dest '\.git'\)/);
  assert.ok(fs.existsSync(path.join(root,'SETUP_CLOUD.bat')));
  assert.ok(fs.existsSync(path.join(root,'BUILD_WINDOWS_INSTALLER.bat')));
});
