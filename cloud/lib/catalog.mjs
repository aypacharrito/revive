const RIGHTS = new Set(['original', 'public-domain', 'redistributable-license', 'written-permission']);
export const CATALOG_PREFIX = 'catalog/';
export function validId(id){return typeof id==='string' && /^[a-z0-9][a-z0-9-]{2,55}$/.test(id);}
export function filenameSafe(name){return typeof name==='string' && /^[A-Za-z0-9][A-Za-z0-9 ._()-]{0,150}\.(zip|7z|exe|msi|tar|gz)$/i.test(name) && !name.includes('..');}
export function validateListing(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid game metadata');
  const {id,title,description='',version='1.0',filename,sha256,bytes,rights,rightsSource='',objectKey,status='published'} = value;
  if(!validId(id))throw Error('Invalid game id');
  if(typeof title!=='string'||!title.trim()||title.length>110)throw Error('Invalid title');
  if(typeof description!=='string'||description.length>900)throw Error('Invalid description');
  if(typeof version!=='string'||version.length>32)throw Error('Invalid version');
  if(!filenameSafe(filename))throw Error('Invalid archive filename');
  if(!/^[a-f0-9]{64}$/.test(sha256||''))throw Error('SHA-256 required');
  if(!Number.isSafeInteger(bytes)||bytes<=0||bytes>512*1024**3)throw Error('Invalid size');
  if(!RIGHTS.has(rights))throw Error('Distribution rights must be explicitly verified');
  if(typeof rightsSource!=='string'||rightsSource.length>500)throw Error('Invalid rights reference');
  if(rights!=='original' && rightsSource.trim().length<8)throw Error('Provide a rights/license reference');
  if(status!=='published')throw Error('Only published files are listed');
  if(objectKey!==`packages/${id}/${sha256}/${filename}`)throw Error('Package identity mismatch');
  return {id,title:title.trim(),description,version,filename,sha256,bytes,rights,rightsSource,objectKey,status};
}
export function publicListing(game){if(game?.visibility==='friends'||/^f-[a-f0-9]{32}-/.test(game?.id||''))throw Error('Private packages cannot enter the public catalog');const x=validateListing(game);const {objectKey,rightsSource,...visible}=x;return {...visible,downloadPath:`/api/catalog-download?id=${encodeURIComponent(x.id)}`};}
