'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const MAX_ART_BYTES = 6 * 1024 * 1024;
function importArtwork(file, gameId, artworkRoot) {
  if (!/^[a-zA-Z0-9-]{3,80}$/.test(gameId)) throw new Error('Invalid game identifier');
  const extension = path.extname(file).toLowerCase();
  if (!['.png','.jpg','.jpeg','.webp'].includes(extension)) throw new Error('Choose a PNG, JPG or WebP image.');
  const stats = fs.statSync(file);
  if (!stats.isFile() || stats.size > MAX_ART_BYTES) throw new Error('Artwork must be a file smaller than 6 MB.');
  const buf = fs.readFileSync(file);
  const signature = buf.subarray(0,12).toString('hex');
  const isPNG = signature.startsWith('89504e470d0a1a0a');
  const isJPEG = signature.startsWith('ffd8ff');
  const isWebP = buf.subarray(0,4).toString()==='RIFF' && buf.subarray(8,12).toString()==='WEBP';
  if (!((extension === '.png'&&isPNG)||(extension.includes('jp')&&isJPEG)||(extension === '.webp'&&isWebP))) throw new Error('The image signature does not match its extension.');
  fs.mkdirSync(artworkRoot,{recursive:true});
  const name=`${gameId}-${crypto.randomBytes(6).toString('hex')}${extension}`;
  fs.writeFileSync(path.join(artworkRoot,name),buf,{flag:'wx'});
  return name;
}
function artworkData(name, artworkRoot) {
  if (!/^[a-zA-Z0-9-]{3,80}-[0-9a-f]{12}\.(png|jpg|jpeg|webp)$/.test(name||'')) return null;
  const file=path.join(artworkRoot,name);
  if (!fs.existsSync(file) || fs.statSync(file).size>MAX_ART_BYTES) return null;
  const ext=path.extname(file).toLowerCase();
  const mime=ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}
module.exports={importArtwork,artworkData,MAX_ART_BYTES};
