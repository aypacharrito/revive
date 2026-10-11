import {Redis} from '@upstash/redis';
import {PRESENCE_SECONDS,cleanIds,presenceKey,allowedFriends} from '../lib/presence.mjs';

async function authorizedUser(req) {
 const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!url || !key) throw Object.assign(Error('Auth service not configured'),{status:503});
 const origin = new URL(url);
 if(origin.protocol!=='https:')throw Object.assign(Error('Auth configuration requires HTTPS'),{status:503});
 const auth = String(req.headers.authorization||'');
 if(!/^Bearer [A-Za-z0-9._~+/=-]{20,9000}$/.test(auth))throw Object.assign(Error('Sign in required'),{status:401});
 const headers={apikey:key,Authorization:auth};
 const r=await fetch(`${origin.origin}/auth/v1/user`,{headers,signal:AbortSignal.timeout(9000),redirect:'error'});
 if(!r.ok) throw Object.assign(Error('Invalid or expired session'),{status:401});
 const user=await r.json();
 if(!user?.id || !/^[0-9a-f-]{36}$/i.test(user.id))throw Object.assign(Error('Invalid session'),{status:401});
 return {origin:origin.origin,headers,userId:user.id.toLowerCase()};
}
async function friendsFor(auth) {
 const p=new URLSearchParams({select:'sender_id,recipient_id,status',status:'eq.accepted',or:`(sender_id.eq.${auth.userId},recipient_id.eq.${auth.userId})`,limit:'300'});
 const r=await fetch(`${auth.origin}/rest/v1/friend_requests?${p}`,{headers:auth.headers,signal:AbortSignal.timeout(9000),redirect:'error'});
 if(!r.ok)throw Object.assign(Error('Could not verify friends'),{status:503});
 return await r.json();
}
export default async function handler(req,res) {
 if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'GET or POST required'});
 res.setHeader('Cache-Control','no-store');
 try {
  if(!process.env.UPSTASH_REDIS_REST_URL||!process.env.UPSTASH_REDIS_REST_TOKEN)throw Object.assign(Error('Presence service not connected'),{status:503});
  const auth=await authorizedUser(req),redis=Redis.fromEnv();
  if(req.method==='POST') {
   await redis.set(presenceKey(auth.userId),{online:true}, {ex:PRESENCE_SECONDS});
   return res.status(200).json({ok:true,expiresIn:PRESENCE_SECONDS});
  }
  const query=new URL(req.url,'https://revive.invalid').searchParams;
  const users=cleanIds(query.get('users')||'');
  if(!users.length)return res.status(200).json({online:{}});
  const allowed=allowedFriends(await friendsFor(auth),auth.userId,users);
  const values=await Promise.all(allowed.map(id=>redis.exists(presenceKey(id))));
  const online=Object.fromEntries(allowed.map((id,i)=>[id,values[i]===1]));
  return res.status(200).json({online});
 }catch(e) {return res.status(e.status||503).json({error:e.status===401?'Sign in required':'Online status temporarily unavailable'});}
}
