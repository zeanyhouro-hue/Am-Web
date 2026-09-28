const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const T={image:'Gambar',video:'Video',audio:'Audio',text:'Teks',shape:'Bentuk',scene:'Scene'};
const C={image:'#3b6fd6',video:'#2b95c9',audio:'#2f9e6a',text:'#7a55c9',shape:'#4b4fb3',scene:'#b8901e'};
const S={L:[],dur:6,t:0,play:true,loop:true,M:[],slot:null,sel:null,fps:30,q:360,ar:9/16,pw:1080,ph:1920,ps:1,as:1,off:0,box:2,zoom:1,W:300,mk:[],name:'',last:0,ld:0,la:0,fr:0,ft:0,ex:null,vm:false};
const cv=$('#cv'),cx=cv.getContext('2d');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const log=m=>{S.lcb&&S.lcb(m);const l=$('#logs');l.textContent=new Date().toLocaleTimeString('id-ID')+'  '+m+(l.textContent==='Belum ada log.'?'':'\n'+l.textContent)};
const fmt=x=>x.toFixed(2)+'s',ic=n=>`<svg class="i"><use href="#i-${n}"/></svg>`;
const fill=el=>el.style.setProperty('--p',(el.value-el.min)/(el.max-el.min)*100+'%');
const SAMPLE='<project name="Preset contoh 9:16" width="1080" height="1920" duration="6000"><scene name="Scene 1"><shape name="Bentuk A" startTime="300" endTime="4200"/><text name="AM Preset Player" startTime="500" endTime="5500"/><image name="Foto 1" startTime="1200" endTime="5200"/><video name="Video 1" startTime="2000" endTime="6000"/><shape name="Bentuk B" startTime="3000" endTime="6000"/><audio name="Musik" startTime="0" endTime="6000"/></scene></project>';
function setSize(s){const p=S.ar<1;cv.width=Math.round(p?s:s*S.ar);cv.height=Math.round(p?s/S.ar:s)}
function setRes(w,h){if(!(w>=16&&h>=16))return log('Resolusi tidak valid');S.pw=w;S.ph=h;S.ar=w/h;setSize(S.q);render();log('Resolusi project: '+w+'x'+h)}
function parse(xml,nm){
 xml=String(xml).replace(/^\uFEFF/,'');const q=xml.indexOf('<');xml=q>0?xml.slice(q):xml;const d=new DOMParser().parseFromString(xml.trim(),'text/xml');
 if(d.querySelector('parsererror')){log('Gagal membaca '+nm+': XML tidak valid');return null}
 const r=d.documentElement,out=[];
 r.querySelectorAll('*').forEach(e=>{
  const k=e.localName.toLowerCase(),n=a=>{for(const x of a){const v=e.getAttribute(x);if(v&&!isNaN(v))return +v}return null};
  const s=n(['startTime','start_time']),en=n(['endTime','end_time']),du=n(['duration']);
  if(!(k in T)&&s===null&&en===null)return;
  out.push({el:e,type:k in T?k:'shape',name:e.getAttribute('name')||e.getAttribute('id')||T[k]||k,s:(s||0)/1000,e:en!==null?en/1000:du!==null?((s||0)+du)/1000:null,m:null});
 });
 if(!out.length){log('Tidak ada layer ditemukan di '+nm);return null}
 return{out,name:r.getAttribute('name'),w:+r.getAttribute('width'),h:+r.getAttribute('height'),rd:(+r.getAttribute('duration')||0)/1000}
}
function setProject(ps,nm,fn){
 S.M.forEach(m=>m.t!=='image'&&m.el.pause&&m.el.pause());
 S.L=[];let rd=0;ps.forEach(p=>{S.L.push(...p.out);rd=Math.max(rd,p.rd);if(p.w&&p.h){S.ar=p.w/p.h;S.pw=p.w;S.ph=p.h}});
 S.dur=rd||Math.max(0,...S.L.map(l=>l.e||0))||6;
 S.L.forEach(l=>{if(l.e===null||l.e>S.dur)l.e=S.dur});
 S.name=nm;S.fn=fn||nm;S.t=0;S.sel=null;S.slot=null;S.mk=[];setSize(S.q);render();log('Preset dimuat: '+nm+' ('+S.L.length+' layer)')
}
async function files(fl){
 fl=[...fl];const xs=fl.filter(f=>/\.xml$/i.test(f.name)).slice(0,2);
 if(xs.length){const ps=[];for(const f of xs){const p=parse(await f.text(),f.name);if(p)ps.push(p)}if(ps.length)setProject(ps,ps[0].name||xs[0].name.replace(/\.xml$/i,''),xs.map(f=>f.name).join(' + '))}
 fl.filter(f=>!/\.xml$/i.test(f.name)).forEach(addMedia);
}
function addMedia(f){
 const t=['image','video','audio'].find(x=>f.type.startsWith(x));
 if(!t)return log('Format tidak didukung: '+f.name);
 const u=URL.createObjectURL(f);let el;
 if(t==='image'){el=new Image;el.src=u}else{el=document.createElement(t);el.src=u;el.preload='auto';el.playsInline=true;if(t==='video')el.muted=true}
 const m={id:S.M.length,name:f.name,t,u,el};S.M.push(m);
 const ok=l=>t==='audio'?l.type==='audio':(l.type==='image'||l.type==='video');
 const i=S.slot!=null&&ok(S.L[S.slot])?S.slot:S.L.findIndex(l=>ok(l)&&!l.m);
 if(i>=0){S.L[i].m=m;S.slot=null;log('Slot "'+S.L[i].name+'" diisi '+f.name);syncA()}
 render();log('Media ditambahkan: '+f.name)
}
function render(){
 const n=S.L.length,d=S.dur.toFixed(1);
 $('#meta').textContent=`${S.name||'-'} - ${n} layer - ${d}s`;$('#nl').textContent=n+' layer';$('#bc').textContent=S.name;
 $('#pinfo').textContent=`preset: ${S.fn||'-'}\n${n} layer, ${d}s, ${S.pw}x${S.ph}`;
 const ix=t=>S.L.map((l,i)=>[l,i]).filter(([l])=>t.includes(l.type));
 const sl=ix(['image','video']).map(([l,i])=>`<div class="sc2"><div class="th">${l.m&&l.m.t==='image'?`<img src="${l.m.u}" alt="">`:ic(l.type==='image'?'image':'film')}<em>${T[l.type]}</em></div><small>${esc(l.m?l.m.name:l.name)}</small><button class="b2 w" data-slot="${i}">${ic('up')}Perbarui file</button></div>`).join('')||'<p class="hn">Belum ada slot media.</p>';
 const au=ix(['audio']).map(([l,i])=>`<div class="f"><span style="flex:none;align-self:center">${esc(l.name)}</span><select data-au="${i}"><option value="">Pilih dari galeri…</option>${S.M.filter(m=>m.t==='audio').map(m=>`<option value="${m.id}"${l.m===m?' selected':''}>${esc(m.name)}</option>`).join('')}</select></div>`).join('')||'<p class="hn">Tidak ada track audio di XML.</p>';
 $$('.slotsBox').forEach(e=>e.innerHTML=sl);$$('.audBox').forEach(e=>e.innerHTML=au);
 $('#gal').innerHTML=S.M.map(m=>`<div class="sc2"><div class="th">${m.t==='image'?`<img src="${m.u}" alt="">`:ic(m.t==='video'?'film':'music')}<em>${T[m.t]}</em></div><small>${esc(m.name)}</small></div>`).join('');
 $('#lg').innerHTML=Object.entries(T).map(([k,v])=>`<span><i style="background:${C[k]}"></i>${v}</span>`).join('');
 const aud=S.L.find(l=>l.type==='audio'&&l.m);$('#asy').textContent=`audio: ${aud?aud.m.name:'-'}\nsync: ${S.as.toFixed(3)}x`;
 const tl=$('#tl');S.W=Math.max(200,(tl.clientWidth||360)-132)*S.zoom;tl.style.setProperty('--w',S.W+'px');
 const st=[.05,.1,.25,.5,1,2,5,10,30].find(x=>x/S.dur*S.W>=70)||60;let tk='';
 for(let k=0;k*st<S.dur;k++)tk+=`<span style="left:${k*st/S.dur*100}%">${(k*st).toFixed(1)}s</span>`;
 tk+=S.mk.map(t=>`<b class="mk" style="left:${t/S.dur*100}%"></b>`).join('');
 tl.innerHTML=n?`<div class="in"><div class="tr rl"><div class="ln">Layer</div><div class="tk">${tk}</div></div>`+S.L.map((l,i)=>`<div class="tr"><div class="ln">${ic('eye')}<i style="background:${C[l.type]}"></i><span>${esc(l.name)}</span></div><div class="tk"><div class="br${S.sel===i?' sel':''}" data-i="${i}" style="left:${l.s/S.dur*100}%;width:${Math.max(.6,(l.e-l.s)/S.dur*100)}%;background:${C[l.type]}">${esc(l.name)}</div></div></div>`).join('')+'<div class="ph"></div></div>':'<p class="bc">Muat preset terlebih dahulu</p>';
 const l=S.L[S.sel];
 $('#det').innerHTML=l?`<b style="color:var(--tx)">${esc(l.name)}</b><br>${T[l.type]}, ${fmt(l.s)} - ${fmt(l.e)}, ${l.m?esc(l.m.name):'tanpa media'}<pre>${esc(new XMLSerializer().serializeToString(l.el).slice(0,1200))}</pre>`:'Ketuk blok layer mana saja untuk melihat detail dan preview medianya.';
 $('#zv').textContent=S.zoom.toFixed(1)+'x';$('#zs').value=S.zoom;fill($('#zs'))
}
function draw(){
 const w=cv.width,h=cv.height;cx.globalAlpha=1;cx.fillStyle='#020307';cx.fillRect(0,0,w,h);
 S.L.forEach((l,i)=>{
  if(l.type==='scene'||l.type==='audio')return;
  const on=S.t>=l.s&&S.t<l.e,v=l.m&&l.m.t==='video'?l.m.el:null;
  if(!on){if(v&&!v.paused)v.pause();return}
  const fd=Math.min(.3,(l.e-l.s)/2),p=Math.min(1,(S.t-l.s)*2);
  cx.globalAlpha=Math.max(0,Math.min(1,(S.t-l.s)/fd,(l.e-S.t)/fd));
  if(l.type==='text'){cx.fillStyle='#fff';cx.textAlign='center';cx.font=`bold ${w*.075}px system-ui,Arial,sans-serif`;cx.fillText(l.name,w/2,h*.5+(1-p)*h*.05)}
  else if(l.m&&l.m.t!=='audio'){
   const m=l.m.el;
   if(v){v.muted=!S.vm;const x=S.t-l.s;if(Math.abs(v.currentTime-x)>(S.play?.3:.05))v.currentTime=x;if(S.play&&v.paused)v.play().catch(()=>{});if(!S.play&&!v.paused)v.pause()}
   const mw=m.videoWidth||m.naturalWidth,mh=m.videoHeight||m.naturalHeight;
   if(mw){const k=Math.min(w/mw,h/S.box/mh)*S.ps;cx.drawImage(m,(w-mw*k)/2,(h-mh*k)/2,mw*k,mh*k)}
  }else{
   const bw=w*.5,x=w*(.05+.12*(i%3)),y=h*(.06+.14*(i%5));
   if(l.type==='shape'){cx.fillStyle=`hsl(${(i*67)%360} 65% 52%)`;cx.beginPath();i%2?cx.ellipse(x+bw/2,y+bw/2,bw/2,bw/2,0,0,7):cx.roundRect(x,y,bw,bw,w*.04);cx.fill()}
   else{cx.strokeStyle='#8a90a0';cx.lineWidth=2;cx.setLineDash([8,6]);cx.strokeRect(x,y,bw,bw);cx.setLineDash([]);cx.fillStyle='#8a90a0';cx.textAlign='center';cx.font=`${w*.04}px system-ui,Arial,sans-serif`;cx.fillText(l.name+' (kosong)',x+bw/2,y+bw/2)}
  }
 });cx.globalAlpha=1
}
function syncA(){S.L.forEach(l=>{const a=l.type==='audio'&&l.m&&l.m.el;if(!a)return;
 const x=S.t-l.s+S.off/1000;a.playbackRate=S.as;a.preservesPitch=$('#pp').checked;
 if(S.play&&S.t>=l.s&&S.t<l.e&&x>=0){if(Math.abs(a.currentTime-x)>.25)a.currentTime=x;a.play().catch(()=>{})}else a.pause()})}
function setPlay(p){S.play=p;$('#playBtn').innerHTML=p?'❚❚ &nbsp;Jeda':'▶ &nbsp;Putar';S.last=performance.now();syncA()}
function tick(ts){
 if(S.play){S.t+=(ts-S.last)/1000;if(S.t>=S.dur){if(S.loop){S.t=0;syncA()}else{S.t=S.dur;setPlay(false)}}}
 S.last=ts;
 if(ts-S.ld>=1000/S.fps-3){const a=performance.now();draw();S.ft=performance.now()-a;S.fr++;S.ld=ts}
 const sk=$('#timeline');if(document.activeElement!==sk){sk.value=S.t/S.dur*1000;fill(sk)}
 $('#time').textContent=fmt(S.t)+' / '+fmt(S.dur);
 const ph=$('.ph');if(ph)ph.style.left=132+S.t/S.dur*S.W+'px';
 if(ts-S.la>500){S.la=ts;$('#info').textContent=`${S.fr*2} fps | render ${S.ft.toFixed(1)} ms | ${cv.width}x${cv.height} | frame ${Math.round(S.t*S.fps)}`;S.fr=0;if(S.play)syncA();if(S.ex&&S.rcb&&S.rcb.onProgress)S.rcb.onProgress(window.AM.getRenderProgress())}
 if(S.ex)$('#pb').style.width=S.t/S.dur*100+'%';
 requestAnimationFrame(tick)
}
function view(n){$$('.view').forEach(v=>v.classList.toggle('on',v.id==='v-'+n));$$('.nv button').forEach(b=>b.classList.toggle('on',b.dataset.view===n));$('#sc').scrollTop=0;if(n==='layer')render()}
function exportV(o={}){
 const bad=m=>{log(m);o.rej&&o.rej(new Error(m))};
 if(S.ex)return bad('Render sedang berjalan');
 if(!S.L.length)return bad('Muat preset dulu');
 const mt=window.MediaRecorder&&['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
 if(!mt){$('#xs').textContent='Browser ini tidak mendukung perekaman video';return bad('MediaRecorder tidak didukung')}
 const H=+o.resolution||+$('#xr').value||S.q,fps=+o.fps||+$('#xf').value,bpp={1:.05,2:.1,3:.2}[{low:1,medium:2,high:3}[o.quality]||$('#xq').value];S.rcb=o;
 const oq=S.q,of=S.fps,ol=S.loop,ch=[];
 setSize(H);S.fps=fps;S.loop=false;S.t=0;
 const[at,rel]=audioTracks(),vs=cv.captureStream(fps);at.forEach(t=>vs.addTrack(t));const rec=new MediaRecorder(vs,{mimeType:mt,videoBitsPerSecond:Math.round(cv.width*cv.height*fps*bpp)});
 const iv=setInterval(()=>{$('#xs').textContent='Merekam '+Math.round(S.t/S.dur*100)+'%';if(S.t>=S.dur-.05)rec.stop()},100);
 rec.ondataavailable=e=>e.data.size&&ch.push(e.data);
 rec.onstop=()=>{clearInterval(iv);rel();setSize(oq);S.fps=of;S.loop=ol;setPlay(false);S.ex=null;
  if(rec.cancel){$('#xs').textContent='Ekspor dibatalkan';$('#pb').style.width='0';o.rej&&o.rej(new Error('Render dibatalkan'));return}
  const v=$('#xv');const bl=new Blob(ch,{type:mt});v.src=URL.createObjectURL(bl);if(o.res){const fr=new FileReader;fr.onload=()=>o.res({base64:fr.result,blobUrl:v.src,mimeType:mt,durationSec:S.dur,sizeBytes:bl.size});fr.readAsDataURL(bl)}v.hidden=false;$('#pb').style.width='100%';$('#xs').textContent='Selesai ('+(mt.includes('mp4')?'MP4':'WebM')+'). Tahan atau klik kanan video untuk menyimpan.'};
 S.ex=rec;rec.start();setPlay(true)
}
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-view],[data-slot],[data-i],[data-a],[data-amb],[data-au2]');if(!c)return;const D=c.dataset;
 if(D.view)view(D.view);
 else if(D.slot!==undefined){S.slot=+D.slot;$('#fm').click()}
 else if(D.i!==undefined){S.sel=S.sel===+D.i?null:+D.i;render()}
 else if(D.a){const f=c.closest('.cd').querySelector('.af').files[0];f?addMedia(f):log('Pilih file audio dulu')}
 else if(D.au2){audioLink(c)}
 else if(D.amb){c.closest('.cd').querySelector('.amb').textContent='Tidak bisa mengambil dari '+D.amb+' di halaman ini (dibatasi browser). Unduh filenya, lalu pilih dari perangkat.'}
});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.au!==undefined){S.L[+t.dataset.au].m=t.value===''?null:S.M[+t.value];syncA();render()}});
const tp=()=>setPlay(!S.play),rs=()=>{S.t=0;syncA()};
$('#playBtn').onclick=$('#cv').onclick=tp;$('#rs').onclick=$('#rs2').onclick=rs;
$('#loopBtn').onclick=e=>{S.loop=!S.loop;e.currentTarget.classList.toggle('lp',S.loop)};
$('#fs').onclick=()=>$('#pv').requestFullscreen&&$('#pv').requestFullscreen();
$('#timeline').oninput=e=>{S.t=e.target.value/1000*S.dur;fill(e.target);syncA()};
$('#xmlFile').onchange=$('#fm').onchange=e=>{files(e.target.files);e.target.value=''};
$('#am').onclick=()=>{S.slot=null;$('#fm').click()};
$('#smp').onclick=()=>{const p=parse(SAMPLE,'c');setProject([p],p.name,'preset contoh')};
$('#pxb').onclick=()=>{const p=parse($('#px').value,'XML tempel');if(p)setProject([p],p.name||'XML tempel','XML tempel')};
$('#ps').oninput=e=>{S.ps=+e.target.value;$('#psv').textContent=S.ps.toFixed(2)+'x';fill(e.target)};
$('#bx').onchange=e=>S.box=+e.target.value;
$('#as').oninput=e=>{S.as=+e.target.value;$('#asv').textContent=S.as.toFixed(3)+'x';fill(e.target);syncA();render()};
$('#of').oninput=e=>{S.off=+e.target.value;$('#ofv').textContent=(S.off>0?'+':'')+S.off+' ms';fill(e.target);syncA()};
$('#pp').onchange=syncA;$('#vm').onchange=e=>S.vm=e.target.checked;
$('#fit').onclick=()=>{const l=S.L.find(l=>l.type==='audio'&&l.m&&l.m.el.duration);if(!l)return log('Pasang audio dulu');const r=Math.min(2,Math.max(.5,l.m.el.duration/(l.e-l.s)));$('#as').value=r;$('#as').oninput({target:$('#as')})};
const zm=z=>{S.zoom=Math.max(1,Math.min(20,+z));render()},tlScroll=x=>$('#tl').scrollBy({left:x,behavior:'smooth'});
$('#zi').onclick=()=>zm(S.zoom+1);$('#zo').onclick=()=>zm(S.zoom-1);$('#zf').onclick=()=>zm(1);$('#zs').oninput=e=>zm(e.target.value);
$('#sl').onclick=()=>tlScroll(-200);$('#sr').onclick=()=>tlScroll(200);
$('#zc').onclick=()=>$('#tl').scrollTo({left:S.t/S.dur*S.W-100,behavior:'smooth'});
$('#mkb').onclick=()=>{S.mk.push(S.t);render();log('Penanda pada '+fmt(S.t))};
$('#grp').onclick=()=>log('Tidak ada grup di preset ini');
$('#qq').onchange=e=>{S.q=+e.target.value;setSize(S.q)};$('#fp').onchange=e=>S.fps=+e.target.value;
$('#xb').onclick=()=>exportV();$('#xc').onclick=()=>{if(S.ex){S.ex.cancel=true;S.ex.stop()}};
addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
 if(e.code==='Space'){e.preventDefault();tp()}
 else if(e.key==='ArrowLeft'){S.t=Math.max(0,S.t-1);syncA()}
 else if(e.key==='ArrowRight'){S.t=Math.min(S.dur,S.t+1);syncA()}
 else if(e.key==='l'||e.key==='L')$('#loopBtn').click()});
let dc=0;
addEventListener('dragenter',e=>{e.preventDefault();dc++;$('#drop').style.display='grid'});
addEventListener('dragleave',()=>{if(--dc<=0){dc=0;$('#drop').style.display='none'}});
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',e=>{e.preventDefault();dc=0;$('#drop').style.display='none';files(e.dataTransfer.files)});
addEventListener('resize',()=>$('#v-layer').classList.contains('on')&&render());
$$('.rg').forEach(fill);setSize(S.q);{const p=parse(SAMPLE,'c');setProject([p],p.name,'preset contoh')}
setPlay(true);requestAnimationFrame(tick);

// ---- link, zip, resolusi ----
const MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',mp4:'video/mp4',mov:'video/quicktime',webm:'video/webm',mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav',ogg:'audio/ogg',aac:'audio/aac'};
const stLnk=t=>{$('#lnkSt').textContent=t;log(t)};
async function unzip(buf){const dv=new DataView(buf),u=new Uint8Array(buf);let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error('ZIP rusak');
 const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out=[];
 for(let i=0;i<n;i++){const m=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true),name=new TextDecoder().decode(u.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
  if(name.endsWith('/'))continue;const s=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),d=u.subarray(s,s+cs);
  out.push({name,data:m===0?d:m===8?new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()):null})}
 return out.filter(x=>x.data)}
function driveUrl(u){const m=u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]+)/);return m?'https://drive.usercontent.google.com/download?id='+m[1]+'&export=download&confirm=t':u}
async function getBlob(u,kind){const pr=($('#pxu').value||'').trim(),t=[];
 if(/^https?:$/.test(location.protocol))t.push('/api/fetch?url='+encodeURIComponent(u)+(kind?'&kind='+kind:''));
 if(pr)t.push(pr.includes('{url}')?pr.replace('{url}',encodeURIComponent(u)):pr+encodeURIComponent(u));
 if(!kind)t.push(driveUrl(u));let er;
 for(const x of t){try{const r=await fetch(x);if(!r.ok){let m='HTTP '+r.status;try{m=(await r.json()).error||m}catch(e){}throw new Error(m)}return await r.blob()}catch(e){er=er||e}}
 throw new Error('Gagal mengambil: '+(er?er.message:'tidak ada jalur')+'. Jalankan lewat server.js, atau unduh file lalu pilih dari perangkat.')}
async function loadBlob(b,nm,depth=0,pn){
 const h=new Uint8Array(await b.slice(0,4).arrayBuffer());
 if(h[0]===0x50&&h[1]===0x4b){const z=await unzip(await b.arrayBuffer()),all=z.filter(x=>/\.xml$/i.test(x.name)).sort((a,c)=>c.data.length-a.data.length);S.pk=all.map(x=>new File([x.data],x.name.split('/').pop(),{type:'text/xml'}));const xs=pn?all.filter(x=>x.name.split('/').pop()===pn):all.slice(0,2);
  if(!xs.length)throw new Error('Tidak ada file XML di dalam paket');
  const fl=xs.map(x=>new File([x.data],x.name.split('/').pop(),{type:'text/xml'}));
  z.filter(x=>!/\.xml$/i.test(x.name)&&MIME[x.name.split('.').pop().toLowerCase()]).forEach(x=>fl.push(new File([x.data],x.name.split('/').pop(),{type:MIME[x.name.split('.').pop().toLowerCase()]})));
  await files(fl);return true}
 const tx=await b.text();
 if(/^\s*(?:\uFEFF)?<\?xml|^\s*<(?:project|scene)\b/i.test(tx)){const p=parse(tx,nm);if(!p)return false;setProject([p],p.name||nm,nm);return true}
 if(depth<1&&/<html|<!doctype/i.test(tx)){
  const c=[...tx.matchAll(/https?:[^"'\s<>\\]+?\.(?:xml|zip|alightmotion)(?:\?[^"'\s<>\\]*)?/gi)].map(m=>m[0].replace(/&amp;/g,'&'));
  for(const u of [...new Set(c)]){try{if(await loadBlob(await getBlob(u),nm,depth+1))return true}catch(e){}}
  throw new Error('Halaman ini tidak berisi XML yang bisa diambil.')}
 throw new Error('Isi link bukan XML atau paket preset yang dikenali')}
async function fromLink(){let u=$('#lnk').value.trim();if(!/^https?:\/\//i.test(u))return stLnk('Tempel link yang diawali https://');
 stLnk('Mengambil...');try{const ok=await loadBlob(await getBlob(driveUrl(u)),u.split('/').pop().split('?')[0]||'link');if(ok){stLnk('Preset dimuat dari link');view('proyek')}}catch(e){stLnk(e.message)}}
$('#lnkGo').onclick=fromLink;$('#lnk').onkeydown=e=>e.key==='Enter'&&fromLink();
$('#pxu').value=localStorage.getItem('amProxy')||'';$('#pxu').onchange=e=>localStorage.setItem('amProxy',e.target.value.trim());
$('#rr').onchange=e=>{if(e.target.value==='custom')return;const[w,h]=e.target.value.split('x').map(Number);$('#rw').value=w;$('#rh').value=h;setRes(w,h)};
$('#rgo').onclick=()=>{$('#rr').value='custom';setRes(+$('#rw').value,+$('#rh').value)};

async function audioLink(c){const cd=c.closest('.cd'),u=cd.querySelector('input').value.trim(),o=cd.querySelector('.amb'),i=S.L.findIndex(l=>l.type==='audio');
 if(!/^https?:\/\//i.test(u))return o.textContent='Tempel link yang diawali https://';if(i<0)return o.textContent='Preset tidak punya track audio';
 o.textContent='Mengambil...';try{const b=await getBlob(u,'audio');S.slot=i;addMedia(new File([b],'audio-'+Date.now()+'.mp3',{type:b.type.startsWith('audio')?b.type:'audio/mpeg'}));o.textContent='Audio terpasang'}catch(e){o.textContent=e.message}}
let AC=null;
function audioTracks(){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const d=AC.createMediaStreamDestination(),ss=[];
 S.L.forEach(l=>{const e=l.m&&l.m.el;if(!e||!(l.type==='audio'||(l.type==='video'&&S.vm)))return;if(!e._s){e._s=AC.createMediaElementSource(e);e._s.connect(AC.destination)}e._s.connect(d);ss.push(e._s)});
 AC.resume();return[d.stream.getAudioTracks(),()=>ss.forEach(s=>{try{s.disconnect(d)}catch(x){}})]}catch(e){log('Audio ekspor tidak tersedia: '+e.message);return[[],()=>{}]}}
