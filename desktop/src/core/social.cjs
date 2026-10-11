'use strict';
// Supabase Auth + PostgREST adapter. No service-role key is ever used by the desktop.
const HANDLE=/^[a-z][a-z0-9_]{2,22}$/;
function validateSocialConfig({url,anonKey}){
 const u=new URL(String(url||''));
 if(u.protocol!=='https:' || !u.hostname.endsWith('.supabase.co') || u.username || u.password || u.search || u.hash || u.pathname!=='/')throw Error('Use your Supabase HTTPS project URL (https://PROJECT.supabase.co).');
 if(typeof anonKey!=='string'||anonKey.length<20||anonKey.length>2000)throw Error('Provide the Supabase publishable/anon key. Never use a service-role key.');
 return {url:u.origin,anonKey};
}
function validateHandle(value){const result=String(value||'').trim().toLowerCase();if(!HANDLE.test(result))throw Error('Handle must have 3–23 characters: lowercase letters, numbers and underscores, starting with a letter.');return result;}
function validateMessage(value){const t=String(value||'').trim();if(t.length<1||t.length>2000)throw Error('Messages must be 1–2000 characters.');return t;}
async function request(config,route,{method='GET',body,token,query}={}){
 const address=new URL(route,config.url);
 if(query)for(const [key,value] of Object.entries(query))address.searchParams.set(key,value);
 const response=await fetch(address,{method,headers:{apikey:config.anonKey,...(token?{Authorization:`Bearer ${token}`}:{ }),'Content-Type':'application/json',Accept:'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(14000)});
 const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=null;}
 if(!response.ok)throw Error(String(data?.msg||data?.message||data?.error_description||data?.error||`Social service HTTP ${response.status}`).slice(0,220));
 return data;
}
async function signUp(config,email,password){if(!/^\S+@\S+\.\S+$/.test(email||'')||String(password||'').length<10)throw Error('Enter a valid email and password of at least 10 characters.');return request(config,'/auth/v1/signup',{method:'POST',body:{email,password}});}
async function signIn(config,email,password){return request(config,'/auth/v1/token',{method:'POST',query:{grant_type:'password'},body:{email,password}});}
async function refreshToken(config,refresh){return request(config,'/auth/v1/token',{method:'POST',query:{grant_type:'refresh_token'},body:{refresh_token:refresh}});}
const qstr=(v)=>String(v).replace(/[(),"\\]/g,'');
async function snapshot(config,token,userId){
 const [me,links]=await Promise.all([
  request(config,'/rest/v1/profiles',{token,query:{select:'id,handle,display_name',id:`eq.${userId}`,limit:'1'}}),
  request(config,'/rest/v1/friend_requests',{token,query:{select:'id,sender_id,recipient_id,status,created_at',or:`(sender_id.eq.${userId},recipient_id.eq.${userId})`,order:'created_at.desc',limit:'200'}})
 ]);
 const peerIds=[...new Set(links.map(link=>link.sender_id===userId?link.recipient_id:link.sender_id))];
 const profiles=peerIds.length?await request(config,'/rest/v1/profiles',{token,query:{select:'id,handle,display_name',id:`in.(${peerIds.join(',')})`,limit:'200'}}):[];
 const people=new Map(profiles.map(p=>[p.id,p]));
 const enriched=links.map(link=>({...link,other:people.get(link.sender_id===userId?link.recipient_id:link.sender_id)||{id:link.sender_id===userId?link.recipient_id:link.sender_id,handle:'unknown'}}));
 return {me:me[0]||null,friends:enriched.filter(x=>x.status==='accepted'),incoming:enriched.filter(x=>x.status==='pending'&&x.recipient_id===userId),outgoing:enriched.filter(x=>x.status==='pending'&&x.sender_id===userId)};
}
async function updateProfile(config,token,userId,handle,display){
 handle=validateHandle(handle);display=String(display||handle).trim().slice(0,48);
 return request(config,'/rest/v1/profiles',{method:'PATCH',token,query:{id:`eq.${userId}`},body:{handle,display_name:display}});
}
async function invite(config,token,handle){return request(config,'/rest/v1/rpc/send_friend_request',{method:'POST',token,body:{target_handle:validateHandle(handle)}});}
async function respond(config,token,requestId,accept){if(!/^[0-9a-f-]{36}$/i.test(requestId))throw Error('Invalid friend request.');return request(config,'/rest/v1/rpc/respond_friend_request',{method:'POST',token,body:{request_id:requestId,accept:!!accept}});}
async function messages(config,token,userId,friendId){if(!/^[0-9a-f-]{36}$/i.test(friendId))throw Error('Invalid friend.');return request(config,'/rest/v1/messages',{token,query:{select:'id,from_id,to_id,body,created_at',or:`(and(from_id.eq.${userId},to_id.eq.${friendId}),and(from_id.eq.${friendId},to_id.eq.${userId}))`,order:'created_at.asc',limit:'150'}});}
async function send(config,token,userId,friendId,body){return request(config,'/rest/v1/messages',{method:'POST',token,body:{from_id:userId,to_id:friendId,body:validateMessage(body)}});}
module.exports={validateSocialConfig,validateHandle,validateMessage,request,signUp,signIn,refreshToken,snapshot,updateProfile,invite,respond,messages,send};
