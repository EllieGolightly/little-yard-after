import { mkdir, cp, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname,'..');
const out = resolve(root,'dist');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for (const path of ['index.html','manifest.webmanifest','src','public']) await cp(resolve(root,path),resolve(out,path),{recursive:true});
console.log('静态网站已生成到 dist/');

// Preserve the source modules and also build a double-clickable offline edition.
const modules = ['pwa', 'data', 'legacy', 'engine', 'storage', 'scene', 'life', 'app'];
let script = 'const __yardModules = {};\n';
for (const name of modules) {
  let source = await readFile(resolve(root, `src/${name}.js`), 'utf8');
  const exported = [...source.matchAll(/^export (?:const|(?:async )?function) (\w+)/gm)].map(match => match[1]);
  source = source.replace(/^import \{([^}]+)\} from '\.\/(\w+)\.js';$/gm, (_, names, module) => `const {${names}} = __yardModules.${module};`)
    .replace(/^export default [^;]+;$/gm, '')
    .replace(/^export (const|(?:async )?function) /gm, '$1 ');
  if (/^(?:import|export) /m.test(source)) throw new Error(`Unsupported module syntax in ${name}`);
  script += `__yardModules.${name} = (() => {\n${source}\nreturn { ${exported.join(', ')} };\n})();\n`;
}
const css = await readFile(resolve(root,'src/styles.css'),'utf8');
const favicon = await readFile(resolve(root,'public/favicon.svg'),'utf8');
let html = await readFile(resolve(root,'index.html'),'utf8');
html = html.replace(/    <link rel="(?:manifest|apple-touch-icon)"[^>]+>\n/g, '').replace('href="./public/favicon.svg"',`href="data:image/svg+xml,${encodeURIComponent(favicon)}"`)
  .replace('<link rel="stylesheet" href="./src/styles.css" />',()=>`<style>${css}</style>`)
  .replace('<script type="module" src="./src/app.js"></script>',()=>`<script type="module">${script.replaceAll('</script','<\\/script')}</script>`);
await mkdir(resolve(root,'outputs'),{recursive:true});
await writeFile(resolve(root,'outputs/小院之后.html'),html);
console.log('双击离线版已生成到 outputs/小院之后.html');

const assets = ['./', './index.html', './manifest.webmanifest', ...modules.map(name=>`./src/${name}.js`), './src/styles.css', './public/favicon.svg', './public/icon-192.png', './public/icon-512.png', './public/icon-maskable-512.png', './public/apple-touch-icon.png'];
const hash = createHash('sha256');
for (const path of assets.filter(path=>path!=='./')) hash.update(await readFile(resolve(out,path)));
const template = await readFile(resolve(root,'scripts/sw-template.js'),'utf8');
hash.update(template);
const worker = template.replace('__BUILD_VERSION__',hash.digest('hex').slice(0,16)).replace('__PRECACHE_ASSETS__',JSON.stringify(assets));
await writeFile(resolve(out,'sw.js'),worker);
await writeFile(resolve(out,'.nojekyll'),'');
console.log('PWA 离线缓存与图标清单已生成。');
