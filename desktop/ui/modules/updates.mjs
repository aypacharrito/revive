import { icon } from './icons.mjs';
import { escapeHTML as esc } from './format.mjs';

const fmtSize = n => !n ? '' : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB/s` : `${Math.round(n / 1024)} KB/s`;
const statusText = {
  development: ['Developer mode', 'Source builds are updated with GitHub Desktop. Auto-updates activate in the installed app.'],
  checking: ['Checking for updates', 'Looking for a new REVIVE release…'],
  current: ['You’re up to date', 'The latest release is already installed.'],
  available: ['New release found', 'Preparing the next version…'],
  downloading: ['Updating REVIVE', 'Downloading in the background. You can keep playing.'],
  ready: ['Update downloaded', 'REVIVE will install it automatically when you close the app.'],
  error: ['Update service unavailable', 'REVIVE still works offline. Try checking again later.']
};
export function renderUpdateStatus(state, detailed = false) {
  const v = state || {phase:'development',version:'0.4.0'};
  const phase=statusText[v.phase] ? v.phase : 'development';
  const [name,detail] = statusText[phase];
  const active=['checking','available','downloading'].includes(phase);
  const pct=Math.min(100,Math.max(0,Number(v.progress?.percent)||0));
  return `<div class="updater-core ${active?'busy':''}" role="status" aria-live="polite">
    <div class="updater-badge" aria-hidden="true"><div class="updater-halo"></div><strong>R</strong><i>✦</i></div>
    <div class="updater-copy"><div class="updater-name">${esc(name)}${v.version && phase==='ready'?` <span>v${esc(v.version)}</span>`:''}</div><p>${esc(phase==='error' ? (v.message || detail) : detail)}</p>
    ${phase==='downloading'?`<div class="updater-track"><span style="width:${pct}%"></span></div><small>${pct}%${v.progress?.bytesPerSecond?` · ${esc(fmtSize(v.progress.bytesPerSecond))}`:''}</small>`:''}</div>
    ${detailed?`<div class="updater-actions"><button class="btn subtle" type="button" data-action="update-check" ${active||phase==='ready'||!v.enabled?'disabled':''}>${icon('refresh',15)} Check now</button>${phase==='ready'?`<button class="btn primary" type="button" data-action="update-restart">${icon('check',15)} Restart & install</button>`:''}</div>`:''}
  </div>`;
}
export function updateDock(state) {
  if (!state || !['checking','available','downloading','ready'].includes(state.phase)) return '';
  return `<div class="update-dock ${state.phase==='ready'?'done':''}">${renderUpdateStatus(state)}</div>`;
}
