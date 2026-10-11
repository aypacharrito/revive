import {readiness} from '../lib/health.mjs';
export default function handler(req,res) {
  if(req.method !== 'GET')return res.status(405).json({error:'GET required'});
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json(readiness());
}
