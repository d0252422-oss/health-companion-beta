'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../scripts/local-engine-web.js'),'utf8');
const ui=require('../scripts/engine-beta-web.js');
const endpoint='https://uavimjgccigpbwqmfkhh.supabase.co/functions/v1/mobile-health-beta/v1/engine/web';
function harness(release='AB'){
 const calls=[],resets=[];
 const context=vm.createContext({URL,Response,AbortSignal,Map,Set,Promise,Date,Number,String,Object,Array,
  sessionToken:'synthetic-session',HOSTED_MANUAL_SQL_ENABLED:true,LOCAL_ENGINE_ENABLED:false,
  window:{HEALTH_MANUAL_SQL_CONFIG:{enabled:true,release,schemaVersion:'manual-sql-v1',projectRef:'uavimjgccigpbwqmfkhh',endpoint}},
  fetch:async(url,options)=>{calls.push({url,options,body:JSON.parse(options.body)});return new Response('{}');},
  document:{getElementById:()=>null,querySelectorAll:()=>[]},
  HealthEngineUI:{...ui,clear:()=>resets.push('engine')},TrainingPersonal:{reset:()=>resets.push('personal')}
 });
 vm.runInContext(source,context);
 vm.runInContext('renderManualProviderStatus=()=>{}',context);
 return {context,calls,resets,run:s=>vm.runInContext(s,context)};
}
const trainingActions=['getTrainingEngine','getTrainingPersonalRecords','getTrainingGoals','getTrainingSetEvidence','manageTrainingGoal'];
test('both engine and personal-record actions use the same authenticated Beta transport',async()=>{
 const h=harness();
 for(const action of [...trainingActions,'getHealthEngine','runFoodEngine','submitFoodEngineFeedback'])await h.context.hostedManualFetch(action,{});
 assert.equal(h.calls.length,8);
 for(const call of h.calls){assert.equal(call.url,endpoint);assert.equal(call.options.credentials,'omit');assert.equal(call.options.headers.authorization,'Bearer synthetic-session');assert.equal(call.options.headers['x-health-session-kind'],'web');}
});
test('release A denies both training families before any request',async()=>{
 const h=harness('A');for(const action of trainingActions)await assert.rejects(h.context.hostedManualFetch(action,{}),/EXERCISE_MANAGEMENT_DISABLED/);
 assert.equal(h.calls.length,0);
});
test('missing Web session denies all combined actions before any request',async()=>{
 const h=harness();h.context.sessionToken=null;
 for(const action of [...trainingActions,'getHealthEngine','runFoodEngine','submitFoodEngineFeedback'])await assert.rejects(h.context.hostedManualFetch(action,{}),/INVALID_WEB_SESSION/);
 assert.equal(h.calls.length,0);
});
test('one shared account reset clears both extensions and pending training state',()=>{
 const h=harness();h.run("localWorkoutRecords.set('old',{});localPendingTrainingWrites.set('old',{});hostedManualBinding={canonical:'old'}");
 const before=h.run('localSessionEpoch');h.context.clearLocalManualState();
 // UI15 resets its new private picker state as well as the existing extension boundary.
 assert.deepEqual(h.resets,['engine','personal','personal']);
 assert.equal(h.run('localSessionEpoch'),before+1);assert.equal(h.run('hostedManualBinding'),null);
 assert.equal(h.run('localWorkoutRecords.size+localPendingTrainingWrites.size'),0);
});
test('combined response validator retains owner, exact revision and goal receipt checks',()=>{
 const h=harness();h.run("hostedManualBinding={canonical:'owner-a'}");
 const envelope={schema_version:'engine-output.v0.1',canonical_user_id:'owner-a',engine_name:'training',engine_version:'training-engine-v0.1',input_snapshot_id:'11111111-1111-4111-a111-111111111111',generated_at:'2026-10-13T00:00:00Z',output:{},evidence:{},confidence:{},data_completeness:{},warnings:[]};
 const check=(a,d,p={})=>h.context.assertManualResponseShape(a,d,p);
 assert.doesNotThrow(()=>check('getTrainingEngine',envelope));
 assert.throws(()=>check('getTrainingEngine',{...envelope,canonical_user_id:'owner-b'}),/MALFORMED_RESPONSE/);
 assert.doesNotThrow(()=>check('getTrainingPersonalRecords',{version:'training-personal-records-goals-v1.2.0',semantics:'MAX_WEIGHT_AND_SINGLE_SET_VOLUME',comparisonVersion:'training-entered-load-v1',range:{},groups:[],excluded:[]}));
 assert.doesNotThrow(()=>check('getTrainingGoals',{goals:[]}));
 assert.throws(()=>check('getTrainingGoals',{}),/MALFORMED_RESPONSE/);
 assert.doesNotThrow(()=>check('getTrainingSetEvidence',{record:{recordId:'r',revision:4}},{recordId:'r',revision:'4'}));
 assert.throws(()=>check('getTrainingSetEvidence',{record:{recordId:'r',revision:3}},{recordId:'r',revision:'4'}),/MALFORMED_RESPONSE/);
 assert.doesNotThrow(()=>check('manageTrainingGoal',{status:'SAVED',goal:{goalId:'g',revision:'2'}},{goalId:'g'}));
 assert.throws(()=>check('manageTrainingGoal',{status:'SAVED',goal:{goalId:'wrong',revision:'2'}},{goalId:'g'}),/MALFORMED_RESPONSE/);
});
