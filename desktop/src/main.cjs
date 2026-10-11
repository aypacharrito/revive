'use strict';
const { app, BrowserWindow, ipcMain, dialog, safeStorage, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const { readLibrary, writeLibrary, importExecutable, candidateExecutables, inspectGame } = require('./core/library.cjs');
const { createSnapshot, listSnapshots, restoreSnapshot, unpackSaveDirectory } = require('./core/backups.cjs');
const { validateEndpoint, uploadLatest, downloadLatest } = require('./core/cloud.cjs');
let win;
const resolveFiles = () => ({
  library: path.join(app.getPath('userData'), 'games.json'),
  settings: path.join(app.getPath('userData'), 'settings.json'),
  backups: path.join(app.getPath('userData'), 'backups')
});
const listGames = () => readLibrary(resolveFiles().library);
function selectedGame(id) {
  const game = listGames().find(g => g.id === id);
  if (!game) throw new Error('This game is not in your library.');
  return game;
}
function setGame(id, update) {
  const games = listGames().map(g => g.id === id ? { ...g, ...update } : g);
  writeLibrary(resolveFiles().library, games);
  return games.find(g => g.id === id);
}
function requireSecretSafe() {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('OS credential encryption is not available. Cloud passwords and tokens cannot be saved safely on this machine.');
}
function encryptedSave(value) {
  requireSecretSafe();
  return safeStorage.encryptString(value).toString('base64');
}
function encryptedLoad(value) {
  if (!value) return '';
  requireSecretSafe();
  return safeStorage.decryptString(Buffer.from(value, 'base64'));
}
function settings() {
  try { return JSON.parse(fs.readFileSync(resolveFiles().settings, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; }
}
function settingsPublic() {
  const s = settings();
  return { cloudUrl: s.cloudUrl || '', cloudUser: s.cloudUser || '', cloudReady: !!s.cloudSecret, aiUrl: s.aiUrl || '', aiReady: !!s.aiSecret };
}
function storeSettings(partial) {
  const old = settings();
  const next = { ...old };
  if ('cloudUrl' in partial) { if (partial.cloudUrl) validateEndpoint(partial.cloudUrl); next.cloudUrl = (partial.cloudUrl || '').trim(); }
  if ('cloudUser' in partial) next.cloudUser = (partial.cloudUser || '').trim();
  if ('cloudPassword' in partial && partial.cloudPassword) next.cloudSecret = encryptedSave(partial.cloudPassword);
  if ('aiUrl' in partial) { if (partial.aiUrl) validateEndpoint(partial.aiUrl); next.aiUrl = (partial.aiUrl || '').replace(/\/$/, ''); }
  if ('aiToken' in partial && partial.aiToken) next.aiSecret = encryptedSave(partial.aiToken);
  fs.mkdirSync(path.dirname(resolveFiles().settings), { recursive: true });
  fs.writeFileSync(resolveFiles().settings, JSON.stringify(next, null, 2), { mode: 0o600 });
  return settingsPublic();
}
function cloudSettings() {
  const s = settings();
  if (!s.cloudUrl || !s.cloudUser || !s.cloudSecret) throw new Error('Configure WebDAV folder URL, username and password in Settings first.');
  return { url: s.cloudUrl, user: s.cloudUser, password: encryptedLoad(s.cloudSecret) };
}
function register() {
  ipcMain.handle('library:list', () => listGames());
  ipcMain.handle('library:chooseExe', async () => {
    const choice = await dialog.showOpenDialog(win, { title: 'Select a game executable you own', properties: ['openFile'], filters: [{ name: 'Windows Games', extensions: ['exe'] }] });
    if (choice.canceled) return null;
    const result = importExecutable(choice.filePaths[0], listGames());
    if (!result.existed) writeLibrary(resolveFiles().library, result.games);
    return result.game;
  });
  ipcMain.handle('library:scanFolder', async () => {
    const choice = await dialog.showOpenDialog(win, { title: 'Scan your installed game folder', properties: ['openDirectory'] });
    if (choice.canceled) return [];
    return candidateExecutables(choice.filePaths[0]).map(exe => ({ exe, name: path.basename(exe) }));
  });
  ipcMain.handle('library:addCandidate', (_e, exe) => {
    const result = importExecutable(exe, listGames());
    if (!result.existed) writeLibrary(resolveFiles().library, result.games);
    return result.game;
  });
  ipcMain.handle('library:remove', (_e, id) => {
    selectedGame(id);
    writeLibrary(resolveFiles().library, listGames().filter(g => g.id !== id));
    return true; // removes launcher entry only, never game files
  });
  ipcMain.handle('library:rename', (_e, id, title) => {
    if (typeof title !== 'string' || !title.trim() || title.length > 100) throw new Error('Enter a game name (1–100 characters).');
    selectedGame(id);
    return setGame(id, { title: title.trim() });
  });
  ipcMain.handle('library:inspect', (_e, id) => inspectGame(selectedGame(id)));
  ipcMain.handle('library:reveal', (_e, id) => shell.showItemInFolder(selectedGame(id).exe));
  ipcMain.handle('library:play', async (_e, id) => {
    const game = selectedGame(id);
    if (!fs.existsSync(game.exe)) throw new Error('Executable missing. Please import the game again.');
    const started = Date.now();
    const child = spawn(game.exe, [], { cwd: game.root, shell: false, windowsHide: false, stdio: 'ignore' });
    const launched = await new Promise((resolve, reject) => {
      child.once('spawn', () => resolve(true));
      child.once('error', reject);
    });
    child.once('exit', () => {
      const current = listGames().find(g => g.id === id);
      if (current) setGame(id, { minutes: (current.minutes || 0) + Math.max(1, Math.round((Date.now() - started) / 60000)) });
      if (win && !win.isDestroyed()) win.webContents.send('library:changed');
    });
    return launched;
  });
  ipcMain.handle('save:chooseDirectory', async (_e, id) => {
    selectedGame(id);
    const choice = await dialog.showOpenDialog(win, { title: 'Select this game’s save data directory', properties: ['openDirectory'] });
    if (choice.canceled) return null;
    return setGame(id, { saveDir: fs.realpathSync(choice.filePaths[0]) });
  });
  ipcMain.handle('save:list', (_e, id) => listSnapshots(selectedGame(id), resolveFiles().backups));
  ipcMain.handle('save:backup', (_e, id) => createSnapshot(selectedGame(id), resolveFiles().backups));
  ipcMain.handle('save:restore', (_e, id, name) => restoreSnapshot(selectedGame(id), resolveFiles().backups, name));
  ipcMain.handle('cloud:upload', async (_e, id) => {
    const game = selectedGame(id);
    const snapshot = createSnapshot(game, resolveFiles().backups);
    return uploadLatest(cloudSettings(), id, snapshot.file);
  });
  ipcMain.handle('cloud:restore', async (_e, id) => {
    const game = selectedGame(id);
    if (!game.saveDir || !fs.existsSync(game.saveDir)) throw new Error('Set an existing save directory before restoring.');
    const buf = await downloadLatest(cloudSettings(), id);
    // Save fetched blob to locally tracked snapshot; restore creates a safety backup first.
    const folder = path.join(resolveFiles().backups, id);
    fs.mkdirSync(folder, { recursive: true });
    const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}.revive`;
    fs.writeFileSync(path.join(folder, filename), buf, { flag: 'wx' });
    return restoreSnapshot(game, resolveFiles().backups, filename);
  });
  ipcMain.handle('settings:get', settingsPublic);
  ipcMain.handle('settings:save', (_e, partial) => storeSettings(partial));
  ipcMain.handle('ai:diagnose', async (_e, id) => {
    const game = selectedGame(id);
    const s = settings();
    if (!s.aiUrl || !s.aiSecret) throw new Error('Configure your REVIVE cloud API URL and owner token in Settings.');
    const report = inspectGame(game);
    const response = await fetch(`${s.aiUrl}/api/diagnose`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${encryptedLoad(s.aiSecret)}` }, body: JSON.stringify({ report }), signal: AbortSignal.timeout(40000), redirect: 'error' });
    let json = {};
    try { json = await response.json(); } catch {}
    if (!response.ok) throw new Error(json.error || `AI server HTTP ${response.status}`);
    return json.advice || 'No advice returned.';
  });
}
app.whenReady().then(() => {
  register();
  win = new BrowserWindow({ width: 1390, height: 880, minWidth: 960, minHeight: 640, backgroundColor: '#070a14', title: 'REVIVE', autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  win.loadFile(path.join(__dirname, '../ui/index.html'));
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
