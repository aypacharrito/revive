import { strict as assert } from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
const root=process.cwd();
for (const d of ['public','cloud/public']) {
 const html=readFileSync(path.join(root,d,'index.html'),'utf8');
 const js=readFileSync(path.join(root,d,'site.js'),'utf8');
 assert.match(html,/id="installer-link"/);
 assert.match(html,/id="donation-link"/);
 assert.doesNotMatch(html,/Download source code/i);
 assert.doesNotMatch(html,/Check Windows installer/i);
 assert.match(html,/id="features"/);
 assert.match(html,/id="support"/);
 assert.match(html,/id="download"/);
 assert.match(js,/\.exe/);
 assert.match(js,/donation-config/);
 assert.match(js,/aria-disabled/);
 assert.doesNotMatch(js,/installer.href = releasesPage/);
 for (const f of ['index.html','styles.css','site.js']) assert(existsSync(path.join(root,d,f)));
}
for (const f of ['index.html','styles.css','site.js']) {
 assert.equal(readFileSync(path.join(root,'public',f),'utf8'),readFileSync(path.join(root,'cloud/public',f),'utf8'));
}
assert(existsSync(path.join(root,'cloud/api/donation-config.js')));
for (const config of ['vercel.json','cloud/vercel.json'])assert(JSON.parse(readFileSync(path.join(root,config),'utf8')).rewrites.some(r=>r.source==='/download'&&r.destination==='/index.html'));
console.log('REVIVE website and download route checks passed');
