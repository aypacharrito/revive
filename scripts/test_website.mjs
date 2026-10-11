import { strict as assert } from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const dir of ['public','cloud/public']) {
  for(const filename of ['index.html','styles.css','site.js']) {
    assert(existsSync(path.join(root,dir,filename)), `${dir}/${filename} missing`);
  }
  const html=readFileSync(path.join(root,dir,'index.html'),'utf8');
  const js=readFileSync(path.join(root,dir,'site.js'),'utf8');
  assert.match(html,/<title>REVIVE/);
  assert.match(html,/id="download"/);
  assert.match(html,/id="installer-link"/);
  assert.match(html,/id="donation-link"/);
  assert.match(html,/href="\/styles\.css"/);
  assert.match(html,/src="\/site\.js"/);
  assert.match(js,/REVIVE-Setup/);
  assert.match(js,/browser_download_url/);
  assert.match(js,/donationURL = ''/);
  assert.match(html,/No account needed for local games/);
  assert.doesNotMatch(html,/purchase (the|a) game/i);
}
for(const filename of ['index.html','styles.css','site.js']){
  const rootBytes=readFileSync(path.join(root,'public',filename));
  const cloudBytes=readFileSync(path.join(root,'cloud/public',filename));
  assert(rootBytes.equals(cloudBytes),`root and cloud website versions differ: ${filename}`);
}
console.log('REVIVE website checks: all passed (assets, links, CTA states, site copies).');
