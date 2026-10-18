/* Planned sessions are drafts. Only an explicit completed-set mutation creates an observation. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.TrainingWorkspaceCore=api;})(globalThis,function(){
  'use strict';
  const VERSION='training-workspace.v1',KINDS=['WEIGHT_REPS','REPS','DURATION','DISTANCE_DURATION'];
  const clone=v=>structuredClone(v),uid=()=>globalThis.crypto.randomUUID();
  function value(v){return v==null||v===''?null:Number(v);}
  function measurements(input,kind,complete=true){
    if(!KINDS.includes(kind))throw Error('INVALID_EXERCISE_TYPE');
    const out={weight:value(input.weight),reps:value(input.reps),distanceMeters:value(input.distanceMeters),durationSeconds:value(input.durationSeconds),notes:String(input.notes||'').slice(0,2000),warmup:input.warmup===true};
    for(const [key,max,integer] of [['weight',1000,false],['reps',10000,true],['distanceMeters',1000000,false],['durationSeconds',86400,false]]){
      const n=out[key];if(n!==null&&(!Number.isFinite(n)||n<0||n>max||integer&&!Number.isSafeInteger(n)))throw Error('INVALID_WORKOUT_SET');
    }
    if(complete){const required=kind==='WEIGHT_REPS'?['weight','reps']:kind==='REPS'?['reps']:kind==='DURATION'?['durationSeconds']:['distanceMeters','durationSeconds'];
      if(required.some(k=>out[k]===null||k!=='weight'&&out[k]<=0))throw Error('MISSING_SET_VALUES');}
    const applicable=kind==='WEIGHT_REPS'?['weight','reps']:kind==='REPS'?['reps']:kind==='DURATION'?['durationSeconds']:['distanceMeters','durationSeconds'];
    for(const key of ['weight','reps','distanceMeters','durationSeconds'])if(!applicable.includes(key))out[key]=null;
    return out;
  }
  function newSet(values={},source=null){return {id:uid(),revision:0,completed:false,removed:false,values:clone(values),prefillSource:source};}
  function copySession(source,date,now=new Date().toISOString()){
    return {schema:VERSION,id:uid(),revision:1,date,timezone:source.timezone||'Asia/Taipei',startTime:now,endTime:null,status:'ACTIVE',snapshot:clone(source.snapshot||null),
      exercises:source.exercises.map(e=>({...clone(e),sets:e.sets.filter(s=>!s.removed).map(s=>newSet(s.values,{date:source.date,sessionId:source.id,setId:s.id,kind:'COPY'}))}))};
  }
  function completedHistory(records,exerciseId){
    return records.filter(r=>r.exerciseId===exerciseId&&!r.deleted&&r.completed!==false&&r.status!=='PLANNED')
      .sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.sessionId).localeCompare(String(b.sessionId))||Number(a.setNumber||0)-Number(b.setNumber||0));
  }
  // Same-date legacy sessions have no retained occurrence timestamp: never invent their order.
  function lastValues(records,exerciseId,ordinal,kind){
    const rows=completedHistory(records,exerciseId).filter(r=>(r.exerciseType||'WEIGHT_REPS')===kind);
    if(!rows.length)return null;
    const date=rows[0].date,sessions=[...new Set(rows.filter(r=>r.date===date).map(r=>r.sessionId))];
    let sessionId=sessions[0];
    if(sessions.length!==1){
      const dated=rows.filter(r=>r.date===date);
      if(dated.some(r=>!r.sessionStartedAt))return {ambiguous:true,date};
      sessionId=dated.sort((a,b)=>String(b.sessionStartedAt).localeCompare(String(a.sessionStartedAt)))[0].sessionId;
    }
    const row=rows.filter(r=>r.date===date&&r.sessionId===sessionId).find(r=>Number(r.setNumber)===ordinal);
    return row?{values:measurements(row,kind,false),source:{date,sessionId:row.sessionId,setId:row.recordId,revision:row.revision,kind:'LAST'}}:null;
  }
  function supportedState(state){if(state?.schema!==VERSION||!Array.isArray(state.queue))throw Error('UNSUPPORTED_QUEUE_VERSION');return state;}
  function initialState(){return {schema:VERSION,draft:null,routines:[],history:[],catalog:[],queue:[],conflict:null};}
  class IndexedRepository{
    constructor(indexedDB=globalThis.indexedDB){this.db=new Promise((resolve,reject)=>{const request=indexedDB.open('health-training-workspace',1);request.onupgradeneeded=()=>request.result.createObjectStore('accounts');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
    async change(key,mutator){const db=await this.db;return new Promise((resolve,reject)=>{const tx=db.transaction('accounts','readwrite'),store=tx.objectStore('accounts'),read=store.get(key);let result;
      read.onsuccess=()=>{try{const state=read.result||initialState();result=mutator(state);store.put(state,key);}catch(error){tx.abort();reject(error);}};
      tx.oncomplete=()=>resolve(clone(result));tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('LOCAL_SAVE_FAILED'));});}
    async read(key){const db=await this.db;return new Promise((resolve,reject)=>{const tx=db.transaction('accounts','readonly'),r=tx.objectStore('accounts').get(key);r.onsuccess=()=>resolve(clone(r.result||initialState()));r.onerror=()=>reject(r.error);});}
  }
  class Workspace{
    constructor(repository,identity){if(!identity?.owner||!identity?.provider)throw Error('VERIFIED_OWNER_REQUIRED');this.repo=repository;this.identity=clone(identity);this.key=VERSION+':'+identity.provider+':'+identity.owner;this.epoch=0;this.stopped=false;}
    stop(){this.stopped=true;this.epoch++;}
    active(epoch=this.epoch){if(this.stopped||epoch!==this.epoch)throw Error('IDENTITY_CHANGED');}
    async read(){const epoch=this.epoch;this.active(epoch);const result=await this.repo.read(this.key);this.active(epoch);return supportedState(result);}
    async change(fn){this.active();return this.repo.change(this.key,s=>{this.active();supportedState(s);const result=fn(s);if(JSON.stringify(s).length>2000000||s.queue.length>500)throw Error('LOCAL_STORAGE_BOUND_EXCEEDED');return result;});}
    async enqueue(action,payload,apply){const entry={id:uid(),action,payload:clone(payload),state:'PENDING'};entry.payload.clientRequestId=entry.id;
      await this.change(s=>{if(s.conflict)throw Error('UNRESOLVED_CONFLICT');apply?.(s);s.queue.push(entry);});return entry;}
    async flush(send,verifyOwner){
      if(this.syncing)return this.syncing;
      const epoch=this.epoch,owner=this.identity.owner;
      const run=async()=>{this.active(epoch);if(await verifyOwner()!==owner)throw Error('IDENTITY_CHANGED');this.active(epoch);
        for(let i=0;i<500;i++){this.active(epoch);const state=await this.read();if(state.conflict||!state.queue.length)return;
          const item=state.queue[0];let result;
          try{result=await send(item.action,clone(item.payload));this.active(epoch);
            if(result?.status!=='SAVED'||result.requestId!==item.id)throw Error('UNCONFIRMED_SYNC');
          }catch(error){this.active(epoch);const code=error.code||error.message;
            if(['STALE_REVISION','REQUEST_ID_CONFLICT','SESSION_CLOSED','WORKOUT_DELETED','EXERCISE_ARCHIVED'].includes(code))await this.change(s=>{s.conflict={entryId:item.id,code};if(s.queue[0]?.id===item.id)s.queue[0].state='CONFLICT';});
            throw error;
          }
          await this.change(s=>{if(s.queue[0]?.id!==item.id)return;s.queue.shift();s.lastConfirmedAt=new Date().toISOString();
            if(result.record){const row={...result.record,sessionRevision:result.sessionRevision,deleted:result.deleted===true};s.history=s.history.filter(r=>r.recordId!==row.recordId);if(!row.deleted)s.history.push(row);}
            if(result.routine){const old=s.routines.find(r=>r.id===result.routine.id);if(!old)s.routines.push(result.routine);else if(old.revision<=result.routine.revision)Object.assign(old,result.routine);}
            if(result.settings){const e=s.catalog.find(e=>e.exerciseId===result.exerciseId);if(e&&e.revision<=result.revision)Object.assign(e,{settings:result.settings,revision:result.revision});}
          });
        }
      };
      const lock=globalThis.navigator?.locks;this.syncing=(lock?lock.request(this.key,run):run()).finally(()=>{this.syncing=null;});return this.syncing;
    }
  }
  return {VERSION,KINDS,measurements,newSet,copySession,completedHistory,lastValues,initialState,IndexedRepository,Workspace};
});
