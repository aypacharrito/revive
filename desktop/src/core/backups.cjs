'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const MAX_TOTAL = 120 * 1024 * 1024;
const MAX_FILES = 3500;
function validRelative(rel) {
  return typeof rel === 'string' && rel.length < 800 && !!rel && !path.isAbsolute(rel) && !rel.split(/[\\/]/).some(p => p === '..' || p === '' || p === '.') && !rel.includes(':') && !rel.includes('\0');
}
function packSaveDirectory(dir) {
  const root = fs.realpathSync(dir);
  if (!fs.statSync(root).isDirectory()) throw new Error('Save path must be a directory.');
  const files = [];
  let total = 0;
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) { stack.push(absolute); continue; }
      if (!entry.isFile()) continue;
      const stat = fs.statSync(absolute);
      total += stat.size;
      if (total > MAX_TOTAL || files.length >= MAX_FILES) throw new Error('Save folder is over the current 120 MB or 3500 file backup limit.');
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (!validRelative(relative)) throw new Error('Unsafe path in save folder.');
      files.push({ path: relative, content: fs.readFileSync(absolute).toString('base64') });
    }
  }
  const raw = Buffer.from(JSON.stringify({ format: 'revive-save-v1', createdAt: new Date().toISOString(), files }));
  return zlib.gzipSync(raw, { level: 6 });
}
function unpackSaveDirectory(buffer, dest) {
  if (!Buffer.isBuffer(buffer) || buffer.length > MAX_TOTAL * 2) throw new Error('Invalid archive size.');
  const raw = zlib.gunzipSync(buffer, { maxOutputLength: MAX_TOTAL * 2 });
  const parsed = JSON.parse(raw.toString('utf8'));
  if (parsed.format !== 'revive-save-v1' || !Array.isArray(parsed.files) || parsed.files.length > MAX_FILES) throw new Error('Unsupported save format.');
  const root = fs.realpathSync(dest);
  let total = 0;
  const targets = parsed.files.map(entry => {
    if (!validRelative(entry.path) || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(entry.content)) throw new Error('Unsafe archive entry.');
    const target = path.resolve(root, ...entry.path.split('/'));
    if (!target.startsWith(root + path.sep)) throw new Error('Save archive path traversal blocked.');
    const bytes = Buffer.from(entry.content, 'base64');
    total += bytes.length;
    if (total > MAX_TOTAL) throw new Error('Archive is too large.');
    // Reject links in the existing destination parent tree.
    let current = path.dirname(target);
    while (current.startsWith(root + path.sep)) {
      if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('Save destination contains a symlink.');
      current = path.dirname(current);
    }
    if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) throw new Error('Refusing to overwrite a symlink.');
    return { target, bytes };
  });
  for (const { target, bytes } of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  return targets.length;
}
function createSnapshot(game, backupRoot) {
  if (!game.saveDir) throw new Error('Choose a save folder first.');
  const data = packSaveDirectory(game.saveDir);
  const dir = path.join(backupRoot, game.id);
  fs.mkdirSync(dir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${timestamp}-${crypto.randomBytes(3).toString('hex')}.revive`);
  fs.writeFileSync(file, data, { flag: 'wx', mode: 0o600 });
  return { file, bytes: data.length, name: path.basename(file) };
}
function listSnapshots(game, backupRoot) {
  const folder = path.join(backupRoot, game.id);
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder).filter(n => /^[0-9TZ-]+-[0-9a-f]{6}\.revive$/.test(n)).sort().reverse().map(name => ({ name, bytes: fs.statSync(path.join(folder, name)).size }));
}
function restoreSnapshot(game, backupRoot, name) {
  if (!game.saveDir || !fs.existsSync(game.saveDir)) throw new Error('Select an existing save folder first.');
  if (!/^[0-9TZ-]+-[0-9a-f]{6}\.revive$/.test(name)) throw new Error('Invalid snapshot identifier.');
  const file = path.join(backupRoot, game.id, name);
  if (!fs.existsSync(file)) throw new Error('Snapshot does not exist.');
  createSnapshot(game, backupRoot); // always preserve current saves first
  return unpackSaveDirectory(fs.readFileSync(file), game.saveDir);
}
module.exports = { packSaveDirectory, unpackSaveDirectory, createSnapshot, listSnapshots, restoreSnapshot, validRelative };
