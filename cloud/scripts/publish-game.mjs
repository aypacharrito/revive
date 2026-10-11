#!/usr/bin/env node
// Owner-only publisher: store copyrighted binaries only with verifiable distribution rights.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {S3Client,PutObjectCommand,HeadObjectCommand} from '@aws-sdk/client-s3';
import {Upload} from '@aws-sdk/lib-storage';
import {r2Config} from '../lib/r2.mjs';
import {validateListing,filenameSafe,validId} from '../lib/catalog.mjs';
function argumentsMap(argv){const o={};for(let i=0;i<argv.length;i+=2){if(!argv[i].startsWith('--')||argv[i+1]===undefined)throw Error('Expected --flag value pairs');o[argv[i].slice(2)]=argv[i+1];}return o;}
function slug(value){return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50);}
export async function hashFile(file){return new Promise((resolve,reject)=>{const h=crypto.createHash('sha256');const stream=fs.createReadStream(file);stream.on('data',chunk=>h.update(chunk));stream.on('error',reject);stream.on('end',()=>resolve(h.digest('hex')));});}
export async function publish(opts,{getConfig=r2Config}={}){
 const {file,title,description='',version='1.0',rights,rightsSource='',id:inputId}=opts;
 if(!file||!fs.statSync(file).isFile())throw Error('Choose an existing package file');
 const filename=path.basename(file);if(!filenameSafe(filename))throw Error('Publish .zip/.7z/.exe/.msi/.tar/.gz with a safe filename');
 const id=inputId||slug(title);if(!validId(id))throw Error('Use an id of at least 3 characters');
 const bytes=fs.statSync(file).size;const sha256=await hashFile(file);
 const objectKey=`packages/${id}/${sha256}/${filename}`;
 const entry=validateListing({id,title,description,version,filename,sha256,bytes,rights,rightsSource,objectKey,status:'published'});
 const {client,Bucket}=getConfig();
 console.log(`Publishing ${entry.title}: ${(bytes/1024**3).toFixed(2)} GiB; SHA-256 ${sha256}`);
 const upload=new Upload({client,params:{Bucket,Key:objectKey,Body:fs.createReadStream(file),ContentType:'application/octet-stream'},queueSize:3,partSize:16*1024*1024,leavePartsOnError:false});
 let last=0;upload.on('httpUploadProgress',event=>{if(Date.now()-last>1250){last=Date.now();console.log(`Uploaded ${((event.loaded||0)/Math.max(1,bytes)*100).toFixed(1)}%`);}});
 await upload.done();
 const verified=await client.send(new HeadObjectCommand({Bucket,Key:objectKey}));if(Number(verified.ContentLength)!==bytes)throw Error('Remote object size mismatch; catalog NOT published');
 await client.send(new PutObjectCommand({Bucket,Key:`catalog/${id}.json`,ContentType:'application/json',Body:JSON.stringify(entry)}));
 console.log('Published in REVIVE catalog:',id);return entry;
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 publish(argumentsMap(process.argv.slice(2))).catch(error=>{console.error('Publication failed:',error.message);process.exitCode=1;});
}
