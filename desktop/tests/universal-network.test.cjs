const test=require('node:test'),assert=require('node:assert/strict');
const {DEFAULT_ORIGIN,validatePublicConfig,fetchPublicConfig}=require('../src/core/public-config.cjs');
test('clients discover the same fixed REVIVE cloud origin',()=>{
 assert.equal(DEFAULT_ORIGIN,'https://revive-omega-five.vercel.app');
 const data={network:'REVIVE',version:1,social:{url:'https://project.supabase.co',anonKey:'sb_publishable_TESTKEY_LONG_ENOUGH'}};
 assert.deepEqual(validatePublicConfig(data),{socialUrl:'https://project.supabase.co',socialAnonKey:data.social.anonKey,catalogUrl:DEFAULT_ORIGIN});
});
test('config host and private keys are rejected',()=>{
 assert.throws(()=>validatePublicConfig({network:'REVIVE',version:1,social:{url:'http://localhost',anonKey:'sb_publishable_long_key_123456789'}}));
 assert.throws(()=>validatePublicConfig({network:'REVIVE',version:1,social:{url:'https://my.supabase.co',anonKey:'service_role_SECRET_123456789'}}));
});
test('universal config cannot be pointed at an arbitrary server',async()=>{
 await assert.rejects(()=>fetchPublicConfig('https://attacker.example',{request:()=>{throw Error('Must not fetch');}}),/Unknown REVIVE/);
});
