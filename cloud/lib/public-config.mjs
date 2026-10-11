const PUBLIC_PREFIX = 'https://';
export function publicConfig(env=process.env) {
 const url=String(env.SUPABASE_URL||'').trim();
 const key=String(env.SUPABASE_PUBLISHABLE_KEY||'').trim();
 let social=null;
 try {
  const u=new URL(url);
  if(u.protocol==='https:'&&/^[a-z0-9-]+\.supabase\.co$/.test(u.hostname) && u.pathname==='/' && (key.startsWith('sb_publishable_')||key.startsWith('eyJ'))){social={url:u.origin,anonKey:key};}
 }catch{}
 return {network:'REVIVE',version:1,social,catalogUrl:env.REVIVE_PUBLIC_ORIGIN||'https://revive-omega-five.vercel.app',requiresLogin:true};
}
