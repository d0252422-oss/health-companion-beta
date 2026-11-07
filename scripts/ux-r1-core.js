/* UI-only projections. Canonical records, formulas and mutation receipts remain authoritative. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.HealthUXCore=api;})(globalThis,function(){
 'use strict';
 const nutrients=['calories','protein','carbs','fat'];
 const numeric=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
 function scale(values,factor){if(!Number.isFinite(factor)||factor<=0||factor>100)throw Error('INVALID_PORTION');return Object.fromEntries(nutrients.map(k=>[k,numeric(values[k])===null?null:Number((numeric(values[k])*factor).toPrecision(12))]));}
 function mealValues(input){const values=Object.fromEntries(nutrients.map(k=>[k,numeric(input[k])]));if(nutrients.some(k=>values[k]!==null&&(values[k]<0||values[k]>(k==='calories'?100000:10000))))throw Error('INVALID_NUTRIENT');if(input.labelMode){const g=numeric(input.weightGrams);if(g===null||g<=0||g>10000)throw Error('MISSING_GRAMS');return mealValues(Object.fromEntries(nutrients.map(k=>[k,values[k]===null?null:Number((values[k]*g/100).toPrecision(12))])));}return values;}
 function total(items){return Object.fromEntries(nutrients.map(k=>{const list=items.map(i=>numeric(i[k]));return [k,list.length&&list.every(n=>n!==null)?Number(list.reduce((a,b)=>a+b,0).toPrecision(12)):null];}));}
 function findMeals(rows,query=''){const q=String(query).trim().toLocaleLowerCase().replace(/\s+/g,' ');return rows.filter(r=>!r.deleted&&!r.isDeleted&&r.mealRecordId&&String(r.foodName||'').toLocaleLowerCase().replace(/\s+/g,' ').includes(q)).sort((a,b)=>String(b.date+' '+b.time).localeCompare(String(a.date+' '+a.time))).slice(0,30);}
 function remainingSeconds(deadline,now=Date.now()){return Number.isFinite(deadline)?Math.max(0,Math.ceil((deadline-now)/1000)):null;}
 function recordRows(data,{type='all',start,end}={}){
  const rows=[];if(type==='all'||type==='nutrition')for(const r of data.meals||[])if(!r.deleted&&!r.isDeleted)rows.push({type:'nutrition',id:r.mealRecordId,date:r.date,time:r.time||'',title:r.foodName||'未命名餐點',record:r});
  if(type==='all'||type==='training')for(const r of data.workouts||[])if(!r.deleted&&r.completed!==false&&r.status!=='PLANNED')rows.push({type:'training',id:r.recordId,date:r.date,time:r.time||'',title:r.exerciseName||'訓練',record:r});
  if(type==='all'||type==='body')for(const r of data.body||[])if(!r.deleted)rows.push({type:'body',id:r.recordId||r.bodyRecordId||r.date,date:r.date,time:'',title:'身體數據',record:r});
  return rows.filter(r=>r.id&&r.date>=start&&r.date<=end).sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time)||a.type.localeCompare(b.type)||String(a.id).localeCompare(String(b.id)));
 }
 return {nutrients,numeric,scale,mealValues,total,findMeals,remainingSeconds,recordRows};
});
