'use strict';
const fs=require('node:fs');
const path=require('node:path');
const SAFE_EXT=new Set(['.js','.cjs','.mjs','.ts','.tsx','.jsx','.css','.html','.json','.md','.yml','.yaml','.rs','.py']);
const OMIT=/^(?:node_modules|\.git|dist|build|\.next|coverage|\.vercel|\.env(?:\..*)?|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i;
function collectCode(folder,{maxFiles=32,maxChars=65000}={}){
  const root=fs.realpathSync(folder), files=[];let chars=0;
  const pending=[{folder:root,depth:0}];
  while(pending.length&&files.length<maxFiles&&chars<maxChars){
    const current=pending.shift();let entries;
    try{entries=fs.readdirSync(current.folder,{withFileTypes:true});}catch{continue;}
    for(const entry of entries){
      if(OMIT.test(entry.name)||entry.isSymbolicLink())continue;
      const abs=path.join(current.folder,entry.name);
      if(entry.isDirectory()&&current.depth<5)pending.push({folder:abs,depth:current.depth+1});
      if(!entry.isFile()||!SAFE_EXT.has(path.extname(entry.name).toLowerCase()))continue;
      if(files.length>=maxFiles||chars>=maxChars)break;
      if(fs.statSync(abs).size>30000)continue;
      let content=fs.readFileSync(abs,'utf8');
      if(content.includes('\0'))continue;
      content=content.slice(0,Math.min(18000,maxChars-chars));
      // Do not transmit obvious assignment-style secrets; avoid pretending this is complete DLP.
      content=content.replace(/((?:api[_-]?key|secret|password|token|private[_-]?key)\s*[:=]\s*['"`])([^'"`\r\n]{5,})(['"`])/gi,'$1[REDACTED]$3');
      chars+=content.length;
      files.push({path:path.relative(root,abs).split(path.sep).join('/'),content});
    }
  }
  return {files,totalChars:chars,warning:'Review the preview before sending. Automated redaction cannot guarantee secret detection.'};
}
module.exports={collectCode};
