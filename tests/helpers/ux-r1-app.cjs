// Synthetic isolated App shell. Never obtains credentials or permits a network request.
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom'),{IDBFactory}=require('fake-indexeddb');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
async function app(){
 const html=read('index.html'),dom=new JSDOM(html,{url:'http://127.0.0.1/health-companion-beta/?uiTest=1',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,errors=[];
 Object.assign(w,{structuredClone,indexedDB:new IDBFactory(),fetch:()=>{throw Error('NETWORK_FORBIDDEN_IN_FIXTURE');},confirm:()=>true,matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})});w.CSS={escape:s=>s};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>{const src=/src="([^"]+)"/.exec(m[1])?.[1];return src?src.startsWith('scripts/')?read(src.split('?')[0]):'':m[2];}).join('\n;\n');
 w.eval(scripts+`\nwindow.UXTest={state:appState,api:apiService,openMealEditor,closeSheet,openSheet,navigate,resetIdentityBoundView,restorePendingMealMutationForCurrentUser,activityPairControls,get activityPair(){return activityPairEditor;},set activityPair(v){activityPairEditor=v;},get formUnknown(){return hasUnresolvedMealMutation();},
 setUser(user){resetIdentityBoundView();currentUser={userId:user,displayName:'隔離測試'};sessionToken='LOCAL_SYNTHETIC_ONLY';hostedManualBinding={canonical:user};ensureHostedManualIdentity=async()=>hostedManualBinding;getLocalDateString=()=> '2026-11-02';HealthUXR1.refresh();},
 setTransport(fn){localEngineRequest=fn;},notify:toast,renderDashboard,renderNutrition,renderMetricDetail,setDashboardDataState,applyExerciseCatalog,
 setRange(){globalDateRange={preset:'7d',startDate:'2026-10-27',endDate:'2026-11-02'};for(const s of Object.values(sectionWindows)){s.start='2026-10-27';s.end='2026-11-02';}},getStoredMeal:readStoredMealMutation};`);
 w.addEventListener('error',e=>errors.push(e.message));await new Promise(r=>setTimeout(r,10));w.UXTest.setUser('SYNTHETIC_A');w.UXTest.setRange();
 let rows=[],calls=[],receipts=new Map(),failure=null;
 function commit(p){const old=receipts.get(p.clientRequestId);if(old)return old;const record={...p,mealRecordId:p.mealRecordId||w.crypto.randomUUID(),revision:(Number(p.revision)||0)+1,date:String(p.date).slice(0,10),includedInTotals:true,nutritionCompleteness:'COMPLETE'};const result={record,recordId:record.mealRecordId,status:'SAVED',operation:'UPSERT',deleted:false,analysisJobScheduled:false};receipts.set(p.clientRequestId,result);rows=rows.filter(r=>r.mealRecordId!==record.mealRecordId).concat(record);return result;}
 w.UXTest.setTransport(async(a,p={})=>{calls.push({a,p:structuredClone(p)});if(a==='upsertMealRecord'){
   if(failure)return failure(a,p);return commit(p);
  }if(a==='getMealWriteStatus')return receipts.has(p.clientRequestId)?{...receipts.get(p.clientRequestId),exists:true,operation:'UPSERT'}:{exists:false};if(a==='getNutritionRecords')return rows;if(a==='getHealthTimeline')return {timeline:[]};if(a==='getDashboardData')return {};if(a==='getBodyRecords'||a==='getManualObservations')return [];if(a==='getWorkoutRecords')return {records:[]};if(a==='getTrainingWorkspace')return {routines:[],sessions:[]};if(a==='getTrainingExerciseHistory')return {records:[],hasMore:false};if(a==='localEngineSnapshot')return {meals:[],outputs:[]};if(a==='refreshDerivedData'||a==='refreshDailyNutrition')return {};throw Error('UNEXPECTED_FIXTURE_ACTION_'+a);});
 // Mutation/read transport is replaced at the same API boundary as production; the real form handler runs.
 w.UXTest.api.upsertMealRecord=p=>w.localEngineRequest('upsertMealRecord',p);w.UXTest.api.getMealWriteStatus=id=>w.localEngineRequest('getMealWriteStatus',{clientRequestId:id});
 const el=id=>w.document.getElementById(id),tick=()=>new Promise(r=>setTimeout(r,25));
 function fill(name='合成餐點',values={calories:100,protein:10,carbs:12,fat:3}){el('meal-food').value=name;for(const [k,v]of Object.entries(values))el('meal-'+k).value=v??'';}
 async function stage(name,values){fill(name,values);el('ux-stage-food').click();await tick();}
 return {dom,w,el,calls,errors,tick,fill,stage,commit,setFailure:f=>failure=f,get rows(){return structuredClone(rows);},close:()=>dom.window.close()};
}
module.exports={app};
