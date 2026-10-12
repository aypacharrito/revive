import {GetObjectCommand,HeadObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {r2Config} from '../lib/r2.mjs';
import {validId,validateListing} from '../lib/catalog.mjs';
import {ownerFromFriendId,validateFriendListing,friendOwnersFor} from '../lib/friend-catalog.mjs';
import {playerFor} from '../lib/game-ai.mjs';
export function createHandler({authenticate=playerFor,owners=friendOwnersFor,getConfig=r2Config,sign=getSignedUrl}={}){return async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 const id=String(req.query?.id||'');if(!validId(id))return res.status(400).json({error:'Invalid game identifier'});
 try{
  const owner=ownerFromFriendId(id);
  if(/^f-[a-f0-9]{32}-/.test(id)&&!owner)return res.status(400).json({error:'Invalid private package identifier'});
  if(owner){const user=await authenticate(req);if(!(await owners(req,user)).includes(owner))return res.status(404).json({error:'Private package unavailable.'});}
  const {client,Bucket}=getConfig();const manifest=await client.send(new GetObjectCommand({Bucket,Key:owner?`friend-catalog/${owner}/${id}.json`:`catalog/${id}.json`}));
  if(Number(manifest.ContentLength)>10000)throw Error('Invalid manifest');const raw=await manifest.Body.transformToString();if(raw.length>10000)throw Error('Invalid manifest');
  const item=(owner?validateFriendListing:validateListing)(JSON.parse(raw));
  if(item.id!==id||(owner&&item.ownerId!==owner)||(!owner&&item.visibility==='friends'))throw Error('Package identity mismatch');
  const head=await client.send(new HeadObjectCommand({Bucket,Key:item.objectKey}));
  if(Number(head.ContentLength)!==item.bytes)throw Error('Package size differs from published manifest');
  const url=await sign(client,new GetObjectCommand({Bucket,Key:item.objectKey}),{expiresIn:owner?300:3600});
  res.setHeader('Cache-Control','no-store');return res.status(200).json({url,sha256:item.sha256,fileName:item.filename,title:item.title,bytes:item.bytes,warning:'Download only; never auto-run packages. Review files before importing.'});
 }catch(error){if(error.publicError)return res.status(error.status).json({error:error.message});return res.status(404).json({error:'This package is unavailable or has failed verification.'});}
};}
export default createHandler();
