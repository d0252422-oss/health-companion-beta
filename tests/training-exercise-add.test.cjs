'use strict';
// Synthetic local component integration: real picker, handlers, Workspace and IndexedDB.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),{IDBFactory}=require('fake-indexeddb');
const root=path.join(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const target={exerciseId:'synthetic-shoulder-fly-out',exerciseName:'啞鈴飛鳥-虎口朝外',bodyPartId:'shoulder',revision:1,settings:{exerciseType:'WEIGHT_REPS'}};
const shoulderRows=Array.from({length:12},(_,i)=>({exerciseId:'synthetic-shoulder-'+i,exerciseName:'測試肩部 '+i,bodyPartId:'shoulder',revision:1,settings:{exerciseType:'WEIGHT_REPS'}}));
const back={exerciseId:'synthetic-back',exerciseName:'測試背部動作',bodyPartId:'back',revision:1,settings:{exerciseType:'WEIGHT_REPS'}};
const current=[...shoulderRows,target,back],older=[...shoulderRows,back];
const flush=()=>new Promise(resolve=>setTimeout(resolve,10));
async function harness({catalog=older,online=false}={}){
 const html=read('index.html'),local=read('scripts/local-engine-web.js');
 const dom=new JSDOM(html,{url:'http://127.0.0.1:55420/health-companion-beta/',runScripts:'outside-only'}),w=dom.window;
 let ctx={owner:'SYNTHETIC_LOCAL_A',provider:'ISOLATED_LOCAL',epoch:0,sessionEpoch:0},session=null;
 const calls=[],notifications=[];w.structuredClone=structuredClone;w.indexedDB=new IDBFactory();w.CSS={escape:s=>s};
 Object.defineProperty(w.navigator,'onLine',{configurable:true,get:()=>online});
 Object.assign(w,{exerciseDatabase:structuredClone(catalog),exerciseBodyParts:[{bodyPartId:'shoulder',displayName:'肩部'},{bodyPartId:'back',displayName:'背部'}],localSessionEpoch:0,
  escapeHtml:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),writeExerciseCache(){}});
 w.eval(read('scripts/core-ux-contract.js'));
 w.eval(local.slice(local.indexOf('// Shared finders'),local.indexOf('function localTrainingDraftLock')));
 const names=['renderExerciseOptions','renderMuscleGroupOptions','applyExerciseCatalog'];
 w.eval(html.split('\n').filter(l=>names.some(n=>l.trimStart().startsWith('function '+n+'('))).join('\n'));
 w.eval(read('scripts/training-workspace-core.js'));
 const env={enabled:()=>true,context:()=>ctx,ready:async()=>{},catalog:async()=>w.exerciseDatabase,exercises:()=>w.exerciseDatabase,
  request:async(action,payload)=>{calls.push({action,payload:structuredClone(payload)});if(action==='getTrainingWorkspace')return {routines:[],sessions:[]};if(action==='getTrainingExerciseHistory')return {records:[],hasMore:false};throw Error('UNEXPECTED_TEST_API');},
  today:()=> '2026-11-01',getSession:()=>session,setSession:s=>session=s,setView(){},notify:text=>notifications.push(text),refreshStats:async()=>{},applyCatalog:rows=>w.applyExerciseCatalog(rows)};
 w.eval(read('scripts/training-workspace-web.js'));w.HealthWorkout.mount(env);w.applyExerciseCatalog(catalog);await w.HealthWorkout.refresh();
 const el=id=>w.document.getElementById(id),state=()=>w.HealthWorkout.workspace.read();
 const press=async id=>{await el(id).onclick();await flush();};
 const publish=rows=>w.applyExerciseCatalog(structuredClone(rows));
 const select=id=>{el('exercise-select').value=id;el('exercise-select').dispatchEvent(new w.Event('change',{bubbles:true}));};
 const start=async(date='2026-11-01')=>{el('training-start-date').value=date;await press('start-workout');};
 return {w,dom,env,el,state,calls,notifications,press,publish,select,start,setOnline:v=>online=v,setContext:v=>ctx={...ctx,...v},close:()=>dom.window.close()};
}
test('UX G1 settings use the visible current catalog while an older draft queue exists',async()=>{
 const h=await harness();try{await h.start();h.publish(current);h.select(target.exerciseId);await h.w.HealthWorkout.editSettings();assert.match(h.el('training-settings-editor').textContent,/虎口朝外/);const input=h.el('training-settings-editor').querySelector('[aria-label="動作備註"]');input.value='SYNTHETIC new note';const save=[...h.el('training-settings-editor').querySelectorAll('button')].find(b=>b.textContent==='儲存設定');await save.onclick();const s=await h.state();assert.equal(s.catalog.find(e=>e.exerciseId===target.exerciseId).settings.notes,input.value);assert.equal(s.queue.at(-1).action,'saveExerciseSettings');}finally{h.close();}
});
test('UX G1 adding an exercise cannot create an unsavable 201st set',async()=>{
 const h=await harness({catalog:current});try{await h.start();await h.w.HealthWorkout.workspace.change(s=>s.draft.exercises.push({exerciseId:back.exerciseId,exerciseName:back.exerciseName,exerciseType:'WEIGHT_REPS',settings:{},sets:Array.from({length:200},(_,i)=>({...h.w.TrainingWorkspaceCore.newSet(),order:i+1}))}));h.select(target.exerciseId);await h.press('add-exercise');assert.equal((await h.state()).draft.exercises.length,1);assert.match(h.el('training-workspace-status').textContent,/上限/);}finally{h.close();}
});
test('UX G3 LAST prefill stays incomplete, copy is independent, and editing completion does not restart rest',async()=>{
 const h=await harness({catalog:current});try{await h.start();h.select(target.exerciseId);await h.press('add-exercise');const w=h.w.HealthWorkout.workspace;await w.change(s=>{s.history=[{recordId:'SYNTHETIC_PREVIOUS',revision:7,sessionId:'SYNTHETIC_PREVIOUS_SESSION',date:'2026-10-30',exerciseId:target.exerciseId,exerciseType:'WEIGHT_REPS',setNumber:1,weight:80,reps:5,completed:true}];s.historyCoverage={[target.exerciseId]:{hasMore:false}};s.draft.restSeconds=120;});let s=await h.state(),first=s.draft.exercises[0].sets[0];await h.w.HealthWorkout.prefillLast(target.exerciseId,first.id);s=await h.state();assert.equal(s.draft.exercises[0].sets[0].completed,false);assert.equal(s.draft.exercises[0].sets[0].prefillSource.revision,7);assert.equal(s.queue.filter(q=>q.action==='upsertTrainingSet').length,0);await h.w.HealthWorkout.saveSet(target.exerciseId,first.id);s=await h.state();const deadline=s.draft.restTimer.deadline;assert.ok(deadline>Date.now()+119000);await h.w.HealthWorkout.saveSet(target.exerciseId,first.id);assert.equal((await h.state()).draft.restTimer.deadline,deadline);await h.w.HealthWorkout.addSet(target.exerciseId,true);s=await h.state();const second=s.draft.exercises[0].sets[1];assert.notEqual(second.id,first.id);assert.equal(second.completed,false);assert.equal(second.values.weight,80);await h.w.HealthWorkout.addSet(target.exerciseId,false);assert.deepEqual((await h.state()).draft.exercises[0].sets[2].values,{});}finally{h.close();}
});
test('UX G3 previous reference excludes the current session even after a confirmed completed set',async()=>{const h=await harness({catalog:current});try{await h.start();h.select(target.exerciseId);await h.press('add-exercise');const w=h.w.HealthWorkout.workspace;await w.change(s=>{s.history=[{recordId:'CURRENT',sessionId:s.draft.id,date:s.draft.date,exerciseId:target.exerciseId,setNumber:1,weight:99,reps:8,completed:true},{recordId:'PREVIOUS',revision:4,sessionId:'EARLIER_SESSION',date:'2026-10-30',exerciseId:target.exerciseId,setNumber:1,weight:70,reps:5,completed:true}];});await h.w.HealthWorkout.render();assert.match(h.el('exercise-session-list').querySelector('.ux-set-reference').textContent,/70 kg/);assert.doesNotMatch(h.el('exercise-session-list').querySelector('.ux-set-reference').textContent,/99 kg/);const id=(await h.state()).draft.exercises[0].sets[0].id;await h.w.HealthWorkout.prefillLast(target.exerciseId,id);assert.equal((await h.state()).draft.exercises[0].sets[0].values.weight,70);}finally{h.close();}});
test('T1 visible selected shoulder exercise joins the session despite an older nonempty queued catalog',async()=>{
 const h=await harness();try{
  await h.start();h.publish(current);h.el('muscle-group-select').value='shoulder';h.el('muscle-group-select').dispatchEvent(new h.w.Event('change'));h.select(target.exerciseId);
  const before=await h.state(),requestsBefore=h.calls.length;assert.match(h.el('muscle-group-select').selectedOptions[0].textContent,/肩部（13）/);assert.equal(h.el('exercise-select').selectedOptions[0].textContent,target.exerciseName);
  assert.ok(!before.catalog.some(e=>e.exerciseId===target.exerciseId));assert.ok(before.queue.length>0);
  await h.press('add-exercise');const after=await h.state();
  if(process.env.TRAINING_ADD_EVIDENCE_DIR){fs.mkdirSync(process.env.TRAINING_ADD_EVIDENCE_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.TRAINING_ADD_EVIDENCE_DIR,'T1-observation.json'),JSON.stringify({scope:'synthetic local real-picker/handler/Workspace/IndexedDB, no service writes',visibleId:h.el('exercise-select').value,visibleName:target.exerciseName,persistedCatalogHadId:false,pendingQueue:before.queue.length,addedCount:after.draft.exercises.length,requestsDuringAdd:h.calls.slice(requestsBefore),status:h.el('training-workspace-status').textContent,date:after.draft.date},null,2));}
  assert.equal(after.draft.exercises.length,1,h.el('training-workspace-status').textContent);assert.equal(after.draft.exercises[0].exerciseId,target.exerciseId);
  assert.equal(after.draft.exercises[0].sets.length,1);assert.equal(after.draft.exercises[0].sets[0].completed,false);assert.equal(h.el('exercise-session-list').querySelectorAll('.training-live-set').length,1);
  assert.ok(!/SELECT_EXERCISE|尚未同步/.test(h.el('training-workspace-status').textContent));assert.equal(after.draft.date,'2026-11-01');
 }finally{h.close();}
});
for(const kind of ['body-part','search'])test('T2 '+kind+' changes do not retain a different filtered-out exercise',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();h.select(target.exerciseId);
  if(kind==='body-part'){h.el('muscle-group-select').value='back';h.el('muscle-group-select').dispatchEvent(new h.w.Event('change'));}
  else{h.el('exercise-search').value=back.exerciseName;h.el('exercise-search').dispatchEvent(new h.w.Event('input'));}
  assert.equal(h.el('exercise-select').value,back.exerciseId,'visible selection must belong to current filter');
  await h.press('add-exercise');assert.equal((await h.state()).draft.exercises[0].exerciseId,back.exerciseId);
 }finally{h.close();}
});
test('T3 zero search results cannot retain an addable old selection',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();h.select(target.exerciseId);h.el('exercise-search').value='完全不存在的合成動作';h.el('exercise-search').dispatchEvent(new h.w.Event('input'));
  assert.equal(h.el('exercise-select').value,'');assert.equal(h.el('exercise-select').disabled,true);
  const before=await h.state(),n=h.calls.length;await h.press('add-exercise');const after=await h.state();
  assert.equal(after.draft.exercises.length,0);assert.deepEqual(after.draft,before.draft);assert.equal(h.calls.length,n);
  assert.match(h.el('training-workspace-status').textContent,/請選擇訓練動作/);assert.ok(!/尚未同步|輸入已保留/.test(h.el('training-workspace-status').textContent));
 }finally{h.close();}
});
test('T2 selection changed during readiness does not silently add another exercise',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();h.select(target.exerciseId);let release;h.env.ready=()=>new Promise(r=>release=r);
  const before=await h.state(),n=h.calls.length,pending=h.el('add-exercise').onclick();await flush();h.select(back.exerciseId);release();await pending;
  assert.deepEqual((await h.state()).draft,before.draft);assert.equal(h.calls.length,n);assert.match(h.el('training-workspace-status').textContent,/選擇已變更/);
 }finally{h.close();}
});
test('T2 selection changed during history read cannot add the old exercise',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();h.select(target.exerciseId);h.setOnline(true);let release;h.env.request=async(action,payload)=>{assert.equal(action,'getTrainingExerciseHistory');assert.equal(payload.exerciseId,target.exerciseId);return new Promise(r=>release=r);};
  const pending=h.el('add-exercise').onclick();await flush();h.select(back.exerciseId);release({records:[],hasMore:false});await pending;
  assert.equal((await h.state()).draft.exercises.length,0);assert.match(h.el('training-workspace-status').textContent,/選擇已變更/);
 }finally{h.close();}
});
for(const kind of ['empty','invalidated','unavailable'])test('T3 '+kind+' catalog is a selection state, never a sync failure',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();h.select(target.exerciseId);
  if(kind==='empty')h.publish([]);else h.w.exerciseDatabase=kind==='invalidated'?older:null;
  const before=await h.state(),n=h.calls.length;await h.press('add-exercise');assert.deepEqual((await h.state()).draft,before.draft);assert.equal(h.calls.length,n);
  assert.match(h.el('training-workspace-status').textContent,kind==='empty'?/請選擇訓練動作/:kind==='invalidated'?/清單已更新/:/沒有可加入的動作/);
  assert.ok(!/尚未同步|輸入已保留/.test(h.el('training-workspace-status').textContent));
 }finally{h.close();}
});
test('T3 unexpected selection programming failure retains safe phase diagnostics without pretending a network failure',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();h.select(target.exerciseId);h.env.exercises=()=>{throw TypeError('SYNTHETIC_PROGRAM_FAILURE_DO_NOT_DISPLAY');};await h.press('add-exercise');
  const status=h.el('training-workspace-status');assert.equal(status.dataset.failureStage,'SELECTION');assert.equal(status.dataset.failureCode,'TRAINING_ADD_FAILED');assert.match(status.textContent,/TRAINING_ADD_FAILED/);assert.ok(!/尚未同步|網路|SYNTHETIC_PROGRAM/.test(status.textContent));assert.equal((await h.state()).draft.exercises.length,0);
 }finally{h.close();}
});
test('T4 successful add, failed local save and retry preserve typed values, date and exact existing queue',async()=>{
 const h=await harness({catalog:current});try{
  await h.start('2026-10-31');h.select(back.exerciseId);await h.press('add-exercise');
  for(const [field,value] of [['weight','37.5'],['reps','9'],['notes','SYNTHETIC retained note']]){const input=h.el('exercise-session-list').querySelector('[data-field="'+field+'"]');input.value=value;input.dispatchEvent(new h.w.Event('input'));await flush();}
  const before=await h.state();h.select(target.exerciseId);const repo=h.w.HealthWorkout.workspace.repo,change=repo.change.bind(repo);repo.change=async()=>{throw Error('SYNTHETIC_DISK_FAILURE');};await h.press('add-exercise');
  assert.deepEqual((await h.state()).draft,before.draft);assert.match(h.el('training-workspace-status').textContent,/尚未保存到本機/);
  repo.change=change;await h.press('add-exercise');const after=await h.state();assert.equal(after.draft.exercises.length,2);assert.deepEqual(after.draft.exercises[0],before.draft.exercises[0]);assert.deepEqual(after.queue,before.queue);assert.equal(after.draft.date,'2026-10-31');assert.equal(h.el('workout-date').value,'2026-10-31');
  const reread=await new h.w.TrainingWorkspaceCore.Workspace(new h.w.TrainingWorkspaceCore.IndexedRepository(),h.w.HealthWorkout.workspace.identity).read();assert.deepEqual(reread.draft,after.draft);
 }finally{h.close();}
});
test('T4 a double click dispatches the real add handler once without creating an extra exercise or set',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();h.select(target.exerciseId);const control=h.el('add-exercise'),pending=control.onclick();control.click();await pending;const s=await h.state();assert.equal(s.draft.exercises.length,1);assert.equal(s.draft.exercises[0].sets.length,1);assert.equal(control.disabled,false);assert.ok(!/DUPLICATE_EXERCISE_ID/.test(h.el('training-workspace-status').textContent));
 }finally{h.close();}
});
test('T4 current catalog metadata does not erase an unsent settings mutation or its exact request',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();const w=h.w.HealthWorkout.workspace,settings={exerciseType:'WEIGHT_REPS',notes:'SYNTHETIC pending note',weightIncrement:1.25};
  await w.enqueue('saveExerciseSettings',{exerciseId:target.exerciseId,revision:1,settings},s=>{const e=s.catalog.find(e=>e.exerciseId===target.exerciseId);e.settings=settings;e.revision=2;});
  const before=await h.state();h.publish(current.map(e=>e.exerciseId===target.exerciseId?{...e,revision:3,settings:{...e.settings,notes:'SYNTHETIC remote note'}}:e));h.select(target.exerciseId);await h.press('add-exercise');const after=await h.state();assert.deepEqual(after.queue,before.queue);assert.deepEqual(after.draft.exercises[0].settings,settings);assert.equal(after.catalog.find(e=>e.exerciseId===target.exerciseId).settings.notes,settings.notes);
 }finally{h.close();}
});
test('T4 owner switch while readiness is pending does not write the prior selection into either account',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();h.select(target.exerciseId);const original=h.w.HealthWorkout.workspace,before=await original.read();let release;h.env.ready=()=>new Promise(r=>release=r);const pending=h.el('add-exercise').onclick();await flush();h.setContext({owner:'SYNTHETIC_LOCAL_B',epoch:1});release();await pending;
  assert.deepEqual((await original.read()).draft,before.draft);const second=new h.w.TrainingWorkspaceCore.Workspace(new h.w.TrainingWorkspaceCore.IndexedRepository(),{owner:'SYNTHETIC_LOCAL_B',provider:'ISOLATED_LOCAL'});assert.equal((await second.read()).draft,null);assert.match(h.el('training-workspace-status').textContent,/帳號已變更/);
 }finally{h.close();}
});
test('T5 local commit followed by render failure is reported saved and rereads without a second add',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();h.select(target.exerciseId);const list=h.el('exercise-session-list'),replace=list.replaceChildren.bind(list);list.replaceChildren=()=>{throw Error('SYNTHETIC_RENDER_FAILURE');};await h.press('add-exercise');assert.equal((await h.state()).draft.exercises.length,1);assert.match(h.el('training-workspace-status').textContent,/已保存到本機，但畫面更新失敗/);
  list.replaceChildren=replace;await h.w.HealthWorkout.render();assert.equal(list.querySelectorAll('.training-live-set').length,1);assert.equal((await h.state()).draft.exercises.length,1);
 }finally{h.close();}
});
test('history read failure is not called a database write failure and leaves the session unchanged',async()=>{
 const h=await harness({catalog:current});try{
  await h.start();h.select(target.exerciseId);const before=await h.state();h.setOnline(true);h.env.request=async()=>{throw Error('SYNTHETIC_READ_FAILURE');};await h.press('add-exercise');assert.deepEqual((await h.state()).draft,before.draft);assert.match(h.el('training-workspace-status').textContent,/歷史讀取失敗，尚未加入/);assert.equal(h.el('training-workspace-status').dataset.failureStage,'HISTORY');
 }finally{h.close();}
});
