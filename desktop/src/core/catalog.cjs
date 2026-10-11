'use strict';
const {validateEndpoint}=require('./cloud.cjs');
function catalogOrigin(url){
 if(!url)return '';
 const u=validateEndpoint(String(url).trim());
 if(u.pathname!=='/' && u.pathname!=='')throw Error('Enter only the catalog API origin, not an individual route.');
 return u.origin;
}
function supportLink(url){
 if(!url)return '';
 const u=new URL(String(url).trim());
 if(u.protocol!=='https:' || !['buy.stripe.com','donate.stripe.com'].includes(u.hostname)||u.username||u.password||u.hash)throw Error('Support link must be an HTTPS Stripe Payment Link.');
 return u.toString();
}
function validateCatalogResponse(body){
 if(!body||!Array.isArray(body.games)||body.games.length>300)throw Error('Invalid catalog response.');
 return body.games.filter(x=>x&&typeof x.id==='string'&&/^[a-z0-9][a-z0-9-]{2,55}$/.test(x.id)&&typeof x.title==='string'&&x.title.length<=110&&typeof x.sha256==='string'&&/^[a-f0-9]{64}$/.test(x.sha256)&&Number.isSafeInteger(x.bytes)&&x.bytes>0&&typeof x.filename==='string'&&x.filename.length<=155&&typeof x.rights==='string');
}
module.exports={catalogOrigin,supportLink,validateCatalogResponse};
