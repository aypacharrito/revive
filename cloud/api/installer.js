import {officialInstaller} from '../lib/installer.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const release=await officialInstaller();
  res.setHeader('Cache-Control','public,max-age=60,s-maxage=300,stale-while-revalidate=300');
  return res.status(200).json({release});
 }catch{
  res.setHeader('Cache-Control','no-store');
  return res.status(503).json({error:'Release lookup unavailable. View official GitHub releases.'});
 }
}
