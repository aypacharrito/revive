'use strict';
/** Display-only update state reducer. Does not install or download software. */
const PHASES = new Set(['development', 'checking', 'current', 'available', 'downloading', 'ready', 'error']);
const compact = value => String(value || '').slice(0, 220);
function normalizeProgress(data = {}) {
  const total = Number(data.total) || 0;
  const transferred = Math.max(0, Number(data.transferred) || 0);
  const percent = total > 0 ? transferred / total * 100 : Number(data.percent) || 0;
  return { percent: Math.min(100, Math.max(0, Math.round(percent))), transferred, total, bytesPerSecond: Math.max(0, Number(data.bytesPerSecond) || 0) };
}
function transition(previous, event, payload = {}) {
  const phase = PHASES.has(event) ? event : previous.phase;
  const next = { ...previous, phase, updatedAt: Date.now() };
  if (event === 'available') next.version = compact(payload.version);
  if (event === 'ready') { next.version = compact(payload.version || next.version); next.progress = { ...(next.progress || {}), percent: 100 }; }
  if (event === 'downloading') next.progress = normalizeProgress(payload);
  if (event === 'error') next.message = compact(payload.message || 'Unable to check for updates');
  if (event !== 'error') next.message = '';
  if (event === 'current' || event === 'checking') next.progress = null;
  return next;
}
function isSafeRestart(gameSessions, phase) { return phase === 'ready' && gameSessions === 0; }
module.exports = { normalizeProgress, transition, isSafeRestart };
