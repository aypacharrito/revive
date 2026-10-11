import test from 'node:test';
import assert from 'node:assert/strict';
import {readiness} from '../lib/health.mjs';
import {presenceKey,cleanIds,allowedFriends} from '../lib/presence.mjs';
const user='12345678-1234-4123-8123-123456789abc';
const friend='12345678-1234-4123-8123-123456789def';
const stranger='12345678-1234-4123-8123-123456789aaa';
test('readiness does not reveal secret values',()=>{
 const env={R2_ACCOUNT_ID:'abc',R2_ACCESS_KEY_ID:'a',R2_SECRET_ACCESS_KEY:'SECRET',R2_BUCKET:'b',SUPABASE_URL:'x',SUPABASE_PUBLISHABLE_KEY:'key',UPSTASH_REDIS_REST_URL:'x',UPSTASH_REDIS_REST_TOKEN:'SECRET2',OPENAI_API_KEY:'s',REVIVE_OWNER_TOKEN:'owner'};
 const state=JSON.stringify(readiness(env));
 assert.equal(state.includes('SECRET'),false); assert.deepEqual(readiness(env).services,{r2:true,upstash:true,supabase:true,ai:true});
});
test('presence ids are validated and de-duplicated',()=>{
 assert.deepEqual(cleanIds(`${friend},${friend},${stranger},NOT-ID`),[friend,stranger]);
 assert.throws(()=>presenceKey('../secret'));
});
test('presence is permitted only for accepted friends',()=>{
 const rows=[{sender_id:user,recipient_id:friend,status:'accepted'},{sender_id:stranger,recipient_id:user,status:'pending'}];
 assert.deepEqual(allowedFriends(rows,user,[friend,stranger]),[friend]);
});
