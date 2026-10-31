/* Account-scoped drafts reuse the training database; no credentials or public image cache. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.FoodPhotoCore=api;})(globalThis,function(){
 'use strict';
 const VERSION='food-photo.v1',MAX_BYTES=10*1024*1024,MAX_PIXELS=24000000;
 function dimensions(bytes){
  const b=new Uint8Array(bytes),v=new DataView(b.buffer,b.byteOffset,b.byteLength);let width,height,type;
  if(b[0]===255&&b[1]===216){type='image/jpeg';let at=2;while(at+9<b.length){if(b[at++]!==255)throw Error('INVALID_IMAGE');while(b[at]===255)at++;const m=b[at++];if(m===218||m===217)break;const n=v.getUint16(at);if(n<2||at+n>b.length)throw Error('INVALID_IMAGE');if([192,193,194].includes(m)){height=v.getUint16(at+3);width=v.getUint16(at+5);break;}at+=n;}}
  else if(b.length>=24&&[137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x)){type='image/png';width=v.getUint32(16);height=v.getUint32(20);}
  else if(b.length>=30&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP'){
   type='image/webp';const kind=String.fromCharCode(...b.slice(12,16));
   if(kind==='VP8X'){width=1+b[24]+(b[25]<<8)+(b[26]<<16);height=1+b[27]+(b[28]<<8)+(b[29]<<16);}
   else if(kind==='VP8 '&&b[23]===157&&b[24]===1&&b[25]===42){width=v.getUint16(26,true)&16383;height=v.getUint16(28,true)&16383;}
   else if(kind==='VP8L'&&b[20]===47){const n=v.getUint32(21,true);width=(n&16383)+1;height=((n>>>14)&16383)+1;}
  }
  if(!type||!width||!height)throw Error('UNSUPPORTED_IMAGE');if(width*height>MAX_PIXELS||width>12000||height>12000)throw Error('IMAGE_TOO_LARGE');return {width,height,type};
 }
 async function normalize(file){
  if(!file||file.size>MAX_BYTES||file.size<16)throw Error('IMAGE_TOO_LARGE');dimensions(await file.arrayBuffer());
  const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
  try{if(bitmap.width*bitmap.height>MAX_PIXELS)throw Error('IMAGE_TOO_LARGE');const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const context=canvas.getContext('2d',{willReadFrequently:true});context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   let blob;for(const quality of [.86,.72,.58]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=1048576)break;}
   if(!blob||blob.size>1048576)throw Error('IMAGE_COMPRESSION_LIMIT');
   const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join('');
   return {blob,sha256,width:canvas.width,height:canvas.height};
  }finally{bitmap.close();}
 }
 class Drafts{
  constructor(indexedDB=globalThis.indexedDB){this.db=new Promise((resolve,reject)=>{const r=indexedDB.open('health-training-workspace',2);r.onupgradeneeded=()=>{for(const store of ['accounts','mealDrafts'])if(!r.result.objectStoreNames.contains(store))r.result.createObjectStore(store);};r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('CLOSE_OLD_APP_TAB'));});}
  key(identity){if(!identity?.owner||!identity?.provider)throw Error('VERIFIED_OWNER_REQUIRED');return VERSION+':'+identity.provider+':'+identity.owner;}
  async read(identity){const db=await this.db,key=this.key(identity);return new Promise((resolve,reject)=>{const r=db.transaction('mealDrafts').objectStore('mealDrafts').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
  async write(identity,value){const db=await this.db,key=this.key(identity);if(value&&JSON.stringify({...value,photo:null}).length>262144)throw Error('DRAFT_TOO_LARGE');return new Promise((resolve,reject)=>{const t=db.transaction('mealDrafts','readwrite');if(value)t.objectStore('mealDrafts').put(value,key);else t.objectStore('mealDrafts').delete(key);t.oncomplete=resolve;t.onabort=t.onerror=()=>reject(t.error||Error('LOCAL_SAVE_FAILED'));});}
 }
 function decimalSum(values){const known=values.filter(v=>v!==null);if(known.some(v=>!/^\d+(?:\.\d+)?$/.test(v)))throw Error('INVALID_NUTRIENT');const scale=Math.max(0,...known.map(v=>(v.split('.')[1]||'').length)),n=known.reduce((a,v)=>{const [x,y='']=v.split('.');return a+BigInt(x+y.padEnd(scale,'0'));},0n);let out=n.toString().padStart(scale+1,'0');if(scale)out=out.slice(0,-scale)+'.'+out.slice(-scale);return {value:known.length===values.length?Number(out):null,knownSubtotal:known.length?out:null};}
 function total(items,key){return decimalSum(items.map(i=>i?.calculation?.nutrients?.[key]?.qualifier==='SOURCE_REPORTED'?i.calculation.nutrients[key].value:null));}
 return {VERSION,dimensions,normalize,Drafts,decimalSum,total};
});
