#!/usr/bin/env python3
"""Read public GitHub release metadata for launcher architecture research.
No game files, proprietary application code, account data, or login secrets are collected.
GitHub public API rate limits apply. Respect its terms and rate limits.
"""
import json
import pathlib
import urllib.error
import urllib.request
from datetime import datetime, timezone

REPOS = [
    'JosefNemec/Playnite',
    'Heroic-Games-Launcher/HeroicGamesLauncher',
    'legendary-gl/legendary',
    'lutris/lutris',
    'ValveSoftware/GameNetworkingSockets',
]

def get_releases(repo):
    url = f'https://api.github.com/repos/{repo}/releases?per_page=3'
    req = urllib.request.Request(url, headers={'User-Agent':'REVIVE-research/0.1', 'Accept':'application/vnd.github+json'})
    with urllib.request.urlopen(req, timeout=15) as response:
        data=json.load(response)
    return [{'tag':entry.get('tag_name'), 'published_at':entry.get('published_at'), 'url':entry.get('html_url'), 'notes':(entry.get('body') or '')[:1000]} for entry in data]

def main():
    output={'checked_at':datetime.now(timezone.utc).isoformat(), 'notice':'Public release metadata only, no automatic dependency installs', 'repositories':{}}
    for repo in REPOS:
        try:
            output['repositories'][repo]={'releases':get_releases(repo)}
        except (urllib.error.URLError,TimeoutError,ValueError) as exc:
            output['repositories'][repo]={'error':str(exc)[:160]}
    dest=pathlib.Path(__file__).resolve().parents[1] / 'docs' / 'research-updates.json'
    dest.write_text(json.dumps(output, indent=2), encoding='utf-8')
    print(f'Public release metadata written to {dest}')

if __name__=='__main__': main()
