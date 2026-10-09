/* Personal records/goals: existing authenticated manual API, no local health cache. */
(function(root){
'use strict';
const basisLabels={UNKNOWN:'計重方式待確認',DUMBBELL_PER_HAND:'啞鈴每手',DUMBBELL_COMBINED:'啞鈴雙手合計',BARBELL_TOTAL:'槓鈴總重（含槓）',PLATES_ONLY:'僅槓片',MACHINE_MARKED:'器械標示重量',BODYWEIGHT:'自重（本版不支援比較）',ASSISTANCE:'輔助重量（本版不支援比較）'};
const statuses={NOT_STARTED:'尚未開始',IN_PROGRESS:'進行中',ACHIEVED:'已達標',EXPIRED_NOT_ACHIEVED:'已截止・未達標',ARCHIVED:'已封存'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>typeof v==='number'&&Number.isFinite(v)?new Intl.NumberFormat('zh-TW',{maximumFractionDigits:3}).format(v):'—';
const basisOptions=(selected='UNKNOWN',goal=false)=>Object.entries(basisLabels).filter(([k])=>!goal||!['UNKNOWN','BODYWEIGHT','ASSISTANCE'].includes(k)).map(([key,label])=>`<option value="${key}"${key===selected?' selected':''}>${esc(label)}</option>`).join('');
const dimensions=c=>[basisLabels[c.loadBasis],c.variantId&&'變式：'+c.variantId,c.equipmentId&&'器材：'+c.equipmentId,c.side&&'側別：'+c.side].filter(Boolean).join(' · ');
const performanceText=r=>r?`${number(r.load)} ${r.unit} × ${r.reps} 次・${r.date}`:'尚無符合次數條件的紀錄';
const goalType=g=>g.goalType||'LOAD_AND_REPS';
const goalLabels={MAX_WEIGHT:'最大重量目標',MAX_SET_VOLUME:'單組訓練量目標',LOAD_AND_REPS:'舊制：重量＋至少指定次數'};
const goalView=g=>{
 const volume=goalType(g)==='MAX_SET_VOLUME',empty=goalType(g)==='LOAD_AND_REPS'?'尚無符合次數條件的紀錄':'尚無符合紀錄';
 const remaining=g.remainingValue===undefined?g.remainingLoadKg:g.remainingValue;
 return {status:statuses[g.status]||g.status,best:g.qualifiedBest?performanceText(g.qualifiedBest):empty,
 percent:g.achievementPercent==null?empty:number(g.achievementPercent)+'%',bar:g.progressBarPercent,
 remaining:remaining==null?'—':number(remaining)+(volume?' kg·次':' kg'),
 progressLabel:volume?'單組訓練量達成率':'目標重量達成率',label:goalLabels[goalType(g)]};
};
let serial=0,tab='pr',catalog=[],goals=[],prData=null,mounted=false;
const byId=id=>document.getElementById(id);
const currentGuard=()=>{const user=currentUser,epoch=localSessionEpoch,n=++serial;return ()=>user===currentUser&&epoch===localSessionEpoch&&n===serial;};
function reset(){serial++;catalog=[];goals=[];prData=null;if(mounted){byId('training-personal-content').replaceChildren();byId('training-personal-evidence').replaceChildren();byId('training-goal-form').hidden=true;byId('training-personal-panel').hidden=true;}}
function evidenceButton(r,label='查看原始訓練組'){return `<button type="button" class="secondary-button" data-pr-record="${esc(r.recordId)}" data-pr-revision="${esc(r.revision)}">${esc(label)}</button>`;}
function recordCard(r,metric){
 const volume=metric==='MAX_SET_VOLUME',label=volume?'最大訓練量':'最大重量';
 const value=r?number(volume?r.volumeKgReps:r.loadKg)+(volume?' kg·次':' kg'):'尚無符合紀錄';
 const contents=`<strong>${label}</strong><p class="pr-best-value">${esc(value)}</p>${r?`<span>${esc(performanceText(r))}</span>`:''}`;
 return r?`<button type="button" class="card card-pad pr-best-card" data-pr-metric="${metric}" data-pr-record="${esc(r.recordId)}" data-pr-revision="${esc(r.revision)}">${contents}</button>`:
 `<article class="card card-pad pr-best-card" data-pr-metric="${metric}">${contents}</article>`;
}
function renderPR(data,selectedKey){
 prData=data;
 const range=data.range,text=range.startDate?`${range.startDate} ～ ${range.endDate}`:'歷史最佳（截至 '+range.endDate+'）';
 const group=data.groups.find(g=>g.comparisonKey===selectedKey)||data.groups.find(g=>!g.provisional)||data.groups[0];
 let html=`<p>${esc(text)}</p>`;
 if(data.groups.length>1)html+=`<label>計重方式<select id="training-pr-basis" class="form-input">${data.groups.map(g=>`<option value="${esc(g.comparisonKey)}"${g===group?' selected':''}>${esc(g.provisional?'依原始填寫重量統計・'+dimensions(g.comparison):dimensions(g.comparison))}</option>`).join('')}</select></label>`;
 if(group)html+=`<p>${esc(group.exerciseName)}・${esc(group.provisional?'依原始填寫重量統計':dimensions(group.comparison))}</p>`;
 html+=`<div class="pr-cards">${recordCard(group?.maxWeight,'MAX_WEIGHT')}${recordCard(group?.maxSetVolume,'MAX_SET_VOLUME')}</div><p>最大訓練量＝單組重量×次數</p>`;
 const excluded=data.excluded.filter(r=>r.reason!=='LOAD_BASIS_UNCONFIRMED');
 if(group||excluded.length)html+=`<details><summary>進階資訊／原始紀錄</summary>${group?.provisional?'<p>計重方式未標明；暫定統計不會用於已確認基準的目標達成。</p>':''}${group?`<p>${esc(dimensions(group.comparison))}</p>${group.records.map(r=>`<p>${esc(performanceText(r))} ${evidenceButton(r)}</p>`).join('')}`:''}${excluded.map(r=>`<p>${esc(r.date)}・${esc(basisLabels[r.comparison.loadBasis])} ${evidenceButton(r,'查看原始組')}</p>`).join('')}</details>`;
 byId('training-personal-content').innerHTML=html;
}
function renderGoals(data){
 goals=data.goals;let html='<button type="button" id="training-goal-new" class="primary-button">新增目標</button>';
 if(!goals.length)html+='<p>尚未設定訓練目標。</p>';
 for(const g of goals){
 const v=goalView(g),type=goalType(g),name=catalog.find(e=>e.exerciseId===g.exerciseId)?.exerciseName||g.exerciseId;
 const target=type==='MAX_WEIGHT'?`${number(g.targetLoad)} ${g.targetUnit}`:type==='MAX_SET_VOLUME'?`${number(g.targetLoad)} ${g.targetUnit} × ${g.targetReps} 次＝${number(g.targetLoad*g.targetReps)} ${g.targetUnit}·次`:`${number(g.targetLoad)} ${g.targetUnit} × 至少 ${g.targetReps} 次`;
 const rule=type==='MAX_SET_VOLUME'?'按單組重量×次數達標，不要求重量與次數各自達到設定值。':type==='LOAD_AND_REPS'?'保留舊制：同一組重量與次數都須達標。':'';
 html+=`<article class="card card-pad" style="margin-top:12px"><h3>${esc(name)}・${esc(v.label)}</h3><p>${esc(target)}</p>${rule?`<p>${esc(rule)}</p>`:''}<p>${esc(dimensions(g))}</p><p>${esc(g.startDate)} ～ ${esc(g.endDate||'無截止日')}・${esc(v.status)}</p><p>目前最佳：${esc(v.best)}</p><p>${esc(v.progressLabel)}：${esc(v.percent)}</p>${v.bar==null?'':`<progress max="100" value="${v.bar}" aria-label="${esc(v.progressLabel)}" style="width:100%"></progress>`}<p>距離目標：${esc(v.remaining)}</p>${g.qualifiedBest?evidenceButton(g.qualifiedBest,'查看達成依據'):''}<button type="button" class="secondary-button" data-goal-edit="${esc(g.goalId)}">編輯</button>${g.archived?'':`<button type="button" class="secondary-button" data-goal-archive="${esc(g.goalId)}">封存</button>`}</article>`;
 }byId('training-personal-content').innerHTML=html;
}
function goalTypeOptions(g){
 const types=g?[goalType(g)]:['MAX_WEIGHT','MAX_SET_VOLUME'];
 return types.map(type=>`<option value="${type}">${esc(goalLabels[type])}</option>`).join('');
}
function updateGoalPreview(){
 const type=byId('goal-type').value,volume=type==='MAX_SET_VOLUME',weight=Number(byId('goal-load').value),reps=Number(byId('goal-reps').value);
 byId('goal-reps-field').hidden=type==='MAX_WEIGHT';byId('goal-reps').disabled=type==='MAX_WEIGHT';byId('goal-reps').required=type!=='MAX_WEIGHT';
 byId('goal-target-preview').textContent=volume?`${weight>0&&Number.isInteger(reps)&&reps>0?number(weight*reps)+' '+byId('goal-unit').value+'·次。':''}單組訓練量目標：按單組重量×次數達標，不要求兩者各自達到設定值。`:type==='LOAD_AND_REPS'?'舊制目標：同一組重量與次數都須達標。':'';
}
async function load(){
 if(!mounted||byId('training-personal-panel').hidden)return;
 const current=currentGuard(),target=byId('training-personal-content');target.dataset.state='loading';target.textContent='正在讀取訓練資料…';byId('training-personal-evidence').replaceChildren();
 try{
  if(!catalog.length){const result=await localEngineRequest('getExerciseDatabase');if(!current())return;catalog=result;const select=byId('training-personal-exercise');select.innerHTML=catalog.map(e=>`<option value="${esc(e.exerciseId)}">${esc(e.exerciseName)}${e.archived?'（已封存）':''}</option>`).join('');}
  if(tab==='pr'&&!byId('training-personal-exercise').value){target.textContent='尚無可選動作。';target.dataset.state='empty';return;}
  const result=tab==='pr'?await localEngineRequest('getTrainingPersonalRecords',{exerciseId:byId('training-personal-exercise').value,days:byId('training-personal-range').value}):await localEngineRequest('getTrainingGoals');
  if(!current())return;tab==='pr'?renderPR(result):renderGoals(result);target.dataset.state='ready';
 }catch(error){if(!current())return;target.dataset.state='error';target.textContent='訓練資料讀取失敗：'+(typeof readableError==='function'?readableError(error):error.message);const retry=document.createElement('button');retry.type='button';retry.textContent='重新讀取';retry.onclick=load;target.append(retry);}
}
function open(tabName){tab=tabName;byId('training-personal-panel').hidden=false;byId('training-personal-title').textContent=tab==='pr'?'個人最佳':'我的目標';byId('training-pr-controls').hidden=tab!=='pr';byId('training-goal-form').hidden=true;load();}
function editor(g){const form=byId('training-goal-form');form.reset();form.dataset.goalId=g?.goalId||'';form.dataset.revision=g?.revision||'';delete form.dataset.request;delete form.dataset.pending;
 byId('goal-exercise').innerHTML=catalog.filter(e=>!e.archived||e.exerciseId===g?.exerciseId).map(e=>`<option value="${esc(e.exerciseId)}">${esc(e.exerciseName)}</option>`).join('');if(g)byId('goal-exercise').value=g.exerciseId;
 byId('goal-type').innerHTML=goalTypeOptions(g);byId('goal-type').value=g?goalType(g):'MAX_WEIGHT';byId('goal-type').disabled=!!g;byId('goal-form-status').textContent='';
 byId('goal-basis').innerHTML=basisOptions(g?.loadBasis||'BARBELL_TOTAL',true);
 for(const [id,key,fallback]of[['goal-load','targetLoad',''],['goal-unit','targetUnit','kg'],['goal-reps','targetReps',''],['goal-start','startDate',getLocalDateString()],['goal-end','endDate',''],['goal-variant','variantId',''],['goal-equipment','equipmentId',''],['goal-side','side','']])byId(id).value=g?.[key]??fallback;
 updateGoalPreview();form.hidden=false;form.scrollIntoView({block:'nearest',behavior:'smooth'});
}
async function saveGoal(event){event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
 const end=byId('goal-end'),start=byId('goal-start');end.setCustomValidity(end.value&&end.value<start.value?'截止日期不可早於開始日期':'');if(!form.reportValidity())return;
 const values={goalType:byId('goal-type').value,operation:form.dataset.goalId?'edit':'create',exerciseId:byId('goal-exercise').value,loadBasis:byId('goal-basis').value,targetLoad:Number(byId('goal-load').value),targetUnit:byId('goal-unit').value,targetReps:byId('goal-type').value==='MAX_WEIGHT'?null:Number(byId('goal-reps').value),startDate:start.value,endDate:end.value||null,variantId:byId('goal-variant').value||null,equipmentId:byId('goal-equipment').value||null,side:byId('goal-side').value||null,...(form.dataset.goalId?{goalId:form.dataset.goalId,revision:form.dataset.revision}:{})};
 const key=JSON.stringify(values);if(form.dataset.pending!==key){form.dataset.pending=key;form.dataset.request=crypto.randomUUID();}
 const current=currentGuard();byId('goal-save').disabled=true;
 try{await localEngineRequest('manageTrainingGoal',{...values,clientRequestId:form.dataset.request});if(!current())return;form.hidden=true;await load();}catch(e){if(current())byId('goal-form-status').textContent=typeof readableError==='function'?readableError(e):e.message;}finally{byId('goal-save').disabled=false;}
}
async function showEvidence(button){const current=currentGuard(),target=byId('training-personal-evidence');target.textContent='正在核對原始組…';
 try{const {record:r}=await localEngineRequest('getTrainingSetEvidence',{recordId:button.dataset.prRecord,revision:button.dataset.prRevision});if(!current())return;
 target.innerHTML=`<article class="card card-pad"><h3>原始訓練組</h3><p>${esc(r.exerciseName)}・${esc(performanceText(r))}</p><p>${esc(dimensions(r.comparison))}</p><details><summary>進階資訊／確認計重方式</summary><p>來源 ${esc(r.source)}<br>組 ID ${esc(r.recordId)}<br>revision ${esc(r.revision)}<br>訓練場次 ${esc(r.sessionId)}<br>計算版本 ${esc(r.version)}</p><form id="pr-source-confirm"><p>僅由你確認本組實際計重方式；不換算每手／雙手或假設槓重。</p><label>計重方式<select id="pr-source-basis" class="form-input">${basisOptions(r.comparison.loadBasis)}</select></label><button type="submit" class="secondary-button">儲存本組計重方式</button><p role="status" id="pr-source-status"></p></form></details></article>`;
 const form=byId('pr-source-confirm');let requestId=crypto.randomUUID(),basis=r.comparison.loadBasis;
 form.onsubmit=async event=>{event.preventDefault();const selected=byId('pr-source-basis').value;if(selected!==basis){basis=selected;requestId=crypto.randomUUID();}const save=form.querySelector('button');save.disabled=true;
 try{await localEngineRequest('updateWorkoutSet',{recordId:r.recordId,revision:Number(r.revision),date:r.date,exerciseId:r.exerciseId,weight:r.loadKg,reps:r.reps,loadBasis:selected,clientRequestId:requestId});if(!current())return;await load();}catch(e){if(current())byId('pr-source-status').textContent=typeof readableError==='function'?readableError(e):e.message;}finally{save.disabled=false;}};
 target.scrollIntoView({block:'nearest',behavior:'smooth'});
 }catch(e){if(current())target.textContent='原始組無法讀取或已修訂，請重新整理：'+e.message;}
}
function init(){if(mounted||!byId('training-personal-panel'))return;mounted=true;byId('open-personal-records').onclick=()=>open('pr');byId('open-training-goals').onclick=()=>open('goals');byId('training-personal-refresh').onclick=load;byId('training-personal-exercise').onchange=load;byId('training-personal-range').onchange=load;byId('training-goal-form').onsubmit=saveGoal;byId('goal-cancel').onclick=()=>byId('training-goal-form').hidden=true;
 byId('training-personal-content').onchange=event=>{if(event.target.id==='training-pr-basis'&&prData){serial++;byId('training-personal-evidence').replaceChildren();renderPR(prData,event.target.value);}};
 for(const id of['goal-type','goal-load','goal-reps','goal-unit'])byId(id).oninput=updateGoalPreview;
 byId('goal-end').oninput=()=>byId('goal-end').setCustomValidity('');byId('goal-start').oninput=()=>byId('goal-end').setCustomValidity('');
 byId('training-personal-content').onclick=async event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.prRecord)return showEvidence(button);if(button.id==='training-goal-new')return editor(null);const goal=goals.find(g=>g.goalId===(button.dataset.goalEdit||button.dataset.goalArchive));if(!goal)return;if(button.dataset.goalEdit)return editor(goal);
 const current=currentGuard();button.disabled=true;button.dataset.request||=crypto.randomUUID();try{await localEngineRequest('manageTrainingGoal',{operation:'archive',goalId:goal.goalId,revision:goal.revision,clientRequestId:button.dataset.request});if(current())await load();}catch(e){if(current())byId('training-personal-evidence').textContent=e.message;}finally{button.disabled=false;}};
}
root.TrainingPersonal={basisOptions,basisLabels,goalView,goalTypeOptions,performanceText,reset,invalidate(){if(mounted&&!byId('training-personal-panel').hidden)load();},init};
if(typeof module!=='undefined')module.exports=root.TrainingPersonal;
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',init);
})(typeof globalThis!=='undefined'?globalThis:this);
