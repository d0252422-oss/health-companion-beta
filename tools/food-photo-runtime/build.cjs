'use strict';
// Reproducible browser-only CLIP subset; never load the upstream all-model dist.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const esbuild=require('esbuild');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const root=path.resolve(__dirname,'../..'),outfile=path.join(root,'scripts/food-photo-vendor/transformers-clip-only.mjs');
 const result=await esbuild.build({absWorkingDir:__dirname,entryPoints:['clip-session-entry.mjs'],outfile,
  bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:false,metafile:true,sourcemap:false,legalComments:'eof',
  conditions:['browser','onnxruntime-web-use-extern-wasm'],
  plugins:[{name:'browser-node-unavailable',setup(build){
   build.onResolve({filter:/^(?:node:.*|sharp)$/},args=>({path:args.path,namespace:'browser-unavailable'}));
   build.onResolve({filter:/^\.\/onnx-node\.js$/},()=>({path:'onnx-node',namespace:'browser-unavailable'}));
   build.onLoad({filter:/.*/,namespace:'browser-unavailable'},args=>({contents:args.path==='node:stream'?'export const Readable = undefined;':args.path==='node:stream/promises'?'export const pipeline = undefined;':'export default {};',loader:'js'}));
  }}]});
 const inputs=Object.entries(result.metafile.inputs).map(([name,meta])=>({path:name.replaceAll('\\','/'),bytes:meta.bytes,sha256:name.startsWith('browser-unavailable:')?null:sha(fs.readFileSync(path.resolve(__dirname,name)))}));
 const forbidden=/\/(?:models\/(?:registry|models|modeling_utils)\.js|generation\/|pipelines(?:\.js|\/))|\/models\/(?!clip\/|session\.js|model_utils\.js)/;
 if(inputs.some(x=>forbidden.test(x.path)))throw Error('NON_CLIP_RUNTIME_INPUT');
 if(Object.values(result.metafile.outputs).some(x=>x.imports.length))throw Error('EXTERNAL_JS_IMPORT');
 const output=fs.readFileSync(outfile);
 const report={schema_version:'clip-only-build.v1',upstream:'@huggingface/transformers@4.3.2',esbuild:esbuild.version,
  entry_sha256:sha(fs.readFileSync(path.join(__dirname,'clip-session-entry.mjs'))),lock_sha256:sha(fs.readFileSync(path.join(__dirname,'package-lock.json'))),
  output:{path:'scripts/food-photo-vendor/transformers-clip-only.mjs',bytes:output.length,sha256:sha(output)},
  external_js_imports:[],unneeded_model_registry_pipeline_generation_inputs:0,inputs};
 fs.writeFileSync(path.join(__dirname,'build-manifest.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({output:report.output,input_count:inputs.length,external_js_imports:0}));
})().catch(()=>{console.error('CLIP_RUNTIME_BUILD_FAILED');process.exitCode=1;});
