'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb'),{JSDOM}=require('jsdom'),C=require('../scripts/food-photo-core.js');
test('photo bounds reject unsupported and decompression-bomb headers before decode',()=>{
 assert.throws(()=>C.dimensions(new Uint8Array(30)),/UNSUPPORTED/);
 const png=new Uint8Array(24);png.set([137,80,78,71,13,10,26,10]);const v=new DataView(png.buffer);v.setUint32(16,8000);v.setUint32(20,8000);assert.throws(()=>C.dimensions(png),/TOO_LARGE/);v.setUint32(16,1600);v.setUint32(20,900);assert.deepEqual(C.dimensions(png),{width:1600,height:900,type:'image/png'});
});
test('decimal sums keep unknown distinct from source-reported zero and known subtotal',()=>{
 assert.deepEqual(C.decimalSum(['0.1','0.2']),{value:.3,knownSubtotal:'0.3'});
 assert.deepEqual(C.decimalSum(['0',null]),{value:null,knownSubtotal:'0'});assert.deepEqual(C.decimalSum([null]),{value:null,knownSubtotal:null});
});
test('additive database upgrade preserves training accounts and isolates photo Blob/pending payload per owner',async()=>{
 const open=indexedDB.open('health-training-workspace',1);await new Promise((ok,bad)=>{open.onupgradeneeded=()=>open.result.createObjectStore('accounts');open.onsuccess=ok;open.onerror=bad;});
 await new Promise((ok,bad)=>{const t=open.result.transaction('accounts','readwrite');t.objectStore('accounts').put({draft:'EXISTING_TRAINING'},'original');t.oncomplete=ok;t.onerror=bad;});open.result.close();
 const a={provider:'verified-beta',owner:'A'},b={...a,owner:'B'},repo=new C.Drafts(indexedDB),requestId='stable-request';
 const draft={photo:{blob:new Blob(['TEST isolated photo'])},pending:{clientRequestId:requestId},items:[]};await repo.write(a,draft);
 assert.equal(await repo.read(b),null);assert.equal((await repo.read(a)).pending.clientRequestId,requestId);assert.equal(await(await repo.read(a)).photo.blob.text(),'TEST isolated photo');
 const db=await repo.db;assert.deepEqual(await new Promise(ok=>{const r=db.transaction('accounts').objectStore('accounts').get('original');r.onsuccess=()=>ok(r.result);}),{draft:'EXISTING_TRAINING'});
 await repo.write(a,{...draft,photo:null});assert.equal((await repo.read(a)).photo,null);db.close();
});
function fixture(initialDraft=null){
 const dom=new JSDOM('<div id="nutrition-screen"></div>',{url:'https://fixture.invalid/',runScripts:'outside-only'}),w=dom.window;
 let stored=initialDraft,owner='A',epoch=1,requestCount=0,refreshes=0,manual=0;
 const food=JSON.parse(fs.readFileSync('scripts/food-photo-catalog.json','utf8')).foods.find(f=>f.source_key[2]==='A0550601');
 w.structuredClone=structuredClone;w.crypto.randomUUID=()=>require('node:crypto').randomUUID();w.URL.createObjectURL=()=> 'blob:isolated';w.URL.revokeObjectURL=()=>{};
 w.FoodPhotoCore={...C,Drafts:class{async read(){return structuredClone(stored);}async write(_owner,d){stored=structuredClone(d);}}};w.HealthEngineUI=require('../scripts/engine-beta-web.js');
 w.fetch=async()=>({ok:true,json:async()=>({version:'TEST',foods:[food],aliases:[],visualMapping:{labels:{'white rice':[food.source_key]}}})});
 let barrier=null;
 const req=async(action,payload)=>{
  if(action==='runFoodEngine'){if(barrier)await barrier.promise;return {schema_version:'engine-output.v0.1',canonical_user_id:owner,engine_name:'food',engine_version:'food-engine-v0.1',input_snapshot_id:'11111111-1111-4111-a111-111111111111',generated_at:new Date().toISOString(),output:{calculation:{reference:{name:food.name},portion:{grams:payload.portion.grams},nutrients:Object.fromEntries(['energy_kcal','protein_g','carbs_g','fat_g'].map(k=>[k,{value:'20',unit:k==='energy_kcal'?'kcal':'g',qualifier:'SOURCE_REPORTED'}]))}},evidence:{},confidence:{},data_completeness:{},warnings:[]};}
  if(action==='getMealWriteStatus'){return {exists:false};}
  if(action==='upsertMealRecord'){requestCount++;assert.equal(payload.foodItems.length,1);assert.equal(payload.calories,20);return {status:'SAVED',recordId:'meal-test',record:{revision:1,photoId:null}};}
  throw Error('UNEXPECTED_ACTION_'+action);
 };
 w.eval(fs.readFileSync('scripts/food-photo-web.js','utf8'));
 w.HealthFoodPhoto.mount({enabled:()=>true,context:()=>({owner,provider:'fixture',epoch}),ready:async()=>{},request:req,today:()=> '2026-10-31',build:'fixture',manual:()=>manual++,refresh:async()=>{refreshes++;}});
 const click=async text=>{const b=[...w.document.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(b,'button '+text);b.click();await new Promise(r=>setTimeout(r,10));};
 const input=(label,value)=>{const e=[...w.document.querySelectorAll('label')].find(x=>x.firstChild.textContent===label)?.querySelector('input');assert.ok(e,label);e.value=value;e.dispatchEvent(new w.Event('change'));return e;};
 const add=async()=>{await click('恢復本機草稿');const search=w.document.querySelector('input[type=search]');search.value='白飯';search.dispatchEvent(new w.Event('input'));await click(food.name+' · 熟');input('可食重量（g）','150');await new Promise(r=>setTimeout(r,10));};
 return {dom,w,click,input,add,get stored(){return stored;},get writes(){return requestCount;},get refreshes(){return refreshes;},switch(){owner='B';epoch++;w.HealthFoodPhoto.reset();},block(){let release;const promise=new Promise(r=>release=r);barrier={promise};return release;}};
}
test('photo meal flows through source selection, portion, explicit review, one receipt and totals refresh',async()=>{
 const f=fixture();await f.add();await f.click('換算份量');assert.equal(f.stored.items[0].calculation.nutrients.energy_kcal.value,'20');
 const review=f.w.document.querySelector('input[type=checkbox]');assert.equal(review.checked,false);const confirmed=[...f.w.document.querySelectorAll('label')].find(e=>e.textContent.includes('我已確認')).querySelector('input');confirmed.checked=true;confirmed.dispatchEvent(new f.w.Event('change'));await new Promise(r=>setTimeout(r,10));
 await f.click('確認儲存');assert.equal(f.writes,1);assert.equal(f.refreshes,1);assert.ok(f.stored.saved);assert.equal(f.stored.photo,null);f.dom.window.close();
});
test('no grams are invented; manual fallback and old async results cannot populate another owner',async()=>{
 const f=fixture();await f.add();f.input('可食重量（g）','');await new Promise(r=>setTimeout(r,10));await assert.rejects(f.w.HealthFoodPhoto.calculate(),/INVALID_PORTION_NUMBER/);assert.equal(f.writes,0);
 f.input('可食重量（g）','100');await new Promise(r=>setTimeout(r,10));const release=f.block(),pending=f.w.HealthFoodPhoto.calculate();await new Promise(r=>setTimeout(r,10));f.switch();release();await assert.rejects(pending,/IDENTITY_CHANGED/);assert.equal(f.w.document.querySelector('#food-photo-content').textContent,'');f.dom.window.close();
});
test('complete photo payload bypasses stale manual label-mode DOM and is stable on replay',()=>{
 const source=fs.readFileSync('scripts/local-engine-web.js','utf8'),start=source.indexOf('function localMealMutationPayload('),end=source.indexOf('\n',start);const code=source.slice(start,end);
 const ctx={Object,globalThis:{},localMealRevisionPayload:p=>({...p,revision:p.revision??2}),document:{getElementById(){throw Error('SHOULD_NOT_READ_MANUAL_FORM');}}};vm.createContext(ctx);vm.runInContext(code,ctx);
 const payload={photoId:'photo',foodItems:[{snapshotId:'snapshot'}],labelMode:false,clientRequestId:'fixed'};const a=ctx.localMealMutationPayload(payload),b=ctx.localMealMutationPayload(payload);assert.equal(a.labelMode,false);assert.equal(JSON.stringify(a),JSON.stringify(b));
});


test('terminal model failure stops late progress without losing photo draft or manual entry',async()=>{
 const initial={date:'2026-10-31',time:'12:00',mealType:'午餐',items:[],photo:{blob:new Blob(['TEST photo'])},photoId:'fixture-photo',predictions:[],recent:[]};
 const f=fixture(initial),workers=[];f.w.createImageBitmap=async()=>({width:1,height:1,close(){}});
 f.w.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){},getImageData(){return {data:new Uint8ClampedArray(4)};}});
 f.w.Worker=class{constructor(){workers.push(this);}postMessage(){}terminate(){this.terminated=true;}};
 await f.click('恢復本機草稿');await f.click('提供照片候選');const first=workers[0];
 await first.onmessage({data:{type:'error',code:'MODEL_UNAVAILABLE'}});const error=f.w.document.querySelector('#food-photo-status').textContent;
 await first.onmessage({data:{type:'progress',progress:100}});assert.equal(first.terminated,true);assert.equal(f.w.document.querySelector('#food-photo-status').textContent,error);assert.match(error,/暫時無法辨識/);assert.ok(f.w.document.querySelector('#food-photo-content img'));
 await f.click('提供照片候選');const second=workers[1];second.onerror();const secondError=f.w.document.querySelector('#food-photo-status').textContent;await second.onmessage({data:{type:'progress',progress:100}});assert.equal(second.terminated,true);assert.equal(f.w.document.querySelector('#food-photo-status').textContent,secondError);
 await f.click('使用手動飲食表單');assert.ok(f.stored.photo);assert.equal(f.writes,0);f.dom.window.close();
});
