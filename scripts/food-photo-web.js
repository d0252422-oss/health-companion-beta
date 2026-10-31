/* Photo candidates assist input. Only normal authenticated server receipts confirm a meal. */
(function(root){
 'use strict';
 if(typeof document==='undefined')return;
 const C=root.FoodPhotoCore,id=()=>crypto.randomUUID(),el=id=>document.getElementById(id),n=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 let env,repo,identity,draft,catalog,worker,generation=0,url=null,saving=false,chain=Promise.resolve();
 const message=text=>{if(el('food-photo-status'))el('food-photo-status').textContent=text;};
 const button=(text,fn)=>{const b=n('button',text);b.type='button';b.className='secondary-button';b.onclick=()=>Promise.resolve(fn()).catch(fail);return b;};
 const fail=e=>message(({IDENTITY_CHANGED:'帳號已變更，已停止本次操作。',IMAGE_TOO_LARGE:'照片太大，請選擇 10 MiB 以下、2400 萬像素以下照片。',UNSUPPORTED_IMAGE:'不支援或照片已損毀。請改用 JPEG、PNG 或 WebP。',PHOTO_QUOTA_EXCEEDED:'照片儲存額度已滿，草稿仍保留；可移除照片後儲存餐點。',STALE_REVISION:'此餐點已由其他裝置修改，請重新核對。',INVALID_PORTION_NUMBER:'請輸入有效的可食克數。',CLOSE_OLD_APP_TAB:'請先關閉其他舊版 App 分頁，再重新開啟。'})[e.code||e.message]||'尚未完成，草稿已保留，可重新嘗試。');
 function context(){return env.context();}
 function guard(g=generation){if(g!==generation||!identity||context().owner!==identity.owner||context().provider!==identity.provider||context().epoch!==identity.epoch)throw Error('IDENTITY_CHANGED');}
 async function persist(){guard();const g=generation,value=structuredClone(draft),owner={...identity};const pending=chain.then(()=>repo.write(owner,value));chain=pending.catch(()=>{});await pending;guard(g);}
 async function ready(){if(navigator.onLine!==false)await env.ready();const ctx=context();if(!ctx.owner)throw Error('VERIFIED_OWNER_REQUIRED');if(identity&&(ctx.owner!==identity.owner||ctx.provider!==identity.provider||ctx.epoch!==identity.epoch))reset();
  if(!identity){identity={...ctx};repo??=new C.Drafts();const g=generation;draft=await repo.read(identity);guard(g);draft??=fresh();localStorage.setItem('healthFoodLastAccount',JSON.stringify({owner:ctx.owner,provider:ctx.provider}));}
  catalog??=await fetch('scripts/food-photo-catalog.json?v='+env.build,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('CATALOG_UNAVAILABLE');return r.json();});guard();
 }
 function fresh(recent=[]){return {schema:C.VERSION,draftId:id(),requestId:id(),date:env.today(),time:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()),mealType:'午餐',items:[],photo:null,photoId:null,predictions:[],recent,confirmed:false,pending:null};}
 function stopModel(){worker?.terminate();worker=null;generation++;if(identity)identity.epoch=context().epoch;}
 function reset(){worker?.terminate();worker=null;generation++;identity=null;draft=null;saving=false;localStorage.removeItem('healthFoodLastAccount');if(url)URL.revokeObjectURL(url);url=null;el('food-photo-content')?.replaceChildren();message('請登入後開啟拍照記錄。');}
 function field(label,type,value,change){const wrap=n('label',label),input=n('input');input.className='form-input';input.type=type;input.value=value??'';input.onchange=()=>Promise.resolve(change(input.value)).catch(fail);wrap.append(input);return {wrap,input};}
 async function changed(fn){guard();if(draft.pending)throw Error('PENDING_MEAL_RECEIPT');stopModel();fn();draft.confirmed=false;await persist();render();}
 async function pick(file){if(!file)return;await ready();if(draft.pending)throw Error('PENDING_MEAL_RECEIPT');stopModel();const g=generation;message('正在處理照片…');const photo=await C.normalize(file);guard(g);draft.photo=photo;draft.photoId=id();draft.photoStatus='LOCAL_ONLY';draft.predictions=[];await persist();render();message('照片只保存在本機。可辨識候選，或直接搜尋食物。');}
 async function infer(){await ready();if(!draft.photo)throw Error('PHOTO_REQUIRED');stopModel();const g=generation;message('首次下載約 183 MB 公開模型；照片留在瀏覽器。可隨時取消或改手動。');
  const bitmap=await createImageBitmap(draft.photo.blob);guard(g);const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const cx=canvas.getContext('2d');cx.drawImage(bitmap,0,0);bitmap.close();
  const region=draft.region||'FULL',x=region==='RIGHT'?Math.floor(canvas.width/2):0,y=region==='BOTTOM'?Math.floor(canvas.height/2):0,w=['LEFT','RIGHT'].includes(region)?Math.floor(canvas.width/2):canvas.width,h=['TOP','BOTTOM'].includes(region)?Math.floor(canvas.height/2):canvas.height;const pixels=cx.getImageData(x,y,w,h).data;
  worker=new Worker('scripts/food-photo-worker.js?v='+env.build,{type:'module'});
  const timer=setTimeout(()=>{if(g!==generation)return;worker?.terminate();worker=null;message('模型載入逾時，照片與草稿仍在，可搜尋食物繼續記錄。');},180000);
  worker.onmessage=async event=>{if(g!==generation)return;const r=event.data;
   if(r.type==='progress'){message('下載公開模型：'+(Number.isFinite(r.progress)?Math.floor(r.progress)+'%':'準備中')+'；照片不會傳給模型網站。');return;}
   clearTimeout(timer);if(r.type==='error'){message('此瀏覽器暫時無法辨識，照片仍在，請搜尋食物繼續。');return;}
   if(r.type!=='result'||!Array.isArray(r.results)||r.results.length>50)return;
   draft.predictions=r.results.filter(x=>typeof x.label==='string'&&x.label.length<=100&&Number.isFinite(x.score)).slice(0,6);draft.model=r.model;await persist();render();message('候選不代表照片已被確認，也可能不是食物；請自行選擇來源與克數。');
  };
  worker.onerror=()=>{if(g===generation){clearTimeout(timer);message('辨識失敗，照片與草稿已保留，仍可手動記錄。');}};
  worker.postMessage({pixels:pixels.buffer,width:w,height:h},[pixels.buffer]);
 }
 function add(food){return changed(()=>draft.items.push({itemId:id(),source_key:food.source_key,name:food.name,preparation:food.preparation_state,grams:'',estimated:false,lower:'',upper:'',calculation:null,snapshotId:null,feedbackId:id()}));}
 async function calculate(){await ready();if(draft.pending)throw Error('PENDING_MEAL_RECEIPT');const g=generation;if(!draft.items.length)throw Error('FOOD_REQUIRED');
  for(const item of draft.items){const signature=JSON.stringify([draft.date,item.source_key,item.grams,item.estimated,item.lower,item.upper]);if(item.signature===signature&&item.snapshotId)continue;
   const portion=item.estimated?{method:'ESTIMATE_RANGE',grams:item.grams,lower_grams:item.lower,upper_grams:item.upper}:{method:'EXPLICIT_GRAMS',grams:item.grams};
   if(!/^\d+(?:\.\d+)?$/.test(item.grams)||Number(item.grams)<=0)throw Error('INVALID_PORTION_NUMBER');
   const result=await env.request('runFoodEngine',{date:draft.date,match:{source_key:item.source_key},portion});guard(g);
   if(!root.HealthEngineUI.envelopeValid(result,identity.owner,'food')||!result.output.calculation)throw Error('FOOD_CONTRACT');
   item.snapshotId=result.input_snapshot_id;item.calculation=result.output.calculation;item.signature=signature;
  }await persist();render();message('已依來源換算。請確認食物、克數及未辨識配料後再儲存。');
 }
 function trustedStorage(url,kind){const u=new URL(url);if(u.origin!=='https://uavimjgccigpbwqmfkhh.supabase.co'||!u.pathname.startsWith('/storage/v1/object/'+kind+'/beta-meal-photos-v1/'))throw Error('INVALID_PHOTO_URL');return u.href;}
 async function upload(){if(!draft.photo)return null;const g=generation;
  // A lost upload response may still mean the immutable object exists. Verify it before re-upload.
  try{const done=await env.request('finalizeMealPhoto',{photoId:draft.photoId});guard(g);if(done.status==='VERIFIED'){draft.photoStatus='VERIFIED';await persist();return draft.photoId;}}catch(e){guard(g);if(!['PHOTO_NOT_FOUND','PHOTO_UPLOAD_NOT_CONFIRMED'].includes(e.code||e.message))throw e;}
  const ticket=await env.request('prepareMealPhoto',{photoId:draft.photoId,sha256:draft.photo.sha256,bytes:draft.photo.blob.size});guard(g);
  if(ticket.status!=='VERIFIED'){const result=await fetch(trustedStorage(ticket.uploadUrl,'upload/sign'),{method:'PUT',headers:{'content-type':'image/jpeg'},body:draft.photo.blob,signal:AbortSignal.timeout(45000)});guard(g);if(!result.ok&&result.status!==409)throw Error('PHOTO_UPLOAD_FAILED');}
  const done=await env.request('finalizeMealPhoto',{photoId:draft.photoId});guard(g);if(done.status!=='VERIFIED')throw Error('PHOTO_UPLOAD_NOT_CONFIRMED');draft.photoStatus='VERIFIED';await persist();return draft.photoId;
 }
 async function save(){if(saving)return;await ready();const g=generation;saving=true;
  try{let payload=draft.pending;
   if(!payload){if(!draft.confirmed)throw Error('REVIEW_REQUIRED');await calculate();guard(g);const photoId=draft.photo?await upload():draft.existingPhotoId??null;guard(g);
    const macro=key=>C.total(draft.items,key).value;
    payload={clientRequestId:draft.requestId,...(draft.mealRecordId?{mealRecordId:draft.mealRecordId,revision:draft.revision}:{}),date:draft.date,time:draft.time,mealType:draft.mealType,foodName:draft.items.map(x=>x.name).join('、').slice(0,200),userConfirmed:true,labelMode:false,calories:macro('energy_kcal'),protein:macro('protein_g'),carbs:macro('carbs_g'),fat:macro('fat_g'),foodItems:draft.items.map(i=>({itemId:i.itemId,snapshotId:i.snapshotId})),photoId};
    draft.pending=payload;await persist();
   }
   // Stable request/payload survives refresh, lost responses and retries. Never create a second meal.
   let receipt=await env.request('getMealWriteStatus',{clientRequestId:payload.clientRequestId});guard(g);
   if(!receipt.exists)receipt=await env.request('upsertMealRecord',payload);guard(g);
   if(!receipt.recordId||!receipt.record||!['QUEUED','SAVED'].includes(receipt.status))throw Error('UNCONFIRMED_SYNC');
   draft.saved={mealRecordId:receipt.recordId,revision:receipt.record.revision,photoId:receipt.record.photoId};draft.pending=null;draft.photo=null;await persist();
   message('餐點已由伺服器確認保存。');renderSaved();
   try{await env.refresh();guard(g);}catch{guard(g);message('已儲存，飲食清單更新失敗，可重新讀取。');}
  }finally{if(g===generation)saving=false;}
 }
 async function feedback(){await ready();const g=generation;for(const item of draft.items){if(!item.snapshotId||item.feedbackSaved)continue;item.feedbackPayload??={event_id:item.feedbackId,input_snapshot_id:item.snapshotId,feedback_type:'FOOD_IDENTITY',correction:{consent_scope:'PERSONAL_ONLY',original_prediction:{model:draft.model||null,candidates:draft.predictions},catalog_version:catalog.version,correction:{source_key:item.source_key,grams:item.grams,method:item.estimated?'ESTIMATE_RANGE':'EXPLICIT_GRAMS',lower:item.lower,upper:item.upper},confirmed_at:new Date().toISOString(),photo_reference:draft.saved?.photoId||null,model_weight_training:false}};await persist();await env.request('submitFoodEngineFeedback',item.feedbackPayload);guard(g);item.feedbackSaved=true;await persist();}message('個人修正已保存；模型權重沒有訓練或變更。');}
 function renderSaved(){const out=el('food-photo-content');out.replaceChildren(n('p','已保存一筆餐點，請到飲食紀錄查看。'));if(draft.saved?.photoId)out.append(button('查看私有照片',async()=>{const g=generation,r=await env.request('getMealPhoto',{photoId:draft.saved.photoId});guard(g);const image=n('img');image.alt='已保存的餐點照片';image.style.maxWidth='100%';image.referrerPolicy='no-referrer';image.src=trustedStorage(r.url,'sign');out.append(image);}),button('移除這餐照片',async()=>{const rows=await env.request('getNutritionRecords',{date:draft.date});guard();const meal=rows.find(r=>r.mealRecordId===draft.saved.mealRecordId);if(!meal)throw Error('MEAL_NOT_FOUND');await env.request('upsertMealRecord',{clientRequestId:id(),mealRecordId:meal.mealRecordId,revision:meal.revision,date:meal.date,time:meal.time,mealType:meal.mealType,foodName:meal.foodName,userConfirmed:meal.userConfirmed,photoId:null});guard();draft.saved.photoId=null;await persist();renderSaved();message('照片已解除關聯；餐點與營養紀錄保留。');}));out.append(button('保存本次修正供個人參考',feedback),button('撤回本次修正使用',async()=>{await ready();const g=generation;for(const item of draft.items.filter(i=>i.feedbackSaved)){await env.request('withdrawFoodEngineFeedback',{event_id:item.feedbackId});guard(g);item.feedbackWithdrawn=true;}await persist();message('已撤回本次回饋使用，將排除後續評估；餐點紀錄保留。');}),button('記錄下一餐',async()=>{const recent=draft.items.map(i=>({source_key:i.source_key,name:i.name}));draft=fresh(recent);await persist();render();}));}
 function render(){if(!draft)return;if(draft.saved)return renderSaved();const out=el('food-photo-content');out.replaceChildren();
  if(url)URL.revokeObjectURL(url);url=null;
  if(!draft.photo&&draft.existingPhotoId){out.append(n('p','此餐已附私有照片。'),button('移除原照片',()=>changed(()=>draft.existingPhotoId=null)));}
  if(draft.photo){const region=n('select');region.setAttribute('aria-label','照片辨識區域');region.className='form-input';for(const [v,t] of [['FULL','整張照片'],['LEFT','左半部'],['RIGHT','右半部'],['TOP','上半部'],['BOTTOM','下半部']]){const o=n('option',t);o.value=v;region.append(o);}region.value=draft.region||'FULL';region.onchange=()=>changed(()=>draft.region=region.value).catch(fail);out.append(region);url=URL.createObjectURL(draft.photo.blob);const image=n('img');image.alt='餐點照片預覽';image.src=url;image.style.cssText='max-width:100%;max-height:260px;object-fit:contain';out.append(image,button('提供照片候選',infer),button('取消辨識',()=>{stopModel();message('已取消辨識，照片與草稿保留。');}),button('移除照片',()=>changed(()=>{stopModel();draft.photo=null;draft.photoId=null;draft.predictions=[];})));}
  for(const [name,type,key] of [['日期','date','date'],['時間','time','time']]){const f=field(name,type,draft[key],v=>changed(()=>{draft[key]=v;for(const i of draft.items)i.signature=null;}));out.append(f.wrap);}
  const meals=n('select');meals.className='form-input';meals.setAttribute('aria-label','餐別');for(const v of ['早餐','午餐','晚餐','點心','宵夜']){const o=n('option',v);o.value=v;meals.append(o);}meals.value=draft.mealType;meals.onchange=()=>changed(()=>draft.mealType=meals.value).catch(fail);out.append(meals);
  if(draft.predictions.length){out.append(n('p','照片候選：'+draft.predictions.map(x=>x.label).join('、')),n('p','候選可能錯誤。請搜尋確認；不是食物／查無對應時改用手動紀錄。'));const mapped=new Set();for(const candidate of draft.predictions){for(const key of catalog.visualMapping?.labels?.[candidate.label]||[]){const k=JSON.stringify(key);if(mapped.has(k))continue;mapped.add(k);const food=catalog.foods.find(f=>JSON.stringify(f.source_key)===k);if(food)out.append(button('候選：'+food.name+' · '+food.preparation_state,()=>add(food)));}}}
  const search=field('搜尋食物（名稱／別名）','search','',()=>{}),results=n('div');search.input.oninput=()=>{const q=search.input.value.normalize('NFKC').trim().toLowerCase();results.replaceChildren();if(!q)return;
   const aliases=catalog.aliases||[];const matches=catalog.foods.filter(f=>f.name.toLowerCase().includes(q)||aliases.some(a=>JSON.stringify(a.source_key)===JSON.stringify(f.source_key)&&a.label.toLowerCase().includes(q)));
   for(const food of matches)results.append(button(food.name+' · '+({RAW:'生',COOKED:'熟',UNKNOWN:'製備未註明'}[food.preparation_state]||food.preparation_state),()=>add(food)));if(!matches.length)results.textContent='沒有可靠對應，請改用既有手動飲食表單。';};out.append(search.wrap,results);
  if(draft.recent?.length){out.append(n('p','你上次確認的食物（仍需重新填份量）'));for(const previous of draft.recent){const food=catalog.foods.find(f=>JSON.stringify(f.source_key)===JSON.stringify(previous.source_key));if(food)out.append(button(food.name,()=>add(food)));}}
  for(const item of draft.items){const box=n('article');box.className='card card-pad';box.append(n('h4',item.name+' · '+({RAW:'生',COOKED:'熟',UNKNOWN:'製備未註明'}[item.preparation]||item.preparation)));
   const grams=field('可食重量（g）','number',item.grams,v=>changed(()=>{item.grams=v;item.signature=null;item.calculation=null;}));grams.input.min='0.01';grams.input.max='10000';grams.input.step='any';box.append(grams.wrap);
   const estimate=field('這是估算份量','checkbox','',()=>{});estimate.input.checked=item.estimated;estimate.input.onchange=()=>changed(()=>{item.estimated=estimate.input.checked;item.signature=null;item.calculation=null;}).catch(fail);box.append(estimate.wrap);
   if(item.estimated)for(const [label,key] of [['估算下限（g）','lower'],['估算上限（g）','upper']])box.append(field(label,'number',item[key],v=>changed(()=>{item[key]=v;item.signature=null;item.calculation=null;})).wrap);
   if(item.calculation){box.append(n('p',item.grams+' g'+(item.estimated?' · 估算（非實測）':'')));for(const [name,key] of [['熱量','energy_kcal'],['蛋白質','protein_g'],['碳水','carbs_g'],['脂肪','fat_g']])box.append(n('p',name+'：'+root.HealthEngineUI.nutrient(item.calculation.nutrients[key])));}
   box.append(button('移除此項',()=>changed(()=>draft.items=draft.items.filter(i=>i.itemId!==item.itemId))));out.append(box);
  }
  const details=n('details'),summary=n('summary','來源與估算說明');details.append(summary,n('p','33 項新增 TFDA 參考，非完整台灣菜色資料庫。生／熟與未註明的來源需自行核對。沒有預設 100g。未辨識的油與配料請自行補充。'),n('p','營養＝來源每 100g × 克數 ÷ 100。模型相似度不是正確率，份量範圍不是統計信賴區間。'),n('p',draft.model?JSON.stringify(draft.model):'尚未使用照片模型。'));out.append(details);
  if(draft.items.every(i=>i.calculation)&&draft.items.length){for(const [name,key] of [['餐點熱量','energy_kcal'],['蛋白質','protein_g'],['碳水','carbs_g'],['脂肪','fat_g']]){const t=C.total(draft.items,key);out.append(n('p',name+'：'+(t.value===null?'資料未完整；已知小計 '+(t.knownSubtotal??'—'):new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(t.value))));}}
  out.append(button('換算份量',calculate));const confirm=field('我已確認食物與份量；估算仍按估算保存','checkbox','',()=>{});confirm.input.checked=draft.confirmed;confirm.input.onchange=async()=>{draft.confirmed=confirm.input.checked;await persist();};out.append(confirm.wrap,button(draft.pending?'核對未完成儲存':'確認儲存',save));
  if(draft.pending){out.append(n('p','儲存結果待核對。請使用相同請求重試，不要另建一餐。'));out.querySelectorAll('input,select').forEach(e=>e.disabled=true);}
 }
 function mount(options){env=options;if(!env.enabled())return;const panel=n('article');panel.className='card card-pad';panel.id='food-photo-panel';panel.style.marginTop='16px';panel.append(n('h3','拍照記錄飲食'));
  for(const [label,capture] of [['拍照記錄',true],['從相簿選擇',false]]){const input=n('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';if(capture)input.setAttribute('capture','environment');input.hidden=true;input.onchange=()=>{const file=input.files?.[0];input.value='';pick(file).catch(fail);};panel.append(input,button(label,()=>input.click()));}
  panel.append(button('恢復本機草稿',async()=>{await ready();render();}),button('使用手動飲食表單',()=>env.manual()));const status=n('p','照片處理與辨識在瀏覽器執行。首次模型下載約 183 MB；可不下載直接搜尋。');status.id='food-photo-status';status.setAttribute('role','status');const content=n('div');content.id='food-photo-content';panel.append(status,content);el('nutrition-screen')?.prepend(panel);
  addEventListener('online',()=>{if(identity&&draft?.pending)save().catch(fail);});
 }
 async function recoverOffline(){if(!env||navigator.onLine!==false)return false;const token=localStorage.getItem('healthCompanionSessionToken'),pointer=localStorage.getItem('healthFoodLastAccount'),g=generation;if(!token)return false;let saved;try{saved=JSON.parse(pointer||'null');}catch{return false;}if(!saved?.owner||!saved?.provider)return false;repo??=new C.Drafts();const value=await repo.read(saved);if(g!==generation||navigator.onLine!==false||token!==localStorage.getItem('healthCompanionSessionToken')||pointer!==localStorage.getItem('healthFoodLastAccount')||!value||(!value.photo&&!value.items?.length&&!value.pending))return false;env.enterOffline(saved);identity={...context()};draft=value;render();message('已恢復此帳號本機照片草稿。重新驗證相同帳號前不會上傳。');return true;}
 async function editMeal(meal){await ready();if(draft.pending)throw Error('PENDING_MEAL_RECEIPT');if(draft.items.length&&!draft.saved&&!confirm('切換餐點將取代目前尚未儲存的草稿，確定繼續？'))return;draft={...fresh(draft.recent),mealRecordId:meal.mealRecordId,revision:meal.revision,date:meal.date,time:meal.time,mealType:meal.mealType,existingPhotoId:meal.photoId,items:meal.foodItems.map(i=>({itemId:i.itemId,source_key:i.calculation.reference.source_key,name:i.calculation.reference.name,preparation:i.calculation.reference.preparation_state,grams:i.calculation.portion.grams,estimated:i.calculation.portion.measurement_status==='ESTIMATED',lower:i.calculation.portion.lower_grams,upper:i.calculation.portion.upper_grams,calculation:i.calculation,snapshotId:i.snapshotId,feedbackId:id()}))};await persist();render();el('food-photo-panel').scrollIntoView?.({block:'start',behavior:'smooth'});}
 function decorateMeals(rows){if(!env?.enabled())return;for(const meal of rows){const edit=document.querySelector('[data-meal-record-id="'+CSS.escape(meal.mealRecordId||'')+'"]');if(!edit)continue;const box=edit.parentElement;
  if(meal.photoId)box.append(button('照片',async()=>{await ready();const g=generation,r=await env.request('getMealPhoto',{photoId:meal.photoId});guard(g);const image=n('img');image.alt='餐點照片';image.referrerPolicy='no-referrer';image.style.cssText='max-width:100%;height:auto';image.src=trustedStorage(r.url,'sign');box.append(image);}));
  if(meal.foodItems?.length&&meal.foodItemsActive!==false)box.append(button('調整食物／份量',()=>editMeal(meal)));
 }}
 root.HealthFoodPhoto={mount,reset,ready,save,calculate,decorateMeals,recoverOffline};
})(globalThis);
