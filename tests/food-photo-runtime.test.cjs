'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('shipped photo runtime is the frozen CLIP-only build with pinned licenses',()=>{
 const m=JSON.parse(read('scripts/food-photo-model-manifest.json')),b=JSON.parse(read('tools/food-photo-runtime/build-manifest.json'));
 assert.equal(b.output.sha256,sha(read(b.output.path)));assert.equal(b.output.bytes,read(b.output.path).length);
 assert.equal(b.lock_sha256,sha(read('tools/food-photo-runtime/package-lock.json')));assert.equal(b.entry_sha256,sha(read('tools/food-photo-runtime/clip-session-entry.mjs')));
 assert.equal(m.runtime.assets[0].sha256,b.output.sha256);assert.equal(m.runtime.custom_build.lockfile_sha256,b.lock_sha256);
 for(const a of m.runtime.assets.filter(x=>x.delivery||x.path.endsWith('.mjs'))) { const local=a.delivery?a.path:'scripts/food-photo-vendor/'+path.basename(a.path);assert.equal(sha(read(local)),a.sha256,'frozen shipped asset '+local);assert.equal(read(local).length,a.bytes); }assert.equal(m.runtime.custom_build.source_maps_shipped,false);
 for(const p of ['TRANSFORMERS-LICENSE.txt','TOKENIZERS-LICENSE.txt','JINJA-LICENSE.txt','ORT-LICENSE.txt','CLIP-LICENSE-MIT.txt'])assert.ok(read('scripts/food-photo-vendor/'+p).length>500);
 assert.equal(fs.existsSync(path.join(root,'scripts/food-photo-vendor/transformers.min.js')),false);
});
test('CLIP closure excludes all-model/pipeline/generation code and external JS loaders',()=>{
 const b=JSON.parse(read('tools/food-photo-runtime/build-manifest.json'));assert.deepEqual(b.external_js_imports,[]);assert.equal(b.unneeded_model_registry_pipeline_generation_inputs,0);assert.equal(b.inputs.length,63);
 assert.ok(b.inputs.every(x=>!x.path.includes('/generation/')&&!x.path.includes('/models/modeling_utils.js')&&!/\/models\/(?:registry|models)\.js/.test(x.path)&&!x.path.includes('/pipelines')));
 assert.ok(b.inputs.filter(x=>x.path.includes('/models/')).every(x=>x.path.includes('/models/clip/')||x.path.endsWith('/session.js')||x.path.endsWith('/model_utils.js')));
 const code=read('scripts/food-photo-worker.js').toString();assert.ok(code.includes("'./food-photo-vendor/transformers-clip-only.mjs'"));assert.ok(!code.includes('transformers.min.js'));assert.ok(code.includes(JSON.parse(read('scripts/food-photo-model-manifest.json')).model.revision));
});
