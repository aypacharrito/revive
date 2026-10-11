'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { verifiedDownload, validateDownload } = require('./verified-download.cjs');
const ACTIVE = new Set(['queued', 'downloading', 'pausing', 'cancelling']);
const MAX_CATALOG_BYTES = 512 * 1024 ** 3;

function createDownloadManager({ file, folder, resolveCatalog, transfer = verifiedDownload, emit = () => {}, now = Date.now }) {
  const jobs = new Map();
  const active = new Map();
  function publicJob(job) {
    const { descriptor, ...visible } = job;
    return { ...visible, resumable: !!job.cloudGame };
  }
  function save() {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify([...jobs.values()], null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }
  function change(job, partial, persist = true) {
    Object.assign(job, partial, { updatedAt: new Date(now()).toISOString() });
    if (persist) save();
    emit(publicJob(job));
  }
  try {
    const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(stored)) throw Error('Invalid download history.');
    for (const entry of stored.slice(-100)) {
      try {
        if (!/^[a-f0-9-]{36}$/i.test(entry.id)) continue;
        if (entry.cloudGame && !/^[a-z0-9][a-z0-9-]{2,55}$/.test(entry.cloudGame)) continue;
        // Signed URLs are short-lived credentials: only catalog IDs and checksums are stored.
        const descriptor = validateDownload({ ...entry.descriptor, url: entry.cloudGame ? 'https://revive.invalid/package' : entry.descriptor.url });
        if (entry.cloudGame) delete descriptor.url;
        const status = ACTIVE.has(entry.status) ? (entry.cloudGame ? 'paused' : 'interrupted') : entry.status;
        if (!['paused', 'interrupted', 'complete', 'error', 'cancelled'].includes(status)) continue;
        jobs.set(entry.id, { id: entry.id, descriptor, name: descriptor.fileName, cloudGame: entry.cloudGame || null,
          status, bytes: Math.max(0, Number(entry.bytes) || 0), total: Number(entry.total) || null,
          bytesPerSecond: 0, createdAt: entry.createdAt, updatedAt: entry.updatedAt,
          error: entry.status === status ? String(entry.error || '').slice(0, 300) : 'Transfer interrupted when REVIVE closed. Retry when ready.' });
      } catch { /* Skip invalid records without losing valid history. */ }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Preserve damaged history for recovery, then start a new list.
      fs.copyFileSync(file, file + '.recovery-' + now());
    }
  }
  function checkCapacity(job) {
    if (active.size >= 3) throw Error('Three downloads may run at once. Pause one before starting another.');
    if ([...active.keys()].some(id => jobs.get(id)?.name.toLowerCase() === job.name.toLowerCase())) {
      throw Error('This file is already downloading.');
    }
    if (fs.existsSync(path.join(folder, job.name))) throw Error('Destination already exists. Move or rename that file before retrying.');
  }
  function run(job) {
    checkCapacity(job);
    const controller = new AbortController();
    const entry = { controller, stop: null, done: null };
    active.set(job.id, entry);
    change(job, { status: 'queued', error: '', bytesPerSecond: 0 });
    entry.done = Promise.resolve().then(async () => {
      try {
        const descriptor = job.cloudGame ? validateDownload(await resolveCatalog(job.cloudGame), { allowSignedR2: true }) : job.descriptor;
        if (descriptor.sha256 !== job.descriptor.sha256 || descriptor.fileName !== job.name) {
          throw Error('The published package changed. Start a new download from the cloud library.');
        }
        controller.signal.throwIfAborted();
        change(job, { status: 'downloading' });
        let lastAt = now(), lastBytes = null;
        const result = await transfer({ ...descriptor, signedR2: !!job.cloudGame }, folder, {
          signal: controller.signal, resume: !!job.cloudGame,
          ...(job.cloudGame ? { maxBytes: MAX_CATALOG_BYTES } : {}),
          onProgress: progress => {
            if (lastBytes === null) lastBytes = progress.resumedBytes || 0;
            const time = now(), elapsed = Math.max(0.001, (time - lastAt) / 1000);
            if (time - lastAt < 180 && progress.bytes !== progress.total) return;
            const speed = Math.max(0, Math.round((progress.bytes - lastBytes) / elapsed));
            lastAt = time; lastBytes = progress.bytes;
            change(job, { ...progress, bytesPerSecond: speed }, false);
          }
        });
        change(job, { status: 'complete', bytes: result.bytes, total: result.bytes, bytesPerSecond: 0, error: '' });
      } catch (error) {
        change(job, { status: entry.stop || 'error', bytesPerSecond: 0, error: entry.stop ? '' : error.message.slice(0, 300) });
      } finally { active.delete(job.id); }
    });
    return publicJob(job);
  }
  function add(descriptor, cloudGame = null) {
    const job = { id: crypto.randomUUID(), name: descriptor.fileName, descriptor: { ...descriptor }, cloudGame,
      status: 'queued', bytes: 0, total: null, createdAt: new Date(now()).toISOString() };
    if (cloudGame) delete job.descriptor.url;
    checkCapacity(job);
    jobs.set(job.id, job);
    // Bound history while preserving active and resumable jobs.
    for (const [id, old] of jobs) {
      if (jobs.size <= 100) break;
      if (['complete', 'cancelled'].includes(old.status) && !active.has(id)) jobs.delete(id);
    }
    return run(job);
  }
  async function stop(id, status) {
    const entry = active.get(id), job = jobs.get(id);
    if (!entry) return false;
    if (status === 'paused' && !job.cloudGame) throw Error('This source supports retry from the beginning. Only cloud games can pause and resume.');
    entry.stop = status;
    change(job, { status: status === 'paused' ? 'pausing' : 'cancelling' });
    entry.controller.abort();
    await entry.done;
    return true;
  }
  return {
    list: () => [...jobs.values()].map(publicJob),
    start: parameters => add(validateDownload(parameters)),
    startCatalog: async id => {
      if (!/^[a-z0-9][a-z0-9-]{2,55}$/.test(id)) throw Error('Invalid catalog game.');
      const descriptor = validateDownload(await resolveCatalog(id), { allowSignedR2: true });
      return add(descriptor, id);
    },
    retry: id => {
      const job = jobs.get(id);
      if (!job || !['paused', 'error', 'interrupted', 'cancelled'].includes(job.status)) throw Error('This download cannot be retried.');
      return run(job);
    },
    pause: id => stop(id, 'paused'),
    cancel: id => stop(id, 'cancelled'),
    reveal: id => {
      const job = jobs.get(id);
      if (!job || job.status !== 'complete') throw Error('Complete the download first.');
      const target = path.join(folder, job.name);
      if (!fs.existsSync(target)) throw Error('This download was moved or removed.');
      return target;
    },
    clearFinished: () => {
      for (const [id, job] of jobs) if (['complete', 'cancelled'].includes(job.status) && !active.has(id)) jobs.delete(id);
      save();
      return [...jobs.values()].map(publicJob);
    },
    shutdown: () => { for (const [id] of active) stop(id, jobs.get(id).cloudGame ? 'paused' : 'interrupted').catch(() => {}); }
  };
}
module.exports = { createDownloadManager };
