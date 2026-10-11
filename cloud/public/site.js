'use strict';
(() => {
  document.getElementById('year').textContent = new Date().getFullYear();
  const installer = document.getElementById('installer-link');
  const label = document.getElementById('installer-label');
  const status = document.getElementById('release-status');
  const releasesPage = 'https://github.com/aypacharrito/revive/releases';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);
  fetch('https://api.github.com/repos/aypacharrito/revive/releases', {
    signal: controller.signal,
    headers: { Accept: 'application/vnd.github+json' }
  })
  .then(response => response.ok ? response.json() : Promise.reject(new Error('Release API not available')))
  .then(releases => {
    for (const release of releases) {
      if (release.draft) continue;
      const exe = (release.assets || []).find(asset => /^REVIVE-Setup-[\w.-]+\.exe$/i.test(asset.name));
      if (!exe) continue;
      installer.href = exe.browser_download_url;
      installer.removeAttribute('target');
      installer.setAttribute('download', '');
      label.textContent = 'Download REVIVE for Windows';
      status.textContent = release.tag_name + (release.prerelease ? ' · Preview build · ' : ' · ') + 'Windows installer available · Free download';
      return;
    }
    throw new Error('No public Windows installer');
  })
  .catch(() => {
    installer.href = releasesPage;
    installer.target = '_blank';
    installer.removeAttribute('download');
    label.textContent = 'Check Windows installer';
    status.textContent = 'A public Windows installer has not been published yet. Download source code or check GitHub Releases.';
  })
  .finally(() => clearTimeout(timeout));

  // A REAL donation link supplied by the owner should replace the empty string.
  // Example accepted destination: an actual Stripe Payment Link, PayPal donation URL.
  const donationURL = '';
  const donate = document.getElementById('donation-link');
  const note = document.getElementById('donation-note');
  if (/^https:\/\/(buy\.stripe\.com|donate\.stripe\.com|paypal\.me|www\.paypal\.com)\//i.test(donationURL)) {
    donate.href = donationURL;
    donate.target = '_blank';
    donate.rel = 'noopener noreferrer';
    note.textContent = 'Optional donations are processed securely by the payment provider.';
  } else {
    donate.addEventListener('click', event => {
      event.preventDefault();
      note.textContent = 'Donation checkout is not connected yet. REVIVE is free to use.';
    });
  }
})();
