/* API window.AM (loadPreset, getAvailableProjects, selectProject, getMediaSlots, applyMedia, setAudio, onLog, getRenderProgress, cancelRender, renderVideo). Dimuat setelah app.js. */
const blobOf=async i=>{if(i instanceof Blob)return i;if(typeof i!=='string')throw new Error('Input media tidak valid');
 if(i.startsWith('data:')){const[h,d]=i.split(','),b=/base64/.test(h)?atob(d):decodeURIComponent(d),u=new Uint8Array(b.length);for(let k=0;k<b.length;k++)u[k]=b.charCodeAt(k);return new Blob([u],{type:h.match(/:(.*?)[;,]/)[1]})}
 return getBlob(i)};
const asFile=async(i,d)=>{const b=await blobOf(i);return b instanceof File?b:new File([b],d+'.'+((b.type.split('/')[1]||'bin').replace('jpeg','jpg')),{type:b.type})};
const slotsOf=()=>S.L.map((l,i)=>[l,i]).filter(([l])=>l.type==='image'||l.type==='video');
window.AM={
 stopDefaultLoad(){},
 async loadPreset(src,pn){const b=await blobOf(src);if(!(await loadBlob(b,src.name||String(src).split('/').pop().split('?')[0]||'preset',0,pn)))throw new Error('XML tidak valid')},
 getAvailableProjects(){return S.pk&&S.pk.length?S.pk.map(f=>({name:f.name,title:f.name.replace(/\.xml$/i,''),selected:S.fn.includes(f.name)})):S.L.length?[{name:S.fn,title:S.name,selected:true}]:[]},
 async selectProject(n){const f=(S.pk||[]).find(f=>f.name===n);if(!f){if(n!==S.fn)throw new Error('Project tidak ditemukan: '+n);return}const p=parse(await f.text(),n);if(!p)throw new Error('XML tidak valid');setProject([p],p.name||n,n)},
 getMediaSlots(){return slotsOf().map(([l,i],k)=>({index:k,id:'slot:'+i,name:l.m?l.m.name:l.name,type:l.type,previewUrl:l.m&&l.m.t==='image'?l.m.u:null,isReplaceable:true}))},
 async applyMedia(s,inp){const a=slotsOf(),e=typeof s==='number'?a[s]:a.find(([l,i])=>'slot:'+i===s);if(!e)throw new Error('Slot tidak ditemukan');S.slot=e[1];addMedia(await asFile(inp,'media'))},
 async setAudio(inp){const i=S.L.findIndex(l=>l.type==='audio');if(i<0)throw new Error('Preset tidak punya track audio');const b=typeof inp==='string'&&/^https?:/i.test(inp)?await getBlob(inp,'audio'):await blobOf(inp);S.slot=i;addMedia(new File([b],'audio.mp3',{type:b.type.startsWith('audio')?b.type:'audio/mpeg'}))},
 onLog(cb){S.lcb=cb},
 getRenderProgress(){return{progressPct:Math.round(S.t/S.dur*100),currentFrame:Math.round(S.t*S.fps),totalFrames:Math.round(S.dur*S.fps)}},
 cancelRender(){if(S.ex){S.ex.cancel=true;S.ex.stop()}},
 renderVideo(o={}){return new Promise((res,rej)=>exportV({...o,res,rej}))}
};
