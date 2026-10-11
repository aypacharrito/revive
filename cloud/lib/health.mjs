export function readiness(env = process.env) {
  const r2 = ['R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET'].every(k => Boolean(env[k]));
  const upstash = ['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'].every(k => Boolean(env[k]));
  const supabase = ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY'].every(k => Boolean(env[k]));
  const ai = ['OPENAI_API_KEY','REVIVE_OWNER_TOKEN'].every(k => Boolean(env[k]));
  return { name:'REVIVE cloud', ready:true, version:'0.7.0', services:{r2,upstash,supabase,ai}, explanation:'Connection variables detected only; availability and permissions have not been tested.' };
}
