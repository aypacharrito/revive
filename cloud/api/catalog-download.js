import {GetObjectCommand,HeadObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {r2Config} from '../lib/r2.mjs';
import {validId,validateListing} from '../lib/catalog.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 const id=String(req.query?.id||'');if(!validId(id))return res.status(400).json({error:'Invalid game identifier'});
 try{
  const {client,Bucket}=r2Config();const manifest=await client.send(new GetObjectCommand({Bucket,Key:`catalog/${id}.json`}));const item=validateListing(JSON.parse(await manifest.Body.transformToString()));
  const head=await client.send(new HeadObjectCommand({Bucket,Key:item.objectKey}));
  if(Number(head.ContentLength)!==item.bytes)throw Error('Package size differs from published manifest');
  const url=await getSignedUrl(client,new GetObjectCommand({Bucket,Key:item.objectKey}),{expiresIn:3600});
  res.setHeader('Cache-Control','no-store');return res.status(200).json({url,sha256:item.sha256,fileName:item.filename,title:item.title,bytes:item.bytes,warning:'Download only; never auto-run packages. Review files before importing.'});
 }catch{return res.status(404).json({error:'This package is unavailable or has failed verification.'});}
}
