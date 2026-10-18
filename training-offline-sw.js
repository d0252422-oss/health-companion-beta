/* Cache only this version's public application shell. Never cache private/API/auth responses. */
'use strict';
const CACHE='health-training-shell-local-01';
const SHELL=['./','./index.html','./build.json','./scripts/build-version.js','./scripts/manual-sql-config.js','./scripts/core-ux-contract.js','./scripts/local-engine-web.js','./scripts/training-personal-web.js','./scripts/engine-beta-web.js','./scripts/web-view-state.js','./scripts/manual-observation-web.js','./scripts/training-workspace-core.js','./scripts/training-workspace-web.js'];
const allowed=new Set(SHELL.map(p=>new URL(p,self.registration.scope).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('health-training-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||!allowed.has(url.pathname))return;
 event.respondWith(fetch(request).then(response=>{if(response.ok&&response.type==='basic'){const copy=response.clone();void caches.open(CACHE).then(cache=>cache.put(new Request(url.origin+url.pathname),copy));}return response;}).catch(async()=>{const cache=await caches.open(CACHE);return await cache.match(url.origin+url.pathname)||Response.error();}));
});
