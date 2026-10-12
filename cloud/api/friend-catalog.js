import {playerFor} from '../lib/game-ai.mjs';
import {friendOwnersFor,readFriendCatalog} from '../lib/friend-catalog.mjs';
import {r2Config} from '../lib/r2.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 try{const user=await playerFor(req),owners=await friendOwnersFor(req,user),{client,Bucket}=r2Config();return res.status(200).json({games:await readFriendCatalog(client,Bucket,owners),note:'Private packages from you and your accepted REVIVE friends.'});}
 catch(error){return res.status(error.publicError?error.status:503).json({error:error.publicError?error.message:'Private cloud library unavailable. Check storage and sign-in.'});}
}
