'use strict';
/** REVIVE controls existing user-installed emulator processes; it does not ship emulator binaries or console files. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ENGINES = Object.freeze({
  retroarch:{label:'RetroArch', url:'https://www.retroarch.com/', description:'Install the matching Libretro core in RetroArch first.'},
  duckstation:{label:'DuckStation',url:'https://www.duckstation.org/',description:'PS1 emulator; firmware may be required.'},
  pcsx2:{label:'PCSX2',url:'https://pcsx2.net/',description:'PS2 emulator; provide legitimately obtained BIOS separately.'},
  rpcs3:{label:'RPCS3',url:'https://rpcs3.net/',description:'PS3 emulator; import a compatible EBOOT.BIN from your own game. Compatibility varies.'},
  xemu:{label:'xemu',url:'https://xemu.app/',description:'Original Xbox; independently configure legally obtained system files.'},
  dolphin:{label:'Dolphin',url:'https://dolphin-emu.org/',description:'GameCube / Wii emulator.'}
});
const SYSTEMS = Object.freeze({
  gb:{label:'Game Boy',engine:'retroarch',ext:['gb']},
  gbc:{label:'Game Boy Color',engine:'retroarch',ext:['gbc']},
  gba:{label:'Game Boy Advance',engine:'retroarch',ext:['gba']},
  nes:{label:'NES',engine:'retroarch',ext:['nes']},
  snes:{label:'Super Nintendo',engine:'retroarch',ext:['sfc','smc']},
  genesis:{label:'Sega Genesis',engine:'retroarch',ext:['md','gen','bin']},
  n64:{label:'Nintendo 64',engine:'retroarch',ext:['n64','z64','v64']},
  ps1:{label:'PlayStation 1',engine:'duckstation',ext:['cue','chd','iso','pbp','m3u']},
  ps2:{label:'PlayStation 2',engine:'pcsx2',ext:['iso','chd','cso','gz']},
  ps3:{label:'PlayStation 3',engine:'rpcs3',ext:['bin'],basename:'EBOOT.BIN'},
  xbox:{label:'Original Xbox',engine:'xemu',ext:['iso']},
  gamecube:{label:'GameCube',engine:'dolphin',ext:['iso','rvz','gcm','gcz','wia']},
  wii:{label:'Nintendo Wii',engine:'dolphin',ext:['iso','rvz','wbfs','wia']}
});
function assertPlatform(platform){if(!Object.hasOwn(SYSTEMS,platform))throw Error('Unsupported console system.');return SYSTEMS[platform];}
function validateContent(file,platform){
  const system=assertPlatform(platform);
  if(typeof file!=='string'||!file.trim())throw Error('Select a game file.');
  if(!system.ext.includes(path.extname(file).slice(1).toLowerCase()))throw Error(`Unsupported ${system.label} game format. Accepted: ${system.ext.join(', ')}`);
  if(system.basename&&path.basename(file).toUpperCase()!==system.basename)throw Error(`Select ${system.basename} for ${system.label}.`);
  const real=fs.realpathSync(file);
  if(!fs.statSync(real).isFile())throw Error('The game path must be a regular file.');
  return real;
}
function importConsoleGame(file,platform,games){
  const real=validateContent(file,platform),system=SYSTEMS[platform];
  const found=games.find(g=>g.kind==='emulated'&&g.platform===platform&&g.exe.toLowerCase()===real.toLowerCase());
  if(found)return {game:found,games,existed:true};
  const title=system.basename?path.basename(path.dirname(real)):path.basename(real,path.extname(real)).replace(/[_-]/g,' ').trim();
  const game={id:crypto.randomUUID(),title,kind:'emulated',platform,emulatorId:system.engine,exe:real,root:path.dirname(real),saveDir:null,addedAt:new Date().toISOString(),minutes:0};
  return {game,games:[game,...games],existed:false};
}
function buildLaunch(game,config,exists=fs.existsSync){
  if(game.kind!=='emulated')throw Error('This entry is not an emulated game.');
  const system=assertPlatform(game.platform);
  if(!exists(game.exe))throw Error('Game image is missing. Reimport it.');
  const command=config.emulatorPaths?.[system.engine];
  if(!command||!exists(command))throw Error(`Configure the ${ENGINES[system.engine].label} executable in Consoles first.`);
  if(path.extname(command).toLowerCase()!=='.exe')throw Error('Select a Windows emulator .exe file.');
  let args;
  switch(system.engine){
    case 'retroarch':{
      const core=config.retroCores?.[game.platform];
      if(!core||!exists(core))throw Error(`Configure a RetroArch core (.dll) for ${system.label} in Consoles.`);
      if(path.extname(core).toLowerCase()!=='.dll')throw Error('RetroArch core must be a .dll file on Windows.');
      args=['-L',core,game.exe];break;
    }
    case 'duckstation':args=['-batch','-fullscreen','--',game.exe];break;
    case 'pcsx2':args=['-batch','-fullscreen','--',game.exe];break;
    case 'rpcs3':args=['--no-gui',game.exe];break;
    case 'xemu':args=['-full-screen','-dvd_path',game.exe];break;
    case 'dolphin':args=['--batch','--exec',game.exe];break;
    default:throw Error('Emulator engine not supported.');
  }
  return {command,args,cwd:path.dirname(command),engine:system.engine};
}
function status(config,exists=fs.existsSync){
  return Object.entries(ENGINES).map(([id,engine])=>({id,...engine,configured:!!(config.emulatorPaths?.[id]&&exists(config.emulatorPaths[id])),path:config.emulatorPaths?.[id]||'',systems:Object.entries(SYSTEMS).filter(([,x])=>x.engine===id).map(([key,x])=>({id:key,label:x.label,coreConfigured:id==='retroarch'?!!(config.retroCores?.[key]&&exists(config.retroCores[key])):true}))}));
}
function gpuGuidance(gpu){const vendor=Number(gpu?.vendorId??0);const name=vendor===0x10de?'NVIDIA':vendor===0x1002?'AMD Radeon':vendor===0x8086?'Intel':'Unknown';return {vendor:name,renderer:'Automatic (recommended)',note:'Select Vulkan in the emulator only after confirming compatibility. This launcher does not override emulator graphics settings; performance is limited by CPU, GPU, drivers, and each game.'};}
module.exports={ENGINES,SYSTEMS,assertPlatform,validateContent,importConsoleGame,buildLaunch,status,gpuGuidance};
