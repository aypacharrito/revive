'use strict';
(() => {
  document.getElementById('year').textContent = new Date().getFullYear();
  const installer = document.getElementById('installer-link');
  const label = document.getElementById('installer-label');
  const status = document.getElementById('release-status');
  // Keep an official download route available if release lookup is rate-limited.
  const unavailable = (message) => {
    installer.href = 'https://github.com/aypacharrito/revive/releases';
    installer.removeAttribute('download');
    installer.removeAttribute('aria-disabled');
    installer.classList.remove('disabled-action');
    label.textContent = 'View official Windows downloads';
    status.textContent = message;
  };
  unavailable('Checking whether the official installer is available…');
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 10000);
  const loadReleases=async()=>{
    try{const cached=await fetch('/api/installer',{signal:abort.signal});if(cached.ok){const data=await cached.json();if(data.release)return [data.release];}}catch{}
    const response=await fetch('https://api.github.com/repos/aypacharrito/revive/releases?per_page=20',{signal:abort.signal,headers:{Accept:'application/vnd.github+json'}});
    if(!response.ok)throw Error('Could not verify releases');return response.json();
  };
  loadReleases()
    .then(releases => {
      for (const release of releases) {
        if (release.draft) continue;
        const asset = (release.assets || []).find(item => /^REVIVE-Setup-[a-zA-Z0-9._-]+\.exe$/i.test(item.name) && item.browser_download_url && item.size > 1000000);
        if (!asset) continue;
        const url = new URL(asset.browser_download_url);
        if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !url.pathname.startsWith('/aypacharrito/revive/releases/download/')) continue;
        installer.href = url.href;
        installer.removeAttribute('aria-disabled');
        installer.classList.remove('disabled-action');
        installer.setAttribute('download', '');
        label.textContent = 'Download REVIVE for Windows';
        status.textContent = release.tag_name + (release.prerelease ? ' · Preview release' : ' · Windows installer') + ' · Free download';
        return;
      }
      unavailable('Check the official releases page for Windows installers.');
    }).catch(() => unavailable('Release lookup is temporarily unavailable. You can still open the official Windows downloads.'))
    .finally(() => clearTimeout(timer));
  installer.addEventListener('click', e => { if (installer.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
  const donate = document.getElementById('donation-link');
  const note = document.getElementById('donation-note');
  // The server reads DONATION_URL from Vercel, keeping configuration off the client.
  fetch('/api/donation-config', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (!data || !data.enabled) return;
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || !/^(buy\.stripe\.com|donate\.stripe\.com|paypal\.me|www\.paypal\.com)$/.test(url.hostname)) return;
      donate.href = url.href;
      donate.target = '_blank';
      donate.rel = 'noopener noreferrer';
      donate.removeAttribute('aria-disabled');
      donate.classList.remove('disabled-action');
      note.textContent = 'Optional donations are processed by the payment provider. REVIVE is free.';
    }).catch(() => {});
  donate.addEventListener('click', e => {
    if (donate.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      note.textContent = 'Donations are not yet connected. REVIVE is free and no payment is required.';
    }
  });
})();
