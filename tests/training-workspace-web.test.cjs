'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom'),{IDBFactory}=require('fake-indexeddb');
const source=name=>fs.readFileSync(path.join(__dirname,'../scripts',name),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,15));
async function fixture({repo,online=true}={}){
 const dom=new JSDOM('<!doctype html><head></head><body><section id="training-overview"><button id="start-workout"></button><button id="resume-workout"></button></section><section id="workout-session" hidden><input id="workout-date"><select id="exercise-select"><option value="squat">TEST squat</option></select><div id="exercise-session-list"></div><button id="add-exercise"></button><button id="finish-workout"></button></section></body>',{url:'http://127.0.0.1:55420/',runScripts:'outside-only'});
 const w=dom.window;w.structuredClone=structuredClone;w.indexedDB=new IDBFactory();w.CSS={escape:s=>s};Object.defineProperty(w.navigator,'onLine',{configurable:true,get:()=>online});w.eval(source('training-workspace-core.js'));
 if(repo)w.TrainingWorkspaceCore.IndexedRepository=class{constructor(){return repo;}};
 let ctx={owner:'A',provider:'TEST_ONLY',epoch:0,sessionEpoch:0},session=null,legacyCalls=0,catalog=[{exerciseId:'squat',exerciseName:'TEST squat',revision:1,settings:{exerciseType:'WEIGHT_REPS',favorite:false}}],calls=[];
 const handlers={};for(const id of ['start-workout','resume-workout','add-exercise','finish-workout']){handlers[id]=()=>{legacyCalls++;if(id==='finish-workout')session=null;};w.document.getElementById(id).onclick=handlers[id];}
 const env={enabled:()=>true,context:()=>ctx,ready:async()=>{},request:async(a,p)=>{calls.push({a,p:structuredClone(p)});if(a==='getTrainingWorkspace')return {routines:[],sessions:[]};if(a==='getTrainingExerciseHistory')return {records:[],hasMore:false};if(a==='getManualProviderIdentity')return {canonicalUserId:ctx.owner};return {status:'SAVED',requestId:p.clientRequestId};},catalog:async()=>catalog,exercises:()=>catalog,today:()=> '2026-10-17',getSession:()=>session,setSession:s=>{session=s;},setView:v=>{w.document.getElementById('workout-session').hidden=v!=='workout_session';w.document.getElementById('training-overview').hidden=v==='workout_session';},notify:()=>{},refreshStats:async()=>{},editEvidence:()=>{},enterOffline:s=>{ctx={...ctx,owner:s.owner,provider:s.provider};}};
 w.eval(source('training-workspace-web.js'));w.HealthWorkout.mount(env);await w.HealthWorkout.refresh();
 return {dom,w,env,calls,get session(){return session;},legacyCalls:()=>legacyCalls,setOnline:v=>{online=v;},setContext:v=>{ctx={...ctx,...v};},setCatalog:v=>{catalog=v;}};
}
async function click(f,text){const b=[...f.w.document.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(b,text);b.click();await tick();await tick();}
test('mounted handlers create stable per-set drafts, not legacy whole-session records',async()=>{
 const f=await fixture({online:false});try{f.w.document.getElementById('training-start-date').value='2026-10-06';await f.w.HealthWorkout.start();assert.equal(f.session.date,'2026-10-06');assert.ok(f.session.id);assert.equal(f.legacyCalls(),0);f.w.document.getElementById('add-exercise').click();await tick();await tick();
 const state=await f.w.HealthWorkout.workspace.read();assert.equal(state.draft.exercises[0].sets[0].completed,false);assert.equal(state.queue.length,1);assert.equal(state.queue[0].action,'startTrainingSession');assert.equal(f.w.document.querySelectorAll('.training-live-set').length,1);
 }finally{f.dom.window.close();}
});
test('simultaneous start uses atomic draft CAS and never overwrites the first planned session',async()=>{
 const f=await fixture({online:false});try{const result=await Promise.allSettled([f.w.HealthWorkout.start(),f.w.HealthWorkout.start()]);const state=await f.w.HealthWorkout.workspace.read();assert.equal(state.queue.filter(q=>q.action==='startTrainingSession').length,1);assert.equal(state.draft.id,state.queue[0].payload.sessionId);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);}finally{f.dom.window.close();}
});
test('quick load increment uses the latest typed draft rather than a stale render closure',async()=>{
 const f=await fixture({online:false});try{await f.w.HealthWorkout.start();f.w.document.getElementById('add-exercise').click();await tick();await tick();const input=f.w.document.querySelector('[data-field="weight"]');input.value='80';input.dispatchEvent(new f.w.Event('input'));await tick();await click(f,'＋ 2.5 kg');assert.equal((await f.w.HealthWorkout.workspace.read()).draft.exercises[0].sets[0].values.weight,82.5);}finally{f.dom.window.close();}
});
test('adding another set to an earlier exercise never renumbers a later source set',async()=>{
 const f=await fixture({online:false});try{await f.w.HealthWorkout.workspace.change(s=>s.catalog.push({exerciseId:'other',exerciseName:'TEST other',settings:{exerciseType:'WEIGHT_REPS'}}));const select=f.w.document.getElementById('exercise-select'),option=f.w.document.createElement('option');option.value='other';select.append(option);
 await f.w.HealthWorkout.start();select.value='squat';f.w.document.getElementById('add-exercise').click();await tick();await tick();select.value='other';f.w.document.getElementById('add-exercise').click();await tick();await tick();
 const later=(await f.w.HealthWorkout.workspace.read()).draft.exercises[1].sets[0].order;[...f.w.document.querySelector('[data-exercise-id="squat"]').querySelectorAll('button')].find(b=>b.textContent==='＋ 下一組').click();await tick();await tick();const state=await f.w.HealthWorkout.workspace.read();assert.equal(state.draft.exercises[1].sets[0].order,later);assert.ok(state.draft.exercises[0].sets[1].order>later);
 }finally{f.dom.window.close();}
});
test('settings editor is in the visible session, and refresh forces authoritative catalog',async()=>{
 const f=await fixture({online:false});try{await f.w.HealthWorkout.start();await f.w.HealthWorkout.editSettings();assert.equal(f.w.document.getElementById('training-settings-editor').parentElement.id,'workout-session');
 let force;f.env.catalog=async options=>{force=options.force;f.setCatalog([{exerciseId:'squat',settings:{notes:'saved note'},revision:2}]);};await f.w.HealthWorkout.workspace.change(s=>{s.queue=[];});await f.w.HealthWorkout.refresh();assert.equal(force,true);assert.equal((await f.w.HealthWorkout.workspace.read()).catalog[0].settings.notes,'saved note');
 }finally{f.dom.window.close();}
});
test('finishing offline freezes event time in the exact queue; never resubmits the whole workout',async()=>{
 const f=await fixture({online:false});try{await f.w.HealthWorkout.start();f.w.document.getElementById('finish-workout').click();await tick();await tick();const state=await f.w.HealthWorkout.workspace.read(),finish=state.queue.at(-1);assert.equal(finish.action,'finishTrainingSession');assert.equal(finish.payload.endTime,state.lastSession.endTime);assert.equal(state.draft,null);assert.equal(f.legacyCalls(),0);assert.ok(!state.queue.some(q=>q.action==='addWorkoutRecord'));}finally{f.dom.window.close();}
});
test('legacy locked draft retains its whole-session receipt handler and can return to modern flow',async()=>{
 const f=await fixture({online:false});try{f.env.setSession({sqlLocked:true,sqlEnvelope:{clientRequestId:'retained'}});f.w.HealthWorkout.useLegacyDraft();f.w.document.getElementById('finish-workout').click();await tick();assert.equal(f.legacyCalls(),1);f.w.document.getElementById('training-start-date').value='2026-10-06';await f.w.HealthWorkout.start();assert.equal(f.session.date,'2026-10-06');assert.ok(f.session.id);assert.equal((await f.w.HealthWorkout.workspace.read()).queue.length,1);
 const stateSource=source('web-view-state.js');assert.match(stateSource,/if\(await HealthWorkout.resume\(\)\)return true/);assert.match(stateSource,/HealthWorkout\?\.useLegacyDraft/);
 }finally{f.dom.window.close();}
});
test('detached offline restore cannot install account A after reset/login B',async()=>{
 let release;const deferred=new Promise(r=>{release=r;});const state={schema:'training-workspace.v1',draft:{id:'A-private'},history:[],queue:[],catalog:[],routines:[]};let delayed=false;
 const repo={read:async()=>delayed?deferred:{...state,draft:null},change:async()=>{}};
 const f=await fixture({repo,online:false});try{f.w.HealthWorkout.reset();f.w.localStorage.setItem('healthCompanionSessionToken','TEST_TOKEN');f.w.localStorage.setItem('healthTrainingLastAccount',JSON.stringify({owner:'A',provider:'TEST_ONLY'}));delayed=true;
 const pending=f.w.HealthWorkout.recoverOffline();f.w.HealthWorkout.reset();f.setContext({owner:'B',epoch:1});release(state);assert.equal(await pending,false);assert.equal(f.w.HealthWorkout.workspace,null);assert.equal(f.session,null);assert.ok(!f.w.document.body.textContent.includes('A-private'));
 }finally{f.dom.window.close();}
});
test('unchanged mixed-mode routine preserves each slot rather than homogenizing it',async()=>{
 const f=await fixture({online:false});try{const routine={id:'r',revision:1,name:'TEST mixed',exercises:[{exerciseId:'squat',exerciseType:'WEIGHT_REPS',sets:[{mode:'FIXED',values:{weight:80,reps:5}},{mode:'LAST',values:{}},{mode:'MANUAL',values:{}}]}]};await f.w.HealthWorkout.editRoutine(routine);await click(f,'儲存課表');const entry=(await f.w.HealthWorkout.workspace.read()).queue.at(-1);assert.deepEqual(JSON.parse(JSON.stringify(entry.payload.plan.exercises[0].sets)),routine.exercises[0].sets);}finally{f.dom.window.close();}
});
test('last values query the chosen exercise even when it is absent from the global recent list',async()=>{
 const f=await fixture();try{const original=f.env.request;f.env.request=async(a,p)=>a==='getTrainingExerciseHistory'&&p.exerciseId==='squat'?{records:[{recordId:'source',exerciseId:'squat',sessionId:'prior',date:'2026-10-06',setNumber:1,weight:45,reps:8,revision:1}],hasMore:false}:original(a,p);
 await f.w.HealthWorkout.start({name:'TEST last',exercises:[{exerciseId:'squat',exerciseType:'WEIGHT_REPS',sets:[{mode:'LAST',values:{}},{mode:'LAST',values:{}}]}]});const draft=(await f.w.HealthWorkout.workspace.read()).draft;assert.equal(draft.exercises[0].sets[0].values.weight,45);assert.equal(draft.exercises[0].sets[0].prefillSource.date,'2026-10-06');assert.equal(draft.exercises[0].sets[1].values.weight,undefined);assert.ok(draft.exercises[0].sets.every(s=>!s.completed));
 }finally{await tick();f.dom.window.close();}
});
test('typed historical labels show actual distance/time/reps and never invented zero loads',()=>{
 const ux=require('../scripts/core-ux-contract.js');assert.equal(ux.workoutSetLabel({exerciseType:'DURATION',durationSeconds:60}),'60 秒');assert.equal(ux.workoutSetLabel({exerciseType:'DISTANCE_DURATION',durationSeconds:60,distanceMeters:200}),'200 m · 60 秒');assert.equal(ux.workoutSetLabel({exerciseType:'REPS',reps:8}),'8 次');assert.equal(ux.workoutSetLabel({weight:80,reps:5,totalVolume:400}),'80 kg × 5 次 · 400 kg·次');
});
test('typed set durations sum, legacy session duration is counted once, unknown duration remains NULL',()=>{
 const vm=require('node:vm'),code=source('local-engine-web.js').split('function localTrainingDailyRows(records){')[1].split('function localTrainingSummary')[0],context={};vm.runInNewContext('function localTrainingDailyRows(records){'+code+';globalThis.calculate=localTrainingDailyRows;',context);
 const row={date:'2026-10-07',sessionId:'s',totalSets:1,totalVolume:null,durationMinutes:1,exerciseType:'DURATION'};assert.equal(context.calculate([row,{...row,recordId:'b'}])[0].trainingDuration,2);assert.equal(context.calculate([{...row,exerciseType:null,durationMinutes:10},{...row,exerciseType:null,durationMinutes:10}])[0].trainingDuration,10);assert.equal(context.calculate([row,{...row,durationMinutes:null}])[0].trainingDuration,null);
});
test('root mounts after existing view contracts; private transport fences owner after readiness',()=>{
 const index=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),transport=source('local-engine-web.js');assert.ok(index.lastIndexOf('initializeViewContracts();')<index.indexOf('HealthWorkout.mount('));assert.match(transport,/await ensureHostedManualIdentity\(\);\s*guard\(\)/);assert.match(source('training-workspace-web.js'),/expected|owner:w.identity.owner/);
});


test('normal online resume automatically replays existing requests after verified identity',async()=>{
 const f=await fixture({online:false});try{await f.w.HealthWorkout.start();const original=(await f.w.HealthWorkout.workspace.read()).queue[0].id;f.setOnline(true);await f.w.HealthWorkout.resume();await tick();await tick();assert.equal((await f.w.HealthWorkout.workspace.read()).queue.length,0);assert.equal(f.calls.find(c=>c.a==='startTrainingSession').p.clientRequestId,original);}finally{f.dom.window.close();}
});

test('finished offline session with no active draft still restores its queued work after reload',async()=>{
 const state={schema:'training-workspace.v1',draft:null,history:[],catalog:[],routines:[],queue:[{id:'retained',action:'finishTrainingSession',payload:{clientRequestId:'retained'}}],conflict:null};
 const repo={read:async()=>structuredClone(state),change:async(_,fn)=>fn(state)};
 const f=await fixture({repo,online:false});try{f.w.HealthWorkout.reset();f.w.localStorage.setItem('healthCompanionSessionToken','TEST_ONLY');f.w.localStorage.setItem('healthTrainingLastAccount',JSON.stringify({owner:'A',provider:'TEST_ONLY'}));assert.equal(await f.w.HealthWorkout.recoverOffline(),true);assert.equal(f.session,null);assert.equal((await f.w.HealthWorkout.workspace.read()).queue[0].id,'retained');assert.equal(f.w.document.getElementById('workout-session').hidden,true);assert.match(f.w.document.getElementById('training-workspace-status').textContent,/待同步/);}finally{f.dom.window.close();}
});

test('public query flags cannot activate localhost preview adapters or synthetic identity',()=>{
 const vm=require('node:vm'),html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 for(const hostname of ['d0252422-oss.github.io','localhost.attacker.invalid','127.0.0.1.attacker.invalid']){
  const context={location:{hostname,search:'?uiTest=1'},URLSearchParams,window:{HEALTH_ENGINE_LOCAL_CONFIG:{enabled:true}}};
  const a=html.split(/\r?\n/).find(l=>l.includes('const UI_TEST_MODE=')),b=html.split(/\r?\n/).find(l=>l.includes('const LOCAL_ENGINE_ENABLED='));
  vm.runInNewContext(a+b+';globalThis.flags=[UI_TEST_MODE,LOCAL_ENGINE_ENABLED];',context);assert.deepEqual(Array.from(context.flags),[false,false]);
 }
 assert.ok(!html.includes('fixture-workspace-subject-'));assert.ok(!html.includes('fixtureAccount='));
});
