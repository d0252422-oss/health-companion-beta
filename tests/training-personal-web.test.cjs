const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ui=require('../scripts/training-personal-web.js');
const source=fs.readFileSync(require.resolve('../scripts/training-personal-web.js'),'utf8');
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function harness({transport=false}={}){
 const nodes=new Map(),calls=[];
 const element=id=>{if(/^(goal-basis|goal-variant|goal-equipment|goal-side|training-pr-basis|pr-source-confirm|pr-source-basis|pr-source-status)$/.test(id))throw Error('Removed DOM requested: '+id);if(!nodes.has(id))nodes.set(id,{id,hidden:id==='training-personal-panel',dataset:{},value:id==='training-personal-range'?'all':id==='training-personal-exercise'?'bench':'',textContent:'',innerHTML:'',replaceChildren(){this.innerHTML='';this.textContent='';},append(){},scrollIntoView(){},reset(){},reportValidity(){return true;},setCustomValidity(){}});return nodes.get(id);};
 const document={getElementById:element,addEventListener(){},createElement:()=>({})};
 const context=vm.createContext({document,Intl,Promise,Set,Map,Number,String,Date,console,URL,Response,AbortSignal,currentUser:'A',localSessionEpoch:1,crypto:require('node:crypto').webcrypto,getLocalDateString:()=> '2026-10-09',readableError:e=>e.message,localEngineRequest:(action,payload)=>{const d=deferred();calls.push({action,payload,...d});return d.promise;},
  sessionToken:'synthetic-session',HOSTED_MANUAL_SQL_ENABLED:true,LOCAL_ENGINE_ENABLED:false,
  window:{HEALTH_MANUAL_SQL_CONFIG:{enabled:true,release:'AB',schemaVersion:'manual-sql-v1',projectRef:'uavimjgccigpbwqmfkhh',endpoint:'https://uavimjgccigpbwqmfkhh.supabase.co/functions/v1/mobile-health-beta/v1/engine/web'}},
  fetch:(url,options)=>{const d=deferred();calls.push({url,options,...JSON.parse(options.body),...d});return d.promise;}});
 if(transport){vm.runInContext(fs.readFileSync(require.resolve('../scripts/local-engine-web.js'),'utf8'),context);vm.runInContext("hostedManualBinding={token:sessionToken,canonical:'synthetic-owner'}",context);}
 vm.runInContext(source,context);context.TrainingPersonal.init();
 return {context,calls,element,finish:async(index,data)=>{calls[index].resolve(transport?new Response(JSON.stringify({ok:true,data}),{status:200}):data);await new Promise(resolve=>setImmediate(resolve));},flush:()=>new Promise(resolve=>setImmediate(resolve))};
}
const catalog=[{exerciseId:'bench',exerciseName:'Bench'}];
const pr={range:{startDate:null,endDate:'2026-10-09'},groups:[],excluded:[]};
// Sanitized Edge55 response shape, never a copy of private user records.
const enteredPr={...pr,version:'training-personal-records-goals-v1.2.0',semantics:'MAX_WEIGHT_AND_SINGLE_SET_VOLUME',comparisonVersion:'training-entered-load-v1'};
test('Edge55 personal records traverse the real hosted transport and render both independent bests',async()=>{
 const h=harness({transport:true});h.element('open-personal-records').onclick();await h.flush();
 await h.finish(0,[{...catalog[0],revision:1}]);
 const a={recordId:'synthetic-weight',revision:'4',load:80,loadKg:80,unit:'kg',reps:5,date:'2026-10-07',volumeKgReps:400},b={...a,recordId:'synthetic-volume',revision:'9',load:60,loadKg:60,reps:10,volumeKgReps:600};
 await h.finish(1,{...enteredPr,groups:[{exerciseName:'Bench',comparison:{exerciseId:'bench'},records:[a,b],maxWeight:a,maxSetVolume:b}]});
 assert.equal(h.element('training-personal-content').dataset.state,'ready');
 const html=h.element('training-personal-content').innerHTML;assert.match(html,/MAX_WEIGHT" data-pr-record="synthetic-weight" data-pr-revision="4"/);assert.match(html,/MAX_SET_VOLUME" data-pr-record="synthetic-volume" data-pr-revision="9"/);
 assert.equal(h.calls[1].action,'getTrainingPersonalRecords');assert.equal(h.calls[1].options.headers['x-health-session-kind'],'web');assert.equal(h.calls[1].options.credentials,'omit');
});
test('valid empty Edge55 results traverse the transport without fabricating bests',async()=>{
 const h=harness({transport:true});h.element('open-personal-records').onclick();await h.flush();await h.finish(0,[{...catalog[0],revision:1}]);await h.finish(1,enteredPr);
 assert.equal(h.element('training-personal-content').dataset.state,'ready');assert.doesNotMatch(h.element('training-personal-content').innerHTML,/data-pr-record=/);
});
test('obsolete, unknown and malformed personal-record contracts remain rejected, not empty successes',async()=>{
 for(const change of [{semantics:'EXACT_REPETITION_RECORDS'},{semantics:'UNKNOWN'},{version:'training-personal-records-goals-v0'},{comparisonVersion:'training-load-basis-v1'},{groups:null},{excluded:{}},{range:null}]){
  const h=harness({transport:true});const pending=h.context.localEngineRequest('getTrainingPersonalRecords',{exerciseId:'bench',days:'all'});await h.flush();
  const rejected=assert.rejects(pending,/MALFORMED_RESPONSE/);await h.finish(0,{...enteredPr,...change});await rejected;
 }
});
test('no qualifier stays NULL with no invented zero percent',()=>{const view=ui.goalView({status:'IN_PROGRESS',qualifiedBest:null,achievementPercent:null,progressBarPercent:null,remainingLoadKg:null});assert.equal(view.bar,null);assert.equal(view.percent,'尚無符合次數條件的紀錄');assert.equal(view.remaining,'—');});
test('overachievement preserves actual performance while progress bar remains capped',()=>{const view=ui.goalView({status:'ACHIEVED',qualifiedBest:{load:150,unit:'kg',reps:6,date:'2026-10-07'},achievementPercent:107.14,progressBarPercent:100,remainingLoadKg:0});assert.equal(view.bar,100);assert.match(view.best,/150 kg × 6/);assert.equal(view.percent,'107.14%');});
test('classification DOM, validation and confirmation events are removed',()=>{
 const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
 assert.doesNotMatch(html+source,/exercise-load-basis|goal-basis|goal-variant|goal-equipment|goal-side|training-pr-basis|pr-source-confirm|pr-source-basis|basisOptions|basisLabels|LOAD_BASIS_UNCONFIRMED|計重方式/);
});
test('PR read uses selected exercise and independent all-time/7-day contract',async()=>{const h=harness();h.element('open-personal-records').onclick();await h.finish(0,catalog);assert.equal(h.calls[1].action,'getTrainingPersonalRecords');assert.equal(h.calls[1].payload.days,'all');await h.finish(1,pr);h.element('training-personal-range').value='7';h.element('training-personal-range').onchange();assert.equal(h.calls[2].payload.days,'7');await h.finish(2,{...pr,range:{startDate:'2026-10-03',endDate:'2026-10-09'}});assert.match(h.element('training-personal-content').innerHTML,/2026-10-03 ～ 2026-10-09/);});
test('goal read has no dashboard or PR range params',async()=>{const h=harness();h.element('open-training-goals').onclick();await h.finish(0,catalog);assert.equal(h.calls[1].action,'getTrainingGoals');assert.equal(h.calls[1].payload,undefined);await h.finish(1,{goals:[]});assert.match(h.element('training-personal-content').innerHTML,/尚未設定訓練目標/);});
test('failed read is an error state, not an empty training result',async()=>{const h=harness();h.element('open-personal-records').onclick();await h.finish(0,catalog);h.calls[1].reject(Error('SQL_UNAVAILABLE'));await new Promise(resolve=>setImmediate(resolve));assert.equal(h.element('training-personal-content').dataset.state,'error');assert.match(h.element('training-personal-content').textContent,/讀取失敗/);});
test('late response from a prior selection cannot overwrite the current selection',async()=>{const h=harness();h.element('open-personal-records').onclick();await h.finish(0,catalog);h.element('training-personal-range').value='7';h.element('training-personal-range').onchange();await h.finish(2,{...pr,range:{startDate:'2026-10-03',endDate:'2026-10-09'}});const current=h.element('training-personal-content').innerHTML;await h.finish(1,pr);assert.equal(h.element('training-personal-content').innerHTML,current);});
test('logout resets private DOM and an old account response cannot restore it',async()=>{const h=harness();h.element('open-personal-records').onclick();await h.finish(0,catalog);h.context.currentUser='B';h.context.localSessionEpoch++;h.context.TrainingPersonal.reset();await h.finish(1,pr);assert.equal(h.element('training-personal-content').innerHTML,'');assert.equal(h.element('training-personal-panel').hidden,true);});
test('source links carry exact record and revision; display text is escaped',async()=>{const h=harness();h.element('open-personal-records').onclick();await h.finish(0,catalog);const r={recordId:'owned-id',revision:'9',load:50,unit:'kg',reps:8,date:'2026-10-07',ties:[]};await h.finish(1,{...pr,groups:[{exerciseName:'<script>untrusted</script>',comparison:{loadBasis:'BARBELL_TOTAL'},comparisonKey:'confirmed',maxWeight:r,maxSetVolume:r,records:[r]}]});const html=h.element('training-personal-content').innerHTML;assert.match(html,/data-pr-record="owned-id" data-pr-revision="9"/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>untrusted/);});

test('main view has exactly two clickable metrics with independent source IDs and closed advanced info',async()=>{
 const h=harness();h.element('open-personal-records').onclick();await h.finish(0,catalog);
 const a={recordId:'A',revision:'4',load:80,loadKg:80,unit:'kg',reps:5,date:'2026-10-07',volumeKgReps:400},b={...a,recordId:'B',revision:'9',load:60,loadKg:60,reps:10,volumeKgReps:600};
 await h.finish(1,{...pr,groups:[{exerciseName:'Bench',comparisonKey:'confirmed',comparison:{loadBasis:'BARBELL_TOTAL'},maxWeight:a,maxSetVolume:b,records:[a,b]}]});
 const html=h.element('training-personal-content').innerHTML;
 assert.equal((html.match(/data-pr-metric=/g)||[]).length,2);assert.match(html,/MAX_WEIGHT" data-pr-record="A" data-pr-revision="4"/);assert.match(html,/MAX_SET_VOLUME" data-pr-record="B" data-pr-revision="9"/);
 assert.match(html,/80 kg/);assert.match(html,/600 kg·次/);assert.doesNotMatch(html,/800 kg·次|<table|各次數|<details[^>]*open/);
 assert.match(html,/最大訓練量＝單組重量×次數/);
});
test('legacy entered loads render the same two cards without a confirmation step',async()=>{
 const h=harness();h.element('open-personal-records').onclick();await h.finish(0,catalog);
 const r={recordId:'legacy',revision:'1',load:100,loadKg:100,unit:'kg',reps:10,volumeKgReps:1000,date:'2026-10-07',comparison:{loadBasis:'UNKNOWN'}};
 await h.finish(1,{...pr,groups:[{exerciseName:'Bench',maxWeight:r,maxSetVolume:r,records:[r]}]});
 const html=h.element('training-personal-content').innerHTML;assert.match(html,/依填寫重量計算，請維持相同記錄方式/);assert.match(html,/1,000 kg·次/);assert.equal((html.match(/data-pr-metric=/g)||[]).length,2);assert.doesNotMatch(html,/<select|待確認|<details[^>]*open/);
});
test('new editor only provides weight and set-volume modes; legacy editing keeps its type',()=>{
 assert.match(fs.readFileSync(require.resolve('../index.html'),'utf8'),/#training-personal-panel \[hidden\]\{display:none!important\}/);assert.equal((ui.goalTypeOptions(null).match(/<option/g)||[]).length,2);assert.doesNotMatch(ui.goalTypeOptions(null),/LOAD_AND_REPS/);
 const old=ui.goalTypeOptions({targetLoad:140,targetReps:5});assert.match(old,/LOAD_AND_REPS/);assert.doesNotMatch(old,/MAX_WEIGHT|MAX_SET_VOLUME/);
});
test('goal view labels product versus old conjunction without invented progress',()=>{
 const base={status:'IN_PROGRESS',qualifiedBest:null,achievementPercent:null,progressBarPercent:null,remainingValue:null};
 assert.equal(ui.goalView({...base,goalType:'MAX_SET_VOLUME'}).percent,'尚無符合紀錄');
 assert.equal(ui.goalView({...base,goalType:'MAX_SET_VOLUME'}).progressLabel,'單組訓練量達成率');
 assert.equal(ui.goalView(base).percent,'尚無符合次數條件的紀錄');
});
test('weight creation sends null reps; volume preview and payload use explicit type',async()=>{
 for(const type of ['MAX_WEIGHT','MAX_SET_VOLUME']){
  const h=harness();h.element('open-training-goals').onclick();await h.finish(0,catalog);await h.finish(1,{goals:[]});
  await h.element('training-personal-content').onclick({target:{closest:()=>({id:'training-goal-new',dataset:{}})}});
  h.element('goal-type').value=type;h.element('goal-exercise').value='bench';h.element('goal-load').value='60';h.element('goal-reps').value='10';h.element('goal-unit').value='kg';h.element('goal-type').oninput();
  assert.equal(h.element('goal-reps-field').hidden,type==='MAX_WEIGHT');
  if(type==='MAX_SET_VOLUME')assert.match(h.element('goal-target-preview').textContent,/600 kg·次/);
  const pending=h.element('training-goal-form').onsubmit({preventDefault(){},currentTarget:h.element('training-goal-form')});
  assert.equal(h.calls[2].payload.comparisonVersion,'training-entered-load-v1');assert.equal('loadBasis' in h.calls[2].payload,false);assert.equal(h.calls[2].payload.goalType,type);assert.equal(h.calls[2].payload.targetReps,type==='MAX_WEIGHT'?null:10);
  await h.finish(2,{goal:{}});await h.finish(3,{goals:[]});await pending;
 }
});
test('goal list distinguishes all three rules and retains null states',async()=>{
 const h=harness();h.element('open-training-goals').onclick();await h.finish(0,catalog);
 const base={exerciseId:'bench',loadBasis:'BARBELL_TOTAL',targetLoad:60,targetUnit:'kg',targetReps:10,startDate:'2026-10-01',endDate:null,status:'IN_PROGRESS',qualifiedBest:null,achievementPercent:null,progressBarPercent:null,remainingValue:null};
 await h.finish(1,{goals:[{...base,goalId:'w',goalType:'MAX_WEIGHT',targetReps:null},{...base,goalId:'v',goalType:'MAX_SET_VOLUME'},{...base,goalId:'old'}]});
 const html=h.element('training-personal-content').innerHTML;assert.match(html,/單組訓練量目標/);assert.match(html,/不要求重量與次數各自達到/);assert.match(html,/舊制：重量＋至少指定次數/);assert.doesNotMatch(html,/<progress|0%|null 次/);
});
test('metric click requests exact source revision and offers read-only evidence',async()=>{
 const h=harness();h.element('open-personal-records').onclick();await h.finish(0,catalog);await h.finish(1,pr);
 const pending=h.element('training-personal-content').onclick({target:{closest:()=>({dataset:{prRecord:'B',prRevision:'9'}})}});
 assert.equal(h.calls[2].action,'getTrainingSetEvidence');assert.equal(h.calls[2].payload.recordId,'B');assert.equal(h.calls[2].payload.revision,'9');
 await h.finish(2,{record:{recordId:'B',revision:'9',exerciseName:'Bench',comparison:{loadBasis:'UNKNOWN'},load:60,unit:'kg',reps:10,date:'2026-10-07',source:'MANUAL_WEB',sessionId:'s',version:'v1.1'}});
 await pending;const html=h.element('training-personal-evidence').innerHTML;assert.match(html,/原始紀錄資訊/);assert.doesNotMatch(html,/<form|<select|確認|儲存/);assert.equal(h.calls.length,3);assert.doesNotMatch(html,/<details[^>]*open/);
});

test('old goal edits omit comparison metadata and version instead of resetting them',async()=>{
 const h=harness();h.element('open-training-goals').onclick();await h.finish(0,catalog);
 const old={goalId:'old',revision:'3',exerciseId:'bench',loadBasis:'PLATES_ONLY',variantId:'legacy-variant',equipmentId:'legacy-equipment',side:'LEFT',targetLoad:60,targetUnit:'kg',targetReps:10,startDate:'2026-10-01',endDate:null,status:'IN_PROGRESS',qualifiedBest:null,achievementPercent:null,progressBarPercent:null};
 await h.finish(1,{goals:[old]});await h.element('training-personal-content').onclick({target:{closest:()=>({dataset:{goalEdit:'old'}})}});
 h.element('goal-load').value='61';
 const pending=h.element('training-goal-form').onsubmit({preventDefault(){},currentTarget:h.element('training-goal-form')});
 const p=h.calls[2].payload;assert.equal(p.goalId,'old');assert.equal(p.revision,'3');assert.equal(p.goalType,'LOAD_AND_REPS');
 for(const key of ['loadBasis','variantId','equipmentId','side','comparisonVersion'])assert.equal(key in p,false,key);
 await h.finish(2,{goal:{}});await h.finish(3,{goals:[]});await pending;
});
test('actual workout set handler saves entered values without querying a removed selector',()=>{
 const html=fs.readFileSync(require.resolve('../index.html'),'utf8'),line=html.split('\n').find(l=>l.includes('function createExerciseBlock('));
 const fields={'.exercise-weight':{value:'80'},'.exercise-reps':{value:'5'},'.exercise-warmup':{checked:false},'.complete-set':{},'.set-log':{innerHTML:''}};
 const block={style:{},dataset:{},innerHTML:'',querySelector(s){assert.ok(fields[s],'unexpected selector '+s);return fields[s];},querySelectorAll(){return[];}};
 const session={exercises:[{exerciseId:'bench',sets:[]}]};let persisted=0;
 vm.runInNewContext(line+';createExerciseBlock({exerciseId:"bench",exerciseName:"Bench"});',{document:{getElementById:id=>id==='workout-empty-state'?null:{appendChild(){}},createElement:()=>block},workoutSession:session,escapeHtml:s=>s,exerciseBodyPartName:()=>'',num:Number,validWorkoutSet:(w,r)=>w>=0&&r>0,persistWorkoutDraft:()=>persisted++,toast:()=>assert.fail('invalid set')});
 fields['.complete-set'].onclick();assert.equal(persisted,1);assert.equal(session.exercises[0].sets[0].weight,80);assert.equal(session.exercises[0].sets[0].reps,5);assert.equal(session.exercises[0].sets[0].volume,400);assert.equal('loadBasis' in session.exercises[0].sets[0],false);
});
