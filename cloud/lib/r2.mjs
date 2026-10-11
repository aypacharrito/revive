import {S3Client} from '@aws-sdk/client-s3';
export function r2Config(env=process.env){
 const required=['R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET'];
 for(const key of required)if(!env[key])throw Error('R2 not configured. Missing '+key);
 if(!/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID))throw Error('Invalid R2 account id');
 if(!/^[a-zA-Z0-9._-]{2,100}$/.test(env.R2_BUCKET))throw Error('Invalid R2 bucket');
 return {Bucket:env.R2_BUCKET,client:new S3Client({region:'auto',endpoint:`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY}})};
}
