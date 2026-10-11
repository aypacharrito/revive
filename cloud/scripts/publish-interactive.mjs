import {createInterface} from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import {publish} from './publish-game.mjs';
const rl=createInterface({input,output});
try{
 console.log('\nREVIVE — AUTHORISED GAME PUBLISHER\nOnly upload games you created or have explicit distribution rights to publish.');
 let file=(await rl.question('Package path (.zip, .exe, .msi, .7z; drag into this window): ')).trim().replace(/^"|"$/g,'');
 const title=(await rl.question('Game title: ')).trim();
 const description=(await rl.question('Short game description: ')).trim();
 const version=(await rl.question('Version (default 1.0): ')).trim()||'1.0';
 console.log('Rights categories: original | public-domain | redistributable-license | written-permission');
 const rights=(await rl.question('Verified distribution rights category: ')).trim();
 const rightsSource=rights==='original'?'Created and owned by the uploader':(await rl.question('License page / written-permission reference: ')).trim();
 const confirm=(await rl.question('Type PUBLISH to confirm you have distribution rights: ')).trim();
 if(confirm!=='PUBLISH')throw Error('Cancelled. No files uploaded.');
 await publish({file,title,description,version,rights,rightsSource});
}catch(e){console.error('\nNot published:',e.message);process.exitCode=1;}finally{rl.close();}
