/* Shared manual SQL UI; local synthetic and hosted verified-session transports stay separate. */
function hostedManualEnabled(){return typeof HOSTED_MANUAL_SQL_ENABLED!=='undefined'&&HOSTED_MANUAL_SQL_ENABLED;}
function manualSqlEnabled(){return LOCAL_ENGINE_ENABLED||hostedManualEnabled();}
let hostedManualBinding=null,hostedManualConfigFingerprint=null,hostedIdentityPending=null;
// Pending reads only, plus one bounded bootstrap handoff. No persistent cache.
const hostedTimelinePending=new Map();
let hostedBootstrapTimeline=null,hostedTimelineGeneration=0;
function invalidateHostedTimelineReads(){hostedTimelineGeneration++;hostedTimelinePending.clear();hostedBootstrapTimeline=null;}
function hostedTimelineKey(config,payload){return JSON.stringify([config.endpoint,config.release,config.schemaVersion,payload]);}
function primeHostedTimeline(){
  if(!hostedManualEnabled()||!sessionToken)return;
  const range=resolveDateRange(globalDateRange.preset,globalDateRange);
  void hostedManualFetch('getHealthTimeline',{startDate:range.startDate,endDate:range.endDate,...(PERF_DEBUG?{debugPerf:1}:{})},true).catch(()=>{});
}
const hostedManualActions=new Set(['getAccessState','getCurrentUser','getUserProfile','getManualProviderIdentity','getManualObservations','getManualObservationDaily','upsertManualObservation','deleteManualObservation','getObservationWriteStatus','getBodyRecords','addBodyRecord','upsertBodyRecord','deleteBodyRecord','getBodyWriteStatus','getNutritionRecords','getSleepRecords','getActivityRecords','upsertMealRecord','deleteMealRecord','getMealWriteStatus','localEngineSnapshot','getDashboardData','getTodaySummary','getHealthTimeline','refreshDailyNutrition','refreshDerivedData','getExerciseDatabase','getExerciseBodyParts','getWorkoutRecords','manageExercise','addWorkoutRecord','updateWorkoutSet','updateWorkoutSets','deleteWorkoutSet','getTrainingWriteStatus','getTrainingPersonalRecords','getTrainingGoals','getTrainingSetEvidence','manageTrainingGoal']);
const hostedTrainingActions=new Set(['getExerciseDatabase','getExerciseBodyParts','getWorkoutRecords','manageExercise','addWorkoutRecord','updateWorkoutSet','updateWorkoutSets','deleteWorkoutSet','getTrainingWriteStatus','getTrainingPersonalRecords','getTrainingGoals','getTrainingSetEvidence','manageTrainingGoal']);
for(const action of ['getTrainingEngine','getHealthEngine','runFoodEngine','submitFoodEngineFeedback'])hostedManualActions.add(action);
hostedTrainingActions.add('getTrainingEngine');
for(const action of ['getTrainingWorkspace','getTrainingExerciseHistory','saveTrainingRoutine','saveExerciseSettings','startTrainingSession','upsertTrainingSet','finishTrainingSession']){hostedManualActions.add(action);hostedTrainingActions.add(action);}
function hostedManualConfig(){
  const raw=window.HEALTH_MANUAL_SQL_CONFIG||{};
  const fail=()=>{const e=Error('MANUAL_PROVIDER_NOT_CONFIGURED');e.code=e.message;throw e;};
  if(!hostedManualEnabled()||raw.enabled!==true||!['A','AB'].includes(raw.release)||raw.schemaVersion!=='manual-sql-v1'||!/^[a-z]{20}$/.test(raw.projectRef||''))fail();
  let endpoint;try{endpoint=new URL(raw.endpoint);}catch{fail();}
  if(endpoint.protocol!=='https:'||endpoint.hostname!==raw.projectRef+'.supabase.co'||endpoint.pathname!=='/functions/v1/mobile-health-beta/v1/engine/web'||endpoint.port||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)fail();
  const config={endpoint:endpoint.href,release:raw.release,schemaVersion:raw.schemaVersion},fingerprint=JSON.stringify(config);
  if(hostedManualConfigFingerprint&&hostedManualConfigFingerprint!==fingerprint){clearLocalManualState();fail();}
  hostedManualConfigFingerprint=fingerprint;return config;
}
function hostedManualNamespace(){const c=hostedManualConfig();return `hosted-sql:${c.endpoint}:${c.release}:${c.schemaVersion}:${hostedManualBinding?.canonical||'unverified'}`;}
async function hostedManualFetch(action,payload={},prime=false){
  const config=hostedManualConfig();
  if(!hostedManualActions.has(action))throw Object.assign(Error('MANUAL_ACTION_NOT_SUPPORTED'),{code:'MANUAL_ACTION_NOT_SUPPORTED'});
  if(config.release==='A'&&(hostedTrainingActions.has(action)||(action==='refreshDerivedData'&&payload.recordType==='workout')))throw Object.assign(Error('EXERCISE_MANAGEMENT_DISABLED'),{code:'EXERCISE_MANAGEMENT_DISABLED'});
  if(!sessionToken||sessionToken==='LOCAL_HTTP_ONLY_COOKIE')throw Object.assign(Error('INVALID_WEB_SESSION'),{code:'INVALID_WEB_SESSION'});
  const token=sessionToken,epoch=localSessionEpoch;
  const load=()=>fetch(config.endpoint,{method:'POST',credentials:'omit',headers:{'content-type':'application/json','authorization':'Bearer '+token,'x-health-session-kind':'web'},body:JSON.stringify({action,payload}),signal:AbortSignal.timeout(30000)});
  if(action!=='getHealthTimeline'){
    if(!action.startsWith('get'))invalidateHostedTimelineReads();
    return load();
  }
  const key=hostedTimelineKey(config,payload),generation=hostedTimelineGeneration;
  const matches=entry=>entry&&entry.token===token&&entry.epoch===epoch&&entry.generation===generation&&entry.key===key;
  let entry=hostedTimelinePending.get(key);
  if(!prime&&matches(hostedBootstrapTimeline)&&Date.now()<hostedBootstrapTimeline.expiresAt){entry=hostedBootstrapTimeline;hostedBootstrapTimeline=null;}
  if(!matches(entry)){
    entry={key,token,epoch,generation,expiresAt:Date.now()+30000,promise:null};
    const active=entry;
    active.promise=load().finally(()=>{if(hostedTimelinePending.get(key)===active)hostedTimelinePending.delete(key);});
    hostedTimelinePending.set(key,active);
  }
  if(prime){hostedBootstrapTimeline=entry;setTimeout(()=>{if(hostedBootstrapTimeline===entry)hostedBootstrapTimeline=null;},30000);}
  const response=await entry.promise;
  if(token!==sessionToken||epoch!==localSessionEpoch)throw Object.assign(Error('IDENTITY_CHANGED'),{code:'IDENTITY_CHANGED'});
  // Every consumer retains its original contract/error checks and an unread body.
  return response.clone();
}
async function ensureHostedManualIdentity(){
  const config=hostedManualConfig(),token=sessionToken;
  if(hostedManualBinding?.token===token)return;
  if(hostedManualBinding)clearLocalManualState();
  if(hostedIdentityPending?.token===token&&hostedIdentityPending.epoch===localSessionEpoch)return hostedIdentityPending.promise;
  const epoch=localSessionEpoch;
  primeHostedTimeline();
  const pending={token,epoch,promise:null};
  pending.promise=(async()=>{
  const response=await hostedManualFetch('getManualProviderIdentity'),body=await response.json();
  if(epoch!==localSessionEpoch||token!==sessionToken)throw Error('IDENTITY_CHANGED');
  if(!body.ok)throw Object.assign(Error(body.error||'INVALID_WEB_SESSION'),{code:body.error||'INVALID_WEB_SESSION'});
  if(!/^[a-f0-9-]{36}$/.test(body.data?.canonicalUserId||'')||body.data.provider!=='postgresql-manual-v1'||body.data.release!==config.release||body.data.schemaVersion!==config.schemaVersion)throw Error('MANUAL_PROVIDER_CONTRACT_MISMATCH');
  hostedManualBinding={token,canonical:body.data.canonicalUserId,access:body.data.access};
  document.getElementById('health-connector-panel')?.style?.setProperty('display','none');
  document.getElementById('chatgpt-meal-box')?.style?.setProperty('display','none');
  if(config.release==='AB')setupLocalExerciseManagement();
  })().finally(()=>{if(hostedIdentityPending===pending)hostedIdentityPending=null;});
  hostedIdentityPending=pending;return pending.promise;
}
function manualSqlFetch(action,payload){return hostedManualEnabled()?hostedManualFetch(action,payload):fetch('/v1/engine/web',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,payload}),signal:AbortSignal.timeout(30000)});}
const localBodyRecords=new Map(),localMealRecords=new Map(),localPendingBodyWrites=new Map();
const localWorkoutRecords=new Map(),localPendingTrainingWrites=new Map();
const localObservationRecords=new Map(),localPendingObservationWrites=new Map();
let localSessionEpoch=0,localOutputRequest=0;
let localCatalogReadSequence=0;
const localSectionReads=new Map();
function cacheLocalRevision(cache,id,record){
  if(!id||!record||!Number.isSafeInteger(Number(record.revision)))return;
  const previous=cache.get(id),revision=Number(record.revision);
  if(previous&&(Number(previous.revision)>revision||(previous.deleted&&Number(previous.revision)>=revision)))return;
  cache.set(id,record);
}
function localManualTotal(records,key){
  return !records.length||records.some(record=>record.nutritionCompleteness==='INCOMPLETE'||record[key]===null||record[key]===undefined||record[key]===''||!Number.isFinite(Number(record[key])))?null:records.reduce((total,record)=>total+Number(record[key]),0);
}
function localMealRevisionPayload(payload){const id=payload.mealRecordId,previous=localMealRecords.get(id)||(appState.nutrition||[]).find(meal=>meal.mealRecordId===id)||(appState.mealsToday||[]).find(meal=>meal.mealRecordId===id);return {...payload,revision:payload.revision??previous?.revision};}
function localMealMutationPayload(payload){const prediction=globalThis.HealthEngineUI?.mealPrediction;const same=prediction&&prediction.epoch===localSessionEpoch&&Object.entries(prediction.values).every(([key,value])=>['date','foodName'].includes(key)?payload[key]===value:value===null?payload[key]===null||payload[key]==='':Number(payload[key])===Number(value));return {...localMealRevisionPayload(payload),labelMode:document.getElementById('meal-label-mode').checked,weightGrams:document.getElementById('meal-weight-grams').value,referenceSource:document.getElementById('meal-reference-source').value,...(same?{foodPredictionSnapshotId:prediction.snapshot_id}:{})};}
function localMealDeleteMutationPayload(payload){return localMealRevisionPayload(payload);}
function localSectionReadGuard(section,start,end){
  const user=currentUser,epoch=localSessionEpoch,serial=(localSectionReads.get(section)||0)+1;
  localSectionReads.set(section,serial);
  return ()=>currentUser===user&&localSessionEpoch===epoch&&localSectionReads.get(section)===serial&&sectionWindows[section].start===start&&sectionWindows[section].end===end;
}
function latestDailyMetricRow(rows,key){return [...(rows||[])].reverse().find(row=>typeof row?.[key]==='number'&&Number.isFinite(row[key]))||null;}
function dailyMetricSource(row,key){const field={totalSleepMinutes:'sleepSource',steps:'stepsSource',activeMinutes:'activeMinutesSource',totalCalories:'totalEnergySource',heartRate:'heartRateSource',hrv:'hrvSource'}[key];return field?row?.[field]||row?.source:row?.source;}
function dailyMetricSourceText(source){const value=String(source||'');if(/MANUAL|SELF_REPORTED/u.test(value))return '手動自行回報';if(value==='SQL_PUBLISHED_DAILY_METRICS'||/HEALTH_CONNECT|WEARABLE/u.test(value))return '穿戴裝置同步';return '來源未提供';}
function latestDailyPublicationState(rows){
  const latest=rows?.at(-1)||null,staleReason=latest?.analysisStaleReason??latest?.staleReason;
  return {latest,failed:staleReason==='RECOMPUTE_FAILED',pending:staleReason!=='RECOMPUTE_FAILED'&&(latest?.dataStatus==='STALE'||latest?.analysisDataStatus==='STALE')};
}
function dailyMetricNotice(rows,key){
  const row=latestDailyMetricRow(rows,key),state=latestDailyPublicationState(rows);
  if(!row){if(state.failed)return `${state.latest.date} 自動／分析資料更新失敗；請重新整理再試一次`;if(state.pending)return `${state.latest.date} 自動／分析資料待更新；尚未發布新數值`;return '尚無資料';}
  const coverageKey={totalSleepMinutes:'sleep',steps:'steps',totalCalories:'totalEnergy'}[key],reconciliationDomain={totalSleepMinutes:'sleep',steps:'steps',totalCalories:'total_energy'}[key],parts=[row.date,dailyMetricSourceText(dailyMetricSource(row,key))];
  if(reconciliationDomain&&row.reconciliationFlags?.some(flag=>String(flag).endsWith(`:${reconciliationDomain}`)))parts.push('來源／時段衝突，未合併加總');
  if(coverageKey&&row.coverage?.[coverageKey]==='PARTIAL_DAY')parts.push('部分日累積');
  if(state.failed)parts.push(`${state.latest.date} 自動／分析資料更新失敗，請重新整理再試一次`);
  else if(state.pending)parts.push(`${state.latest.date} 自動／分析資料待更新`);
  return parts.join(' · ');
}
function renderDailySqlReadNotice(section,rows){
  if(!manualSqlEnabled())return;
  if(section==='sleep'){
    document.getElementById('sleep-last-note').textContent=dailyMetricNotice(rows,'totalSleepMinutes');
    document.getElementById('sleep-score-note').textContent='SQL 原始睡眠分數尚未接通（不替換為實驗分數）';
    return;
  }
  document.getElementById('activity-steps-note').textContent=dailyMetricNotice(rows,'steps');
  document.getElementById('activity-active-note').textContent='SQL 尚無活動熱量的對應來源';
  const totalRow=latestDailyMetricRow(rows,'totalCalories');
  document.getElementById('activity-total-note').textContent=totalRow?dailyMetricNotice(rows,'totalCalories'):'SQL 尚無此熱量類型的對應來源';
}
function clearLocalManualState(){globalThis.HealthWorkout?.reset?.();globalThis.HealthEngineUI?.clear?.();resetExerciseNavigation();globalThis.TrainingPersonal?.reset();invalidateHostedTimelineReads();manualProviderObservation=null;manualSourceEvidence=null;renderManualProviderStatus();hostedManualBinding=null;hostedIdentityPending=null;localSessionEpoch++;localOutputRequest++;localCatalogReadSequence++;localBodyRecords.clear();localMealRecords.clear();localPendingBodyWrites.clear();localObservationRecords.clear();localPendingObservationWrites.clear();if(typeof resetManualObservationState==='function')resetManualObservationState();localWorkoutRecords.clear();localPendingTrainingWrites.clear();localTrainingDraftLock(false);if(typeof exerciseDatabase!=='undefined')exerciseDatabase=[];if(typeof exerciseBodyParts!=='undefined')exerciseBodyParts=[];if(typeof workoutSession!=='undefined')workoutSession=null;document.getElementById('exercise-management')?.remove();const overview=document.getElementById('training-overview'),draft=document.getElementById('workout-session'),list=document.getElementById('exercise-session-list');if(overview?.style)overview.style.display='block';draft?.classList?.remove('active');list?.replaceChildren?.();if(typeof setTrainingView==='function')setTrainingView('overview');if(typeof loadWeightFormDate==='function')loadWeightFormDate.binding=null;}
let manualProviderObservation=null;
let manualSourceEvidence=null;
let manualSourceSerial=0;
const manualSourceSequences=new Map();
// Observed contract evidence, never a claim inferred from an HTTP200 alone.
function manualSourceStatus(){return manualSourceEvidence||{api:'UNKNOWN',database:'UNKNOWN',dataPresent:'UNKNOWN',dataUpdatedAt:null,analysisUpdatedAt:null,domains:{}};}
function manualAnalysisState(row){
  const s=row?.score_status||row?.analysisStatus;
  if(s==='ANALYSIS_PENDING')return row.analysisJobScheduled===true?'UPDATING':row.analysisJobScheduled===false?'NOT_ENABLED':'UNKNOWN';
  if(s==='COMPUTED'&&typeof row.bodyScore==='number'&&Number.isFinite(row.bodyScore))return 'UPDATED';
  if(s==='COMPUTED'&&row.algorithmVersion==='health-score-v1.0'&&typeof row.score==='number'&&Number.isFinite(row.score))return 'UPDATED';
  if(['VALID','PARTIAL_DATA'].includes(s)&&typeof row.score==='number'&&Number.isFinite(row.score))return 'UPDATED';
  return ({INSUFFICIENT_DATA:'INSUFFICIENT_DATA',STALE:'STALE',ERROR:'FAILED',ANALYSIS_UNAVAILABLE:'UNKNOWN',ANALYSIS_NOT_ENABLED:'NOT_ENABLED'})[s]||'UNKNOWN';
}
function assertManualResponseShape(action,data,payload={}){
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v),rows=(v,id)=>Array.isArray(v)&&v.every(r=>object(r)&&typeof r[id]==='string'&&r[id].length>0&&Number.isSafeInteger(Number(r.revision)));
  const mutationRecord=(value,{idKey='recordId',deleted}={})=>{
    const recordId=value?.recordId,revision=Number(value?.record?.revision);
    return object(value)&&value.status==='SAVED'&&typeof recordId==='string'&&recordId.length>0&&object(value.record)&&value.record[idKey]===recordId&&Number.isSafeInteger(revision)&&revision>0&&(deleted===undefined||value.deleted===deleted);
  };
  const bodyReceipt=value=>mutationRecord(value,{deleted:value?.deleted===true});
  const observationReceipt=value=>mutationRecord(value,{deleted:value?.deleted===true})&&['sleep','steps','total_energy'].includes(value.record.domain)&&/^\d{4}-\d{2}-\d{2}$/.test(value.record.date);
  const mealReceipt=(value,expectedOperation)=>{
    if(!object(value)||!['UPSERT','DELETE'].includes(value.operation)||expectedOperation&&value.operation!==expectedOperation)return false;
    const deleted=value.operation==='DELETE',recordId=value.recordId,revision=Number(value.record?.revision);
    return typeof recordId==='string'&&recordId.length>0&&['QUEUED','SAVED'].includes(value.status)&&value.deleted===deleted&&object(value.record)&&value.record.mealRecordId===recordId&&Number.isSafeInteger(revision)&&revision>0;
  };
  const exerciseReceipt=value=>object(value)&&value.status==='SAVED'&&typeof value.exerciseId==='string'&&value.exerciseId.length>0&&Number.isSafeInteger(Number(value.revision))&&Number(value.revision)>0&&['create','update','rename','classify','archive','restore','delete'].includes(value.operation)&&(value.operation==='delete'?value.deleted===true:value.deleted!==true);
  const workoutAddReceipt=value=>object(value)&&value.status==='SAVED'&&typeof value.sessionId==='string'&&value.sessionId.length>0&&Array.isArray(value.records)&&value.records.length>0&&value.records.every(record=>object(record)&&typeof record.recordId==='string'&&record.recordId.length>0&&record.sessionId===value.sessionId&&Number.isSafeInteger(Number(record.revision))&&Number(record.revision)>0);
  const workoutBatchReceipt=value=>{
    if(!object(value)||value.status!=='SAVED'||!Array.isArray(value.records)||!value.records.length||!Array.isArray(value.updatedRecordIds)||value.updatedRecordIds.length!==value.records.length)return false;
    const ids=value.records.map(record=>record?.recordId),updated=value.updatedRecordIds;
    return ids.every((id,index)=>typeof id==='string'&&id.length>0&&Number.isSafeInteger(Number(value.records[index].revision))&&Number(value.records[index].revision)>0)&&new Set(ids).size===ids.length&&new Set(updated).size===updated.length&&ids.every(id=>updated.includes(id));
  };
  const sameRecordId=(value,key='recordId')=>!payload?.[key]||value?.recordId===payload[key];
  const sameRecordDate=value=>!payload?.date||value?.record?.date===payload.date;
  const own=(value,key)=>object(value)&&Object.hasOwn(value,key);
  const sameNumber=(expected,actual)=>expected===null||expected===undefined||expected===''?actual===null:Number.isFinite(Number(expected))&&Number(actual)===Number(expected);
  const samePayloadNumber=(record,key)=>!own(payload,key)||sameNumber(payload[key],record?.[key]);
  const samePayloadText=(record,key,normalize=value=>value)=>!own(payload,key)||normalize(record?.[key])===normalize(payload[key]);
  const sameInstant=(expected,actual)=>expected===null||expected===undefined?actual===null:Number.isFinite(Date.parse(expected))&&Date.parse(actual)===Date.parse(expected);
  const bodyCorrelates=value=>sameRecordId(value)&&sameRecordDate(value)&&samePayloadNumber(value.record,'weight')&&samePayloadNumber(value.record,'bodyFat');
  const observationCorrelates=value=>sameRecordId(value)&&sameRecordDate(value)&&(!payload.domain||value.record.domain===payload.domain)&&samePayloadNumber(value.record,'value')&&samePayloadText(value.record,'coverage')&&samePayloadText(value.record,'cutoffTime')&&(!own(payload,'startedAt')||sameInstant(payload.startedAt,value.record.startedAt))&&(!own(payload,'endedAt')||sameInstant(payload.endedAt,value.record.endedAt));
  const normalizeText=value=>String(value??'').trim().normalize('NFC').replace(/\s+/gu,' ');
  const mealCorrelates=value=>{
    if(!sameRecordDate(value)||own(payload,'time')&&value.record.time!==payload.time||own(payload,'mealType')&&normalizeText(value.record.mealType)!==normalizeText(payload.mealType)||own(payload,'foodName')&&normalizeText(value.record.foodName)!==normalizeText(payload.foodName)||own(payload,'userConfirmed')&&value.record.userConfirmed!==(payload.userConfirmed===true))return false;
    if(payload.labelMode===true){if(value.record.labelMode!==true||!sameNumber(payload.weightGrams,value.record.weightGrams)||normalizeText(value.record.referenceSource)!==normalizeText(payload.referenceSource))return false;return ['calories','protein','carbs','fat','fiber','sodium'].every(key=>!own(payload,key)||sameNumber(payload[key],value.record.labelValues?.[key]));}
    return ['calories','protein','carbs','fat','fiber','sodium'].every(key=>samePayloadNumber(value.record,key));
  };
  const workoutAddCorrelates=value=>{
    if(!workoutAddReceipt(value))return false;if(!Array.isArray(payload?.exercises))return true;
    const expected=payload.exercises.flatMap(exercise=>Array.isArray(exercise?.sets)?exercise.sets.map(set=>({exerciseId:String(exercise.exerciseId||''),weight:set?.weight,reps:set?.reps})):[]),actual=value.records;
    if(expected.length!==actual.length||value.records.some(record=>payload.date&&record.date!==payload.date))return false;
    return expected.every((set,index)=>set.exerciseId&&actual[index]?.exerciseId===set.exerciseId&&sameNumber(set.weight,actual[index]?.weight)&&sameNumber(set.reps,actual[index]?.reps));
  };
  const workoutBatchCorrelates=value=>{
    if(!workoutBatchReceipt(value))return false;if(!Array.isArray(payload?.updates))return true;
    const expected=payload.updates.map(update=>update?.recordId),actual=value.updatedRecordIds;
    if(expected.length!==actual.length||new Set(expected).size!==expected.length||!expected.every(id=>typeof id==='string'&&actual.includes(id)))return false;
    const records=new Map(value.records.map(record=>[record.recordId,record]));return payload.updates.every(update=>{const record=records.get(update.recordId);return record&&['date','exerciseId'].every(key=>!own(update,key)||record[key]===update[key])&&['weight','reps'].every(key=>!own(update,key)||sameNumber(update[key],record[key]));});
  };
  const goalReceipt=value=>object(value)&&value.status==='SAVED'&&object(value.goal)&&typeof value.goal.goalId==='string'&&/^[1-9]\d*$/.test(String(value.goal.revision));
  const trainingReceipt=value=>goalReceipt(value)||exerciseReceipt(value)||workoutAddReceipt(value)||workoutBatchReceipt(value)||mutationRecord(value,{deleted:value?.deleted===true});
  let valid=true;
  if(action==='getBodyRecords'||action==='getManualObservations')valid=rows(data,'recordId');
  if(action==='getNutritionRecords')valid=rows(data,'mealRecordId');
  if(action==='getWorkoutRecords'){
    const dates=Array.isArray(data?.records)?new Set(data.records.map(row=>row.date).filter(date=>/^\d{4}-\d{2}-\d{2}$/.test(date))):new Set();
    valid=object(data)&&rows(data.records,'recordId')&&(data.trainingDays===undefined||Number.isSafeInteger(data.trainingDays)&&data.trainingDays>=0&&data.trainingDays===dates.size);
  }
  if(action==='updateWorkoutSets')valid=workoutBatchCorrelates(data);
  if(action==='getExerciseDatabase')valid=rows(data,'exerciseId');
  if(action==='getExerciseBodyParts')valid=Array.isArray(data)&&data.every(r=>object(r)&&typeof r.bodyPartId==='string'&&typeof r.displayName==='string'&&['SYSTEM','USER'].includes(r.source));
  if(['getSleepRecords','getActivityRecords'].includes(action)){
    const keys=action==='getSleepRecords'?['totalSleepMinutes','sleepScore']:['steps','activeMinutes','activeCalories','totalCalories'];
    const optional=action==='getActivityRecords'?['heartRate','hrv','weight','bodyFatPercentage','spo2']:[];
    valid=Array.isArray(data)&&data.every(r=>object(r)&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&['CURRENT','STALE'].includes(r.dataStatus)&&(!Object.hasOwn(r,'analysisDataStatus')||['CURRENT','STALE'].includes(r.analysisDataStatus))&&keys.every(k=>r[k]===null||r.dataStatus==='CURRENT'&&typeof r[k]==='number'&&Number.isFinite(r[k]))&&optional.every(k=>!Object.hasOwn(r,k)||r[k]===null||r.dataStatus==='CURRENT'&&typeof r[k]==='number'&&Number.isFinite(r[k])));
  }
  if(action==='getTrainingWorkspace')valid=object(data)&&data.schemaVersion==='training-workspace.v1'&&Array.isArray(data.routines)&&Array.isArray(data.sessions);
  if(action==='getTrainingExerciseHistory')valid=object(data)&&Array.isArray(data.records)&&typeof data.hasMore==='boolean';
  if(['saveTrainingRoutine','saveExerciseSettings','startTrainingSession','upsertTrainingSet','finishTrainingSession'].includes(action))valid=object(data)&&data.status==='SAVED'&&data.requestId===payload.clientRequestId;
  if(action==='getHealthTimeline')valid=object(data)&&Array.isArray(data.timeline)&&data.timeline.every(object);
  if(['addBodyRecord','upsertBodyRecord','deleteBodyRecord'].includes(action))valid=bodyReceipt(data)&&(action==='deleteBodyRecord'?data.deleted===true:data.deleted===false)&&(action==='deleteBodyRecord'?sameRecordId(data):bodyCorrelates(data));
  if(action==='getBodyWriteStatus')valid=object(data)&&typeof data.exists==='boolean'&&(data.exists===false||bodyReceipt(data));
  if(['upsertManualObservation','deleteManualObservation'].includes(action))valid=observationReceipt(data)&&(action==='deleteManualObservation'?data.deleted===true:data.deleted===false)&&(action==='deleteManualObservation'?sameRecordId(data):observationCorrelates(data));
  if(action==='getObservationWriteStatus')valid=object(data)&&typeof data.exists==='boolean'&&(data.exists===false||observationReceipt(data));
  if(action==='upsertMealRecord')valid=mealReceipt(data,'UPSERT')&&(!payload.mealRecordId||data.recordId===payload.mealRecordId)&&mealCorrelates(data);
  if(action==='deleteMealRecord')valid=mealReceipt(data,'DELETE')&&(!payload.mealRecordId||data.recordId===payload.mealRecordId);
  if(action==='getMealWriteStatus')valid=object(data)&&typeof data.exists==='boolean'&&(data.exists===false||mealReceipt(data));
  if(action==='manageExercise')valid=exerciseReceipt(data)&&(!payload.exerciseId||data.exerciseId===payload.exerciseId)&&(!payload.operation||data.operation===payload.operation);
  if(action==='addWorkoutRecord')valid=workoutAddCorrelates(data);
  if(action==='updateWorkoutSet')valid=mutationRecord(data,{deleted:false})&&sameRecordId(data)&&sameRecordDate(data)&&(!payload.exerciseId||data.record.exerciseId===payload.exerciseId)&&samePayloadNumber(data.record,'weight')&&samePayloadNumber(data.record,'reps');
  if(action==='deleteWorkoutSet')valid=mutationRecord(data,{deleted:true})&&sameRecordId(data);
  if(['getTrainingEngine','runFoodEngine'].includes(action))valid=!!globalThis.HealthEngineUI?.envelopeValid(data,hostedManualBinding?.canonical,action==='getTrainingEngine'?'training':'food');
  if(action==='getHealthEngine')valid=object(data)&&(data.status==='SNAPSHOT_UNAVAILABLE'?data.envelope===null:['CURRENT','STALE'].includes(data.status)&&!!globalThis.HealthEngineUI?.envelopeValid(data.envelope,hostedManualBinding?.canonical,'health_score'));
  if(action==='submitFoodEngineFeedback')valid=object(data)&&data.event_id===payload.event_id&&data.feedback_status==='NEW'&&data.production_rules_changed===false;
  if(action==='getTrainingPersonalRecords')valid=object(data)&&data.version==='training-personal-records-goals-v1.2.0'&&data.semantics==='MAX_WEIGHT_AND_SINGLE_SET_VOLUME'&&data.comparisonVersion==='training-entered-load-v1'&&Array.isArray(data.groups)&&Array.isArray(data.excluded)&&object(data.range);
  if(action==='getTrainingGoals')valid=object(data)&&Array.isArray(data.goals);
  if(action==='getTrainingSetEvidence')valid=object(data)&&object(data.record)&&data.record.recordId===payload.recordId&&String(data.record.revision)===String(payload.revision);
  if(action==='manageTrainingGoal')valid=goalReceipt(data)&&(!payload.goalId||data.goal.goalId===payload.goalId);
  if(action==='getTrainingWriteStatus')valid=object(data)&&typeof data.exists==='boolean'&&(data.exists===false||trainingReceipt(data));
  if(action==='localEngineSnapshot'||action==='refreshDailyNutrition'||action==='refreshDerivedData'&&data?.outputs!==undefined){
    valid=object(data)&&rows(data.meals,'mealRecordId')&&Array.isArray(data.outputs)&&data.outputs.every(r=>object(r)&&typeof r.domain==='string'&&typeof r.score_status==='string'&&typeof r.calculation_date==='string'&&(r.score===null||typeof r.score==='number'&&Number.isFinite(r.score)));
  }
  if(!valid)throw Object.assign(Error('MALFORMED_RESPONSE'),{code:'MALFORMED_RESPONSE'});
}
function recordManualSourceEvidence(action,{received=false,ok=false,data,error,payload={},sequence=++manualSourceSerial}={}){
  if(ok)assertManualResponseShape(action,data,payload);
  const s=manualSourceEvidence??={api:'UNKNOWN',database:'UNKNOWN',dataPresent:'UNKNOWN',dataUpdatedAt:null,analysisUpdatedAt:null,domains:{}};
  const at=new Date().toISOString();s.api=received?'CONNECTED':'UNAVAILABLE';
  if(!ok){s.database=/^DB_|DATABASE|SQL_/.test(error||'')?'UNAVAILABLE':'UNKNOWN';renderManualProviderStatus();return;}
  const scope={start:payload.startDate||payload.date||null,end:payload.endDate||payload.date||null};
  const updateDomain=(name,fields)=>{const old=s.domains[name]||{};if((old.sequence||0)>sequence)return;const retained={...old};if(JSON.stringify(old.scope)!==JSON.stringify(scope))delete retained.present;s.domains[name]={...retained,...fields,scope,sequence};if(fields.analysis==='UPDATED')s.analysisUpdatedAt=at;};
  let rows=null,domain=null;
  if(action==='getBodyRecords'&&Array.isArray(data)){rows=data;domain='body';}
  if(action==='getManualObservations'&&Array.isArray(data)){rows=data;domain=payload.domain||'manual_observations';}
  if(action==='getNutritionRecords'&&Array.isArray(data)){rows=data;domain='nutrition';}
  if(action==='getWorkoutRecords'&&Array.isArray(data?.records)){rows=data.records;domain='training';}
  if(action==='getExerciseDatabase'&&Array.isArray(data)){rows=data;domain='exercise';}
  if(action==='getSleepRecords'&&Array.isArray(data)){rows=data;domain='sleep';}
  if(action==='getActivityRecords'&&Array.isArray(data)){rows=data;domain='activity';}
  if(action==='getHealthTimeline'&&Array.isArray(data?.timeline)){rows=data.timeline;domain='timeline';}
  if(['getDashboardData','getTodaySummary'].includes(action)&&data?.user&&Object.hasOwn(data,'today')){rows=data.today?[data.today]:[];domain='dashboard';}
  const snapshot=Array.isArray(data?.meals)&&Array.isArray(data?.outputs)&&['localEngineSnapshot','refreshDailyNutrition','refreshDerivedData'].includes(action);
  if(snapshot){rows=data.meals;domain='nutrition';const latest={};for(const out of data.outputs){if(!latest[out.domain]||out.calculation_date>=latest[out.domain].calculation_date)latest[out.domain]=out;}for(const name of new Set([...Object.keys(s.domains).filter(n=>!['training','exercise','timeline','dashboard'].includes(n)),...Object.keys(latest)])){const out=latest[name];updateDomain(name,{analysis:out?manualAnalysisState(out):'UNKNOWN',analysisDate:out?.calculation_date||null});}}
  const mutation=['upsertManualObservation','deleteManualObservation','addBodyRecord','upsertBodyRecord','deleteBodyRecord','upsertMealRecord','deleteMealRecord','addWorkoutRecord','updateWorkoutSet','updateWorkoutSets','deleteWorkoutSet','manageExercise'].includes(action);
  const receipt=['getObservationWriteStatus','getBodyWriteStatus','getMealWriteStatus','getTrainingWriteStatus'].includes(action)&&data?.exists===true;
  const committed=(mutation||receipt)&&data?.status==='SAVED'&&(typeof data.recordId==='string'||typeof data.exerciseId==='string'||Array.isArray(data.records));
  if(rows!==null){s.database='CONNECTED';s.dataUpdatedAt=at;updateDomain(domain,{present:rows.length>0});}
  if(['getSleepRecords','getActivityRecords'].includes(action)&&rows){
    const metrics=action==='getSleepRecords'?['totalSleepMinutes']:['steps','activeMinutes'];
    const latest=rows.at(-1);
    const reason=latest?.analysisStaleReason??latest?.staleReason,analysis=reason==='RECOMPUTE_FAILED'?'FAILED':latest?.dataStatus==='STALE'||latest?.analysisDataStatus==='STALE'||reason?'STALE':'UNKNOWN';
    updateDomain(domain,{present:rows.some(r=>metrics.some(k=>typeof r[k]==='number'&&Number.isFinite(r[k]))),analysis,analysisDate:latest?.date||null});
  }
  if(committed){s.database='CONNECTED';s.dataUpdatedAt=at;/* presence is verified by a subsequent SELECT, not optimistic mutation UI */}
  if(action==='getBodyRecords'&&rows){const latest=[...rows].sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];updateDomain('body',{analysis:latest?manualAnalysisState(latest):'INSUFFICIENT_DATA',analysisDate:latest?.date||null});}
  if(action==='getManualObservations'&&rows){for(const name of payload.domain?[payload.domain]:['sleep','steps','total_energy']){const latest=rows.filter(r=>r.domain===name).sort((a,b)=>b.date.localeCompare(a.date))[0];updateDomain('manual_'+name,{present:!!latest,analysis:latest?manualAnalysisState(latest):'INSUFFICIENT_DATA',analysisDate:latest?.date||null});}}
  if((['addBodyRecord','upsertBodyRecord','deleteBodyRecord','getBodyWriteStatus'].includes(action)||action==='refreshDerivedData'&&payload.recordType==='body')&&data?.analysisStatus)updateDomain('body',{analysis:manualAnalysisState(data),analysisDate:data.record?.date||payload.date||null});
  if(['getWorkoutRecords','addWorkoutRecord','updateWorkoutSet','updateWorkoutSets','deleteWorkoutSet'].includes(action)||action==='refreshDerivedData'&&payload.recordType==='workout')updateDomain('training',{analysis:'NOT_ENABLED',analysisDate:null});
  if(!Object.values(s.domains).some(d=>d.analysis==='UPDATED'))s.analysisUpdatedAt=null;
  const present=Object.values(s.domains).filter(d=>Object.hasOwn(d,'present')).map(d=>d.present);s.dataPresent=present.some(Boolean)?'PRESENT':present.length?'ABSENT':'UNKNOWN';
  renderManualProviderStatus();
}
function renderManualProviderStatus(){
  if(typeof document==='undefined')return; // Transport-only hosts/tests have no UI surface.
  const node=document.getElementById('technical-provider-updated');
  if(node)node.textContent=!manualProviderObservation?'尚無本帳號成功 SQL 讀寫證據':`${manualProviderObservation.ok?'最近請求成功':'最近請求失敗（沒有切换資料來源）'} · ${manualProviderObservation.at} · ${manualProviderObservation.action}${manualProviderObservation.analysis?' · '+manualProviderObservation.analysis:''}`;
  const sql=manualSqlEnabled(),s=manualSourceStatus(),put=(id,text,state)=>{const el=document.getElementById(id);if(el){el.textContent=text;if(el.dataset)el.dataset.state=state||'UNKNOWN';}};
  put('data-connection-state',!sql?'既有資料服務（未切換）':s.api==='CONNECTED'?(s.database==='CONNECTED'?'已連線（最近 SQL 請求已驗證）':'API 已回應；資料庫尚未確認'):'尚未確認連線',s.api);
  put('data-storage-provider',sql?(hostedManualEnabled()?'雲端資料庫':'本機測試資料庫'):'既有資料服務',sql?'SQL_CONFIGURED':'LEGACY_CONFIGURED');
  put('data-last-updated',s.dataUpdatedAt?`最近 SQL 讀寫確認：${s.dataUpdatedAt}`:'尚無 SQL 讀寫確認時間',s.dataUpdatedAt?'OBSERVED':'UNKNOWN');
  put('data-presence',s.dataPresent==='PRESENT'?'本次查詢有資料':s.dataPresent==='ABSENT'?'本次查詢沒有資料':'尚未查詢資料',s.dataPresent);
  const names={body:'身體',nutrition:'飲食',training:'訓練',sleep:'睡眠',activity:'活動',cardio:'心肺',recovery:'恢復',overall:'整體'},labels={UPDATED:'已更新（experimental）',UPDATING:'有待處理工作',INSUFFICIENT_DATA:'資料不足',NOT_ENABLED:'分析尚未啟用',FAILED:'失敗',STALE:'結果待更新',UNKNOWN:'尚未確認'};
  const analyses=Object.entries(s.domains).filter(([,d])=>d.analysis),states=analyses.map(([,d])=>d.analysis);
  const analysisState=['FAILED','STALE','UPDATING','UNKNOWN','NOT_ENABLED','INSUFFICIENT_DATA','UPDATED'].find(v=>states.includes(v))||'UNKNOWN';
  put('data-analysis-state',analyses.length?analyses.map(([d,v])=>`${names[d]||d}：${labels[v.analysis]||labels.UNKNOWN}${v.analysisDate?'（'+v.analysisDate+'）':''}`).join('；'):'尚未確認分析狀態',analysisState);
  put('technical-database-status',`Database = ${s.database}`,s.database);
  put('technical-source-status',`API_CONNECTED=${s.api}; DATABASE_CONNECTED=${s.database}; DATA_PRESENT=${s.dataPresent}; DATA_UPDATED=${s.dataUpdatedAt?'OBSERVED':'UNKNOWN'}; ANALYSIS_UPDATED=${analysisState}; algorithm=health-score-v1.0`,analysisState);
  if(sql)for(const id of ['sync-dot','settings-status-dot']){const el=document.getElementById(id);if(el)el.className='status-dot '+(s.database==='CONNECTED'?'connected':s.database==='UNAVAILABLE'||s.api==='UNAVAILABLE'?'error':'notConfigured');}
}
function observeManualProvider(action,ok,analysis){manualProviderObservation={action,ok,analysis,at:new Date().toISOString()};renderManualProviderStatus();}
function localManualBodyNotice(displayedWeightRow=null){
  if(!manualSqlEnabled())return;
  const note=document.getElementById('body-current-note');
  const row=[...(appState.body||[])].filter(item=>typeof item.weight==='number'&&Number.isFinite(item.weight)).sort((a,b)=>b.date.localeCompare(a.date))[0],displayedSource=displayedWeightRow?.weightSource||displayedWeightRow?.bodySource||'';
  if(note&&row&&row.date===displayedWeightRow?.date&&/MANUAL|SELF_REPORTED/u.test(displayedSource)){
    note.dataset.analysisStatus=row.analysisStatus;
    const label=row.analysisStatus==='COMPUTED'?`Experimental 身體分數 ${row.bodyScore??'—'}（未經真實有效性驗證）`:row.analysisStatus==='INSUFFICIENT_DATA'?'紀錄已保存；身體分析資料不足':row.analysisStatus==='ANALYSIS_UNAVAILABLE'?'紀錄已保存；暫時無法查詢分析狀態':row.analysisStatus==='ERROR'?'紀錄已保存；分析失敗，可重新整理重試':row.analysisJobScheduled?'紀錄已保存；有待處理的重算工作':'紀錄已保存；此項分析尚未啟用';
    note.textContent+=' · '+label;
  }else if(note)delete note.dataset.analysisStatus;
}
async function localEngineRequest(action,payload={},expectedIdentity=null){
  const guard=()=>{if(expectedIdentity&&(expectedIdentity.epoch!==localSessionEpoch||(hostedManualBinding?.canonical||currentUser?.userId)!==expectedIdentity.owner))throw Object.assign(Error('IDENTITY_CHANGED'),{code:'IDENTITY_CHANGED'});};guard();
  if(!manualSqlEnabled())throw Error('LOCAL_ENGINE_DISABLED');
  if(hostedManualEnabled())await ensureHostedManualIdentity();
  guard();
  // getManualProviderIdentity already authenticates the Web session, resolves the
  // canonical user and returns the authoritative entitlement. Avoid a second
  // sequential Edge round trip during every hosted app bootstrap.
  if(hostedManualEnabled()&&action==='getCurrentUser'&&hostedManualBinding?.token===sessionToken)return {user:{userId:hostedManualBinding.canonical},access:hostedManualBinding.access};
  if(action==='logout'&&!hostedManualEnabled()){clearLocalManualState();await fetch('/local-logout',{method:'POST'});return {};}
  const epoch=localSessionEpoch;
  const sourceSequence=++manualSourceSerial;manualSourceSequences.set(action,sourceSequence);
  const sourceCurrent=()=>epoch===localSessionEpoch&&manualSourceSequences.get(action)===sourceSequence;
  const invalidateSourceRead=['addBodyRecord','upsertBodyRecord','deleteBodyRecord'].includes(action)?'getBodyRecords':['upsertMealRecord','deleteMealRecord'].includes(action)?'getNutritionRecords':['addWorkoutRecord','updateWorkoutSet','updateWorkoutSets','deleteWorkoutSet'].includes(action)?'getWorkoutRecords':null;
  if(invalidateSourceRead)manualSourceSequences.set(invalidateSourceRead,++manualSourceSerial);
  const catalogSequence=action==='getExerciseDatabase'?++localCatalogReadSequence:0;
  if(action==='manageExercise')localCatalogReadSequence++;
  const observationMutation=['upsertManualObservation','deleteManualObservation'].includes(action);
  const bodyMutation=['addBodyRecord','upsertBodyRecord','deleteBodyRecord'].includes(action);
  const trainingMutation=['saveTrainingRoutine','saveExerciseSettings','startTrainingSession','upsertTrainingSet','finishTrainingSession','manageTrainingGoal','manageExercise','addWorkoutRecord','updateWorkoutSet','updateWorkoutSets','deleteWorkoutSet'].includes(action);
  let observationKey;
  if(observationMutation){observationKey=action+'|'+JSON.stringify(payload);let pending=localPendingObservationWrites.get(observationKey);if(!pending){const old=localObservationRecords.get(payload.recordId);pending=structuredClone({...payload,revision:payload.revision??old?.revision,clientRequestId:payload.clientRequestId||crypto.randomUUID()});localPendingObservationWrites.set(observationKey,pending);}payload=pending;manualSourceSequences.set('getManualObservations',++manualSourceSerial);}
  let pendingKey;
  let trainingKey;
  if(trainingMutation){
    if(action==='addWorkoutRecord'&&workoutSession?.sqlEnvelope)payload=workoutSession.sqlEnvelope;
    const keyInput=action==='addWorkoutRecord'?{date:payload.date,startTime:payload.startTime,exercises:payload.exercises}:payload;
    trainingKey=action+'|'+JSON.stringify(keyInput);
    let pending=localPendingTrainingWrites.get(trainingKey);
    if(!pending){const previous=localWorkoutRecords.get(payload.recordId)||(appState.workouts||[]).find(r=>r.recordId===payload.recordId);pending=structuredClone({...payload,revision:payload.revision??previous?.revision,clientRequestId:payload.clientRequestId||crypto.randomUUID()});localPendingTrainingWrites.set(trainingKey,pending);}
    payload=pending;
    if(action==='addWorkoutRecord'&&workoutSession){workoutSession.sqlEnvelope=pending;localTrainingDraftLock(true);}
  }
  if(bodyMutation){
    pendingKey=action+'|'+JSON.stringify(payload);
    let pending=localPendingBodyWrites.get(pendingKey);
    if(!pending){const previous=localBodyRecords.get(payload.recordId);pending={...payload,revision:payload.revision??previous?.revision,clientRequestId:payload.clientRequestId||crypto.randomUUID()};localPendingBodyWrites.set(pendingKey,pending);}
    payload=pending;
  }
  if(['upsertMealRecord','deleteMealRecord'].includes(action)){
    payload={...(action==='upsertMealRecord'?localMealMutationPayload(payload):localMealDeleteMutationPayload(payload)),clientRequestId:payload.clientRequestId||crypto.randomUUID()};
  }
  let body,received=false;
  try{
    const response=await manualSqlFetch(action,payload);
    received=true;
    try{body=await response.json();}catch{const error=Error('MALFORMED_RESPONSE');error.code='MALFORMED_RESPONSE';throw error;}
    if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.ok!=='boolean')throw Object.assign(Error('MALFORMED_RESPONSE'),{code:'MALFORMED_RESPONSE'});
    if(response.ok===false&&body?.ok===true)body={ok:false,error:'HTTP_RESPONSE_CONTRACT_MISMATCH'};
    if(body.ok)try{assertManualResponseShape(action,body.data,payload);}catch(error){body=undefined;throw error;}
  }catch(error){
    if(error.name==='TimeoutError'||error.name==='AbortError')error.code='REQUEST_TIMEOUT';
    if((bodyMutation||trainingMutation||observationMutation)&&epoch===localSessionEpoch){
      try{const status=await localEngineRequest(observationMutation?'getObservationWriteStatus':trainingMutation?'getTrainingWriteStatus':'getBodyWriteStatus',{clientRequestId:payload.clientRequestId});if(status.exists){assertManualResponseShape(action,status,payload);body={ok:true,data:{...status,recovered:true}};}}catch{ /* keep the original stable envelope for an explicit retry */ }
    }
    if(!body||typeof body.ok!=='boolean'){if(sourceCurrent()){recordManualSourceEvidence(action,{received,error:error.code});observeManualProvider(action,false);}throw error;}
  }
  if(epoch!==localSessionEpoch){const error=Error('IDENTITY_CHANGED');error.code='IDENTITY_CHANGED';throw error;}
  if(catalogSequence&&catalogSequence!==localCatalogReadSequence){const error=Error('STALE_CATALOG_RESPONSE');error.code='STALE_CATALOG_RESPONSE';throw error;}
  if(!body.ok){if(sourceCurrent()){recordManualSourceEvidence(action,{received,error:body.error});observeManualProvider(action,false);}if(observationKey&&!body.retryable)localPendingObservationWrites.delete(observationKey);if(pendingKey&&!body.retryable)localPendingBodyWrites.delete(pendingKey);if(trainingKey&&!body.retryable){localPendingTrainingWrites.delete(trainingKey);if(action==='addWorkoutRecord')localTrainingDraftLock(false);}const error=Error(body.error);error.code=body.error;error.retryable=body.retryable===true;if(sourceCurrent()&&typeof handleAccessError==='function')handleAccessError(error);throw error;}
  if(sourceCurrent())recordManualSourceEvidence(action,{received:true,ok:true,data:body.data,payload,sequence:sourceSequence});
  observeManualProvider(action,true,body.data?.analysisStatus);
  if(observationMutation){localPendingObservationWrites.delete(observationKey);if(body.data.record)cacheLocalRevision(localObservationRecords,body.data.recordId,{...body.data.record,deleted:body.data.deleted===true});}
  if(action==='getManualObservations')for(const record of body.data)cacheLocalRevision(localObservationRecords,record.recordId,record);
  if(trainingMutation){localPendingTrainingWrites.delete(trainingKey);if(action==='addWorkoutRecord')localTrainingDraftLock(false);if(body.data.record)cacheLocalRevision(localWorkoutRecords,body.data.recordId,{...body.data.record,deleted:body.data.deleted===true});for(const record of body.data.records||[])cacheLocalRevision(localWorkoutRecords,record.recordId,record);}
  if(action==='getWorkoutRecords')for(const record of body.data.records||[])cacheLocalRevision(localWorkoutRecords,record.recordId,record);
  if(bodyMutation){localPendingBodyWrites.delete(pendingKey);cacheLocalRevision(localBodyRecords,body.data.recordId,{...body.data.record,deleted:body.data.deleted===true});}
  if(['upsertMealRecord','deleteMealRecord'].includes(action)&&body.data.record)cacheLocalRevision(localMealRecords,body.data.recordId||body.data.record.mealRecordId,{...body.data.record,deleted:action==='deleteMealRecord'});
  if(action==='getMealWriteStatus'&&body.data.exists&&body.data.record)cacheLocalRevision(localMealRecords,body.data.recordId||body.data.record.mealRecordId,{...body.data.record,deleted:body.data.deleted===true});
  if(action==='getBodyRecords')for(const record of body.data)cacheLocalRevision(localBodyRecords,record.recordId,record);
  if(action==='getNutritionRecords')for(const record of body.data)cacheLocalRevision(localMealRecords,record.mealRecordId,record);
  // The hosted runtime already schedules bounded recomputation after durable
  // mutations. Its UI performs domain-scoped readback, so a second full
  // snapshot/drain here only adds blocking SQL and network work. Keep this
  // diagnostic panel refresh for the explicit local-engine harness only.
  if(LOCAL_ENGINE_ENABLED&&(bodyMutation||['upsertMealRecord','deleteMealRecord','refreshDailyNutrition','refreshDerivedData'].includes(action)))queueMicrotask(refreshLocalEngineOutputs);
  if(trainingMutation&&action!=='manageTrainingGoal')queueMicrotask(()=>action==='manageExercise'?globalThis.TrainingPersonal?.invalidateCatalog?.():globalThis.TrainingPersonal?.invalidate());
  return body.data;
}
function showLocalEngineLogin(){
  let overlay=document.getElementById('local-engine-login');if(!overlay){overlay=document.createElement('div');overlay.id='local-engine-login';overlay.style.cssText='position:fixed;inset:0;z-index:220;background:white;color:#111;display:grid;place-content:center;gap:15px';
    overlay.innerHTML='<h1>健康陪跑 · 本機驗收</h1><p>僅合成帳號；不是 Google/OAuth 登入。</p><button id="local-login-a">登入測試 A</button><button id="local-login-b">登入測試 B</button><button id="local-login-web_a">登入 Web-session 測試 A</button><button id="local-login-web_b">登入 Web-session 測試 B</button><p id="local-login-error"></p>';document.body.appendChild(overlay);
    for(const account of ['A','B','WEB_A','WEB_B']){const button=document.getElementById('local-login-'+account.toLowerCase());if(account.startsWith('WEB_')&&window.HEALTH_ENGINE_LOCAL_CONFIG?.webSession!==true){button.hidden=true;continue;}button.onclick=async()=>{try{const response=await fetch('/local-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({account:account.replace('WEB_',''),...(account.startsWith('WEB_')?{kind:'web'}:{})})});if(!response.ok)throw Error('LOCAL_TEST_LOGIN_REJECTED');if(await initializeLocalEngineSession())await boot();}catch(error){document.getElementById('local-login-error').textContent=error.message;}};}
  }overlay.style.display='grid';
}
async function initializeLocalEngineSession(){
  clearLocalManualState();
  clearPersonalState();
  document.getElementById('local-engine-output')?.remove();
  document.getElementById('health-connector-panel').style.display='none';
  document.getElementById('technical-api-status').previousElementSibling.textContent='Local PostgreSQL / Deno';
  document.getElementById('chatgpt-meal-box').style.display='none';
  try{const result=await localEngineRequest('getCurrentUser');applyAuthenticatedUser(result);sessionToken='LOCAL_HTTP_ONLY_COOKIE';document.getElementById('local-engine-login')?.remove();if(typeof LOCAL_EXERCISE_ENABLED!=='undefined'&&LOCAL_EXERCISE_ENABLED)setupLocalExerciseManagement();await refreshLocalEngineOutputs();return true;}
  catch{showLocalEngineLogin();return false;}
}
function setupLocalMealFields(record){
  if(!manualSqlEnabled())return;
  document.getElementById('chatgpt-meal-box').style.display='none';
  if(!document.getElementById('meal-label-mode')){
    const field=document.createElement('fieldset');field.innerHTML='<legend>本機 experimental：確認標示與份量</legend><label><input id="meal-label-mode" type="checkbox"> 下方營養值為每 100 g 標示（不是此餐總量）</label><label for="meal-weight-grams">實際可食重量 g</label><input id="meal-weight-grams" type="number" min="0" class="form-input"><label for="meal-reference-source">標示來源／版本</label><input id="meal-reference-source" class="form-input"><p>請使用已含烹調油的最終食品標示；系統不會額外加油。照片辨識未實作。</p>';
    document.getElementById('meal-form').prepend(field);
  }
  const details=document.getElementById('meal-label-details');if(details){details.hidden=false;details.open=Boolean(record?.labelMode);}
  const labelMode=document.getElementById('meal-label-mode');
  labelMode.checked=Boolean(record?.labelMode);
  labelMode.disabled=Boolean(record);
  labelMode.title=record?'計算模式建立後不可切換；如需不同模式請另建餐點。':'';
  document.getElementById('meal-weight-grams').value=record?.weightGrams||'';
  document.getElementById('meal-reference-source').value=record?.referenceSource||'';
  if(record?.labelValues)for(const key of ['calories','protein','carbs','fat'])document.getElementById('meal-'+key).value=record.labelValues[key]??'';
  if(typeof syncMealLabelFields==='function')syncMealLabelFields();
}
async function refreshLocalEngineOutputs(){
  if(!manualSqlEnabled()||!currentUser)return;
  const requestedUser=currentUser;
  const requestNumber=++localOutputRequest;
  const windowRange=typeof sectionWindows!=='undefined'?sectionWindows.nutrition:null;
  const bounds=windowRange?{startDate:windowRange.start,endDate:windowRange.end}:{};
  let panel=document.getElementById('local-engine-output');if(!panel){panel=document.createElement('section');panel.id='local-engine-output';panel.className='card';document.getElementById('meal-list').before(panel);}
  panel.dataset.state='loading';
  try{
    const snapshot=await localEngineRequest('localEngineSnapshot',bounds);
    if(currentUser!==requestedUser)return;
    if(requestNumber!==localOutputRequest)return;
    if(windowRange&&(sectionWindows.nutrition.start!==bounds.startDate||sectionWindows.nutrition.end!==bounds.endDate))return;
    for(const record of snapshot.meals)cacheLocalRevision(localMealRecords,record.mealRecordId,record);
    const currentDay=getLocalDateString();
    appState.nutrition=snapshot.meals;
    if(!windowRange||(bounds.startDate<=currentDay&&currentDay<=bounds.endDate))appState.mealsToday=snapshot.meals.filter(m=>m.date===currentDay);
    renderNutrition();
    panel.replaceChildren();const title=document.createElement('h3');title.textContent='Experimental / UNVALIDATED · 非臨床驗證';panel.append(title);
    for(const result of snapshot.outputs.filter(r=>r.calculation_date===getLocalDateString())){
      const row=document.createElement('p');row.dataset.domain=result.domain;row.dataset.score=result.score===null?'null':String(result.score);row.dataset.status=result.score_status;row.dataset.version=result.engine_version;
      row.textContent=localEngineOutputText(result);panel.append(row);
    }panel.dataset.state='ready';
  }catch(error){if(currentUser!==requestedUser)return;if(requestNumber!==localOutputRequest)return;panel.textContent='Engine 載入失敗：'+error.message;panel.dataset.state='error';const retry=document.createElement('button');retry.textContent='重試 Engine';retry.onclick=refreshLocalEngineOutputs;panel.append(retry);}
}
function localEngineOutputText(result){
  return `${result.domain}: ${result.score===null?'— 資料不足':result.score} · ${result.score_status} · 完整度 ${Math.round(result.data_completeness*100)}% · ${result.engine_version}`;
}

// Shared finders consume the same complete authorized catalog. Search is local.
const exercisePickerBindings=new Map();
let exerciseManagerState=null,exerciseCatalogLoadPending=null;
function resetExerciseNavigation(){
 exerciseManagerState=null;exerciseCatalogLoadPending=null;exercisePickerBindings.clear();
 const form=document.getElementById('exercise-catalog-form');form?.reset();if(form)form.onsubmit=null;
 for(const id of ['exercise-search','edit-workout-search','edit-workout-group-search','training-personal-search','goal-search']){const el=document.getElementById(id);if(el){el.value='';el.oninput=null;}}
 for(const id of ['exercise-select','muscle-group-select','edit-workout-exercise','edit-workout-muscle','edit-workout-group-exercise','edit-workout-group-muscle','training-personal-exercise','training-personal-part','goal-exercise','goal-part']){const el=document.getElementById(id);if(el){el.replaceChildren();if(['muscle-group-select','edit-workout-muscle','edit-workout-group-muscle','training-personal-part','goal-part'].includes(id))el.onchange=null;}}
 form?.querySelectorAll?.('input,select,button').forEach(c=>c.disabled=false);
 globalThis.TrainingPersonal?.reset();

}
function bindExerciseLookup(selectId,options={}){
 const select=document.getElementById(selectId);if(!select)return;
 const old=exercisePickerBindings.get(selectId),config={...old?.config,...options};
 const binding={config,refresh(selectedId){
  const entries=config.getEntries?config.getEntries():exerciseDatabase,parts=typeof exerciseBodyParts==='undefined'?[]:exerciseBodyParts;
  const part=config.partId&&document.getElementById(config.partId),search=config.searchId&&document.getElementById(config.searchId),wanted=selectedId??select.value;
  const scope=config.includeArchived?'all':'active';
  const eligible=HealthCoreUX.exerciseCatalogView(entries,parts,{scope}).groups.flatMap(g=>g.records);
  if(part){const selected=part.value;part.innerHTML='<option value="">所有部位</option>'+HealthCoreUX.exerciseCatalogView(entries,parts,{scope}).groups.map(g=>`<option value="${escapeHtml(g.bodyPartId)}">${escapeHtml(g.displayName)}（${g.count}）</option>`).join('');if([...part.options].some(o=>o.value===selected))part.value=selected;}
  const view=HealthCoreUX.exerciseCatalogView(entries,parts,{scope,query:search?.value||'',bodyPartId:part?.value||''});
  select.innerHTML=view.groups.map(g=>`<optgroup label="${escapeHtml(g.displayName)}">${g.records.map(e=>`<option value="${escapeHtml(e.exerciseId)}">${escapeHtml(e.exerciseName)}${e.archived?'（已封存）':''}</option>`).join('')}</optgroup>`).join('');
  if(wanted&&![...select.options].some(o=>o.value===wanted)){
   const keep=eligible.find(e=>e.exerciseId===wanted),historical=config.includeId===wanted;
   if(keep||historical)select.insertAdjacentHTML('beforeend',`<option value="${escapeHtml(wanted)}">${escapeHtml(keep?.exerciseName||config.fallbackName||'歷史動作')}（目前選取／歷史紀錄）</option>`);
  }
  if(wanted&&[...select.options].some(o=>o.value===wanted))select.value=wanted;
  if(!select.options.length)select.innerHTML='<option value="">尚無符合動作</option>';
  select.disabled=!select.value;
  const status=config.statusId&&document.getElementById(config.statusId);
  if(status)status.textContent=view.count?`${view.count} 個動作`:search?.value?'找不到搜尋結果':part?.value?'此分類沒有動作':'尚無動作';
 }};
 exercisePickerBindings.set(selectId,binding);
 const part=config.partId&&document.getElementById(config.partId),search=config.searchId&&document.getElementById(config.searchId);
 if(part)part.onchange=()=>{binding.refresh();config.onFilter?.();};if(search)search.oninput=()=>binding.refresh();
 binding.refresh(config.selectedId);delete config.selectedId;return binding;
}
function publishExerciseCatalog(entries){
 globalThis.TrainingPersonal?.catalogChanged?.(entries);
 for(const binding of exercisePickerBindings.values())binding.refresh();
}
function exerciseCatalogRead(){
 if(!exerciseCatalogLoadPending){const epoch=localSessionEpoch;const pending=Promise.all([apiService.getExerciseDatabase(),apiService.getExerciseBodyParts()]);exerciseCatalogLoadPending=pending;pending.finally(()=>{if(epoch===localSessionEpoch&&exerciseCatalogLoadPending===pending)exerciseCatalogLoadPending=null;}).catch(()=>{});}
 return exerciseCatalogLoadPending;
}
const CREATE_BODY_PART_VALUE='__create_body_part__';
function populateExerciseBodyPartSelect(select,{selectedId='',allowCreate=false}={}){
 select.replaceChildren();
 for(const source of ['SYSTEM','USER']){
  const parts=exerciseBodyParts.filter(part=>part.source===source);if(!parts.length)continue;
  const group=document.createElement('optgroup');group.label=source==='SYSTEM'?'系統訓練部位':'我的訓練部位';
  for(const part of parts){const option=document.createElement('option');option.value=part.bodyPartId;option.textContent=part.displayName;group.append(option);}select.append(group);
 }
 if(selectedId&&![...select.options].some(o=>o.value===selectedId)){const option=document.createElement('option');option.value=selectedId;option.textContent='原有部位';select.append(option);}
 if(allowCreate){const option=document.createElement('option');option.value=CREATE_BODY_PART_VALUE;option.textContent='＋ 新增訓練部位';select.append(option);}
 if(selectedId)select.value=selectedId;select.disabled=!select.options.length;
}
function exerciseEditorCanClose(){
 const state=exerciseManagerState;if(!state?.editing)return true;
 if(state.pending||state.busy){document.getElementById('exercise-editor-status').textContent='正在核對儲存結果，請保留此表單。';return false;}
 const form=document.getElementById('exercise-catalog-form'),dirty=state.initial!==JSON.stringify(exerciseEditorValues());
 if(dirty&&!confirm('放棄尚未儲存的變更？'))return false;
 state.editing=null;form?.reset();return true;
}
function exerciseEditorValues(){
 const form=document.getElementById('exercise-catalog-form'),part=document.getElementById('exercise-edit-body-part'),creating=part.value===CREATE_BODY_PART_VALUE;
 return {name:document.getElementById('exercise-edit-name').value,...(creating?{newBodyPartName:document.getElementById('exercise-edit-new-part').value}:{bodyPartId:part.value})};
}
function openExerciseEditor(exercise,trigger){
 const state=exerciseManagerState;if(!state)return;
 if(!openSheet('exercise-catalog-form'))return;
 state.editing=exercise||{create:true};state.triggerId=exercise?.exerciseId||null;state.trigger=trigger;state.pending=null;
 const form=document.getElementById('exercise-catalog-form');form.reset();form.querySelectorAll('input,select,button').forEach(c=>c.disabled=false);document.getElementById('exercise-editor-save').textContent='儲存變更';document.getElementById('exercise-delete').textContent='永久刪除此動作';
 document.getElementById('exercise-editor-title').textContent=exercise?'編輯動作':'新增動作';
 document.getElementById('exercise-edit-name').value=exercise?.exerciseName||'';
 populateExerciseBodyPartSelect(document.getElementById('exercise-edit-body-part'),{selectedId:exercise?.bodyPartId,allowCreate:!exercise});
 document.getElementById('exercise-edit-body-part').disabled=exercise&&!exercise.custom;
 document.getElementById('exercise-new-part-field').hidden=true;document.getElementById('exercise-edit-new-part').required=false;
 document.getElementById('exercise-delete-section').hidden=!exercise?.custom;
 document.getElementById('exercise-editor-status').textContent='';
 state.initial=JSON.stringify(exerciseEditorValues());
}
async function exerciseManagerMutation(payload,controls,status){
 const state=exerciseManagerState,epoch=localSessionEpoch;if(!state||state.busy)return;
 state.busy=true;controls.forEach(c=>c.disabled=true);status.textContent='儲存中…';
 let committed=false;
 try{
  await localEngineRequest('manageExercise',payload);if(epoch!==localSessionEpoch||state!==exerciseManagerState)return;
  committed=true;state.pending=null;state.initial=JSON.stringify(exerciseEditorValues());status.textContent='已儲存';
  if(state.editing){state.editing=null;closeSheet();}
  await state.reload(true);
  if(epoch===localSessionEpoch&&state===exerciseManagerState){status.textContent='已儲存';document.getElementById('exercise-manager-status').textContent='已儲存';const target=state.triggerId&&[...document.querySelectorAll('#exercise-manager-list [data-edit-exercise]')].find(b=>b.dataset.editExercise===state.triggerId);(target||state.trigger||document.getElementById('exercise-manager-search'))?.focus();}
 }catch(error){
  if(epoch!==localSessionEpoch||state!==exerciseManagerState)return;
  if(committed){state.loadFailed=true;document.getElementById('exercise-manager-status').textContent='已儲存，清單更新失敗，可重新讀取';}
  else{const uncertain=!error.code||error.retryable||['REQUEST_TIMEOUT','MALFORMED_RESPONSE','HTTP_RESPONSE_CONTRACT_MISMATCH'].includes(error.code);if(uncertain){state.pending=payload;status.textContent='尚無法確認儲存結果；保留內容，按儲存即可核對並安全重試。';}else{state.pending=null;status.textContent=error.code==='EXERCISE_REFERENCED'?'有歷史引用，不能永久刪除；可以封存。':error.code==='STALE_REVISION'?'資料已被更新，請重新讀取後再編輯。':'儲存失敗：'+readableError(error);}}
 }finally{if(state===exerciseManagerState){state.busy=false;controls.forEach(c=>c.disabled=!!state.pending&&c.tagName!=='BUTTON');if(state.pending&&state.editing){const save=document.getElementById('exercise-editor-save'),remove=document.getElementById('exercise-delete');save.disabled=state.pending.operation==='delete';remove.disabled=state.pending.operation!=='delete';if(!save.disabled)save.textContent='核對並重試儲存';if(!remove.disabled)remove.textContent='核對並重試刪除';}
 if(state.editing&&!state.editing.create&&!state.editing.custom)document.getElementById('exercise-edit-body-part').disabled=true;}}
}
function setupLocalExerciseManagement(){
 if(!LOCAL_EXERCISE_ENABLED)return;
 document.getElementById('exercise-management')?.remove();
 const panel=document.createElement('section');panel.id='exercise-management';panel.className='card card-pad';
 panel.innerHTML='<button id="manage-exercises" type="button" class="secondary-button" aria-expanded="false" aria-controls="exercise-manager">管理我的動作</button><div id="exercise-manager" hidden><div class="catalog-heading"><h3>我的動作</h3><button id="exercise-create-open" class="primary-button" type="button">＋ 新增動作</button></div><label class="form-label" for="exercise-manager-search">搜尋動作名稱或別名</label><input id="exercise-manager-search" class="form-input" type="search" placeholder="搜尋所有部位"><div class="catalog-tabs" role="group" aria-label="動作範圍"><button class="secondary-button" type="button" data-catalog-scope="custom" aria-pressed="true">我的自訂動作</button><button class="secondary-button" type="button" data-catalog-scope="system" aria-pressed="false">系統動作／別名</button><button class="secondary-button" type="button" data-catalog-scope="archived" aria-pressed="false">已封存</button></div><p id="exercise-manager-status" role="status"></p><div id="exercise-manager-list"></div><button id="exercise-manager-retry" class="secondary-button" type="button">重新讀取</button></div>';
 document.getElementById('training-overview').append(panel);
 const state=exerciseManagerState={scope:'custom',query:'',expanded:new Map(),entries:[],loaded:false,busy:false,editing:null,pending:null,loadFailed:false};
 state.reload=async(afterSave=false)=>{
  const epoch=localSessionEpoch;const status=document.getElementById('exercise-manager-status');if(!afterSave)status.textContent='載入中…';
  try{const [entries,parts]=await exerciseCatalogRead();if(epoch!==localSessionEpoch||state!==exerciseManagerState)return;
   exerciseBodyParts=parts;state.entries=entries;state.loaded=true;state.loadFailed=false;applyExerciseCatalog(entries);renderLocalExerciseManager(entries);
   status.textContent='資料已更新';
  }catch(error){if(epoch!==localSessionEpoch||state!==exerciseManagerState)return;state.loadFailed=true;status.textContent=afterSave?'已儲存，清單更新失敗，可重新讀取':'讀取失敗，請重新讀取：'+readableError(error);if(!state.loaded)document.getElementById('exercise-manager-list').replaceChildren();throw error;}
 };
 document.getElementById('manage-exercises').onclick=event=>{const manager=document.getElementById('exercise-manager');manager.hidden=!manager.hidden;event.currentTarget.setAttribute('aria-expanded',String(!manager.hidden));if(!manager.hidden&&!state.loaded)state.reload().catch(()=>{});};
 document.getElementById('exercise-manager-retry').onclick=()=>{if(!state.busy)state.reload().catch(()=>{});};
 document.getElementById('exercise-create-open').onclick=e=>{if(!state.busy&&!state.pending)openExerciseEditor(null,e.currentTarget);};
 document.getElementById('exercise-manager-search').oninput=e=>{state.query=e.target.value;renderLocalExerciseManager(state.entries);};
 panel.querySelectorAll('[data-catalog-scope]').forEach(button=>button.onclick=()=>{state.scope=button.dataset.catalogScope;panel.querySelectorAll('[data-catalog-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderLocalExerciseManager(state.entries);});
 document.getElementById('exercise-edit-body-part').onchange=event=>{const creating=event.target.value===CREATE_BODY_PART_VALUE;document.getElementById('exercise-new-part-field').hidden=!creating;document.getElementById('exercise-edit-new-part').required=creating;};
 document.getElementById('exercise-editor-cancel').onclick=()=>closeSheet();
 document.getElementById('exercise-catalog-form').onsubmit=event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity()||state.busy)return;
  const item=state.editing;if(!item||state.pending&&!['create','update'].includes(state.pending.operation))return;
  const values=exerciseEditorValues();if(!item.create&&!item.custom)delete values.bodyPartId;
  const payload=state.pending||{operation:item.create?'create':'update',...(!item.create?{exerciseId:item.exerciseId,revision:item.revision}:{}),...values,clientRequestId:crypto.randomUUID()};
  void exerciseManagerMutation(payload,[...form.querySelectorAll('input,select,button')],document.getElementById('exercise-editor-status'));
 };
 document.getElementById('exercise-delete').onclick=()=>{
  const item=state.editing;if(!item?.custom||state.busy||state.pending&&state.pending.operation!=='delete')return;
  if(!confirm('永久刪除此自訂動作？只有沒有任何歷史引用的動作才能刪除，此操作無法復原。'))return;
  const payload=state.pending||{operation:'delete',exerciseId:item.exerciseId,revision:item.revision,clientRequestId:crypto.randomUUID()};
  void exerciseManagerMutation(payload,[...document.querySelectorAll('#exercise-catalog-form input,#exercise-catalog-form select,#exercise-catalog-form button')],document.getElementById('exercise-editor-status'));
 };
}
function renderLocalExerciseManager(entries){
 const state=exerciseManagerState,list=document.getElementById('exercise-manager-list');if(!state||!list)return;
 const scroll=list.scrollTop;list.replaceChildren();
 const view=HealthCoreUX.exerciseCatalogView(entries,exerciseBodyParts,{scope:state.scope,query:state.query});
 if(!view.count){const empty=document.createElement('p');empty.textContent=state.query?'找不到搜尋結果':!entries.length?'尚未建立動作':state.scope==='archived'?'尚無已封存動作':'此範圍沒有動作';list.append(empty);return;}
 for(const group of view.groups){
  const section=document.createElement('section'),toggle=document.createElement('button'),content=document.createElement('div');
  toggle.type='button';toggle.className='catalog-group-toggle secondary-button';toggle.textContent=`${group.displayName}（${group.count}）`;
  content.id='exercise-part-'+encodeURIComponent(group.bodyPartId);const open=state.query?true:state.expanded.get(group.bodyPartId)!==false;
  content.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-controls',content.id);
  toggle.onclick=()=>{content.hidden=!content.hidden;toggle.setAttribute('aria-expanded',String(!content.hidden));state.expanded.set(group.bodyPartId,!content.hidden);};
  for(const exercise of group.records){
   const row=document.createElement('article');row.className='catalog-row';row.dataset.exerciseId=exercise.exerciseId;
   const name=document.createElement('span');name.className='catalog-row-name';name.textContent=exercise.exerciseName+(exercise.archived?' · 已封存':'');
   const edit=document.createElement('button');edit.type='button';edit.className='secondary-button';edit.textContent='編輯';edit.dataset.editExercise=exercise.exerciseId;edit.setAttribute('aria-label','編輯 '+exercise.exerciseName);
   edit.onclick=()=>{if(!state.busy&&!state.pending)openExerciseEditor(exercise,edit);};
   const more=document.createElement('details');more.className='catalog-more';const summary=document.createElement('summary');summary.textContent='更多';summary.setAttribute('aria-label',exercise.exerciseName+' 更多操作');
   const archive=document.createElement('button');archive.type='button';archive.className='secondary-button';archive.textContent=exercise.archived?'恢復':'封存';
   const status=document.createElement('p');status.setAttribute('role','status');status.className='catalog-row-status';
   let pending=null;archive.onclick=()=>{if(state.busy||state.pending&&(state.pending.exerciseId!==exercise.exerciseId||!['archive','restore'].includes(state.pending.operation)))return;const payload=state.pending||pending||{operation:exercise.archived?'restore':'archive',exerciseId:exercise.exerciseId,revision:exercise.revision,clientRequestId:crypto.randomUUID()};pending=payload;void exerciseManagerMutation(payload,[archive,edit],status).then(()=>{if(!state.pending)pending=null;});};
   more.append(summary,archive);row.append(name,edit,more,status);content.append(row);
  }
  section.append(toggle,content);list.append(section);
 }list.scrollTop=scroll;
}
function localTrainingDraftLock(locked){
  if(typeof workoutSession!=='undefined'&&workoutSession){workoutSession.sqlLocked=locked;if(!locked)delete workoutSession.sqlEnvelope;}
  document.querySelectorAll('#workout-session .complete-set,#workout-session .remove-draft-set,#add-exercise,#workout-session .exercise-weight,#workout-session .exercise-reps,#workout-date,#back-training,#start-workout').forEach(control=>control.disabled=locked);
  if(typeof persistWorkoutDraft==='function')persistWorkoutDraft();
}
function localTrainingDailyRows(records){
  const days=new Map(),sessions=new Map();
  for(const row of [...records].sort((a,b)=>a.date.localeCompare(b.date))){if(!row.date)continue;const day=days.get(row.date)||{date:row.date,trainingSets:0,trainingVolume:0,trainingDuration:0};day.trainingSets+=row.totalSets??1;day.trainingVolume=day.trainingVolume===null||row.totalVolume==null?null:day.trainingVolume+row.totalVolume;days.set(row.date,day);const key=row.sessionId||row.recordId;const previous=sessions.get(key);sessions.set(key,{date:previous?.date||row.date,duration:row.exerciseType?(previous?.duration===null||row.durationMinutes==null?null:(previous?.duration??0)+row.durationMinutes):row.durationMinutes==null?previous?.duration??null:Math.max(previous?.duration??0,row.durationMinutes)});}
  // A split session counts once, attributed to its earliest retained date in this range.
  for(const session of sessions.values()){const day=days.get(session.date);day.trainingDuration=day.trainingDuration===null||session.duration===null?null:day.trainingDuration+session.duration;}
  return [...days.values()];
}
function localTrainingSummary(records,reportedTotalSets,reportedTotalVolume){
  const rows=Array.isArray(records)?records:[],trainingDates=new Set(rows.map(row=>row?.date).filter(date=>/^\d{4}-\d{2}-\d{2}$/.test(date)));
  const fallbackSets=rows.reduce((total,row)=>total+(Number.isFinite(Number(row?.totalSets))?Number(row.totalSets):1),0);
  const fallbackVolume=rows.length&&rows.every(row=>typeof row.totalVolume==='number'&&Number.isFinite(row.totalVolume))?rows.reduce((total,row)=>total+row.totalVolume,0):null;
  const totalSets=Number.isFinite(Number(reportedTotalSets))?Number(reportedTotalSets):fallbackSets;
  const totalVolume=reportedTotalVolume===null?null:Number.isFinite(Number(reportedTotalVolume))?Number(reportedTotalVolume):fallbackVolume;
  const trainingDays=trainingDates.size;
  return {totalSets,totalVolume,trainingDays,averageSetsPerTrainingDay:trainingDays>0?totalSets/trainingDays:null};
}
