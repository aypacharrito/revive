import {publicConfig} from '../lib/public-config.mjs';
export default function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 res.setHeader('Cache-Control','public,max-age=120,s-maxage=180');
 res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('X-Content-Type-Options','nosniff');
 return res.status(200).json(publicConfig());
}
