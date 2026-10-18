const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ui=require('../scripts/engine-beta-web.js');
test('NULL, undefined, empty and invalid values never become 0',()=>{for(const v of [null,undefined,'',NaN,Infinity])assert.equal(ui.amount(v),'—');assert.equal(ui.amount(0),'0');for(const value of [null,undefined,'','NaN'])assert.equal(ui.nutrient({value,unit:'g'}),'—');});
test('qualified values and source-reported zero remain visible',()=>{assert.equal(ui.nutrient({value:'0',unit:'g',qualifier:'SOURCE_REPORTED'}),'0 g');assert.equal(ui.nutrient({value:'42.8',unit:'mg',qualifier:'APPROXIMATE'}),'≈ 42.8 mg');assert.equal(ui.nutrient({value:'0.5',unit:'g',qualifier:'LESS_THAN'}),'< 0.5 g');});
test('envelope validation rejects owner/version/name mismatches',()=>{const r={schema_version:'engine-output.v0.1',canonical_user_id:'owner-a',engine_name:'training',engine_version:'training-engine-v0.1',input_snapshot_id:'11111111-1111-4111-a111-111111111111',generated_at:'2026-10-07T00:00:00Z',output:{},evidence:{},confidence:{},data_completeness:{},warnings:[]};assert.ok(ui.envelopeValid(r,'owner-a','training'));assert.ok(!ui.envelopeValid(r,'owner-b','training'));assert.ok(!ui.envelopeValid({...r,engine_version:'future'},'owner-a','training'));assert.ok(!ui.envelopeValid(r,'owner-a','food'));});
test('new display values use text nodes and account reset clears engine state',()=>{const source=fs.readFileSync(path.join(__dirname,'../scripts/engine-beta-web.js'),'utf8'),transport=fs.readFileSync(path.join(__dirname,'../scripts/local-engine-web.js'),'utf8');assert.ok(!source.includes('innerHTML'));assert.match(source,/api\.clear=.*api\.mealPrediction=null/);assert.match(transport,/function clearLocalManualState\(\)\{globalThis\.HealthWorkout\?\.reset\?\.\(\);globalThis\.HealthEngineUI\?\.clear\?\.\(\)/);});
test('new actions use the existing verified-session transport',()=>{const source=fs.readFileSync(path.join(__dirname,'../scripts/engine-beta-web.js'),'utf8');assert.match(source,/await localEngineRequest\(action,payload\)/);assert.ok(!source.includes('fetch('));assert.ok(!source.includes('localStorage'));});

// Offline DOM harness: verifies asynchronous display fencing without live writes.
function mountedUI(){
  const vm=require('node:vm'),all=[];
  class Node{
    constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.style={};this.value='';this._text='';all.push(this);}
    set textContent(value){this._text=String(value);this.children=[];}
    get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this._text='';this.children=[...nodes];}
    setAttribute(){}
    addEventListener(name,fn){this.listeners[name]=fn;}
    fire(name){return this.listeners[name]?.({currentTarget:this});}
  }
  const nodes=Object.fromEntries(['training-overview','dashboard-screen','nutrition-screen','meal-date','meal-food','meal-calories','meal-protein','meal-carbs','meal-fat','meal-label-mode'].map(id=>[id,new Node('div')]));
  const pending=[],context=vm.createContext({document:{readyState:'complete',createElement:t=>new Node(t),getElementById:id=>nodes[id]},hostedManualEnabled:()=>true,getLocalDateString:()=> '2026-10-07',localSessionEpoch:1,sessionToken:'fixture-session',hostedManualBinding:{canonical:'owner-a'},localEngineRequest:(action,payload)=>new Promise(resolve=>pending.push({action,payload,resolve}))});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/engine-beta-web.js'),'utf8'),context);
  const health=nodes['dashboard-screen'].children[0];
  return {context,pending,health,date:health.children[2].children[0],button:health.children[3],out:health.children[4]};
}
function healthReply(score){return {status:'CURRENT',envelope:{schema_version:'engine-output.v0.1',canonical_user_id:'owner-a',engine_name:'health_score',engine_version:'health-score-v1.0',input_snapshot_id:'11111111-1111-4111-a111-111111111111',generated_at:'2026-10-07T00:00:00Z',output:{score,status:'PARTIAL_INPUT',missing_components:['sleep']},evidence:{},confidence:{},data_completeness:{},warnings:[]}};}
test('late response for a previous date cannot overwrite the selected date',async()=>{const h=mountedUI(),old=h.button.fire('click');h.date.value='2026-10-06';h.date.fire('input');const latest=h.button.fire('click');h.pending[1].resolve(healthReply(77));await latest;const text=h.out.textContent;h.pending[0].resolve(healthReply(88));await old;assert.equal(h.out.textContent,text);assert.match(text,/77/);assert.ok(!text.includes('88'));});
test('account reset clears pending health response and prediction binding',async()=>{const h=mountedUI(),request=h.button.fire('click');h.context.HealthEngineUI.mealPrediction={snapshot_id:'old'};h.context.localSessionEpoch++;h.context.sessionToken='different-fixture-session';h.context.HealthEngineUI.clear();h.pending[0].resolve(healthReply(88));await request;assert.equal(h.out.textContent,'尚未查詢');assert.equal(h.context.HealthEngineUI.mealPrediction,null);});
test('changing date without a second request clears the old pending read',async()=>{const h=mountedUI(),request=h.button.fire('click');h.date.value='2026-10-05';h.date.fire('input');h.pending[0].resolve(healthReply(88));await request;assert.equal(h.out.textContent,'尚未查詢');});
