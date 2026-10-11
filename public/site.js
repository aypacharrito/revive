'use strict';
(() => {
  document.getElementById('year').textContent = new Date().getFullYear();
  const installer = document.getElementById('installer-link');
  const label = document.getElementById('installer-label');
  const status = document.getElementById('release-status');
  // Do not lead visitors to GitHub source or an empty Releases page.
  const unavailable = (message) => {
    installer.href = '#download';
    installer.removeAttribute('download');
    installer.setAttribute('aria-disabled', 'true');
    installer.classList.add('disabled-action');
    label.textContent = 'Windows installer coming soon';
    status.textContent = message;
  };
  unavailable('Checking whether the official installer is available…');
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 6500);
  fetch('https://api.github.com/repos/aypacharrito/revive/releases?per_page=20', {
    signal: abort.signal, headers: { Accept: 'application/vnd.github+json' }
  }).then(response => response.ok ? response.json() : Promise.reject(Error('Could not verify releases')))
    .then(releases => {
      for (const release of releases) {
        if (release.draft) continue;
        const asset = (release.assets || []).find(item => /^REVIVE-Setup-[a-zA-Z0-9._-]+\.exe$/i.test(item.name) && item.browser_download_url && item.size > 1000000);
        if (!asset) continue;
        const url = new URL(asset.browser_download_url);
        if (url.protocol !== 'https:' || url.hostname !== 'github.com') continue;
        installer.href = url.href;
        installer.removeAttribute('aria-disabled');
        installer.classList.remove('disabled-action');
        installer.setAttribute('download', '');
        label.textContent = 'Download REVIVE for Windows';
        status.textContent = release.tag_name + (release.prerelease ? ' · Preview release' : ' · Windows installer') + ' · Free download';
        return;
      }
      unavailable('The Windows installer is being prepared. The download button will activate automatically once a public installer is released.');
    }).catch(() => unavailable('An installer is not verified at the moment. Please check again later.'))
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
