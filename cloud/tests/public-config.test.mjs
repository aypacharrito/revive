import test from 'node:test';import assert from 'node:assert/strict';
import {publicConfig} from '../lib/public-config.mjs';
test('client config contains only public project settings',()=>{
 const config=publicConfig({SUPABASE_URL:'https://sample.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_TESTKEY_LONG_ENOUGH',R2_SECRET_ACCESS_KEY:'DANGEROUS',REVIVE_OWNER_TOKEN:'OWNERPRIVATE',UPSTASH_REDIS_REST_TOKEN:'REDISPRIVATE'});
 assert.equal(config.social.url,'https://sample.supabase.co');
 assert.equal(JSON.stringify(config).includes('PRIVATE'),false);
 assert.equal(JSON.stringify(config).includes('DANGEROUS'),false);
});
test('cloud does not leak misconfigured Supabase secrets',()=>{
 assert.equal(publicConfig({SUPABASE_URL:'http://localhost',SUPABASE_PUBLISHABLE_KEY:'key'}).social,null);
});
