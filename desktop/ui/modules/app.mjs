import {replaceIcons} from './icons.mjs';
import {updateDock} from './updates.mjs';
import {escapeHTML as esc} from './format.mjs';
import {libraryView} from '../views/library.mjs';
import {gameView} from '../views/game.mjs';
import {multiplayerView} from '../views/multiplayer.mjs';
import {friendsView} from '../views/friends.mjs';
import {catalogView} from '../views/catalog.mjs';
import {supportView} from '../views/support.mjs';
import {consolesView} from '../views/consoles.mjs';
import {downloadsView} from '../views/downloads.mjs';
import {savesView} from '../views/saves.mjs';
import {diagnosticsView} from '../views/diagnostics.mjs';
import {settingsView} from '../views/settings.mjs';
const native=window.revive||null;
const $=selector=>document.querySelector(selector);
const previewGames=[{id:'demo-blur',title:'Blur',exe:'C:\\Games\\Blur\\Blur.exe',root:'C:\\Games\\Blur',minutes:169,saveDir:null,favorite:true,lastPlayedAt:'2026-10-08T17:30:00',addedAt:'2026-10-06T12:00:00'},{id:'demo-sunset',title:'Sunset Overdrive',exe:'C:\\Games\\Sunset Overdrive\\Sunset.exe',root:'C:\\Games\\Sunset Overdrive',minutes:62,saveDir:null,addedAt:'2026-10-07T12:00:00'},{id:'demo-arcade',title:'Your next classic',exe:'C:\\Games\\NextGame\\Game.exe',root:'C:\\Games\\NextGame',minutes:0,saveDir:null,addedAt:'2026-10-08T12:00:00'}];
const s={native:!!native,version:'1.2.0',games:[],view:'library',selected:null,search:'',filter:'all',sort:'added',platform:'all',artwork:{},downloads:{},snapshots:[],report:null,advice:'',review:null,sourcePreview:null,networkReport:null,cloudConfig:{},running:null,runningGames:[],work:false,emulators:null,gpu:null,update:{phase:'development',version:'1.2.0',enabled:false},social:null,socialFriend:null,socialMessages:[],socialPresence:{},presenceCheckedAt:0,connectionStatus:null,catalog:[],catalogError:''};
try{const saved=JSON.parse(localStorage.getItem('revive.library.preferences')||'{}');if(['added','az','recent','playtime'].includes(saved.sort))s.sort=saved.sort;if(['all','pc','console'].includes(saved.platform))s.platform=saved.platform;}catch{}
function saveLibraryPreferences(){try{localStorage.setItem('revive.library.preferences',JSON.stringify({sort:s.sort,platform:s.platform}));}catch{}}
const pages={library:libraryView,game:gameView,consoles:consolesView,friends:friendsView,catalog:catalogView,support:supportView,multiplayer:multiplayerView,downloads:downloadsView,saves:savesView,diagnostics:diagnosticsView,settings:settingsView};
const aliases={library:'LIBRARY',game:'GAME HUB',consoles:'CONSOLES',friends:'FRIENDS & CHAT',catalog:'CLOUD LIBRARY',support:'SUPPORT REVIVE',multiplayer:'MULTIPLAYER',downloads:'DOWNLOADS',saves:'CLOUD SAVES',diagnostics:'AI LAB',settings:'SETTINGS'};
function toast(message,kind='success'){
 const holder=$('#toast-stack'),element=document.createElement('div');element.className=`toast-item ${kind}`;element.setAttribute('role','status');const glyph=document.createElement('span');glyph.textContent=kind==='error'?'!':'✦';const copy=document.createElement('span');copy.textContent=message;element.append(glyph,copy);holder.append(element);requestAnimationFrame(()=>element.classList.add('visible'));setTimeout(()=>{element.classList.remove('visible');setTimeout(()=>element.remove(),280)},4800);
}
async function call(method,...args){if(!native||typeof native[method]!=='function')throw Error('Preview mode: run the Windows desktop application to use this feature.');return native[method](...args);}
function selectGame(){return s.games.find(g=>g.id===s.selected)||null;}
async function refreshLibrary(){s.games=native?await native.listGames():previewGames;if(!selectGame())s.selected=s.games[0]?.id||null;for(const game of s.games){if(native&&game.art&&!s.artwork[game.id]){try{s.artwork[game.id]=await native.artworkData(game.id);}catch{}}}render();}
function render({retainScroll=false}={}){
 const content=$('#content'),scroll=content.scrollTop;
 $('#pageLabel').textContent=aliases[s.view]||'LIBRARY';
 document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===s.view||(s.view==='game'&&el.dataset.view==='library')));
 document.querySelector('.top-search')?.classList.toggle('highlighted',!!s.search);
 content.innerHTML=(pages[s.view]||libraryView)(s);
 content.classList.remove('enter');if(!retainScroll){void content.offsetWidth;content.classList.add('enter');}
 if(retainScroll)content.scrollTop=scroll;else content.scrollTop=0;
 $('#downloadCount').textContent=Object.values(s.downloads).filter(j=>['queued','downloading'].includes(j.status)).length||'';
 $('#updateDock').innerHTML=updateDock(s.update);
 $('#footerInfo').textContent=`REVIVE ${s.version} · ${native?'DESKTOP':'INTERACTIVE DESIGN PREVIEW'}`;
}
async function setView(view,{retainScroll=false}={}){
 if(!pages[view])return;
 s.view=view;
 if(view==='downloads'&&native){const list=await call('listDownloads');s.downloads=Object.fromEntries(list.map(job=>[job.id,job]));}
 if(view==='settings'){s.cloudConfig=native?await call('settings'):{};s.connectionStatus=native?await call('connectionStatus'):null;}
 if(view==='catalog'&&native){try{s.catalog=await call('catalogList');s.catalogError='';}catch(error){s.catalogError=error.message;s.catalog=[];}}
 if(view==='consoles'&&native){[s.emulators,s.gpu]=await Promise.all([call('emulatorStatus'),call('gpuStatus')]);}
 if(view==='saves')await refreshBackups();
 if(view==='friends' && native) await refreshFriends({repaint:false});
 render({retainScroll});
}
async function refreshBackups(){const g=selectGame();s.snapshots=g&&native?await call('listBackups',g.id):[];}
async function refreshFriends({repaint=true}={}){
 if(!native)return;
 const next=await call('socialStatus');s.social=next;
 if(next.friends?.length && (!s.socialFriend||!next.friends.some(x=>x.other.id===s.socialFriend)))s.socialFriend=next.friends[0].other.id;
 if(!next.signedIn){s.socialFriend=null;s.socialPresence={};s.presenceCheckedAt=0;}
 if(next.signedIn && Date.now()-s.presenceCheckedAt>45000) {
  s.presenceCheckedAt=Date.now();
  try{const presence=await call('socialPresence',(next.friends||[]).map(x=>x.other.id));s.socialPresence=presence.online||{};}
  catch{ s.socialPresence={}; } // Social remains usable if Vercel/Upstash is not connected.
 }
 if(next.signedIn&&s.socialFriend)s.socialMessages=await call('socialMessages',s.socialFriend);
 if(repaint&&s.view==='friends') {render({retainScroll:true});const sc=$('#messageScroll');if(sc)sc.scrollTop=sc.scrollHeight;}
}
function showModal(markup){const el=$('#modal');el.innerHTML=`<div class="modal-card">${markup}</div>`;el.classList.remove('hidden');const b=el.querySelector('button');b?.focus();}
function closeModal(){$('#modal').classList.add('hidden');$('#modal').innerHTML='';}
function confirmAction(title,description,handler,button='Continue'){
 showModal(`<div class="modal-head"><span class="modal-kicker">CONFIRM ACTION</span><h2>${esc(title)}</h2><p>${esc(description)}</p></div><div class="modal-footer"><button class="btn subtle" data-action="close-modal">Cancel</button><button class="btn primary" data-action="confirm-modal">${esc(button)}</button></div>`);
 s.modalAction=handler;
}
async function performAction(e){
 const target=e.target.closest('[data-action],[data-view]');if(!target)return;
 if(target.dataset.view){await setView(target.dataset.view);return;}
 const action=target.dataset.action,g=selectGame(),id=g?.id;
 try{
  switch(action){
   case 'cloud-health':s.connectionStatus=await call('connectionStatus');render({retainScroll:true});toast('Cloud connection status refreshed.');return;
   case 'catalog-refresh': await setView('catalog',{retainScroll:true});toast('Catalog refreshed.');return;
   case 'catalog-download':{const job=await call('catalogDownload',target.dataset.id);s.downloads[job.id]={...job,...s.downloads[job.id]};await setView('downloads');toast('Cloud game download started.');return;}
   case 'support-open': await call('openSupport');return;
   case 'update-check':s.update=await call('checkUpdates');render({retainScroll:true});return;
   case 'update-restart':await call('installUpdate');return;
   case 'library':case 'catalog':case 'support':case 'consoles':case 'friends':case 'multiplayer':case 'downloads':case 'saves':case 'diagnostics':case 'settings': await setView(action);return;
   case 'focus-search':await setView('library');$('#search')?.focus();return;
   case 'filter':s.filter=target.dataset.filter;render({retainScroll:true});return;
   case 'clear-filters':s.search='';s.filter='all';s.platform='all';saveLibraryPreferences();render({retainScroll:true});return;
   case 'select-game':s.selected=target.dataset.id;await setView('game');return;
   case 'select-tool-game':s.selected=target.dataset.id;s.report=null;s.advice='';await refreshBackups();render({retainScroll:true});return;
   case 'close-modal':closeModal();return;
   case 'confirm-modal':{const fn=s.modalAction;closeModal();s.modalAction=null;await fn?.();return;}
   case 'friends-refresh':await refreshFriends();toast('Friends synced.');return;
   case 'select-friend':s.socialFriend=target.dataset.id;s.socialMessages=await call('socialMessages',s.socialFriend);render({retainScroll:true});{const sc=$('#messageScroll');if(sc)sc.scrollTop=sc.scrollHeight;}return;
   case 'friend-accept':await call('socialRespond',target.dataset.request,true);await refreshFriends();toast('Friend request accepted.');return;
   case 'friend-decline':await call('socialRespond',target.dataset.request,false);await refreshFriends();toast('Request declined.');return;
   case 'social-signout':await call('socialSignOut');s.socialFriend=null;s.socialMessages=[];await refreshFriends();toast('Signed out.');return;
   case 'emulator-refresh':s.emulators=await call('emulatorStatus');render({retainScroll:true});return;
   case 'gpu-refresh':s.gpu=await call('gpuStatus');render({retainScroll:true});toast('GPU inspection complete.');return;
   case 'emulator-config':{const id=target.dataset.engine;const r=await call('configureEmulator',id);if(r){s.emulators=await call('emulatorStatus');render({retainScroll:true});toast(`${id} linked.`);}return;}
   case 'emulator-core':{const id=target.dataset.platform;const r=await call('configureCore',id);if(r){s.emulators=await call('emulatorStatus');render({retainScroll:true});toast(`${id} core linked.`);}return;}
   case 'console-import':{const platform=target.dataset.platform;const game=await call('importConsole',platform);if(game){s.selected=game.id;await refreshLibrary();await setView('game');toast(`${game.title} imported. Link its emulator on Consoles if needed.`);}return;}
   case 'import-exe':{
    const game=await call('importExe');if(game){s.selected=game.id;await refreshLibrary();await setView('game');toast(`${game.title} added to your collection.`)}return;
   }
   case 'scan-folder':{
    const list=await call('scanFolder');s.candidates=list;
    showModal(`<div class="modal-head"><span class="modal-kicker">IMPORT GAME FOLDER</span><h2>Choose an executable</h2><p>Detected candidates from your local folder. Ignore installers or unrelated tools.</p></div><div class="candidate-list">${list.length?list.map((x,i)=>`<div class="candidate"><div><strong>${esc(x.name)}</strong><p>${esc(x.exe)}</p></div><button class="btn primary small" data-action="import-candidate" data-index="${i}">Import</button></div>`).join(''):'<p class="modal-empty">No likely game executables found.</p>'}</div><div class="modal-footer"><button class="btn subtle" data-action="close-modal">Close</button></div>`);return;
   }
   case 'import-candidate':{const candidate=s.candidates?.[Number(target.dataset.index)];if(!candidate)return;const game=await call('importCandidate',candidate.exe);closeModal();s.selected=game.id;await refreshLibrary();await setView('game');toast(`${game.title} added.`);return;}
   case 'play':case 'play-recent':await call('launchGame',action==='play-recent'?target.dataset.id:id);toast('Launching game…');await refreshLibrary();return;
   case 'favorite':await call('toggleFavorite',id);await refreshLibrary();render({retainScroll:true});return;
   case 'artwork':{const updated=await call('selectArtwork',id);if(updated){s.artwork[id]=await call('artworkData',id);await refreshLibrary();render({retainScroll:true});toast('Custom game artwork saved.');}return;}
   case 'reveal':await call('reveal',id);return;
   case 'rename':{const old=g.title;showModal(`<div class="modal-head"><span class="modal-kicker">LIBRARY</span><h2>Rename game</h2><p>Change the library label, not the original files.</p></div><form id="renameForm"><label class="modal-label">Game name<input name="name" value="${esc(old)}" maxlength="100" required autofocus></label><div class="modal-footer"><button type="button" data-action="close-modal" class="btn subtle">Cancel</button><button class="btn primary" type="submit">Save name</button></div></form>`);$('#renameForm input')?.focus();return;}
   case 'remove':confirmAction('Remove this game?',`Remove ${g.title} from REVIVE? Its original game files will remain untouched.`,async()=>{await call('removeGame',id);await refreshLibrary();await setView('library');toast('Game removed from the launcher.');},'Remove entry');return;
   case 'pick-save':{const updated=await call('pickSaveDir',id);if(updated){await refreshLibrary();await setView(s.view);toast('Save directory connected.');}return;}
   case 'backup':{const result=await call('backup',id);await refreshBackups();render({retainScroll:true});toast(`Backup created (${Math.round(result.bytes/1024)} KB)`);return;}
   case 'restore':{const snapshot=target.dataset.name;confirmAction('Restore save snapshot?', 'Close the game before restoring. REVIVE will first protect your current save as a safety backup.',async()=>{const count=await call('restore',id,snapshot);await refreshBackups();render({retainScroll:true});toast(`Restored ${count} save files.`)},'Restore snapshot');return;}
   case 'cloud-upload':{const result=await call('cloudUpload',id);await refreshBackups();render({retainScroll:true});toast(`Cloud backup uploaded (${Math.round(result.bytes/1024)} KB).`);return;}
   case 'cloud-restore':confirmAction('Restore cloud backup?', 'This overwrites matching save files after creating a local safety backup. Close the game first.',async()=>{const n=await call('cloudRestore',id);await refreshBackups();render({retainScroll:true});toast(`Restored ${n} files from cloud.`)},'Restore cloud');return;
   case 'inspect':s.report=await call('inspectGame',id);s.advice=null;await setView('diagnostics',{retainScroll:true});toast('Static inspection complete.');return;
   case 'ask-ai':toast('Requesting AI diagnostics…');s.advice=await call('aiDiagnose',id);s.report=s.report||await call('inspectGame',id);await setView('diagnostics',{retainScroll:true});toast('AI analysis complete.');return;
   case 'source-select':s.sourcePreview=await call('selectSource');s.review=null;render({retainScroll:true});return;
   case 'source-review':if(!s.sourcePreview)return;confirmAction('Send code excerpts to AI?',`Send ${s.sourcePreview.files.length} text files to your configured AI endpoint? Automated secret detection is not comprehensive; review the selected folder first.`,async()=>{s.review=await call('reviewSource');render({retainScroll:true});toast('AI code review complete.');},'Send code to AI');return;
   case 'network-check':s.networkReport=await call('checkNetwork');render({retainScroll:true});toast('Network adapter scan complete.');return;
   case 'open-downloads':await call('openDownloads');return;
   case 'cancel-download':await call('cancelDownload',target.dataset.id);return;
   case 'pause-download':await call('pauseDownload',target.dataset.id);return;
   case 'retry-download':{const job=await call('retryDownload',target.dataset.id);s.downloads[job.id]={...job,...s.downloads[job.id]};render({retainScroll:true});return;}
   case 'reveal-download':await call('revealDownload',target.dataset.id);return;
   case 'clear-downloads':{const jobs=await call('clearFinishedDownloads');s.downloads=Object.fromEntries(jobs.map(job=>[job.id,job]));render({retainScroll:true});toast('Finished entries cleared. Downloaded files are still saved.');return;}
  }
 }catch(err){toast(err?.message||String(err),'error');}
}
document.addEventListener('click',e=>{performAction(e).catch(err=>toast(err.message||String(err),'error'));});
document.addEventListener('input',e=>{if(e.target.id==='search'){s.search=e.target.value;const cursor=e.target.selectionStart;render({retainScroll:true});const input=$('#search');input?.focus();input?.setSelectionRange(cursor,cursor);}});
document.addEventListener('change',e=>{if(['sort','platform'].includes(e.target.id)){s[e.target.id]=e.target.value;saveLibraryPreferences();render({retainScroll:true});}});
document.addEventListener('submit',async e=>{
 const id=e.target.id;if(!['cloudForm','aiForm','downloadForm','renameForm','socialSettingsForm','catalogSettingsForm','socialAuthForm','friendInviteForm','messageForm','profileForm'].includes(id))return;e.preventDefault();const body=Object.fromEntries(new FormData(e.target).entries());
 const submitter=e.submitter?.value;
 try{
  if(id==='socialAuthForm'){
   if(submitter==='signup'){const response=await call('socialSignUp',body.email,body.password);toast(response.needsVerification?'Account created. Check your email to verify before signing in.':'Account created. Sign in to continue.');}
   else {await call('socialSignIn',body.email,body.password);await refreshFriends();toast('Connected to REVIVE Social.');}
   return;
  }
  if(id==='friendInviteForm'){await call('socialInvite',body.handle.replace(/^@/,''));await refreshFriends();toast('Friend invitation sent.');return;}
  if(id==='messageForm'){if(!s.socialFriend)return;await call('socialSend',s.socialFriend,body.body);s.socialMessages=await call('socialMessages',s.socialFriend);render({retainScroll:true});const sc=$('#messageScroll');if(sc)sc.scrollTop=sc.scrollHeight;return;}
  if(id==='profileForm'){await call('socialProfile',body.handle,body.display);await refreshFriends();toast('Profile saved.');return;}
  if(id==='renameForm'){const g=selectGame();await call('renameGame',g.id,body.name);closeModal();await refreshLibrary();render();toast('Game renamed.');return;}
  if(id==='downloadForm'){const job=await call('startDownload',body);s.downloads[job.id]={...job,...s.downloads[job.id]};await setView('downloads',{retainScroll:true});toast('Verified download queued.');return;}
  s.cloudConfig=await call('saveSettings',body);toast('Preferences saved securely.');render({retainScroll:true});
 }catch(err){toast(err?.message||String(err),'error')}
});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setView('library').then(()=>$('#search')?.focus());return;}
 if(e.key==='Escape'){if(!$('#modal').classList.contains('hidden'))closeModal();else if(s.search){s.search='';render();}}
 if(e.altKey&&e.key==='ArrowLeft'){e.preventDefault();setView('library');}
 if(e.ctrlKey&&['1','2','3','4','5','6','7'].includes(e.key)){e.preventDefault();setView(({1:'library',2:'multiplayer',3:'downloads',4:'saves',5:'consoles',6:'friends',7:'catalog'})[e.key]);}
});
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
if(native){
 native.onUpdateState(data=>{const old=s.update?.phase;s.update=data;$('#updateDock').innerHTML=updateDock(data);if(s.view==='settings')render({retainScroll:true});if(data.phase==='ready'&&old!=='ready')toast('REVIVE update downloaded. It installs when you exit.');});
 native.updateStatus().then(data=>{s.update=data;$('#updateDock').innerHTML=updateDock(data);if(s.view==='settings')render({retainScroll:true});}).catch(err=>console.warn('Update status unavailable',err));
 native.onLibraryChanged(()=>refreshLibrary().catch(err=>toast(err.message,'error')));
 native.onGameSession(data=>{s.runningGames=s.runningGames.filter(id=>id!==data.id);if(['starting','playing'].includes(data.status))s.runningGames.push(data.id);s.running=s.runningGames[0]||null;const label=data.status==='playing'?'Game launched':data.status==='stopped'?'Game session ended':null;if(label)toast(label);if(['game','library'].includes(s.view))render({retainScroll:true});});
 native.onDownloadChanged(data=>{s.downloads[data.id]={...(s.downloads[data.id]||{}),...data};$('#downloadCount').textContent=Object.values(s.downloads).filter(j=>['queued','downloading'].includes(j.status)).length||'';if(s.view==='downloads'&&!document.activeElement?.closest('#downloadForm'))render({retainScroll:true});if(data.status==='complete')toast(`${data.name} verified and saved.`);if(data.status==='error')toast(`${data.name}: ${data.error}`,'error');});
}
replaceIcons();
async function initialize(){if(native){const [info,jobs]=await Promise.all([call('appInfo'),call('listDownloads')]);s.version=info.version;s.runningGames=info.runningGames;s.downloads={...Object.fromEntries(jobs.map(job=>[job.id,job])),...s.downloads};}await refreshLibrary();}
initialize().catch(err=>toast(err.message,'error'));
setTimeout(()=>document.querySelector('#boot')?.classList.add('fade'),330);
setTimeout(()=>document.querySelector('#boot')?.remove(),850);

// Social beta refreshes only while the Friends screen is active; don't interrupt draft messages.
setInterval(async()=>{if(!native||s.view!=='friends'||document.activeElement?.closest('#messageForm,#friendInviteForm,#socialAuthForm'))return;try{await refreshFriends();}catch(e){console.warn('REVIVE social refresh:',e.message);}},10000);

// Keep online presence refreshed while the application is open, not only on Friends & Chat.
// A failed or unconfigured cloud provider never prevents local games from working.
if(native){
 const presenceHeartbeat=async()=>{
   try{const state=await call('socialStatus');if(state?.signedIn)await call('socialPresence',[]);}catch{}
 };
 setTimeout(presenceHeartbeat,3000);
 setInterval(presenceHeartbeat,70000);
}
