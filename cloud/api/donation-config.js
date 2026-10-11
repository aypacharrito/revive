const ALLOWED = new Set(['buy.stripe.com','donate.stripe.com','paypal.me','www.paypal.com']);
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  let enabled=false, url='';
  try {const candidate=new URL(process.env.DONATION_URL || ''); if(candidate.protocol==='https:' && ALLOWED.has(candidate.hostname)){enabled=true;url=candidate.href;}}catch{}
  return res.status(200).json({enabled,url});
}
