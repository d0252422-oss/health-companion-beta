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
const goalView=g=>({status:statuses[g.status]||g.status,best:performanceText(g.qualifiedBest),percent:g.achievementPercent===null?'尚無符合次數條件的紀錄':`${number(g.achievementPercent)}%`,bar:g.progressBarPercent,remaining:g.remainingLoadKg===null?'—':`${number(g.remainingLoadKg)} kg`});
let serial=0,tab='pr',catalog=[],goals=[],mounted=false;
const byId=id=>document.getElementById(id);
const currentGuard=()=>{const user=currentUser,epoch=localSessionEpoch,n=++serial;return ()=>user===currentUser&&epoch===localSessionEpoch&&n===serial;};
function reset(){serial++;catalog=[];goals=[];if(mounted){byId('training-personal-content').replaceChildren();byId('training-personal-evidence').replaceChildren();byId('training-goal-form').hidden=true;byId('training-personal-panel').hidden=true;}}
function evidenceButton(r,label='查看原始訓練組'){return `<button type="button" class="secondary-button" data-pr-record="${esc(r.recordId)}" data-pr-revision="${esc(r.revision)}">${esc(label)}</button>`;}
function recordCard(r,reps){return `<article class="card card-pad"><b>${reps} 次</b><p>${r?esc(performanceText(r)):'尚無紀錄'}</p>${r?evidenceButton(r):''}${r?.ties?.length>1?`<details><summary>其他並列紀錄（${r.ties.length-1}）</summary>${r.ties.slice(1).map(t=>`<p>${esc(t.date)} ${evidenceButton(t)}</p>`).join('')}</details>`:''}</article>`;}
function renderPR(data){
 const range=data.range,text=range.startDate?`${range.startDate} ～ ${range.endDate}`:'歷史最佳（截至 '+range.endDate+'）';
 let html=`<p>${esc(text)}・Asia/Taipei</p><p>各次數最高已記錄重量；只比較實際完成次數相同的組。</p>`;
 if(!data.groups.length)html+='<p>此期間尚無計重方式已確認的有效紀錄。</p>';
 for(const group of data.groups){const common=[3,5,8,10,12],other=group.bestByReps.filter(r=>!common.includes(r.reps));
  html+=`<section><h3>${esc(group.exerciseName)}</h3><p>${esc(dimensions(group.comparison))}</p><div class="pr-cards">${common.map(reps=>recordCard(group.bestByReps.find(r=>r.reps===reps),reps)).join('')}</div>${other.length?`<details><summary>其他實際有紀錄的次數（${other.length}）</summary><div class="pr-cards">${other.map(r=>recordCard(r,r.reps)).join('')}</div></details>`:''}<details><summary>期間原始訓練組（${group.records.length}）</summary>${group.records.map(r=>`<p>${esc(performanceText(r))} ${evidenceButton(r)}</p>`).join('')}</details></section>`;
 }
 if(data.excluded.length)html+=`<details><summary>待確認或本版不支援的紀錄（${data.excluded.length}）</summary><p>原紀錄保留，未混入已確認的最佳或目標。</p>${data.excluded.map(r=>`<p>${esc(r.date)}・${esc(basisLabels[r.comparison.loadBasis])} ${evidenceButton(r,'查看／確認原始組')}</p>`).join('')}</details>`;
 byId('training-personal-content').innerHTML=html;
}
function renderGoals(data){goals=data.goals;let html='<p>目標按自己的起訖日期計算，不受頁首期間切換影響。</p><button type="button" id="training-goal-new" class="primary-button">新增目標</button>';
 if(!goals.length)html+='<p>尚未設定訓練目標。</p>';
 for(const g of goals){const v=goalView(g),name=catalog.find(e=>e.exerciseId===g.exerciseId)?.exerciseName||g.exerciseId;
  html+=`<article class="card card-pad" style="margin-top:12px"><h3>${esc(name)}・${number(g.targetLoad)} ${esc(g.targetUnit)} × ${g.targetReps} 次</h3><p>${esc(dimensions(g))}</p><p>${esc(g.startDate)} ～ ${esc(g.endDate||'無截止日')}・${esc(v.status)}</p><p>目前符合條件的最佳：${esc(v.best)}</p><p>目標重量達成率：${esc(v.percent)}</p>${v.bar===null?'':`<progress max="100" value="${v.bar}" aria-label="目標重量達成率" style="width:100%"></progress>`}<p>距離目標重量：${esc(v.remaining)}</p>${g.qualifiedBest?evidenceButton(g.qualifiedBest,'查看達成依據'):''}<button type="button" class="secondary-button" data-goal-edit="${esc(g.goalId)}">編輯</button>${g.archived?'':`<button type="button" class="secondary-button" data-goal-archive="${esc(g.goalId)}">封存</button>`}</article>`;
 }byId('training-personal-content').innerHTML=html;
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
 byId('goal-basis').innerHTML=basisOptions(g?.loadBasis||'BARBELL_TOTAL',true);
 for(const [id,key,fallback]of[['goal-load','targetLoad',''],['goal-unit','targetUnit','kg'],['goal-reps','targetReps',''],['goal-start','startDate',getLocalDateString()],['goal-end','endDate',''],['goal-variant','variantId',''],['goal-equipment','equipmentId',''],['goal-side','side','']])byId(id).value=g?.[key]??fallback;
 form.hidden=false;form.scrollIntoView({block:'nearest',behavior:'smooth'});
}
async function saveGoal(event){event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
 const end=byId('goal-end'),start=byId('goal-start');end.setCustomValidity(end.value&&end.value<start.value?'截止日期不可早於開始日期':'');if(!form.reportValidity())return;
 const values={operation:form.dataset.goalId?'edit':'create',exerciseId:byId('goal-exercise').value,loadBasis:byId('goal-basis').value,targetLoad:Number(byId('goal-load').value),targetUnit:byId('goal-unit').value,targetReps:Number(byId('goal-reps').value),startDate:start.value,endDate:end.value||null,variantId:byId('goal-variant').value||null,equipmentId:byId('goal-equipment').value||null,side:byId('goal-side').value||null,...(form.dataset.goalId?{goalId:form.dataset.goalId,revision:form.dataset.revision}:{})};
 const key=JSON.stringify(values);if(form.dataset.pending!==key){form.dataset.pending=key;form.dataset.request=crypto.randomUUID();}
 const current=currentGuard();byId('goal-save').disabled=true;
 try{await localEngineRequest('manageTrainingGoal',{...values,clientRequestId:form.dataset.request});if(!current())return;form.hidden=true;await load();}catch(e){if(current())byId('goal-form-status').textContent=typeof readableError==='function'?readableError(e):e.message;}finally{byId('goal-save').disabled=false;}
}
async function showEvidence(button){const current=currentGuard(),target=byId('training-personal-evidence');target.textContent='正在核對原始組…';
 try{const {record:r}=await localEngineRequest('getTrainingSetEvidence',{recordId:button.dataset.prRecord,revision:button.dataset.prRevision});if(!current())return;
 target.innerHTML=`<article class="card card-pad"><h3>原始訓練組</h3><p>${esc(r.exerciseName)}・${esc(performanceText(r))}</p><p>${esc(dimensions(r.comparison))}</p><p>来源 ${esc(r.source)}<br>組 ID ${esc(r.recordId)}<br>revision ${esc(r.revision)}<br>訓練場次 ${esc(r.sessionId)}<br>計算版本 ${esc(r.version)}</p><form id="pr-source-confirm"><p>僅由你確認本組實際計重方式；不換算每手／雙手或假設槓重。</p><label>計重方式<select id="pr-source-basis" class="form-input">${basisOptions(r.comparison.loadBasis)}</select></label><button type="submit" class="secondary-button">儲存本組計重方式</button><p role="status" id="pr-source-status"></p></form></article>`;
 const form=byId('pr-source-confirm');let requestId=crypto.randomUUID(),basis=r.comparison.loadBasis;
 form.onsubmit=async event=>{event.preventDefault();const selected=byId('pr-source-basis').value;if(selected!==basis){basis=selected;requestId=crypto.randomUUID();}const save=form.querySelector('button');save.disabled=true;
 try{await localEngineRequest('updateWorkoutSet',{recordId:r.recordId,revision:Number(r.revision),date:r.date,exerciseId:r.exerciseId,weight:r.loadKg,reps:r.reps,loadBasis:selected,clientRequestId:requestId});if(!current())return;await load();}catch(e){if(current())byId('pr-source-status').textContent=typeof readableError==='function'?readableError(e):e.message;}finally{save.disabled=false;}};
 target.scrollIntoView({block:'nearest',behavior:'smooth'});
 }catch(e){if(current())target.textContent='原始組無法讀取或已修訂，請重新整理：'+e.message;}
}
function init(){if(mounted||!byId('training-personal-panel'))return;mounted=true;byId('open-personal-records').onclick=()=>open('pr');byId('open-training-goals').onclick=()=>open('goals');byId('training-personal-refresh').onclick=load;byId('training-personal-exercise').onchange=load;byId('training-personal-range').onchange=load;byId('training-goal-form').onsubmit=saveGoal;byId('goal-cancel').onclick=()=>byId('training-goal-form').hidden=true;
 byId('goal-end').oninput=()=>byId('goal-end').setCustomValidity('');byId('goal-start').oninput=()=>byId('goal-end').setCustomValidity('');
 byId('training-personal-content').onclick=async event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.prRecord)return showEvidence(button);if(button.id==='training-goal-new')return editor(null);const goal=goals.find(g=>g.goalId===(button.dataset.goalEdit||button.dataset.goalArchive));if(!goal)return;if(button.dataset.goalEdit)return editor(goal);
 const current=currentGuard();button.disabled=true;button.dataset.request||=crypto.randomUUID();try{await localEngineRequest('manageTrainingGoal',{operation:'archive',goalId:goal.goalId,revision:goal.revision,clientRequestId:button.dataset.request});if(current())await load();}catch(e){if(current())byId('training-personal-evidence').textContent=e.message;}finally{button.disabled=false;}};
}
root.TrainingPersonal={basisOptions,basisLabels,goalView,performanceText,reset,invalidate(){if(mounted&&!byId('training-personal-panel').hidden)load();},init};
if(typeof module!=='undefined')module.exports=root.TrainingPersonal;
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',init);
})(typeof globalThis!=='undefined'?globalThis:this);
