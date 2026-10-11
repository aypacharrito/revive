'use strict';
const { app, BrowserWindow, ipcMain, dialog, safeStorage, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { Worker } = require('node:worker_threads');
const crypto = require('node:crypto');
const { readLibrary, writeLibrary, importExecutable, candidateExecutables, inspectGame } = require('./core/library.cjs');
const { createSnapshot, listSnapshots, restoreSnapshot, unpackSaveDirectory } = require('./core/backups.cjs');
const { validateEndpoint, uploadLatest, downloadLatest } = require('./core/cloud.cjs');
const { profileFor } = require('./core/profiles.cjs');
const { importArtwork, artworkData } = require('./core/artwork.cjs');
const { verifiedDownload, validateDownload } = require('./core/verified-download.cjs');
const { collectCode } = require('./core/source-review.cjs');
const { networkReadiness } = require('./core/network.cjs');
const { ENGINES, SYSTEMS, importConsoleGame, buildLaunch, status: emulatorStatus, gpuGuidance } = require('./core/consoles.cjs');
const { createUpdateService } = require('./update-service.cjs');
const social = require('./core/social.cjs');
const {DEFAULT_ORIGIN,fetchPublicConfig}=require('./core/public-config.cjs');
const {catalogOrigin,supportLink,validateCatalogResponse}=require('./core/catalog.cjs');
let win;
let updates;
const gameSessions = new Set();
const activeDownloads = new Map();
let reviewPreview = null;
const stateEvent = (channel, payload) => { if (win && !win.isDestroyed()) win.webContents.send(channel, payload); };
const resolveFiles = () => ({
  library: path.join(app.getPath('userData'), 'games.json'),
  settings: path.join(app.getPath('userData'), 'settings.json'),
  backups: path.join(app.getPath('userData'), 'backups'),
  artwork: path.join(app.getPath('userData'), 'artwork'),
  downloads: path.join(app.getPath('downloads'), 'REVIVE')
});
const listGames = () => readLibrary(resolveFiles().library);
function selectedGame(id) {
  const game = listGames().find(g => g.id === id);
  if (!game) throw new Error('This game is not in your library.');
  return game;
}
function setGame(id, update) {
  const games = listGames().map(g => g.id === id ? { ...g, ...update } : g);
  writeLibrary(resolveFiles().library, games);
  return games.find(g => g.id === id);
}
function requireSecretSafe() {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('OS credential encryption is not available. Cloud passwords and tokens cannot be saved safely on this machine.');
}
function encryptedSave(value) {
  requireSecretSafe();
  return safeStorage.encryptString(value).toString('base64');
}
function encryptedLoad(value) {
  if (!value) return '';
  requireSecretSafe();
  return safeStorage.decryptString(Buffer.from(value, 'base64'));
}
function settings() {
  try { return JSON.parse(fs.readFileSync(resolveFiles().settings, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; }
}
function settingsPublic() {
  const s = settings();
  return { cloudUrl: s.cloudUrl || '', cloudUser: s.cloudUser || '', cloudReady: !!s.cloudSecret, aiUrl: s.aiUrl || '', aiReady: !!s.aiSecret, socialUrl: s.socialUrl || '', socialKeyReady: !!s.socialAnonKey, catalogUrl:s.catalogUrl||DEFAULT_ORIGIN, supportUrl:s.supportUrl||'', networkAuto:true };
}
function storeSettings(partial) {
  const old = settings();
  const next = { ...old };
  if ('catalogUrl' in partial)next.catalogUrl=catalogOrigin(partial.catalogUrl);
  if ('supportUrl' in partial)next.supportUrl=supportLink(partial.supportUrl);
  if ('cloudUrl' in partial) { if (partial.cloudUrl) validateEndpoint(partial.cloudUrl); next.cloudUrl = (partial.cloudUrl || '').trim(); }
  if ('cloudUser' in partial) next.cloudUser = (partial.cloudUser || '').trim();
  if ('cloudPassword' in partial && partial.cloudPassword) next.cloudSecret = encryptedSave(partial.cloudPassword);
  if ('aiUrl' in partial) { if (partial.aiUrl) validateEndpoint(partial.aiUrl); next.aiUrl = (partial.aiUrl || '').replace(/\/$/, ''); }
  if ('aiToken' in partial && partial.aiToken) next.aiSecret = encryptedSave(partial.aiToken);
  if ('socialUrl' in partial || 'socialAnonKey' in partial) {
    const url = (partial.socialUrl || next.socialUrl || '').trim();
    const key = (partial.socialAnonKey || next.socialAnonKey || '').trim();
    if (url || key) { const valid = social.validateSocialConfig({url,anonKey:key}); next.socialUrl=valid.url; next.socialAnonKey=valid.anonKey; }
  }
  fs.mkdirSync(path.dirname(resolveFiles().settings), { recursive: true });
  fs.writeFileSync(resolveFiles().settings, JSON.stringify(next, null, 2), { mode: 0o600 });
  return settingsPublic();
}
function cloudSettings() {
  const s = settings();
  if (!s.cloudUrl || !s.cloudUser || !s.cloudSecret) throw new Error('Configure WebDAV folder URL, username and password in Settings first.');
  return { url: s.cloudUrl, user: s.cloudUser, password: encryptedLoad(s.cloudSecret) };
}
let publicConfigCache=null;
async function socialConfig() {
 const s=settings();
 // Advanced users may explicitly use a different public Supabase project.
 if(s.socialUrl && s.socialAnonKey)return social.validateSocialConfig({url:s.socialUrl,anonKey:s.socialAnonKey});
 if(!publicConfigCache || Date.now()-publicConfigCache.at>300000){
   const value=await fetchPublicConfig();publicConfigCache={value,at:Date.now()};
 }
 return social.validateSocialConfig({url:publicConfigCache.value.socialUrl,anonKey:publicConfigCache.value.socialAnonKey});
}
function currentSocialSession() {
 const s=settings();
 if(!s.socialSession) throw Error('Sign in from Friends & Chat first.');
 return JSON.parse(encryptedLoad(s.socialSession));
}
function saveSocialSession(session) {
 const next=settings();next.socialSession=encryptedSave(JSON.stringify(session));
 fs.mkdirSync(path.dirname(resolveFiles().settings),{recursive:true});fs.writeFileSync(resolveFiles().settings,JSON.stringify(next,null,2),{mode:0o600});
}
async function socialAuth() {
 const c=await socialConfig();let session=currentSocialSession();
 if(Date.now() > session.expiresAt-60000) {
  const next=await social.refreshToken(c,session.refresh_token);
  session={access_token:next.access_token,refresh_token:next.refresh_token,user:next.user,expiresAt:Date.now()+next.expires_in*1000};
  saveSocialSession(session);
 }
 return {config:c,session};
}
function inspectAsync(game) {
  if (game.kind === 'emulated') {
    const found=fs.existsSync(game.exe);
    return Promise.resolve({title:game.title,exe:path.basename(game.exe),root:game.root,saveDir:game.saveDir,fileCount:found?1:0,observedBytes:found?fs.statSync(game.exe).size:0,extensions:{[path.extname(game.exe).toLowerCase()]:found?1:0},warnings:[...(!found?['Game image file missing.']:[]),...(!game.saveDir?['Save directory not selected.']:[])],notableFiles:[],exeSha256:null,notes:'Console image metadata only; REVIVE did not execute, decrypt or modify it. Large console files are not automatically hashed.'});
  }
  return new Promise((resolve,reject)=>{
    const worker=new Worker(path.join(__dirname,'workers/inspect.cjs'),{workerData:game});
    const timeout=setTimeout(()=>{worker.terminate();reject(Error('Game scan exceeded the 90-second time limit.'));},90000);
    worker.once('message',data=>{clearTimeout(timeout);data.ok?resolve(data.report):reject(Error(data.error));});
    worker.once('error',error=>{clearTimeout(timeout);reject(error);});
    worker.once('exit',code=>{if(code!==0){clearTimeout(timeout);reject(Error(`Game scan worker exited (${code}).`));}});
  });
}
function register() {
  ipcMain.handle('updates:status', () => updates.status());
  ipcMain.handle('updates:check', () => updates.check());
  ipcMain.handle('updates:install', () => updates.installNow());
  ipcMain.handle('cloud:connectionStatus',async()=>{
    const st=settings(),origin=catalogOrigin(st.catalogUrl||DEFAULT_ORIGIN);
    if(!origin)return {configured:false,services:{}};
    try {const response=await fetch(`${origin}/api/health`,{signal:AbortSignal.timeout(9000),redirect:'error'});
      if(!response.ok)throw Error(`HTTP ${response.status}`);
      const data=await response.json();return {configured:true,...data};
    }catch(error){return {configured:true,error:'Cloud endpoint unreachable: '+error.message,services:{}};}
  });
  ipcMain.handle('social:presence',async(_event,friendIds)=>{
    const st=settings(),origin=catalogOrigin(st.catalogUrl||DEFAULT_ORIGIN);
    if(!origin)return {configured:false,online:{}};
    const {session}=await socialAuth();
    const headers={Authorization:`Bearer ${session.access_token}`};
    const ping=await fetch(`${origin}/api/presence`,{method:'POST',headers,signal:AbortSignal.timeout(9000),redirect:'error'});
    if(!ping.ok)throw Error('Presence service unavailable. Configure Upstash in Vercel.');
    const clean=Array.isArray(friendIds)?friendIds.filter(x=>/^[a-f0-9-]{36}$/i.test(x)).slice(0,30):[];
    if(!clean.length)return {configured:true,online:{}};
    const query=new URLSearchParams({users:clean.join(',')});
    const result=await fetch(`${origin}/api/presence?${query}`,{headers,signal:AbortSignal.timeout(9000),redirect:'error'});
    if(!result.ok)throw Error('Friend online-status check failed.');
    const data=await result.json();return {configured:true,online:data.online||{}};
  });
  ipcMain.handle('social:signup',async(_e,email,password)=>social.signUp(await socialConfig(),email,password).then(x=>({needsVerification:!x?.access_token})));
  ipcMain.handle('social:signin',async(_e,email,password)=>{
    const r=await social.signIn(await socialConfig(),email,password);
    if(!r?.access_token || !r?.user?.id)throw Error('Sign in did not return a valid account. Verify your email.');
    saveSocialSession({access_token:r.access_token,refresh_token:r.refresh_token,user:r.user,expiresAt:Date.now()+r.expires_in*1000});
    return {id:r.user.id,email:r.user.email};
  });
  ipcMain.handle('social:signout',()=>{
    const s=settings();delete s.socialSession;
    fs.writeFileSync(resolveFiles().settings,JSON.stringify(s,null,2),{mode:0o600});return true;
  });
  ipcMain.handle('social:status',async()=>{
    const s=settings();try{await socialConfig();}catch(err){return {configured:false,signedIn:false,error:err.message};}
    if(!s.socialSession)return {configured:true,signedIn:false};
    try {const {config,session}=await socialAuth();const data=await social.snapshot(config,session.access_token,session.user.id);return {...data,configured:true,signedIn:true,id:session.user.id,email:session.user.email};}
    catch(err){return {configured:true,signedIn:false,error:err.message};}
  });
  ipcMain.handle('social:profile',async(_e,handle,display)=>{
    const {config,session}=await socialAuth();return social.updateProfile(config,session.access_token,session.user.id,handle,display);
  });
  ipcMain.handle('social:invite',async(_e,handle)=>{const {config,session}=await socialAuth();return social.invite(config,session.access_token,handle);});
  ipcMain.handle('social:respond',async(_e,id,accept)=>{const {config,session}=await socialAuth();return social.respond(config,session.access_token,id,accept);});
  ipcMain.handle('social:messages',async(_e,friendId)=>{const {config,session}=await socialAuth();return social.messages(config,session.access_token,session.user.id,friendId);});
  ipcMain.handle('social:send',async(_e,friendId,body)=>{const {config,session}=await socialAuth();return social.send(config,session.access_token,session.user.id,friendId,body);});
  ipcMain.handle('library:list', () => listGames());
  ipcMain.handle('emulation:status',()=>({engines:emulatorStatus(settings()),systems:SYSTEMS}));
  ipcMain.handle('emulation:gpu',async()=>{
    try {const data=await app.getGPUInfo('basic');
      const device=(data?.gpuDevice||[]).find(d=>[0x10de,0x1002,0x8086].includes(d.vendorId))||data?.gpuDevice?.[0]||{};
      return {name:device.deviceString||'',...gpuGuidance(device)};
    }catch{return gpuGuidance({});}
  });
  ipcMain.handle('emulation:chooseEngine',async(_e,id)=>{
    if(!Object.hasOwn(ENGINES,id))throw Error('Invalid emulator engine.');
    const chosen=await dialog.showOpenDialog(win,{title:`Select your installed ${ENGINES[id].label} executable`,properties:['openFile'],filters:[{name:'Windows application',extensions:['exe']}]});
    if(chosen.canceled)return null;
    const exe=fs.realpathSync(chosen.filePaths[0]);if(path.extname(exe).toLowerCase()!=='.exe'||!fs.statSync(exe).isFile())throw Error('Select a Windows .exe emulator application.');
    const next=settings();next.emulatorPaths={...(next.emulatorPaths||{}),[id]:exe};
    fs.mkdirSync(path.dirname(resolveFiles().settings),{recursive:true});fs.writeFileSync(resolveFiles().settings,JSON.stringify(next,null,2),{mode:0o600});
    return {id,path:exe};
  });
  ipcMain.handle('emulation:chooseCore',async(_e,system)=>{
    if(!Object.hasOwn(SYSTEMS,system)||SYSTEMS[system].engine!=='retroarch')throw Error('A RetroArch platform is required.');
    const chosen=await dialog.showOpenDialog(win,{title:`Choose installed Libretro core for ${SYSTEMS[system].label}`,properties:['openFile'],filters:[{name:'Windows Libretro core',extensions:['dll']}]});
    if(chosen.canceled)return null;
    const core=fs.realpathSync(chosen.filePaths[0]);if(path.extname(core).toLowerCase()!=='.dll'||!fs.statSync(core).isFile())throw Error('Select a .dll RetroArch core.');
    const next=settings();next.retroCores={...(next.retroCores||{}),[system]:core};fs.mkdirSync(path.dirname(resolveFiles().settings),{recursive:true});fs.writeFileSync(resolveFiles().settings,JSON.stringify(next,null,2),{mode:0o600});
    return {system,path:core};
  });
  ipcMain.handle('emulation:import',async(_e,platform)=>{
    if(!Object.hasOwn(SYSTEMS,platform))throw Error('Unsupported console.');
    const system=SYSTEMS[platform];
    const chosen=await dialog.showOpenDialog(win,{title:`Import your own ${system.label} game file`,properties:['openFile'],filters:[{name:`${system.label} content`,extensions:system.ext}]});
    if(chosen.canceled)return null;
    const result=importConsoleGame(chosen.filePaths[0],platform,listGames());
    if(!result.existed)writeLibrary(resolveFiles().library,result.games);
    return result.game;
  });
  ipcMain.handle('multiplayer:networkCheck',()=>networkReadiness());
  ipcMain.handle('library:profile', (_e, id) => { const g=selectedGame(id);return profileFor(g.compatibilityId||g.title); });
  ipcMain.handle('library:favorite', (_e, id) => { const g=selectedGame(id); return setGame(id,{favorite:!g.favorite}); });
  ipcMain.handle('library:artwork', async (_e,id) => {
    selectedGame(id);
    const selection=await dialog.showOpenDialog(win,{title:'Choose custom game artwork',properties:['openFile'],filters:[{name:'Image',extensions:['png','jpg','jpeg','webp']}]});
    if(selection.canceled)return null;
    const art=importArtwork(selection.filePaths[0],id,resolveFiles().artwork);
    return setGame(id,{art});
  });
  ipcMain.handle('library:artworkData',(_e,id) => { const g=selectedGame(id);return g.art?artworkData(g.art,resolveFiles().artwork):null; });
  ipcMain.handle('catalog:list',async()=>{
    const origin=catalogOrigin(settings().catalogUrl||DEFAULT_ORIGIN);
    if(!origin)throw Error('REVIVE cloud library is not reachable yet.');
    const response=await fetch(`${origin}/api/catalog`,{signal:AbortSignal.timeout(15000),redirect:'error'});
    const body=await response.json();if(!response.ok)throw Error(body.error||`Catalog HTTP ${response.status}`);
    return validateCatalogResponse(body);
  });
  ipcMain.handle('catalog:download',async(_event,id)=>{
    if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{2,55}$/.test(id))throw Error('Invalid catalog game.');
    const origin=catalogOrigin(settings().catalogUrl||DEFAULT_ORIGIN);if(!origin)throw Error('REVIVE cloud library is not reachable yet.');
    const response=await fetch(`${origin}/api/catalog-download?id=${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(15000),redirect:'error'});
    const item=await response.json();if(!response.ok)throw Error(item.error||`Catalog HTTP ${response.status}`);
    const validated=validateDownload(item,{allowSignedR2:true});
    const target=new URL(validated.url);
    if(target.protocol!=='https:' || !target.hostname.endsWith('.r2.cloudflarestorage.com'))throw Error('Unexpected download host; refusing transfer.');
    if(activeDownloads.size>=3)throw Error('Three downloads may run at once.');
    const jobId=crypto.randomUUID(),controller=new AbortController();activeDownloads.set(jobId,controller);
    const started=Date.now();let last=0;
    (async()=>{try{
      const result=await verifiedDownload({...validated,signedR2:true},resolveFiles().downloads,{signal:controller.signal,maxBytes:512*1024**3,resume:true,onProgress:p=>{
        const now=Date.now();if(now-last>180){last=now;stateEvent('download:changed',{id:jobId,status:'downloading',name:validated.fileName,...p,bytesPerSecond:Math.round(p.bytes/Math.max(1,(now-started)/1000))});}
      }});
      stateEvent('download:changed',{id:jobId,status:'complete',name:validated.fileName,cloudGame:id,...result});
    }catch(error){stateEvent('download:changed',{id:jobId,status:controller.signal.aborted?'cancelled':'error',name:validated.fileName,error:error.message});}
    finally{activeDownloads.delete(jobId)}})();
    return {id:jobId,name:validated.fileName};
  });
  ipcMain.handle('support:open',async()=>{
    const url=supportLink(settings().supportUrl);if(!url)throw Error('Configure your Stripe Payment Link in Settings.');
    await shell.openExternal(url);return true;
  });
  ipcMain.handle('download:start', async (_e,parameters) => {
    const descriptor=validateDownload(parameters);
    if(activeDownloads.size>=3) throw new Error('Three downloads may run at once.');
    const id=crypto.randomUUID(),controller=new AbortController();
    activeDownloads.set(id,controller);
    const launchedAt=Date.now();
    let lastProgress=0;
    (async()=>{
      try{
        const result=await verifiedDownload(descriptor,resolveFiles().downloads,{signal:controller.signal,onProgress: progress => {
          const elapsed=Math.max(.1,(Date.now()-launchedAt)/1000);
          const now=Date.now();if(now-lastProgress>=150){lastProgress=now;stateEvent('download:changed',{id,status:'downloading',name:descriptor.fileName,...progress,bytesPerSecond:Math.round(progress.bytes/elapsed)});}
        }});
        stateEvent('download:changed',{id,status:'complete',name:descriptor.fileName,...result});
      }catch(error){stateEvent('download:changed',{id,status:controller.signal.aborted?'cancelled':'error',name:descriptor.fileName,error:String(error.message||error)});}
      finally{activeDownloads.delete(id);}
    })();
    return {id,name:descriptor.fileName};
  });
  ipcMain.handle('download:cancel',(_e,id)=>{const c=activeDownloads.get(id);if(!c)return false;c.abort();return true;});
  ipcMain.handle('download:folder',()=>{fs.mkdirSync(resolveFiles().downloads,{recursive:true});return shell.openPath(resolveFiles().downloads);});
  ipcMain.handle('source:select', async()=>{
    const choice=await dialog.showOpenDialog(win,{title:'Choose REVIVE source directory (only text files will be previewed)',properties:['openDirectory']});
    if(choice.canceled)return null;
    reviewPreview=collectCode(choice.filePaths[0]);
    return {files:reviewPreview.files.map(f=>({path:f.path,chars:f.content.length})),totalChars:reviewPreview.totalChars,warning:reviewPreview.warning};
  });
  ipcMain.handle('source:review', async()=>{
    if(!reviewPreview?.files?.length)throw Error('Choose a source folder to review first.');
    const s=settings();if(!s.aiUrl||!s.aiSecret)throw Error('Configure the Vercel AI endpoint in Settings first.');
    const response=await fetch(`${s.aiUrl}/api/code-review`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${encryptedLoad(s.aiSecret)}`},body:JSON.stringify({files:reviewPreview.files}),signal:AbortSignal.timeout(60000),redirect:'error'});
    const data=await response.json();if(!response.ok)throw Error(data.error||`AI HTTP ${response.status}`);
    return data.review;
  });
  ipcMain.handle('library:chooseExe', async () => {
    const choice = await dialog.showOpenDialog(win, { title: 'Select a game executable you own', properties: ['openFile'], filters: [{ name: 'Windows Games', extensions: ['exe'] }] });
    if (choice.canceled) return null;
    const result = importExecutable(choice.filePaths[0], listGames());
    if (!result.existed) writeLibrary(resolveFiles().library, result.games);
    return result.game;
  });
  ipcMain.handle('library:scanFolder', async () => {
    const choice = await dialog.showOpenDialog(win, { title: 'Scan your installed game folder', properties: ['openDirectory'] });
    if (choice.canceled) return [];
    return candidateExecutables(choice.filePaths[0]).map(exe => ({ exe, name: path.basename(exe) }));
  });
  ipcMain.handle('library:addCandidate', (_e, exe) => {
    const result = importExecutable(exe, listGames());
    if (!result.existed) writeLibrary(resolveFiles().library, result.games);
    return result.game;
  });
  ipcMain.handle('library:remove', (_e, id) => {
    selectedGame(id);
    writeLibrary(resolveFiles().library, listGames().filter(g => g.id !== id));
    return true; // removes launcher entry only, never game files
  });
  ipcMain.handle('library:rename', (_e, id, title) => {
    if (typeof title !== 'string' || !title.trim() || title.length > 100) throw new Error('Enter a game name (1–100 characters).');
    selectedGame(id);
    return setGame(id, { title: title.trim() });
  });
  ipcMain.handle('library:inspect', (_e, id) => inspectAsync(selectedGame(id)));
  ipcMain.handle('library:reveal', (_e, id) => shell.showItemInFolder(selectedGame(id).exe));
  ipcMain.handle('library:play', async (_e, id) => {
    const game = selectedGame(id);
    if (!fs.existsSync(game.exe)) throw new Error('Game file missing. Please import again.');
    const launch=game.kind==='emulated'?buildLaunch(game,settings()):{command:game.exe,args:[],cwd:game.root};
    const started = Date.now();
    stateEvent('game:session',{id,status:'starting'});
    const child = spawn(launch.command, launch.args, { cwd: launch.cwd, shell: false, windowsHide: false, stdio: 'ignore' });
    const launched = await new Promise((resolve, reject) => {
      child.once('spawn', () => resolve(true));
      child.once('error', reject);
    });
    child.once('exit', () => {
      gameSessions.delete(child.pid);
      stateEvent('game:session',{id,status:'stopped'});
      const current = listGames().find(g => g.id === id);
      if (current) setGame(id, { minutes: (current.minutes || 0) + Math.max(1, Math.round((Date.now() - started) / 60000)) });
      if (win && !win.isDestroyed()) win.webContents.send('library:changed');
    });
    gameSessions.add(child.pid);
    setGame(id,{lastPlayedAt:new Date().toISOString()});
    stateEvent('game:session',{id,status:'playing'});
    return launched;
  });
  ipcMain.handle('save:chooseDirectory', async (_e, id) => {
    selectedGame(id);
    const choice = await dialog.showOpenDialog(win, { title: 'Select this game’s save data directory', properties: ['openDirectory'] });
    if (choice.canceled) return null;
    return setGame(id, { saveDir: fs.realpathSync(choice.filePaths[0]) });
  });
  ipcMain.handle('save:list', (_e, id) => listSnapshots(selectedGame(id), resolveFiles().backups));
  ipcMain.handle('save:backup', (_e, id) => createSnapshot(selectedGame(id), resolveFiles().backups));
  ipcMain.handle('save:restore', (_e, id, name) => restoreSnapshot(selectedGame(id), resolveFiles().backups, name));
  ipcMain.handle('cloud:upload', async (_e, id) => {
    const game = selectedGame(id);
    const snapshot = createSnapshot(game, resolveFiles().backups);
    return uploadLatest(cloudSettings(), id, snapshot.file);
  });
  ipcMain.handle('cloud:restore', async (_e, id) => {
    const game = selectedGame(id);
    if (!game.saveDir || !fs.existsSync(game.saveDir)) throw new Error('Set an existing save directory before restoring.');
    const buf = await downloadLatest(cloudSettings(), id);
    // Save fetched blob to locally tracked snapshot; restore creates a safety backup first.
    const folder = path.join(resolveFiles().backups, id);
    fs.mkdirSync(folder, { recursive: true });
    const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}.revive`;
    fs.writeFileSync(path.join(folder, filename), buf, { flag: 'wx' });
    return restoreSnapshot(game, resolveFiles().backups, filename);
  });
  ipcMain.handle('settings:get', settingsPublic);
  ipcMain.handle('settings:save', (_e, partial) => storeSettings(partial));
  ipcMain.handle('ai:diagnose', async (_e, id) => {
    const game = selectedGame(id);
    const s = settings();
    if (!s.aiUrl || !s.aiSecret) throw new Error('Configure your REVIVE cloud API URL and owner token in Settings.');
    const report = await inspectAsync(game);
    const response = await fetch(`${s.aiUrl}/api/diagnose`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${encryptedLoad(s.aiSecret)}` }, body: JSON.stringify({ report }), signal: AbortSignal.timeout(40000), redirect: 'error' });
    let json = {};
    try { json = await response.json(); } catch {}
    if (!response.ok) throw new Error(json.error || `AI server HTTP ${response.status}`);
    return json.advice || 'No advice returned.';
  });
}
app.whenReady().then(() => {
  updates = createUpdateService({ app, sessions:gameSessions, emit: state => stateEvent('updates:state', state) });
  register();
  win = new BrowserWindow({ width: 1440, height: 900, minWidth: 960, minHeight: 650, backgroundColor: '#080a0e', title: 'REVIVE', autoHideMenuBar: true, titleBarStyle: 'hidden', titleBarOverlay: {color:'#090b10',symbolColor:'#a5adc1',height:42}, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  win.webContents.setWindowOpenHandler(({url})=>{
    try{const parsed=new URL(url);if(parsed.protocol==='https:'&&['www.nexusmods.com','www.xbox.com','steamdb.info','www.retroarch.com','retroarch.com','www.duckstation.org','duckstation.org','pcsx2.net','www.pcsx2.net','rpcs3.net','www.rpcs3.net','xemu.app','www.xemu.app','dolphin-emu.org','www.dolphin-emu.org','buy.stripe.com','donate.stripe.com'].includes(parsed.hostname))shell.openExternal(url);}catch{}
    return {action:'deny'};
  });
  win.webContents.on('will-navigate',(event)=>event.preventDefault());
  win.loadFile(path.join(__dirname, '../ui/index.html'));
  win.webContents.once('did-finish-load', () => updates.start());
});
app.on('before-quit', () => updates?.stop());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
