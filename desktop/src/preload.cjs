'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);
contextBridge.exposeInMainWorld('revive', Object.freeze({
  listGames: () => invoke('library:list'),
  importExe: () => invoke('library:chooseExe'),
  scanFolder: () => invoke('library:scanFolder'),
  importCandidate: exe => invoke('library:addCandidate', exe),
  removeGame: id => invoke('library:remove', id),
  renameGame: (id, name) => invoke('library:rename', id, name),
  inspectGame: id => invoke('library:inspect', id),
  launchGame: id => invoke('library:play', id),
  reveal: id => invoke('library:reveal', id),
  pickSaveDir: id => invoke('save:chooseDirectory', id),
  listBackups: id => invoke('save:list', id),
  backup: id => invoke('save:backup', id),
  restore: (id, name) => invoke('save:restore', id, name),
  cloudUpload: id => invoke('cloud:upload', id),
  cloudRestore: id => invoke('cloud:restore', id),
  settings: () => invoke('settings:get'),
  saveSettings: settings => invoke('settings:save', settings),
  aiDiagnose: id => invoke('ai:diagnose', id),
  onLibraryChanged: fn => { ipcRenderer.on('library:changed', fn); }
}));
