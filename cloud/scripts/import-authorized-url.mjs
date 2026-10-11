#!/usr/bin/env node
// Owner-only HTTPS fetch, to local temporary file, followed by rights-checked R2 publication.
// Does not extract, execute, scrape MediaFire pages, or circumvent host rate limits.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {Readable,Transform} from 'node:stream';import {pipeline} from 'node:stream/promises';
import {createInterface} from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import {pathToFileURL} from 'node:url';

const MAX_BYTES=25*1024**3;
export function validImportUrl(value){
 const u=new URL(value);
 if(u.protocol!=='https:'||u.username||u.password||u.hash||!u.hostname.includes('.')||u.port)throw Error('Use a public HTTPS direct file URL without credentials.');
 if(/^(localhost|.+\.localhost|.+\.local|.+\.internal|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.|::1|\[::1\])$/i.test(u.hostname))throw Error('Local/private server addresses are blocked.');
 return u;
}
export async function retrieveDirectUrl(url,file,{request=fetch,maxBytes=MAX_BYTES}={}){
 const origin=validImportUrl(url);
 // Only owner-initiated downloads on the owner's own machine; never fetch from a public server endpoint.
 const res=await request(origin.href,{redirect:'error',signal:AbortSignal.timeout(180000)});
 if(!res.ok||!res.body)throw Error('Source failed (HTTP '+res.status+'); obtain a valid direct link or use a local file.');
 const type=String(res.headers.get('content-type')||'').toLowerCase();
 if(/text\/html|application\/json|text\/plain/.test(type))throw Error('This URL returns a web page, not a downloadable archive. Download an authorized file manually, then publish the local file.');
 const claimed=Number(res.headers.get('content-length')||0);
 if(claimed>maxBytes)throw Error('Source file exceeds size limit');
 let received=0;
 try{
   await pipeline(Readable.fromWeb(res.body),new Transform({transform(chunk,_enc,done){received+=chunk.length;if(received>maxBytes)return done(Error('Source file exceeds size limit'));done(null,chunk);}}),fs.createWriteStream(file,{flags:'wx'}));
   if(!received)throw Error('Empty source file');
   return received;
 }catch(e){try{fs.unlinkSync(file)}catch{}throw e;}
}
export async function importAuthorizedUrl({url,filename,...metadata},{retrieve=retrieveDirectUrl,publisher}={}){
 if(!/^[a-zA-Z0-9][a-zA-Z0-9 ._()-]{0,150}\.(zip|7z|exe|msi|tar|gz)$/i.test(filename||'')||filename.includes('..'))throw Error('Provide a safe package filename including .zip, .7z, .exe, .msi, .tar, or .gz');
 if(!['original','public-domain','redistributable-license','written-permission'].includes(metadata.rights))throw Error('Distribution rights must be verified first');
 if(metadata.rights!=='original'&&String(metadata.rightsSource||'').length<8)throw Error('Provide a license or written-permission reference');
 validImportUrl(url);
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'revive-owner-import-'));
 const file=path.join(tmp,filename);
 try {
 await retrieve(url,file);
 if(!publisher){const {publish}=await import('./publish-game.mjs');publisher=publish;}
 return await publisher({file,...metadata});
 }
 finally {fs.rmSync(tmp,{recursive:true,force:true});}
}
async function runInteractive(){
 const rl=createInterface({input,output});
 try{
 console.log('REVIVE OWNER / AUTHORIZED DIRECT-LINK IMPORT');
 console.log('No copyrighted commercial packages without explicit distribution permission.');
 const url=(await rl.question('Public HTTPS direct download URL: ')).trim();
 const filename=(await rl.question('Downloaded filename (game.zip): ')).trim();
 const title=(await rl.question('Title: ')).trim();
 const description=(await rl.question('Description: ')).trim();
 const version=(await rl.question('Version [1.0]: ')).trim()||'1.0';
 const rights=(await rl.question('Rights: original / public-domain / redistributable-license / written-permission: ')).trim();
 const rightsSource=rights==='original'?'Owned and created by uploader':(await rl.question('License URL or written permission reference: ')).trim();
 if((await rl.question('Confirm your legal distribution permission by typing PUBLISH: ')).trim()!=='PUBLISH')throw Error('Cancelled');
 await importAuthorizedUrl({url,filename,title,description,version,rights,rightsSource});
 }finally{rl.close()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)runInteractive().catch(e=>{console.error(e.message);process.exitCode=1});
