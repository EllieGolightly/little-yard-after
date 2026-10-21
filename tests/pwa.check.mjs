import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import vm from 'node:vm';
const read=path=>readFile(new URL('../dist/'+path,import.meta.url),'utf8');
const worker=await read('sw.js');
const scope='https://example.github.io/little-yard-after/';
function harness({offline=false,failInstall=false}={}){
 const listeners={},stores=new Map(),deleted=[],network=[],claimed=[];
 const cache={async addAll(requests){if(failInstall)throw Error('download interrupted');for(const req of requests)stores.set(req.url,new Response(req.url));},async match(key){return stores.get(typeof key==='string'?key:key.url);}};
 const context={URL,Request,Response,Set,Promise,self:{registration:{scope},clients:{claim:async()=>claimed.push(true)},skipWaiting:async()=>{},addEventListener:(name,fn)=>listeners[name]=fn},caches:{open:async()=>cache,keys:async()=>[`little-yard-after:${scope}:old`,'other-app:v1','little-yard-after:https://example.github.io/another/:old'],delete:async key=>deleted.push(key)},fetch:async request=>{network.push(request.url);if(offline)throw Error('offline');return new Response('network');}};
 vm.runInNewContext(worker,context);return {listeners,stores,deleted,network,claimed};
}
const waitEvent=async fn=>{let waiting;fn({waitUntil:p=>waiting=p});await waiting;};
test('Pages subdirectory assets, PWA manifest and PNG icons all resolve',async()=>{
 const html=await read('index.html'),manifest=JSON.parse(await read('manifest.webmanifest'));
 assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
 for(const path of [...html.matchAll(/(?:href|src)="(\.\/[^"?#]+)"/g)].map(m=>m[1]))assert.ok((await stat(new URL('../dist/'+path,import.meta.url))).isFile());
 assert.ok(!/(?:src|href)="\/(?!\/)/.test(html),'must not point to the account root');
 for(const icon of manifest.icons){const b=await readFile(new URL('../dist/'+icon.src,import.meta.url));const [w,h]=icon.sizes.split('x').map(Number);assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);}
 const assets=JSON.parse(worker.match(/const ASSETS = (\[.*?\]);/)[1]);
 for(const file of ['index.html','src/app.js','src/pwa.js','src/engine.js','src/life.js','src/styles.css','manifest.webmanifest'])assert.ok(assets.includes('./'+file));
 for(const path of assets.filter(p=>p!=='./'))assert.ok((await stat(new URL('../dist/'+path,import.meta.url))).isFile());
});
test('a complete cached release opens offline at both project root and index, with query strings',async()=>{
 const h=harness({offline:true});await waitEvent(h.listeners.install);
 for(const path of ['', 'index.html','src/engine.js','src/app.js','manifest.webmanifest','public/icon-192.png']){
  let response;h.listeners.fetch({request:new Request(scope+path+'?from=homescreen'),respondWith:p=>response=p});
  assert.equal((await response).status,200);assert.ok((await (await response).text()).startsWith(scope));
 }
 assert.equal(h.network.length,0);
});
test('worker neither intercepts unrelated requests nor clears another app cache',async()=>{
 const h=harness();await waitEvent(h.listeners.activate);
 assert.equal(h.deleted.length,1);assert.equal(h.deleted[0],`little-yard-after:${scope}:old`);assert.equal(h.claimed.length,1);
 for(const url of ['https://example.github.io/other/','https://other.example/app.js',scope+'unknown']){
  let intercepted=false;h.listeners.fetch({request:new Request(url),respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 }
 let post=false;h.listeners.fetch({request:new Request(scope,{method:'POST'}),respondWith:()=>post=true});assert.equal(post,false);
});
test('incomplete installation rejects rather than activating a partial release',async()=>{
 const h=harness({failInstall:true});await assert.rejects(waitEvent(h.listeners.install));assert.equal(h.claimed.length,0);
});
test('standalone HTML remains self-contained and boots without PWA globals',async()=>{
 const html=await readFile(new URL('../outputs/小院之后.html',import.meta.url),'utf8');
 assert.ok(!/rel="(?:manifest|apple-touch-icon)"/.test(html));assert.ok(!/(?:src|href)="\.\//.test(html));
 const nodes=new Map();const doc={querySelector(key){if(!nodes.has(key))nodes.set(key,{innerHTML:'',addEventListener(){}});return nodes.get(key);},querySelectorAll(){return[];},addEventListener(){}};
 vm.runInNewContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],{structuredClone,document:doc,location:{protocol:'file:'},localStorage:{getItem(){return null;}}});
 assert.ok(nodes.get('#app').innerHTML.includes('这一次，想怎样过日子'));
});
