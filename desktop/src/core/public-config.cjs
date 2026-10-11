'use strict';
// PUBLIC project settings only. No API secrets or owner token are ever distributed.
const DEFAULT_ORIGIN='https://revive-omega-five.vercel.app';
const TRUSTED_ORIGINS=new Set([DEFAULT_ORIGIN,'https://revive-pacificalegalinsurance.vercel.app']);
function validatePublicConfig(data){
 if(!data||data.network!=='REVIVE'||data.version!==1||!data.social)throw Error('REVIVE universal network not yet configured on the server.');
 const socialUrl=new URL(String(data.social.url||''));
 if(socialUrl.protocol!=='https:'||!/^[a-z0-9-]+\.supabase\.co$/i.test(socialUrl.hostname)||socialUrl.pathname!=='/'||socialUrl.search||socialUrl.hash)throw Error('Unexpected social network URL');
 const anonKey=String(data.social.anonKey||'');
 if(!((anonKey.startsWith('sb_publishable_')||anonKey.startsWith('eyJ'))&&anonKey.length>=30&&anonKey.length<2000))throw Error('Invalid public project key');
 return {socialUrl:socialUrl.origin,socialAnonKey:anonKey,catalogUrl:DEFAULT_ORIGIN};
}
async function fetchPublicConfig(origin=DEFAULT_ORIGIN,{request=fetch}={}){
 if(!TRUSTED_ORIGINS.has(origin))throw Error('Unknown REVIVE configuration server');
 const response=await request(origin+'/api/client-config',{signal:AbortSignal.timeout(9000),redirect:'error'});
 if(!response.ok)throw Error('REVIVE cloud network unavailable (HTTP '+response.status+').');
 return validatePublicConfig(await response.json());
}
module.exports={DEFAULT_ORIGIN,TRUSTED_ORIGINS,validatePublicConfig,fetchPublicConfig};
