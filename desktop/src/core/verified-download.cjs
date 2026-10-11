'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {Readable,Transform}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const {validateEndpoint}=require('./cloud.cjs');
const MAX_BYTES=8*1024*1024*1024;
function validateDownload({url,sha256,fileName},{allowSignedR2=false}={}) {
  let parsed;
  if(allowSignedR2){
    parsed=new URL(url);
    if(parsed.protocol!=='https:'||!(/^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/i.test(parsed.hostname))||parsed.username||parsed.password||parsed.hash||parsed.searchParams.get('X-Amz-Algorithm')!=='AWS4-HMAC-SHA256'||!parsed.searchParams.has('X-Amz-Signature')) throw Error('Invalid signed R2 download URL.');
  }else parsed=validateEndpoint(url);
  if(!/^[a-f0-9]{64}$/i.test(sha256||''))throw Error('A trusted 64-character SHA-256 is required.');
  if(!/^[a-zA-Z0-9][a-zA-Z0-9_. ()-]{0,120}$/.test(fileName||'')||fileName==='.'||fileName==='..')throw Error('Choose a safe file name.');
  if(/[. ]$/.test(fileName)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(fileName))throw Error('Choose a file name supported by Windows.');
  return {url:parsed.toString(),sha256:sha256.toLowerCase(),fileName};
}
async function verifiedDownload(params,folder,{signal,onProgress,request=fetch,maxBytes=MAX_BYTES,resume=false}={}) {
  const job=validateDownload(params,{allowSignedR2:params?.signedR2===true});
  const resumable=resume===true && params?.signedR2===true;
  fs.mkdirSync(folder,{recursive:true});
  const target=path.join(folder,job.fileName);
  if(fs.existsSync(target))throw Error('Destination already exists. Rename the file or move it first.');
  const temp=resumable ? path.join(folder,`.revive-${job.sha256.slice(0,18)}-${job.fileName}.part`) : path.join(folder,`.revive-${crypto.randomUUID()}.part`);
  let keepPartial=false;
  try{
    let offset=resumable && fs.existsSync(temp)?fs.statSync(temp).size:0;
    if(offset>maxBytes){fs.unlinkSync(temp);throw Error('Partial download exceeds allowed size.');}
    const headers=offset?{Range:`bytes=${offset}-`}:{};
    const hash=crypto.createHash('sha256');
    if(offset){
      for await(const chunk of fs.createReadStream(temp)) { signal?.throwIfAborted(); hash.update(chunk); }
      if(hash.copy().digest('hex')===job.sha256){fs.renameSync(temp,target);return {file:target,bytes:offset,sha256:job.sha256,resumedBytes:offset};}
    }
    let response=await request(job.url,{signal,headers,redirect:'error'});
    if(response.status===416&&offset){offset=0;response=await request(job.url,{signal,headers:{},redirect:'error'});}
    if(!response.ok||!response.body)throw Error(`Download failed (HTTP ${response.status}).`);
    if(response.status===206){
      const range=response.headers.get('content-range')||'';
      const match=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(range);
      if(!match || Number(match[1])!==offset || Number(match[2])<offset || Number(match[2])>=Number(match[3]) || Number(match[3])>maxBytes)throw Error('Server returned an invalid range.');
    }else if(response.status===200){
      // Server ignored Range; discard earlier bytes and safely start again.
      offset=0;
    }else throw Error('Unexpected transfer response.');
    const declared=Number(response.headers.get('content-length')||0);
    if(declared+offset>maxBytes)throw Error('Download exceeds allowed size.');
    const streamHash=offset?hash:crypto.createHash('sha256');
    let total=offset;
    const stream=new Transform({transform(chunk,_encoding,callback){
      total+=chunk.length;
      if(total>maxBytes)return callback(Error('Download exceeds allowed size.'));
      streamHash.update(chunk);onProgress?.({bytes:total,total:declared?declared+offset:null,resumedBytes:offset});callback(null,chunk);
    }});
    await pipeline(Readable.fromWeb(response.body),stream,fs.createWriteStream(temp,{flags:offset?'a':'w'}),{signal});
    const observed=streamHash.digest('hex');
    if(observed!==job.sha256)throw Error('SHA-256 mismatch: discarded the download.');
    fs.renameSync(temp,target);
    return {file:target,bytes:total,sha256:observed,resumedBytes:offset};
  }catch(e){
    if(resumable && (e.name==='AbortError'||['ABORT_ERR','ECONNRESET','ETIMEDOUT','UND_ERR_SOCKET','UND_ERR_CONNECT_TIMEOUT'].includes(e.code)||['ECONNRESET','ETIMEDOUT','UND_ERR_SOCKET','UND_ERR_CONNECT_TIMEOUT'].includes(e.cause?.code)))keepPartial=true;
    throw e;
  }finally{if(!keepPartial){try{fs.unlinkSync(temp)}catch{}}}
}

module.exports={validateDownload,verifiedDownload,MAX_BYTES};
