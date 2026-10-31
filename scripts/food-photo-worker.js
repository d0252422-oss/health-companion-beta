import {createCLIPClassifier,RawImage,env} from './food-photo-vendor/transformers-clip-only.mjs';
const REVISION='6b7c523703ae26e39be4b03774966f8571c7f523';
env.allowLocalModels=false;env.allowRemoteModels=true;
env.remoteHost='https://huggingface.co/';env.remotePathTemplate='{model}/resolve/'+REVISION+'/';
env.useBrowserCache=true;env.useWasmCache=true;env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.wasmPaths={mjs:new URL('./food-photo-vendor/ort-wasm-simd-threaded.asyncify.mjs',import.meta.url).href,wasm:'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/ort-wasm-simd-threaded.asyncify.wasm'};
let classifier;
self.onmessage=async({data})=>{try{
 if(!(data.pixels instanceof ArrayBuffer)||!Number.isInteger(data.width)||!Number.isInteger(data.height)||data.width<1||data.height<1||data.width>1600||data.height>1600||data.pixels.byteLength!==data.width*data.height*4)throw Error('INVALID_IMAGE');
 const labels=['white rice','noodles','bread','oatmeal','egg','tofu','chicken','pork','beef','fish','shrimp','milk','broccoli','leafy vegetables','carrot','tomato','banana','apple','orange','papaya','potato','mixed meal','a non-food object'];
 classifier??=await createCLIPClassifier({progress_callback:e=>{if(e.status==='progress'||e.status==='progress_total')self.postMessage({type:'progress',progress:e.progress});}});
 const image=new RawImage(new Uint8Array(data.pixels),data.width,data.height,4),begin=performance.now();
 const results=await classifier(image,labels);
 self.postMessage({type:'result',results,model:{name:'Xenova/clip-vit-base-patch32',revision:REVISION,runtime:'transformers.js-4.3.2-clip-only.v1',device:'wasm-q8-single-thread',labelsVersion:'food-photo-visual-labels.v1',durationMs:performance.now()-begin,scoreMeaning:'UNCALIBRATED_RELATIVE_SIMILARITY'}});
}catch{self.postMessage({type:'error',code:'MODEL_UNAVAILABLE'});}};
