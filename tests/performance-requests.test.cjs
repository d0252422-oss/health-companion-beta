const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../scripts/local-engine-web.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const range = {startDate:'2026-09-05',endDate:'2026-10-04'};
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function harness(){
  const calls=[],timers=[];let now=0;
  const context=vm.createContext({URL,Response,AbortSignal,Map,Set,Promise,Date:{now:()=>now},
    setTimeout:fn=>timers.push(fn),sessionToken:'synthetic-A',localSessionEpoch:0,
    HOSTED_MANUAL_SQL_ENABLED:true,LOCAL_ENGINE_ENABLED:false,PERF_DEBUG:false,
    globalDateRange:{preset:'30d'},resolveDateRange:()=>range,
    window:{HEALTH_MANUAL_SQL_CONFIG:{enabled:true,release:'AB',schemaVersion:'manual-sql-v1',
      projectRef:'uavimjgccigpbwqmfkhh',endpoint:'https://uavimjgccigpbwqmfkhh.supabase.co/functions/v1/mobile-health-beta/v1/engine/web'}},
    fetch:(url,options)=>{const result=deferred();calls.push({url,options,body:JSON.parse(options.body),...result});return result.promise;},
    clearLocalManualState:()=>vm.runInContext('invalidateHostedTimelineReads();localSessionEpoch++',context)
  });
  vm.runInContext(source.slice(0,source.indexOf('async function ensureHostedManualIdentity')),context);
  return {context,calls,timers,advance:ms=>{now+=ms;},run:code=>vm.runInContext(code,context),
    read:(payload=range)=>context.hostedManualFetch('getHealthTimeline',payload),
    finish:(index,data={timeline:[{date:'2026-10-04',healthScore:null,steps:0}]},status=200)=>calls[index].resolve(new Response(JSON.stringify({ok:status===200,data}),{status}))};
}
test('concurrent cross-screen timelines use one POST and independently readable bodies',async()=>{
  const h=harness(),a=h.read(),b=h.read();assert.equal(h.calls.length,1);h.finish(0);
  const [ra,rb]=await Promise.all([a,b]);assert.notEqual(ra,rb);assert.deepEqual(await ra.json(),await rb.json());
  const next=h.read();assert.equal(h.calls.length,2);h.finish(1);await next;
});
test('bootstrap starts timeline independently of identity and hands off once after completion',async()=>{
  const h=harness();h.context.primeHostedTimeline();
  const identity=h.context.hostedManualFetch('getManualProviderIdentity');
  assert.deepEqual(h.calls.map(c=>c.body.action),['getHealthTimeline','getManualProviderIdentity']);
  h.finish(0);await Promise.resolve();await Promise.resolve();h.finish(1,{});await identity;
  const timeline=await h.read();assert.equal(h.calls.length,2);assert.equal((await timeline.json()).data.timeline[0].healthScore,null);
  const next=h.read();assert.equal(h.calls.length,3);h.finish(2);await next;
});
test('transport failure reaches all readers and the next request can retry',async()=>{
  const h=harness(),a=h.read(),b=h.read();h.calls[0].reject(Error('network unavailable'));
  await assert.rejects(a,/network unavailable/);await assert.rejects(b,/network unavailable/);
  const retry=h.read();assert.equal(h.calls.length,2);h.finish(1);await retry;
});
test('failed bootstrap is consumed as a failure, never fabricated as empty data',async()=>{
  const h=harness();h.context.primeHostedTimeline();h.calls[0].reject(Error('offline'));await Promise.resolve();await Promise.resolve();
  await assert.rejects(h.read(),/offline/);assert.equal(h.calls.length,1);
});
test('different ranges and complete payloads never coalesce',async()=>{
  const h=harness(),requests=[h.read(),h.read({...range,startDate:'2026-09-28'}),h.read({...range,userId:'untrusted-extra'})];
  assert.equal(h.calls.length,3);h.calls.forEach((_,i)=>h.finish(i));await Promise.all(requests);
});
test('account token switch cannot reuse or consume the old response',async()=>{
  const h=harness(),old=h.read();h.context.sessionToken='synthetic-B';const current=h.read();assert.equal(h.calls.length,2);
  h.finish(0);await assert.rejects(old,/IDENTITY_CHANGED/);h.finish(1);await current;
  assert.equal(h.calls[1].options.headers.authorization,'Bearer synthetic-B');
});
test('logout epoch fences old requests even when the same token is reused',async()=>{
  const h=harness(),old=h.read();h.run('localSessionEpoch++');const next=h.read();assert.equal(h.calls.length,2);
  h.finish(0);await assert.rejects(old,/IDENTITY_CHANGED/);h.finish(1);await next;
});
test('a mutation invalidates the pending/primed read before starting its write',async()=>{
  const h=harness();h.context.primeHostedTimeline();const write=h.context.hostedManualFetch('upsertMealRecord',{mealRecordId:'synthetic'}),next=h.read();
  assert.deepEqual(h.calls.map(c=>c.body.action),['getHealthTimeline','upsertMealRecord','getHealthTimeline']);
  h.calls.forEach((_,i)=>h.finish(i));await Promise.all([write,next]);
});
test('writes are never deduplicated',async()=>{
  const h=harness(),a=h.context.hostedManualFetch('upsertMealRecord',{}),b=h.context.hostedManualFetch('upsertMealRecord',{});
  assert.equal(h.calls.length,2);h.calls.forEach((_,i)=>h.finish(i));await Promise.all([a,b]);
});
test('bootstrap response expires at 30 seconds',async()=>{
  const h=harness();h.context.primeHostedTimeline();h.finish(0);await Promise.resolve();await Promise.resolve();
  h.advance(30001);const next=h.read();assert.equal(h.calls.length,2);h.finish(1);await next;
});
test('HTTP auth failures retain their status and payload for the existing validation',async()=>{
  const h=harness(),a=h.read(),b=h.read();h.finish(0,{error:'INVALID_WEB_SESSION'},401);
  const responses=await Promise.all([a,b]);for(const response of responses){assert.equal(response.status,401);assert.equal((await response.json()).ok,false);}
});
test('a provider change fails closed and clears pending data',async()=>{
  const h=harness(),first=h.read();h.finish(0);await first;
  h.context.window.HEALTH_MANUAL_SQL_CONFIG.release='A';await assert.rejects(h.read(),/MANUAL_PROVIDER_NOT_CONFIGURED/);
});
test('session bootstrap still awaits authoritative identity before applying the user or access',async()=>{
  const start=html.indexOf('    async function initializeSession(){');
  // Inspect the real initialization order; transport tests above execute the actual coordinator.
  const body=html.slice(start,html.indexOf('}else if(sessionToken)clearPersonalState();',start));
  const identity=source.slice(source.indexOf('async function ensureHostedManualIdentity'),source.indexOf('function manualSqlFetch'));
  assert.ok(identity.indexOf('primeHostedTimeline();')<identity.indexOf("await hostedManualFetch('getManualProviderIdentity')"));
  assert.ok(body.indexOf('await sessionPost("getCurrentUser",{})')<body.indexOf('applyAuthenticatedUser(state)'));
  assert.match(body,/if\(!acceptCurrentAccess\(state\)\)return false/);
  assert.match(source,/if\(hostedManualEnabled\(\)\)await ensureHostedManualIdentity\(\)/);
});
test('real identity gate starts both requests but does not bind an unverified identity',async()=>{
  const h=harness();h.context.document={getElementById:()=>null};h.context.setupLocalExerciseManagement=()=>{};
  vm.runInContext(source.slice(source.indexOf('async function ensureHostedManualIdentity'),source.indexOf('function manualSqlFetch')),h.context);
  const verified=h.context.ensureHostedManualIdentity();
  assert.deepEqual(h.calls.map(c=>c.body.action),['getHealthTimeline','getManualProviderIdentity']);
  h.finish(0);await Promise.resolve();assert.equal(h.run('hostedManualBinding'),null);
  h.finish(1,{canonicalUserId:'00000000-0000-4000-8000-000000000001',provider:'postgresql-manual-v1',release:'AB',schemaVersion:'manual-sql-v1',access:{isAllowed:true}});
  await verified;assert.equal(h.run('hostedManualBinding.canonical'),'00000000-0000-4000-8000-000000000001');
  const value=await h.read();assert.equal(h.calls.length,2);assert.equal((await value.json()).data.timeline[0].steps,0);
});
test('a rejected real identity gate never creates a canonical binding',async()=>{
  const h=harness();h.context.document={getElementById:()=>null};h.context.setupLocalExerciseManagement=()=>{};
  vm.runInContext(source.slice(source.indexOf('async function ensureHostedManualIdentity'),source.indexOf('function manualSqlFetch')),h.context);
  const verified=h.context.ensureHostedManualIdentity();h.finish(0);h.calls[1].resolve(new Response(JSON.stringify({ok:false,error:'INVALID_WEB_SESSION'}),{status:401}));
  await assert.rejects(verified,/INVALID_WEB_SESSION/);assert.equal(h.run('hostedManualBinding'),null);
});
