import { mkdir, cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname,'..');
const out = resolve(root,'dist');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for (const path of ['index.html','src','public']) await cp(resolve(root,path),resolve(out,path),{recursive:true});
console.log('静态网站已生成到 dist/');
