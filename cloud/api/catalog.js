import {ListObjectsV2Command,GetObjectCommand} from '@aws-sdk/client-s3';
import {r2Config} from '../lib/r2.mjs';
import {CATALOG_PREFIX,publicListing} from '../lib/catalog.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 try{
  const {client,Bucket}=r2Config();const items=[];let ContinuationToken;
  do {
   const page=await client.send(new ListObjectsV2Command({Bucket,Prefix:CATALOG_PREFIX,MaxKeys:150,ContinuationToken}));
   for(const entry of page.Contents||[]){
    if(!/^catalog\/[a-z0-9-]+\.json$/.test(entry.Key))continue;
    try{const file=await client.send(new GetObjectCommand({Bucket,Key:entry.Key}));const raw=await file.Body.transformToString();const json=JSON.parse(raw);const pub=publicListing(json);if(entry.Key===`catalog/${pub.id}.json`)items.push(pub);}catch{/* corrupt or unpublished entries are not listed */}
   }
   ContinuationToken=page.NextContinuationToken;
   if(items.length>=250)break;
  }while(ContinuationToken);
  res.setHeader('Cache-Control','public, max-age=30, s-maxage=45');return res.status(200).json({games:items.slice(0,250),note:'Only games with verified distribution permission may be published. Catalog access is public in this prototype.'});
 }catch(e){return res.status(503).json({error:e.message.startsWith('R2 not configured')?'Game catalog storage has not been connected.':'Catalog temporarily unavailable.'});}
}
