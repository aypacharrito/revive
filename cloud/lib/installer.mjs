const RELEASES_URL='https://api.github.com/repos/aypacharrito/revive/releases?per_page=20';
export function selectInstaller(releases){
 if(!Array.isArray(releases))return null;
 for(const release of releases){
  if(release.draft)continue;
  const asset=(release.assets||[]).find(item=>/^REVIVE-Setup-[a-zA-Z0-9._-]+\.exe$/i.test(item.name)&&item.size>3000000&&typeof item.browser_download_url==='string'&&item.browser_download_url.startsWith('https://github.com/aypacharrito/revive/releases/download/'));
  if(asset)return {tag_name:release.tag_name,prerelease:!!release.prerelease,assets:[{name:asset.name,size:asset.size,browser_download_url:asset.browser_download_url}]};
 }
 return null;
}
export async function officialInstaller(request=fetch){
 const response=await request(RELEASES_URL,{headers:{Accept:'application/vnd.github+json','User-Agent':'REVIVE-installer'},signal:AbortSignal.timeout(4500)});
 if(!response.ok)throw Error('GitHub release lookup unavailable.');
 return selectInstaller(await response.json());
}
