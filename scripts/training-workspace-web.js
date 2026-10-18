/* Product wiring only: normal verified-session transport; IndexedDB contains no credentials. */
(function(root){
 'use strict';
 const C=root.TrainingWorkspaceCore,labels={WEIGHT_REPS:'重量 × 次數',REPS:'次數',DURATION:'時間',DISTANCE_DURATION:'距離與時間'},fields={weight:'重量 kg',reps:'次數',distanceMeters:'距離 m',durationSeconds:'時間 秒',notes:'備註'};
 let env,workspace=null,repository,view=null,historySerial=0,offlineRecovery=false,recoveryGeneration=0,legacyMode=false,legacyHandlers=null,modernHandlers=null;
 const el=id=>document.getElementById(id),node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const clone=v=>structuredClone(v),id=()=>crypto.randomUUID();
 const button=(text,fn,primary=false)=>{const b=node('button',text,primary?'primary-button':'secondary-button');b.type='button';b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{await safe(fn);}finally{b.disabled=false;}};return b;};
 const required=kind=>kind==='WEIGHT_REPS'?['weight','reps']:kind==='REPS'?['reps']:kind==='DURATION'?['durationSeconds']:['distanceMeters','durationSeconds'];
 const nextOrder=draft=>Math.max(0,...draft.exercises.flatMap(e=>e.sets.map(s=>s.order||0)))+1;
 function same(w){w.active();if(workspace!==w||env.context().owner!==w.identity.owner||env.context().provider!==w.identity.provider){reset();throw Error('IDENTITY_CHANGED');}}
 function message(text){const target=el('training-workspace-status');if(target)target.textContent=text;}
 function explain(error){const code=error.code||error.message;return ({STALE_REVISION:'其他裝置已修改這筆資料。請先核對伺服器版本。',UNRESOLVED_CONFLICT:'有尚未解決的版本衝突，已停止補傳。',IDENTITY_CHANGED:'帳號已變更，已停止這次操作。',MISSING_SET_VALUES:'請填寫本組所需數值；未知值會保留空白。',LOCAL_SAVE_FAILED:'本機儲存失敗，請保留此頁與輸入內容。',INVALID_WORKOUT_SET:'請檢查數值範圍與整數次數。',EXERCISE_ARCHIVED:'動作已封存，請先恢復動作再開始新的訓練。'})[code]||'尚未同步，輸入已保留。'+(code||'網路暫時不可用');}
 async function safe(fn){try{await fn();}catch(e){message(explain(e));env?.notify?.(explain(e));}}
 async function ensure(){
  if(!env.enabled())throw Error('TRAINING_PROVIDER_REQUIRED');
  if(offlineRecovery&&workspace&&navigator.onLine===false){same(workspace);return workspace;}
  const before=env.context();await env.ready();const ctx=env.context();
  if(before.epoch!==ctx.epoch)throw Error('IDENTITY_CHANGED');
  if(!ctx.owner)throw Error('VERIFIED_OWNER_REQUIRED');
  if(workspace&&workspace.identity.owner===ctx.owner&&workspace.identity.provider===ctx.provider)return workspace;
  reset();repository??=new C.IndexedRepository();
  const w=workspace=new C.Workspace(repository,{owner:ctx.owner,provider:ctx.provider});await w.read();same(w);
  // Pointer permits offline draft recovery only; it is never authorization.
  localStorage.setItem('healthTrainingLastAccount',JSON.stringify({owner:ctx.owner,provider:ctx.provider}));
  return w;
 }
 async function refresh({catalog=true}={}){
  const w=await ensure(),serial=++historySerial;
  const [remote,history]=await Promise.all([env.request('getTrainingWorkspace',{}),env.request('getTrainingExerciseHistory',{})]);same(w);
  if(serial!==historySerial)return;
  if(catalog)await env.catalog({force:true});same(w);
  await w.change(s=>{if(s.queue.length)return;s.routines=remote.routines;s.sessions=remote.sessions;if(!s.draft){s.history=history.records;s.historyCoverage={};}s.historyHasMore=history.hasMore;s.catalog=clone(env.exercises());});
  const draft=(await w.read()).draft;for(const exercise of draft?.exercises||[])await loadExerciseHistory(w,exercise.exerciseId);
  await render();return remote;
 }
 async function sync(){
  const w=await ensure();if(navigator.onLine===false){message('離線：本機已保存，等待重新連線。');return;}
  const settingsPending=(await w.read()).queue.some(q=>q.action==='saveExerciseSettings');
  message('正在核對並同步…');
  try{await w.flush((a,p)=>{same(w);return env.request(a,p,{owner:w.identity.owner,epoch:env.context().sessionEpoch});},async()=>{const result=await env.request('getManualProviderIdentity',{});same(w);return result.canonicalUserId;});same(w);
   const state=await w.read();if(settingsPending&&!state.queue.length){await env.catalog({force:true});same(w);await w.change(s=>{if(!s.queue.length)s.catalog=clone(env.exercises());});}
   if(state.conflict)message('版本衝突：佇列已暫停，請查看下方差異。');else message('伺服器已確認同步。');
   await render();if(!state.queue.length){try{await env.refreshStats();same(w);}catch(error){same(w);message('已同步；統計更新失敗，可重新讀取。');}}
  }catch(error){if(workspace===w){message(explain(error));await render();}throw error;}
 }
 async function resume(){
  if(legacyMode){env.setView('workout_session');return true;}
  const w=await ensure();await render();same(w);const state=await w.read();if(state.queue.length&&!state.conflict&&navigator.onLine!==false)void safe(sync);if(state.draft){env.setView('workout_session');return true;}return false;
 }
 async function planFromDraft(draft){
  return {name:draft.name||'我的訓練',exercises:draft.exercises.map(e=>({exerciseId:e.exerciseId,exerciseType:e.exerciseType,sets:e.sets.filter(s=>!s.removed).map(s=>({mode:s.mode||'MANUAL',values:clone(s.values)}))}))};
 }
 async function loadExerciseHistory(w,exerciseId){
  if(navigator.onLine===false)return;
  const result=await env.request('getTrainingExerciseHistory',{exerciseId});same(w);
  await w.change(s=>{s.history=s.history.filter(r=>r.exerciseId!==exerciseId).concat(result.records);s.historyCoverage??={};while(s.history.length>400){const older=s.history.find(r=>r.exerciseId!==exerciseId)?.exerciseId;if(!older)break;s.history=s.history.filter(r=>r.exerciseId!==older);delete s.historyCoverage[older];}s.historyCoverage[exerciseId]={hasMore:result.hasMore,checkedAt:new Date().toISOString()};});
 }
 async function start(plan={name:'我的訓練',exercises:[]},source=null,date=el('training-start-date')?.value||env.today(),copied=null){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>env.today())throw Error('INVALID_WORKOUT_TIME');
  const w=await ensure();let state=await w.read();same(w);if(state.draft?.status==='ACTIVE'){env.setView('workout_session');message('已恢復尚未結束的訓練；請先結束它，再開始下一次。');return;}
  if(!copied)for(const e of plan.exercises)if(e.sets.some(s=>s.mode==='LAST'))await loadExerciseHistory(w,e.exerciseId);
  state=await w.read();same(w);
  const catalog=state.catalog.length?state.catalog:env.exercises(),now=new Date().toISOString();
  const draft=copied||{schema:C.VERSION,id:id(),revision:1,date,timezone:'Asia/Taipei',startTime:now,status:'ACTIVE',name:plan.name,snapshot:{plan:clone(plan),source},exercises:[]};
  if(!copied)for(const e of plan.exercises){
   const exercise=catalog.find(x=>x.exerciseId===e.exerciseId);if(!exercise||exercise.archived)throw Error('EXERCISE_ARCHIVED');
   const kind=e.exerciseType||exercise.settings?.exerciseType||'WEIGHT_REPS',sets=e.sets.map((s,i)=>{
    const previous=s.mode==='LAST'?C.lastValues(state.history,e.exerciseId,i+1,kind):null;
    const set=C.newSet(s.mode==='FIXED'?s.values:previous?.values||{},previous?.source||null);set.mode=s.mode;
    if(s.mode==='LAST'&&!previous?.values)set.prefillNotice=previous?.ambiguous?'同日有多次舊訓練，無法判定先後，請選歷史來源或手動輸入。':!state.historyCoverage?.[e.exerciseId]?'尚未取得此動作歷史；請連線讀取或手動輸入。':'沒有對應的完成組，請輸入。';
    return set;
   });draft.exercises.push({exerciseId:e.exerciseId,exerciseName:exercise.exerciseName,bodyPartId:exercise.bodyPartId,exerciseType:kind,settings:clone(exercise.settings||{}),sets});
  }
  let order=0;for(const e of draft.exercises)for(const set of e.sets)set.order=++order;
  await w.enqueue('startTrainingSession',{sessionId:draft.id,date:draft.date,startTime:draft.startTime,timezone:draft.timezone,plan:await planFromDraft(draft),source},s=>{if(s.draft?.status==='ACTIVE')throw Error('ACTIVE_DRAFT_EXISTS');s.draft=draft;});same(w);
  await render();env.setView('workout_session');void safe(sync);
 }
 async function addExercise(){
  const w=await ensure(),state=await w.read(),exercise=state.catalog.find(e=>e.exerciseId===el('exercise-select').value);if(!exercise)throw Error('SELECT_EXERCISE');
  await loadExerciseHistory(w,exercise.exerciseId);same(w);
  await w.change(s=>{if(!s.draft||s.draft.status!=='ACTIVE')throw Error('SESSION_CLOSED');if(s.draft.exercises.some(e=>e.exerciseId===exercise.exerciseId))throw Error('DUPLICATE_EXERCISE_ID');
   if(s.draft.exercises.length>=50)throw Error('WORKOUT_SET_BOUND_EXCEEDED');
   const set=C.newSet();set.order=nextOrder(s.draft);s.draft.exercises.push({exerciseId:exercise.exerciseId,exerciseName:exercise.exerciseName,exerciseType:exercise.settings?.exerciseType||'WEIGHT_REPS',settings:clone(exercise.settings||{}),sets:[set]});});
  await render();
 }
 async function editLocalSet(exerciseId,setId,patch){
  const w=await ensure();await w.change(s=>{const e=s.draft?.exercises.find(x=>x.exerciseId===exerciseId),set=e?.sets.find(x=>x.id===setId);if(!set)throw Error('SET_NOT_FOUND');Object.assign(set.values,patch);});
  message('本機草稿已保存；未按完成不計入實績。');
 }
 async function adjustWeight(exerciseId,setId,delta){const w=await ensure();await w.change(s=>{const set=s.draft?.exercises.find(e=>e.exerciseId===exerciseId)?.sets.find(set=>set.id===setId);if(set?.values.weight==null)throw Error('MISSING_SET_VALUES');set.values.weight=Math.max(0,set.values.weight+delta);});await render();}
 async function saveSet(exerciseId,setId,{undo=false,remove=false}={}){
  const w=await ensure();const state=await w.read(),d=state.draft,e=d?.exercises.find(x=>x.exerciseId===exerciseId),set=e?.sets.find(x=>x.id===setId);if(!set||d.status!=='ACTIVE')throw Error('SET_NOT_FOUND');
  if(remove&&!set.revision){await w.change(s=>{s.draft.exercises.find(x=>x.exerciseId===exerciseId).sets.find(x=>x.id===setId).removed=true;});await render();return;}
  const values=C.measurements(undo||remove?set.lastSentValues||set.values:set.values,e.exerciseType);
  const all=d.exercises.flatMap(x=>x.sets),payload={sessionId:d.id,sessionRevision:d.revision,recordId:set.id,revision:set.revision,exerciseId,exerciseType:e.exerciseType,
    setOrder:set.order||all.findIndex(x=>x.id===setId)+1,setNumber:e.sets.findIndex(x=>x.id===setId)+1,values,completed:!undo&&!remove,prefillSource:set.prefillSource};
  await w.enqueue('upsertTrainingSet',payload,s=>{
   if(s.draft.id!==d.id||s.draft.revision!==d.revision)throw Error('STALE_REVISION');
   const target=s.draft.exercises.find(x=>x.exerciseId===exerciseId).sets.find(x=>x.id===setId);
   target.completed=payload.completed;target.removed=remove;target.revision++;target.lastSentValues=clone(values);s.draft.revision++;
  });await render();void safe(sync);
 }
 async function finish(){
  const w=await ensure(),state=await w.read(),d=state.draft;if(!d)return;
  const endTime=new Date().toISOString();
  await w.enqueue('finishTrainingSession',{sessionId:d.id,sessionRevision:d.revision,endTime},s=>{if(s.draft.revision!==d.revision)throw Error('STALE_REVISION');s.draft.status='FINISHED';s.draft.revision++;s.draft.endTime=endTime;s.lastSession=clone(s.draft);s.draft=null;});
  env.setSession(null);env.setView('overview');await render();void safe(sync);
 }
 function inputs(values,kind,onchange,{note=true}={}){
  const area=node('div',undefined,'training-set-inputs');
  for(const key of [...required(kind),...(note?['notes']:[])]){
   const label=node('label',fields[key]);const input=node('input');input.className='form-input';input.dataset.field=key;input.type=key==='notes'?'text':'number';input.value=values[key]??'';
   if(key!=='notes'){input.min=key==='weight'?'0':'0.01';input.step=key==='reps'?'1':'any';input.inputMode=key==='reps'?'numeric':'decimal';}
   input.oninput=()=>safe(()=>onchange({[key]:key==='notes'?input.value:input.value===''?null:Number(input.value)}));label.append(input);area.append(label);
  }return area;
 }
 function performance(v){const chunks=[];for(const key of ['weight','reps','distanceMeters','durationSeconds'])if(v[key]!=null)chunks.push(String(v[key])+' '+({weight:'kg',reps:'次',distanceMeters:'m',durationSeconds:'秒'})[key]);return chunks.join(' × ')||'待輸入';}
 async function renderHistory(exercise,details,history){
  details.replaceChildren(node('summary','上次與近期逐組紀錄'));
  const rows=C.completedHistory(history,exercise.exerciseId).slice(0,12);
  if(!rows.length){details.append(node('p',view?.historyCoverage?.[exercise.exerciseId]?'尚無已確認的完成紀錄；預填值保持空白。':'此動作歷史尚未讀取，請連線後重新讀取；預填值保持空白。'));return;}
  let shown='';
  for(const row of rows){
   if(shown!==row.sessionId){shown=row.sessionId;const h=node('div',row.date+' · 來源訓練 '+String(row.sessionId).slice(0,8),'training-history-date');
    h.append(button('沿用此訓練的組',async()=>{
     const w=await ensure(),source=await env.request('getTrainingExerciseHistory',{sessionId:row.sessionId});same(w);if(source.hasMore)throw Error('READ_BOUND_EXCEEDED');
     await w.change(s=>{const current=s.draft.exercises.find(e=>e.exerciseId===exercise.exerciseId);if(current.sets.some(x=>x.completed||x.revision))throw Error('COMPLETED_SETS_REQUIRE_EDIT');
      let order=nextOrder(s.draft);current.sets=source.records.filter(x=>x.exerciseId===exercise.exerciseId&&(x.exerciseType||'WEIGHT_REPS')===current.exerciseType).map(r=>({...C.newSet(C.measurements(r,current.exerciseType,false),{date:r.date,sessionId:r.sessionId,setId:r.recordId,revision:r.revision,kind:'LAST'}),order:order++}));if(nextOrder(s.draft)>201)throw Error('WORKOUT_SET_BOUND_EXCEEDED');});await render();
    }));details.append(h);
   }
   const p=node('p','第 '+(row.setNumber||'—')+' 組 · '+performance(row));p.append(button('查看／修正來源組',()=>row.sessionRevision?editHistory(row):env.editEvidence(row)));details.append(p);
  }
  details.append(node('p','只顯示已由伺服器確認的紀錄；舊資料同日多次訓練的先後可能未知。','record-date-note'));
 }
 async function editHistory(row){
  const w=await ensure(),result=await env.request('getTrainingExerciseHistory',{sessionId:row.sessionId});same(w);
  const fresh=result.records.find(r=>r.recordId===row.recordId);if(!fresh)throw Error('WORKOUT_NOT_FOUND');
   const target=showSettingsPanel();target.replaceChildren(node('h3','修正來源組'),node('p',fresh.date+' · '+fresh.exerciseName));
  const values=C.measurements(fresh,fresh.exerciseType||'WEIGHT_REPS',false);target.append(inputs(values,fresh.exerciseType||'WEIGHT_REPS',patch=>Object.assign(values,patch)),button('取消',()=>{target.hidden=true;target.replaceChildren();}));
  for(const [caption,completed] of [['儲存修正',true],['撤銷這組完成',false]])target.append(button(caption,async()=>{
   await w.enqueue('upsertTrainingSet',{sessionId:fresh.sessionId,sessionRevision:fresh.sessionRevision,recordId:fresh.recordId,revision:fresh.revision,exerciseId:fresh.exerciseId,exerciseType:fresh.exerciseType||'WEIGHT_REPS',
    setOrder:fresh.setOrder,setNumber:fresh.setNumber,values:C.measurements(values,fresh.exerciseType||'WEIGHT_REPS'),completed},s=>{
     if(s.draft?.id===fresh.sessionId){if(s.draft.revision!==fresh.sessionRevision)throw Error('STALE_REVISION');const set=s.draft.exercises.flatMap(e=>e.sets).find(set=>set.id===fresh.recordId);
      if(set){set.values=clone(values);set.lastSentValues=clone(values);set.revision=fresh.revision+1;set.completed=completed;}s.draft.revision++;}
    });
   target.hidden=true;await sync();
  }));
  target.scrollIntoView?.({block:'nearest'});
 }
 async function render(){
  const w=workspace;if(!w)return;let state=await w.read();same(w);
  if(state.draft?.exercises.some(e=>e.sets.some(set=>!set.order))){await w.change(s=>{const sets=s.draft.exercises.flatMap(e=>e.sets),used=new Set(sets.map(set=>set.order).filter(Boolean));for(const set of sets)if(!set.order){const sent=s.queue.find(q=>q.action==='upsertTrainingSet'&&q.payload.recordId===set.id)?.payload||s.history.find(r=>r.recordId===set.id);let order=sent?.setOrder||sets.indexOf(set)+1;while(used.has(order))order++;set.order=order;used.add(order);}});state=await w.read();same(w);}
  view=state;env.setSession(state.draft);
  const target=el('exercise-session-list');if(!target)return;
  const active=document.activeElement,focusId=active?.closest?.('[data-set-id]')?.dataset.setId,focusField=active?.dataset.field;target.replaceChildren();
  const draft=state.draft;
  if(draft){
   el('workout-date').value=draft.date;el('workout-date').disabled=true;
   el('workout-date').title='日期固定於本次快照；補登請在開始前選擇日期。';
   for(const exercise of draft.exercises){
    const block=node('article',undefined,'card card-pad training-exercise-card');block.dataset.exerciseId=exercise.exerciseId;
    const heading=node('h3',exercise.exerciseName);block.append(heading,node('p',labels[exercise.exerciseType]+(exercise.settings.equipment?' · '+exercise.settings.equipment:''),'record-date-note'));
    if(exercise.settings.notes)block.append(node('p',exercise.settings.notes));
    const history=node('details');void renderHistory(exercise,history,state.history);block.append(history);
    for(const [i,set] of exercise.sets.entries()){
     if(set.removed)continue;const row=node('section',undefined,'training-live-set');row.dataset.setId=set.id;
     row.append(node('strong','第 '+(i+1)+' 組 · '+(set.completed?'已完成':'未完成／預填')));
     if(set.prefillSource)row.append(node('p','輸入輔助來源：'+set.prefillSource.date+' · 不代表已完成','record-date-note'));
     if(set.prefillNotice)row.append(node('p',set.prefillNotice,'record-date-note'));
     row.append(inputs(set.values,exercise.exerciseType,patch=>editLocalSet(exercise.exerciseId,set.id,patch)));
     if(exercise.exerciseType==='WEIGHT_REPS'){
      const increment=Number(exercise.settings.weightIncrement)||2.5;
      row.append(button('− '+increment+' kg',()=>adjustWeight(exercise.exerciseId,set.id,-increment)),
       button('＋ '+increment+' kg',()=>adjustWeight(exercise.exerciseId,set.id,increment)));
     }
     const warm=node('label','暖身組 '),checkbox=node('input');checkbox.type='checkbox';checkbox.checked=set.values.warmup===true;checkbox.onchange=()=>safe(()=>editLocalSet(exercise.exerciseId,set.id,{warmup:checkbox.checked}));warm.append(checkbox);row.append(warm);
     const actions=node('div',undefined,'training-row-actions');actions.append(button(set.completed?'儲存本組修改':'完成本組',()=>saveSet(exercise.exerciseId,set.id),true));
     if(set.completed)actions.append(button('撤銷完成',()=>saveSet(exercise.exerciseId,set.id,{undo:true})));
     actions.append(button('刪除誤建組',()=>saveSet(exercise.exerciseId,set.id,{remove:true})));row.append(actions);block.append(row);
    }
    block.append(button('＋ 下一組',async()=>{await w.change(s=>{const e=s.draft.exercises.find(x=>x.exerciseId===exercise.exerciseId);if(s.draft.exercises.reduce((n,x)=>n+x.sets.length,0)>=200)throw Error('WORKOUT_SET_BOUND_EXCEEDED');
     const previous=e.sets.filter(x=>!x.removed).at(-1),next=C.newSet(previous?.values||{},previous?{date:s.draft.date,setId:previous.id,kind:'TODAY_PREFILL'}:null);next.order=nextOrder(s.draft);if(next.order>200)throw Error('WORKOUT_SET_BOUND_EXCEEDED');e.sets.push(next);});await render();target.querySelector('[data-exercise-id="'+CSS.escape(exercise.exerciseId)+'"] .training-live-set:last-of-type input')?.focus();}));
    target.append(block);
   }
   if(!draft.exercises.length)target.append(node('p','搜尋並加入動作，就可以逐組紀錄。'));
  }
  if(focusId&&focusField)target.querySelector('[data-set-id="'+CSS.escape(focusId)+'"] [data-field="'+focusField+'"]')?.focus();
  const pending=state.queue.length;message(state.conflict?'版本衝突：'+state.conflict.code+'。輸入已保留，補傳已暫停。':pending?pending+' 筆待同步；本機已保存。':state.lastConfirmedAt?'已同步（伺服器確認）；未完成組仍是本機草稿。':state.draft?'本機草稿已保存；尚無伺服器確認。':'尚未開始訓練；課表不計入實績。');
  renderRoutines(state);renderConflict(state);
 }
 function renderRoutines(state){
  const list=el('training-routines-list');if(!list)return;list.replaceChildren();
  for(const routine of state.routines.filter(r=>!r.archived)){
   const row=node('article',undefined,'training-routine-row');row.append(node('strong',routine.name),button('從課表開始',()=>start(routine,{routineId:routine.id,revision:routine.revision})),button('編輯',()=>editRoutine(routine)),button('封存',async()=>{
    const w=await ensure();await w.enqueue('saveTrainingRoutine',{routineId:routine.id,revision:routine.revision,plan:routine,archived:true},s=>{const r=s.routines.find(x=>x.id===routine.id);r.archived=true;r.revision++;});await render();void safe(sync);
   }));list.append(row);
  }if(!list.children.length)list.append(node('p','還沒有課表。建立範本不會產生訓練實績。'));
 }
 function routineFields(container,row,catalog){
  const select=node('select'),mode=node('select'),count=node('input');select.className=mode.className=count.className='form-input';select.setAttribute('aria-label','課表動作');mode.setAttribute('aria-label','預填方式');count.setAttribute('aria-label','規劃組數');count.type='number';count.min='1';count.max='50';count.value=row?.sets?.length||3;
  for(const e of catalog.filter(e=>!e.archived)){const option=node('option',e.exerciseName);option.value=e.exerciseId;select.append(option);}select.value=row?.exerciseId||select.options[0]?.value||'';
  for(const [v,t] of [['MANUAL','手動輸入'],['LAST','沿用上次'],['FIXED','固定值']]){const option=node('option',t);option.value=v;mode.append(option);}mode.value=row?.sets?.[0]?.mode||'MANUAL';
  const values=clone(row?.sets?.[0]?.values||{}),fixed=node('div');const redraw=()=>{fixed.replaceChildren(inputs(values,catalog.find(e=>e.exerciseId===select.value)?.settings?.exerciseType||row?.exerciseType||'WEIGHT_REPS',patch=>Object.assign(values,patch),{note:false}));fixed.hidden=mode.value!=='FIXED';};mode.onchange=redraw;select.onchange=redraw;redraw();
  const area=node('fieldset');area.append(select,count,mode,fixed,button('移除此規劃動作',()=>area.remove()));container.append(area);
  return {area,read:()=>{const n=Number(count.value);if(!Number.isSafeInteger(n)||n<1||n>50||!select.value)throw Error('INVALID_TRAINING_PLAN');
   const unchanged=row&&select.value===row.exerciseId&&n===row.sets.length&&mode.value===row.sets[0]?.mode&&JSON.stringify(values)===JSON.stringify(row.sets[0]?.values||{});
   const kind=unchanged?row.exerciseType:catalog.find(e=>e.exerciseId===select.value)?.settings?.exerciseType||'WEIGHT_REPS';
   return {exerciseId:select.value,exerciseType:kind,sets:unchanged?clone(row.sets):Array.from({length:n},()=>({mode:mode.value,values:mode.value==='FIXED'?C.measurements(values,kind,false):{}}))};}};
 }
 async function editRoutine(routine=null){
  const w=await ensure(),state=await w.read(),target=el('training-routine-editor');same(w);target.replaceChildren();target.hidden=false;
  const name=node('input'),rows=node('div'),entries=[];name.className='form-input';name.placeholder='課表名稱';name.setAttribute('aria-label','課表名稱');name.value=routine?.name||'';
  target.append(node('h3',routine?'編輯課表':'新增課表'),node('p','課表只決定預填；每一組仍須實際按完成。'),name,rows);
  for(const row of routine?.exercises||[])entries.push(routineFields(rows,row,state.catalog));
  target.append(button('＋ 規劃動作',()=>{entries.push(routineFields(rows,null,state.catalog));}),button('取消',()=>{target.hidden=true;target.replaceChildren();}),button('儲存課表',async()=>{
   if(!name.value.trim())throw Error('INVALID_TRAINING_TEXT');const plan={name:name.value.trim(),exercises:entries.filter(e=>e.area.isConnected).map(e=>e.read())},routineId=routine?.id||id(),revision=routine?.revision||0;
   await w.enqueue('saveTrainingRoutine',{routineId,revision,plan},s=>{const index=s.routines.findIndex(r=>r.id===routineId),item={...plan,id:routineId,revision:revision+1,archived:false};if(index<0)s.routines.push(item);else s.routines[index]=item;});
   target.hidden=true;target.replaceChildren();await render();void safe(sync);
  },true));name.focus();
 }
 async function editSettings(){
  const w=await ensure(),state=await w.read(),exercise=state.catalog.find(x=>x.exerciseId===el('exercise-select').value);if(!exercise)throw Error('SELECT_EXERCISE');
  const target=showSettingsPanel();target.replaceChildren();
  const select=node('select');select.className='form-input';select.setAttribute('aria-label','動作類型');for(const [v,t] of Object.entries(labels)){const option=node('option',t);option.value=v;select.append(option);}select.value=exercise.settings?.exerciseType||'WEIGHT_REPS';
  const favorite=node('input');favorite.type='checkbox';favorite.checked=exercise.settings?.favorite===true;const fav=node('label','常用動作 ');fav.append(favorite);
  const fields={};for(const [key,label] of [['notes','動作備註'],['equipment','器材／座椅設定'],['weightIncrement','預設重量增減 kg']]){const input=node('input');input.className='form-input';input.setAttribute('aria-label',label);input.type=key==='weightIncrement'?'number':'text';input.value=exercise.settings?.[key]??(key==='weightIncrement'?2.5:'');fields[key]=input;target.append(node('label',label),input);}
  target.prepend(node('h3',exercise.exerciseName+' · 個人設定'),node('p','類型變更只套用下一次加入的動作，不改寫既有訓練欄位。'),select,fav);
  target.append(button('取消',()=>{target.hidden=true;target.replaceChildren();}),button('儲存設定',async()=>{
   const settings={exerciseType:select.value,favorite:favorite.checked,notes:fields.notes.value,equipment:fields.equipment.value,weightIncrement:Number(fields.weightIncrement.value)};
   await w.enqueue('saveExerciseSettings',{exerciseId:exercise.exerciseId,revision:exercise.revision,settings},s=>{const e=s.catalog.find(x=>x.exerciseId===exercise.exerciseId);e.settings=settings;e.revision++;});
   target.hidden=true;await render();void safe(sync);
  },true));
 }
 function renderConflict(state){
  const target=el('training-sync-conflict');target.replaceChildren();target.hidden=!state.conflict;if(!state.conflict)return;
  target.append(node('h3','版本衝突，沒有覆寫伺服器資料'),node('p','請先讀取伺服器紀錄核對。本機內容與原請求會保留。'),
   button('讀取伺服器版本',async()=>{const w=workspace,result=await env.request('getTrainingExerciseHistory',{});same(w);const details=node('details');details.open=true;details.append(node('summary','伺服器近期紀錄'));for(const r of result.records.slice(0,20))details.append(node('p',r.date+' '+r.exerciseName+' '+performance(r)+' · revision '+r.revision));target.append(details);}),
   button('保留衝突證據，另存未完成副本',async()=>{
    const w=workspace;await w.change(s=>{s.conflictArchive??=[];if(s.conflictArchive.length>=10)throw Error('CONFLICT_ARCHIVE_BOUND_EXCEEDED');s.conflictArchive.push({at:new Date().toISOString(),draft:clone(s.draft),queue:clone(s.queue),conflict:clone(s.conflict)});s.queue=[];s.conflict=null;s.lastSession=s.draft;s.draft=null;});
    const original=state.draft;if(original){const copy=C.copySession(original,env.today());await start(await planFromDraft(copy),{kind:'CONFLICT_COPY'},copy.date,copy);}else await refresh();await render();
   }));
 }
 async function copyPrevious(){
  const w=await ensure(),state=await w.read();let source=state.lastSession;
  if(!source){const latest=C.completedHistory(state.history,state.history[0]?.exerciseId);const all=state.history,dates=[...new Set(all.map(r=>r.date))].sort().reverse();if(!dates.length)throw Error('NO_COMPLETED_HISTORY');
   const sessions=[...new Set(all.filter(r=>r.date===dates[0]).map(r=>r.sessionId))];if(sessions.length!==1)throw Error('AMBIGUOUS_SAME_DAY_HISTORY');
   const records=all.filter(r=>r.sessionId===sessions[0]);source={id:sessions[0],date:dates[0],timezone:'Asia/Taipei',exercises:[]};
   for(const r of records){let e=source.exercises.find(e=>e.exerciseId===r.exerciseId);if(!e){e={exerciseId:r.exerciseId,exerciseName:r.exerciseName,exerciseType:r.exerciseType||'WEIGHT_REPS',settings:{},sets:[]};source.exercises.push(e);}e.sets.push({id:r.recordId,values:C.measurements(r,e.exerciseType,false)});}
  }
  const copy=C.copySession(source,el('training-start-date')?.value||env.today());await start(await planFromDraft(copy),{kind:'COPY',sessionId:source.id,date:source.date},copy.date,copy);
 }
 function wire(handlers){if(handlers)for(const [key,fn] of Object.entries(handlers))el(key).onclick=fn;}
 function useLegacyDraft(){legacyMode=true;wire(legacyHandlers);el('finish-workout').onclick=async()=>{await legacyHandlers['finish-workout']();if(!env.getSession()){legacyMode=false;wire(modernHandlers);}};message('已恢復舊版草稿，沿用原儲存收據核對；不會重送為逐組實績。');}
 function showSettingsPanel(){const target=el('training-settings-editor');(el('workout-session').hidden?el('training-workspace-toolbar'):el('workout-session')).append(target);target.hidden=false;return target;}
 function reset(){recoveryGeneration++;workspace?.stop();workspace=null;view=null;offlineRecovery=false;legacyMode=false;wire(modernHandlers);historySerial++;localStorage.removeItem('healthTrainingLastAccount');env?.setSession?.(null);for(const id of ['exercise-session-list','training-routines-list','training-routine-editor','training-settings-editor','training-sync-conflict'])el(id)?.replaceChildren();}
 async function editRecord(record){const w=await ensure(),result=await env.request('getTrainingExerciseHistory',{sessionId:record.sessionId});same(w);const row=result.records.find(r=>r.recordId===record.recordId);if(!row)throw Error('SOURCE_OUTSIDE_RECENT_HISTORY');await editHistory(row);}
 async function recoverOffline(){
  if(offlineRecovery&&workspace)return true;
  if(!env||navigator.onLine!==false||!localStorage.getItem('healthCompanionSessionToken'))return false;
  const generation=recoveryGeneration,ctx=env.context(),token=localStorage.getItem('healthCompanionSessionToken'),pointer=localStorage.getItem('healthTrainingLastAccount');
  let saved;try{saved=JSON.parse(pointer||'null');}catch{return false;}
  if(!saved?.owner||!saved?.provider)return false;
  repository??=new C.IndexedRepository();const w=new C.Workspace(repository,saved),state=await w.read();
  if(generation!==recoveryGeneration||ctx.epoch!==env.context().epoch||token!==localStorage.getItem('healthCompanionSessionToken')||pointer!==localStorage.getItem('healthTrainingLastAccount')||navigator.onLine!==false||(!state.draft&&!state.queue.length)){w.stop();return false;}
  workspace?.stop();workspace=w;offlineRecovery=true;env.enterOffline(saved);
  env.applyCatalog?.(state.catalog);
  await render();env.setView(state.draft?'workout_session':'overview');message('離線草稿／待同步工作已恢復；重新驗證相同帳號之前不會上傳。');return true;
 }
 function mount(options){
  env=options;if(!env.enabled())return;
  legacyHandlers=Object.fromEntries(['start-workout','resume-workout','add-exercise','finish-workout'].map(key=>[key,el(key).onclick]));
  const style=node('style');style.textContent='.training-exercise-card{margin-top:12px;min-width:0}.training-live-set{display:block;padding:14px 0;border-top:1px solid var(--border-color)}.training-set-inputs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0}.training-set-inputs label{min-width:0;font-size:.8rem}.training-set-inputs input{min-height:44px;font-size:16px}.training-set-inputs label:last-child:nth-child(odd){grid-column:1/-1}.training-row-actions,.training-workspace-toolbar,.training-routine-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.training-row-actions button{min-height:44px}.training-history-date{margin-top:10px;font-weight:700}.training-routine-row strong{width:100%;overflow-wrap:anywhere}#training-routine-editor fieldset{border:1px solid var(--border-color);border-radius:10px;display:grid;gap:8px;margin:10px 0}#training-workspace-status{overflow-wrap:anywhere;line-height:1.6}#finish-workout{position:sticky;bottom:calc(80px + env(safe-area-inset-bottom));z-index:2}#workout-session{padding-bottom:110px}';
  document.head.append(style);
  const toolbar=node('section',undefined,'card card-pad'),actions=node('div',undefined,'training-workspace-toolbar');toolbar.id='training-workspace-toolbar';
  const status=node('p','尚未讀取訓練工作區','record-date-note');status.id='training-workspace-status';status.setAttribute('role','status');
  actions.append(button('讀取／恢復訓練',async()=>{await refresh();await resume();}),button('新增課表',()=>editRoutine()),button('複製上次訓練',copyPrevious),button('重新同步',sync));
  const routines=node('details');routines.append(node('summary','我的課表'));const list=node('div');list.id='training-routines-list';routines.append(list);
  toolbar.append(actions,status,routines);for(const name of ['training-routine-editor','training-settings-editor','training-sync-conflict']){const panel=node('section');panel.id=name;panel.hidden=true;toolbar.append(panel);}
  el('training-overview').prepend(toolbar);const sessionStatus=node('p');sessionStatus.id='training-session-sync';el('workout-session').prepend(sessionStatus);
  // These replace the old whole-session submit; they never double-write completed sets.
  el('start-workout').onclick=()=>safe(async()=>{const w=await ensure();if(!(await w.read()).catalog.length)await refresh();const date=el('training-start-date').value||env.today();await start({name:'我的訓練',exercises:[]},null,date);});
  el('resume-workout').onclick=()=>safe(resume);el('add-exercise').onclick=()=>safe(addExercise);el('finish-workout').onclick=()=>safe(finish);
  modernHandlers=Object.fromEntries(['start-workout','resume-workout','add-exercise','finish-workout'].map(key=>[key,el(key).onclick]));
  const startDate=node('input');startDate.id='training-start-date';startDate.type='date';startDate.className='form-input';startDate.value=env.today();startDate.max=env.today();startDate.setAttribute('aria-label','開始或補登訓練日期');toolbar.prepend(startDate,node('p','訓練日期於開始時固定；跨午夜仍歸屬本次日期。','record-date-note'));
  let favoritesOnly=false;el('add-exercise').after(button('動作備註／器材設定',editSettings),button('常用／全部動作',async()=>{favoritesOnly=!favoritesOnly;const w=await ensure(),state=await w.read(),select=el('exercise-select');for(const option of select.options)option.hidden=favoritesOnly&&!state.catalog.find(e=>e.exerciseId===option.value)?.settings?.favorite;const first=[...select.options].find(o=>!o.hidden);select.value=first?.value||'';}));
  addEventListener('online',()=>safe(async()=>{if(workspace)await sync();}));addEventListener('offline',()=>message('已離線；草稿與待同步請求保存在此帳號的本機儲存。'));
  const observer=new MutationObserver(()=>{if(el('training-session-sync'))el('training-session-sync').textContent=el('training-workspace-status')?.textContent||'';});observer.observe(status,{childList:true,characterData:true,subtree:true});
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./training-offline-sw.js').catch(()=>message('離線頁面快取未就緒；本機草稿仍會保存。'));
 }
 root.HealthWorkout={mount,reset,resume,refresh,recoverOffline,useLegacyDraft,start,sync,render,editRoutine,editSettings,editRecord,saveSet,copyPrevious,get workspace(){return workspace;}};
})(globalThis);
