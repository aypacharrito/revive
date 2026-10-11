'use strict';
const { transition, isSafeRestart } = require('./core/update-policy.cjs');

/**
 * Packaged Windows NSIS builds only. The installed application is updated;
 * imported games, ROMs, userData and backup directories are NOT in the installer.
 * GitHub Releases are the default feed configured in desktop/package.json.
 */
function createUpdateService({ app, emit, sessions, injectedUpdater = null, platform = process.platform }) {
  const enabled = platform === 'win32' && app.isPackaged;
  const autoUpdater = enabled ? (injectedUpdater || require('electron-updater').autoUpdater) : null;
  let state = { phase: enabled ? 'checking' : 'development', version: app.getVersion(), enabled, progress: null, message: '', updatedAt: Date.now() };
  let checking = null;
  let timer;
  let started = false;
  function publish(phase, payload = {}) { state = transition(state, phase, payload); emit({ ...state }); }
  const safeError = error => String(error?.message || error || 'Unknown update error').slice(0, 220);
  if (enabled) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;
    // Don't enable unrestricted update headers or user-provided update URLs.
    autoUpdater.on('checking-for-update', () => publish('checking'));
    autoUpdater.on('update-available', info => publish('available', info));
    autoUpdater.on('update-not-available', () => publish('current'));
    autoUpdater.on('download-progress', progress => publish('downloading', progress));
    autoUpdater.on('update-downloaded', info => publish('ready', info));
    autoUpdater.on('error', error => publish('error', { message: safeError(error) }));
  }
  async function check() {
    if (!enabled) return { ...state };
    if (state.phase === 'ready' || state.phase === 'downloading') return { ...state };
    if (checking) return checking;
    checking = (async () => {
      try { await autoUpdater.checkForUpdates(); }
      catch (error) { publish('error', { message: safeError(error) }); }
      finally { checking = null; }
      return { ...state };
    })();
    return checking;
  }
  function start() {
    if (started || !enabled) return;
    started = true;
    // Never block app startup or prevent offline gaming.
    const immediate = setTimeout(() => void check(), 4200);
    immediate.unref?.();
    timer = setInterval(() => void check(), 4 * 60 * 60 * 1000);
    timer.unref?.();
  }
  function installNow() {
    if (!enabled || !isSafeRestart(sessions.size, state.phase)) {
      throw new Error(sessions.size ? 'Close your running games before restarting REVIVE.' : 'No fully downloaded update is ready.');
    }
    // Explicit action only; ordinary automatic updates install on app exit.
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
    return true;
  }
  function stop() { if (timer) clearInterval(timer); }
  return { status: () => ({ ...state }), start, check, installNow, stop };
}
module.exports = { createUpdateService };
