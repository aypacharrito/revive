'use strict';
const fs = require('node:fs');
function validateEndpoint(url) {
  const parsed = new URL(url);
  if (parsed.username || parsed.password || parsed.hash || parsed.search) throw new Error('Use a clean WebDAV folder URL without embedded credentials or query parameters.');
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) throw new Error('HTTPS is required for cloud backups.');
  return parsed;
}
async function request(url, user, pass, method, body) {
  validateEndpoint(url);
  const headers = { 'Authorization': `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}` };
  if (body) headers['Content-Type'] = 'application/octet-stream';
  const response = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(60000), redirect: 'error' });
  if (!response.ok) throw new Error(`Cloud storage rejected the request (HTTP ${response.status}).`);
  return response;
}
function gameUrl(settings, gameId) {
  const u = validateEndpoint(settings.url);
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  u.pathname += `${encodeURIComponent(gameId)}.revive`;
  return u.toString();
}
async function uploadLatest(settings, gameId, snapshotFile) {
  const stat = fs.statSync(snapshotFile);
  if (stat.size > 130 * 1024 * 1024) throw new Error('Cloud backup exceeds size limit.');
  await request(gameUrl(settings, gameId), settings.user, settings.password, 'PUT', fs.readFileSync(snapshotFile));
  return { bytes: stat.size };
}
async function downloadLatest(settings, gameId) {
  const response = await request(gameUrl(settings, gameId), settings.user, settings.password, 'GET');
  const length = Number(response.headers.get('content-length') || 0);
  if (length > 130 * 1024 * 1024) throw new Error('Cloud backup too large.');
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length > 130 * 1024 * 1024) throw new Error('Cloud backup too large.');
  return buf;
}
module.exports = { validateEndpoint, uploadLatest, downloadLatest };
