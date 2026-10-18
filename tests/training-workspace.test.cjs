'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{IDBFactory}=require('fake-indexeddb'),C=require('../scripts/training-workspace-core.js');
const repo=()=>new C.IndexedRepository(new IDBFactory()),who=owner=>({owner,provider:'LOCAL_TEST_ONLY'}),newWork=(r,owner='A')=>new C.Workspace(r,who(owner));
const row=(id,date,weight,reps,session='s')=>({recordId:id,exerciseId:'squat',sessionId:session,date,setNumber:1,weight,reps,revision:1,completed:true});
test('missing input stays NULL; zero entered weight is valid and not an absent value',()=>{
 assert.equal(C.measurements({weight:'',reps:null},'WEIGHT_REPS',false).weight,null);
 assert.throws(()=>C.measurements({weight:'',reps:5},'WEIGHT_REPS'),/MISSING/);
 assert.equal(C.measurements({weight:0,reps:5},'WEIGHT_REPS').weight,0);
 for(const v of [NaN,Infinity,-1])assert.throws(()=>C.measurements({weight:v,reps:5},'WEIGHT_REPS'),/INVALID/);
 assert.throws(()=>C.measurements({weight:5,reps:1.2},'WEIGHT_REPS'),/INVALID/);
});
test('type-specific fields never fabricate external load for duration/distance/reps',()=>{
 assert.equal(C.measurements({durationSeconds:60},'DURATION').weight,null);
 assert.equal(C.measurements({durationSeconds:60,weight:80,reps:10},'DURATION').weight,null);
 assert.equal(C.measurements({durationSeconds:60,distanceMeters:200},'DISTANCE_DURATION').reps,null);
 assert.equal(C.measurements({reps:8},'REPS').weight,null);
 assert.throws(()=>C.measurements({distanceMeters:200},'DISTANCE_DURATION'),/MISSING/);
});
test('copy/template prefill is independent, stable-ID, incomplete; later template edits do not rewrite snapshot',()=>{
 const source={id:'old',date:'2026-10-07',snapshot:{plan:{weight:80}},exercises:[{exerciseId:'squat',sets:[{id:'oldset',revision:4,completed:true,values:{weight:80,reps:5,warmup:true}}]}]};
 const copy=C.copySession(source,'2026-10-08');assert.notEqual(copy.id,source.id);assert.notEqual(copy.exercises[0].sets[0].id,'oldset');
 assert.equal(copy.exercises[0].sets[0].completed,false);assert.equal(copy.exercises[0].sets[0].revision,0);assert.equal(copy.exercises[0].sets[0].values.warmup,true);
 source.snapshot.plan.weight=1;source.exercises[0].sets[0].values.weight=1;assert.equal(copy.snapshot.plan.weight,80);assert.equal(copy.exercises[0].sets[0].values.weight,80);
});
test('last performance requires completed matching exercise/type and matching ordinal',()=>{
 const history=[row('a','2026-10-07',80,5),{...row('planned','2026-10-08',90,5),completed:false},{...row('deleted','2026-10-09',100,5),deleted:true}];
 assert.equal(C.lastValues(history,'squat',1,'WEIGHT_REPS').values.weight,80);
 assert.equal(C.lastValues(history,'squat',2,'WEIGHT_REPS'),null);assert.equal(C.lastValues(history,'other',1,'WEIGHT_REPS'),null);assert.equal(C.lastValues(history,'squat',1,'DURATION'),null);
});
test('same-date legacy chronology is UNKNOWN; retained timestamps may establish actual latest session',()=>{
 const rows=[row('a','2026-10-07',80,5,'a'),row('b','2026-10-07',60,10,'b')];
 assert.equal(C.lastValues(rows,'squat',1,'WEIGHT_REPS').ambiguous,true);
 rows[0].sessionStartedAt='2026-10-07T01:00:00Z';rows[1].sessionStartedAt='2026-10-07T02:00:00Z';
 assert.equal(C.lastValues(rows,'squat',1,'WEIGHT_REPS').values.weight,60);
});
test('IndexedDB survives new repository/controller instances with draft, unknown values, notes and queued exact IDs',async()=>{
 const idb=new IDBFactory(),r=new C.IndexedRepository(idb),w=newWork(r);
 const op=await w.enqueue('upsertTrainingSet',{recordId:'stable',values:{weight:null,reps:null}},s=>{s.draft={notes:'未完成',warmup:true,completed:false};});
 const after=newWork(new C.IndexedRepository(idb)),state=await after.read();assert.deepEqual(state.draft,{notes:'未完成',warmup:true,completed:false});assert.equal(state.queue[0].id,op.id);assert.equal(state.queue[0].payload.values.weight,null);
 assert.equal(JSON.stringify(state).includes('token'),false);
});
test('account and provider namespaces isolate drafts AND queued writes',async()=>{
 const r=repo(),a=newWork(r);await a.enqueue('save',{recordId:'A'},s=>{s.draft={private:'A'};});
 assert.equal((await newWork(r,'B').read()).draft,null);assert.equal((await new C.Workspace(r,{owner:'A',provider:'OTHER'}).read()).queue.length,0);
 let sends=0;await assert.rejects(a.flush(async()=>{sends++;},async()=>'B'),/IDENTITY_CHANGED/);assert.equal(sends,0);assert.equal((await a.read()).queue.length,1);
});
test('offline/acknowledgement loss replays the same immutable ID and creates one observation',async()=>{
 const w=newWork(repo()),op=await w.enqueue('upsertTrainingSet',{recordId:'setA'},s=>{s.draft={completed:true};}),rows=new Map(),calls=[];
 const send=async(a,p)=>{calls.push(structuredClone(p));rows.set(p.recordId,p);if(calls.length===1)throw TypeError('ack lost');return {status:'SAVED',requestId:p.clientRequestId,record:{recordId:p.recordId,revision:1}};};
 await assert.rejects(w.flush(send,async()=>'A'),/ack lost/);assert.equal((await w.read()).queue.length,1);await w.flush(send,async()=>'A');
 assert.equal(rows.size,1);assert.deepEqual(calls[0],calls[1]);assert.equal(calls[1].clientRequestId,op.id);assert.equal((await w.read()).queue.length,0);
});
test('HTTP200 without server receipt is not SYNCED',async()=>{
 const w=newWork(repo());await w.enqueue('save',{});await assert.rejects(w.flush(async()=>({status:'OK'}),async()=>'A'),/UNCONFIRMED_SYNC/);
 assert.equal((await w.read()).queue.length,1);assert.equal((await w.read()).lastConfirmedAt,undefined);
});
test('version conflict freezes original request and all later operations, without rebase',async()=>{
 const w=newWork(repo());await w.enqueue('edit',{revision:2});await w.enqueue('edit',{revision:3});let sends=0;
 await assert.rejects(w.flush(async()=>{sends++;throw Object.assign(Error('conflict'),{code:'STALE_REVISION'});},async()=>'A'));
 const state=await w.read();assert.equal(sends,1);assert.equal(state.queue.length,2);assert.equal(state.queue[0].payload.revision,2);assert.equal(state.conflict.code,'STALE_REVISION');
 await assert.rejects(w.enqueue('edit',{}),/UNRESOLVED_CONFLICT/);await w.flush(async()=>{sends++;},async()=>'A');assert.equal(sends,1);
});
test('account switch during restore/in-flight response cannot mutate a new account or drain later entries',async()=>{
 const r=repo(),a=newWork(r);await a.enqueue('save',{});await a.enqueue('save',{n:2});let resolve,started;
 const begin=new Promise(r=>started=r),pending=a.flush((_,p)=>{started();return new Promise(r=>resolve=()=>r({status:'SAVED',requestId:p.clientRequestId}));},async()=>'A');
 await begin;a.stop();resolve();await assert.rejects(pending,/IDENTITY_CHANGED/);assert.equal((await newWork(r).read()).queue.length,2);assert.equal((await newWork(r,'B').read()).queue.length,0);
});
test('separate tabs use atomic IndexedDB transactions; simultaneous retries remain one server record',async()=>{
 const r=repo(),a=newWork(r),b=newWork(r),rows=new Map();await Promise.all([a.change(s=>{s.a=1;}),b.change(s=>{s.b=2;})]);assert.equal((await a.read()).a,1);assert.equal((await a.read()).b,2);
 await a.enqueue('save',{recordId:'only'});const send=async(_,p)=>{rows.set(p.recordId,p.clientRequestId);await new Promise(r=>setTimeout(r,1));return {status:'SAVED',requestId:p.clientRequestId};};
 await Promise.all([a.flush(send,async()=>'A'),b.flush(send,async()=>'A')]);assert.equal(rows.size,1);assert.equal((await a.read()).queue.length,0);
});
test('cancelling/deleting a completed set removes it from confirmed nearby history after receipt',async()=>{
 const w=newWork(repo());await w.change(s=>{s.history=[row('a','2026-10-07',80,5)];});await w.enqueue('upsertTrainingSet',{recordId:'a',completed:false});
 await w.flush(async(_,p)=>({status:'SAVED',requestId:p.clientRequestId,record:{recordId:'a',revision:2},deleted:true}),async()=>'A');assert.equal((await w.read()).history.length,0);
});
test('stopped controller rejects a late restore read',async()=>{
 let finish;const w=newWork({read:()=>new Promise(r=>finish=r)});const pending=w.read();w.stop();finish(C.initialState());await assert.rejects(pending,/IDENTITY_CHANGED/);
});


test('undo before send, during send and after lost ACK ends in one tombstone without resurrection',async()=>{
 for(const timing of ['QUEUED','INFLIGHT','ACK_LOST']){
  const w=newWork(repo()),receipts=new Map(),rows=new Map(),ids=[];let ready,release,first=true;
  const started=new Promise(r=>ready=r),blocked=new Promise(r=>release=r);
  const original=await w.enqueue('upsertTrainingSet',{recordId:'same-set',revision:0,completed:true});
  const send=async(_,payload)=>{ids.push(payload.clientRequestId);let saved=receipts.get(payload.clientRequestId);
   if(!saved){rows.set(payload.recordId,payload.completed);saved={status:'SAVED',requestId:payload.clientRequestId,record:{recordId:payload.recordId,revision:payload.revision+1},deleted:!payload.completed};receipts.set(payload.clientRequestId,saved);}
   if(first){first=false;ready();if(timing==='INFLIGHT')await blocked;if(timing==='ACK_LOST')throw Error('ACK_LOST');}return saved;
  };
  let running;
  if(timing==='INFLIGHT'){running=w.flush(send,async()=>'A');await started;}
  if(timing==='ACK_LOST')await assert.rejects(w.flush(send,async()=>'A'),/ACK_LOST/);
  const inverse=await w.enqueue('upsertTrainingSet',{recordId:'same-set',revision:1,completed:false});
  if(timing==='INFLIGHT'){release();await running;}else await w.flush(send,async()=>'A');
  await w.flush(send,async()=>'A');assert.equal(rows.size,1);assert.equal(rows.get('same-set'),false);assert.equal((await w.read()).history.length,0);assert.equal((await w.read()).queue.length,0);assert.equal(receipts.size,2);assert.equal(ids[0],original.id);assert.ok(ids.includes(inverse.id));
 }
});

test('expired session or missing entitlement stops replay while retaining original work for account A',async()=>{
 const r=repo(),a=newWork(r),entry=await a.enqueue('upsertTrainingSet',{recordId:'A-only'});let sends=0;
 for(const code of ['INVALID_WEB_SESSION','SESSION_EXPIRED','ACCESS_DENIED'])await assert.rejects(a.flush(async()=>{sends++;},async()=>{throw Error(code);}),new RegExp(code));
 assert.equal(sends,0);assert.equal((await newWork(r,'B').read()).queue.length,0);a.stop();const restored=newWork(r);assert.equal((await restored.read()).queue[0].id,entry.id);
 await restored.flush(async(_,p)=>({status:'SAVED',requestId:p.clientRequestId}),async()=>'A');assert.equal((await restored.read()).queue.length,0);
});

test('unknown same-key queue schema fails closed without clearing or rewriting pending data',async()=>{
 const r=repo(),w=newWork(r);const entry=await w.enqueue('save',{revision:4});await r.change(w.key,s=>{s.schema='training-workspace.future';});
 await assert.rejects(w.read(),/UNSUPPORTED_QUEUE_VERSION/);await assert.rejects(w.enqueue('save',{}),/UNSUPPORTED_QUEUE_VERSION/);const saved=await r.read(w.key);assert.equal(saved.schema,'training-workspace.future');assert.equal(saved.queue[0].id,entry.id);assert.equal(saved.queue[0].payload.revision,4);
});
