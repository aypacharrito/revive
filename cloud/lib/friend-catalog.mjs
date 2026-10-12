import {ListObjectsV2Command,GetObjectCommand} from '@aws-sdk/client-s3';
import {publicConfig} from './public-config.mjs';
import {validateListing,validId} from './catalog.mjs';
export const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function friendId(ownerId,slug){
 if(!UUID.test(ownerId||''))throw Error('Copy your REVIVE account ID from Friends & Chat.');
 const suffix=String(slug||'').toLowerCase().slice(0,20).replace(/-+$/,'');
 const id=`f-${ownerId.replaceAll('-','').toLowerCase()}-${suffix}`;
 if(!validId(id)||suffix.length<3)throw Error('Use a game title of at least 3 characters.');return id;
}
export function ownerFromFriendId(id){
 const match=/^f-([a-f0-9]{32})-([a-z0-9][a-z0-9-]{2,19})$/.exec(String(id||''));
 if(!match)return null;const h=match[1],owner=`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
 return UUID.test(owner)?owner:null;
}
export function validateFriendListing(value){
 if(value?.visibility!=='friends'||!UUID.test(value.ownerId||'')||ownerFromFriendId(value.id)!==value.ownerId)throw Error('Invalid private package owner');
 const base=validateListing({...value,rights:'original',rightsSource:'',objectKey:`packages/${value.id}/${value.sha256}/${value.filename}`});
 const objectKey=`friend-packages/${value.ownerId}/${base.id}/${base.sha256}/${base.filename}`;
 if(value.objectKey!==objectKey)throw Error('Private package identity mismatch');
 const {rights,rightsSource,...common}=base;return {...common,objectKey,ownerId:value.ownerId,visibility:'friends'};
}
export function friendListing(value){const {objectKey,...visible}=validateFriendListing(value);return {...visible,rights:'friends-only',downloadPath:`/api/catalog-download?id=${encodeURIComponent(visible.id)}`};}
export async function friendOwnersFor(req,userId,{env=process.env,request=fetch}={}){
 if(!UUID.test(userId||''))throw Error('Invalid player');
 const config=publicConfig(env).social;if(!config)throw Error('Accounts unavailable');
 const query=new URLSearchParams({select:'sender_id,recipient_id,status',status:'eq.accepted',or:`(sender_id.eq.${userId},recipient_id.eq.${userId})`,limit:'250'});
 const r=await request(`${config.url}/rest/v1/friend_requests?${query}`,{headers:{apikey:config.anonKey,Authorization:req.headers.authorization},redirect:'error',signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error('Friend access check failed');const rows=await r.json();if(!Array.isArray(rows))throw Error('Invalid friends response');
 const owners=new Set([userId]);for(const row of rows){if(row.status!=='accepted')continue;const other=row.sender_id===userId?row.recipient_id:row.recipient_id===userId?row.sender_id:null;if(UUID.test(other||''))owners.add(other);}
 return [...owners];
}
export async function readFriendCatalog(client,Bucket,owners){
 const items=[];
 for(const owner of owners){
  if(!UUID.test(owner))continue;let ContinuationToken;
  do{
   const page=await client.send(new ListObjectsV2Command({Bucket,Prefix:`friend-catalog/${owner}/`,MaxKeys:50,ContinuationToken}));
   const keys=(page.Contents||[]).filter(entry=>typeof entry.Key==='string'&&entry.Key.startsWith(`friend-catalog/${owner}/`)&&entry.Key.endsWith('.json')).map(entry=>entry.Key);
   for(let start=0;start<keys.length;start+=5){
    const batch=await Promise.all(keys.slice(start,start+5).map(async Key=>{try{const file=await client.send(new GetObjectCommand({Bucket,Key}));if(Number(file.ContentLength)>10000)return null;const raw=await file.Body.transformToString();if(raw.length>10000)return null;const entry=friendListing(JSON.parse(raw));return entry.ownerId===owner&&Key===`friend-catalog/${owner}/${entry.id}.json`?entry:null;}catch{return null;}}));
    items.push(...batch.filter(Boolean));if(items.length>=250)return items.slice(0,250);
   }
   ContinuationToken=page.NextContinuationToken;
  }while(ContinuationToken);
 }
 return items;
}
