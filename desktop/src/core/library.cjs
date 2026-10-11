'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const IGNORED_EXES = /(?:unins|uninstall|setup|install|crash|report|redist|dxsetup|vcredist|launcher_update|updater|eac|easyanticheat|unitycrashhandler)/i;
function readLibrary(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data.games) ? data.games : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}
function writeLibrary(file, games) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify({ version: 1, games }, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, file);
}
function titleFromExe(exe) {
  return path.basename(exe, path.extname(exe)).replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function importExecutable(file, games) {
  if (!file || !/\.exe$/i.test(file)) throw new Error('Select a Windows game .exe file.');
  const real = fs.realpathSync(file);
  if (!fs.statSync(real).isFile()) throw new Error('The selected executable is not a regular file.');
  const existing = games.find(g => g.exe.toLowerCase() === real.toLowerCase());
  if (existing) return { games, game: existing, existed: true };
  const lookup = `${path.basename(real)} ${path.basename(path.dirname(real))}`.toLowerCase();
  const knownName = /sunset[ _-]?overdrive/.test(lookup) ? 'Sunset Overdrive' : /\bblur\b/.test(lookup) ? 'Blur' : null;
  const title = knownName || titleFromExe(real);
  const game = { id: crypto.randomUUID(), title, compatibilityId: knownName?.toLowerCase() || null, exe: real, root: path.dirname(real), saveDir: null, addedAt: new Date().toISOString(), minutes: 0 };
  return { games: [game, ...games], game, existed: false };
}
function candidateExecutables(folder, depthLimit = 3) {
  const found = [];
  const queue = [{ dir: fs.realpathSync(folder), depth: 0 }];
  let walked = 0;
  while (queue.length && walked < 2500 && found.length < 100) {
    const { dir, depth } = queue.shift();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const item of entries) {
      walked++;
      if (walked >= 2500) break;
      if (item.isSymbolicLink()) continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory() && depth < depthLimit && !/^(redist|_commonredist|support|installer|updates|backup)$/i.test(item.name)) queue.push({ dir: full, depth: depth + 1 });
      if (item.isFile() && /\.exe$/i.test(item.name) && !IGNORED_EXES.test(item.name)) found.push(full);
    }
  }
  return found;
}
function inspectGame(game) {
  const warnings = [], extensions = {}, interesting = [];
  if (!fs.existsSync(game.exe)) warnings.push('Executable is missing or has been moved.');
  let count = 0, bytes = 0;
  const queue = [{ dir: game.root, depth: 0 }];
  while (queue.length && count < 12000) {
    const { dir, depth } = queue.shift();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const item of entries) {
      if (count >= 12000) break;
      if (item.isSymbolicLink()) continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory() && depth < 5) queue.push({ dir: full, depth: depth + 1 });
      if (!item.isFile()) continue;
      count++;
      const ext = path.extname(item.name).toLowerCase() || '[none]';
      extensions[ext] = (extensions[ext] || 0) + 1;
      try { bytes += fs.statSync(full).size; } catch {}
      if (/(steam_api|d3dx|xinput|vcruntime|msvcp|unityplayer|bink|gamespy|openal|directx)/i.test(item.name) && interesting.length < 35) interesting.push(path.relative(game.root, full));
    }
  }
  if (!game.saveDir) warnings.push('Save-game folder not selected; choose it before making backups.');
  else if (!fs.existsSync(game.saveDir)) warnings.push('Selected save-game folder does not exist.');
  const exeHash = fs.existsSync(game.exe) ? hashFile(game.exe) : null;
  return { title: game.title, exe: path.basename(game.exe), root: game.root, saveDir: game.saveDir, fileCount: count, observedBytes: bytes, scanTruncated: count >= 12000, extensions, notableFiles: interesting, exeSha256: exeHash, warnings, notes: 'Static metadata inspection only. No game code was executed or modified. This is not an authoritative integrity check without a trusted publisher manifest.' };
}
function hashFile(file) {
  const fd = fs.openSync(file, 'r');
  const hash = crypto.createHash('sha256');
  const buf = Buffer.allocUnsafe(1024 * 1024);
  try {
    let n;
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) hash.update(buf.subarray(0, n));
  } finally { fs.closeSync(fd); }
  return hash.digest('hex');
}
module.exports = { readLibrary, writeLibrary, importExecutable, candidateExecutables, inspectGame, titleFromExe };
