import {Redis} from '@upstash/redis';
import {publicConfig} from './public-config.mjs';
const fail=(status,message)=>Object.assign(Error(message),{status,publicError:true});
export async function playerFor(req,env=process.env,request=fetch){
 const config=publicConfig(env).social;if(!config)throw fail(503,'REVIVE accounts are not configured.');
 const bearer=String(req.headers?.authorization||'');
 if(!/^Bearer [A-Za-z0-9._~+/=-]{20,9000}$/.test(bearer))throw fail(401,'Sign in to REVIVE first.');
 const r=await request(config.url+'/auth/v1/user',{headers:{apikey:config.anonKey,Authorization:bearer},redirect:'error',signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw fail(401,'Your session expired. Sign in again.');
 const user=await r.json();if(!/^[a-f0-9-]{36}$/i.test(user?.id||''))throw fail(401,'Invalid session.');return user.id.toLowerCase();
}
const bounded=(value,max)=>Math.max(0,Math.min(max,Math.trunc(Number(value)||0)));
const texts=(value,count,len)=>Array.isArray(value)?value.filter(x=>typeof x==='string').slice(0,count).map(x=>x.slice(0,len)):[];
export function gameReport(report){
 if(!report||typeof report!=='object'||Array.isArray(report))throw fail(400,'Inspect an imported game first.');
 const extensions={};for(const [key,value] of Object.entries(report.extensions||{}).slice(0,60))if(/^\.[a-z0-9]{1,12}$|^\[none\]$/i.test(key))extensions[key]=bounded(value,12000);
 const result={title:String(report.title||'').slice(0,100),exe:String(report.exe||'').split(/[\\/]/).pop().slice(0,150),fileCount:bounded(report.fileCount,12000),observedBytes:bounded(report.observedBytes,1e15),scanTruncated:!!report.scanTruncated,extensions,
  notableFiles:texts(report.notableFiles,35,150).filter(x=>!x.startsWith('/')&&!x.startsWith('\\')&&!/^[a-z]:/i.test(x)),warnings:texts(report.warnings,10,300),exeSha256:/^[a-f0-9]{64}$/i.test(report.exeSha256||'')?report.exeSha256.toLowerCase():null};
 if(!result.title)throw fail(400,'Missing game title.');return result;
}
export const QUOTA_SCRIPT=`local u=tonumber(redis.call('GET',KEYS[1]) or '0'); local g=tonumber(redis.call('GET',KEYS[2]) or '0'); if u>=tonumber(ARGV[1]) or g>=tonumber(ARGV[2]) then return 0 end; redis.call('INCR',KEYS[1]); redis.call('EXPIRE',KEYS[1],3660); redis.call('INCR',KEYS[2]); redis.call('EXPIRE',KEYS[2],90000); return 1;`;
export async function reserveAI(userId,{env=process.env,redis,now=Date.now(),namespace='diagnostics'}={}){
 const url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;
 if(!redis&&(!url||!token))throw fail(503,'AI usage limits are not configured.');
 const client=redis||new Redis({url,token});
 const cover=namespace==='covers';
 const limit=Math.max(1,Math.min(100,bounded(cover?env.REVIVE_COVERS_PER_HOUR||3:env.REVIVE_AI_REQUESTS_PER_HOUR||10,100))),global=Math.max(1,Math.min(10000,bounded(cover?env.REVIVE_COVERS_PER_DAY||20:env.REVIVE_AI_REQUESTS_PER_DAY||100,10000)));
 const prefix=cover?'revive:covers':'revive:ai';const keys=[`${prefix}:user:${userId}:${Math.floor(now/3600000)}`,`${prefix}:global:${Math.floor(now/86400000)}`];
 if(Number(await client.eval(QUOTA_SCRIPT,keys,[limit,global]))!==1)throw fail(429,'AI allowance reached. Try again later.');
}
