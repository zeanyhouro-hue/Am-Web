// Server tanpa dependensi (Node 18+). Menyajikan public/ dan /api/fetch?url=...&kind=audio
const http=require('http'),fs=require('fs'),path=require('path'),dns=require('dns').promises,net=require('net');
const PORT=process.env.PORT||3000,PUB=path.join(__dirname,'public'),MAX=300e6,UA='Mozilla/5.0';
const FB='https://firebasestorage.googleapis.com/v0/b/alight-creative.appspot.com/o';
const SH=/alightcreative\.com\/am\/share\/u\/([^/?#]+)\/p\/([^/?#]+)/;
const MT={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'};
const priv=ip=>net.isIPv4(ip)?/^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip):/^(::1|::$|f[cd]|fe80)/i.test(ip);
async function safe(u){const x=new URL(u);if(!/^https?:$/.test(x.protocol))throw new Error('Protokol tidak didukung');
 const a=await dns.lookup(x.hostname,{all:true});if(!a.length||a.some(r=>priv(r.address)))throw new Error('Host tidak diizinkan');return x.href}
async function get(u){for(let i=0;i<6;i++){const r=await fetch(await safe(u),{redirect:'manual',headers:{'user-agent':UA}});
 if(r.status>=300&&r.status<400&&r.headers.get('location')){u=new URL(r.headers.get('location'),u).href;continue}r.finalUrl=u;return r}throw new Error('Terlalu banyak redirect')}
async function amFile(u){
 if(/(^|\.)alight\.link$/.test(new URL(u).hostname)){const r=await get(u),t=SH.test(r.finalUrl)?'':await r.text();
  u=SH.test(r.finalUrl)?r.finalUrl:(t.match(/https?:\/\/alightcreative\.com\/am\/share\/u\/[^"'\s<>\\]+/)||[])[0];if(!u)throw new Error('Link alight.link tidak mengarah ke halaman share AM')}
 const m=u.match(SH);if(!m)throw new Error('Bukan link share AM');
 const prefix=`share/u/${m[1]}/p/${m[2]}/`,tried=[];let names=[];
 try{const r=await get(`${FB}?prefix=${encodeURIComponent(prefix)}&maxResults=100`);tried.push('list='+r.status);const j=await r.json();names=(j.items||[]).map(i=>i.name)}catch(e){tried.push('list='+e.message)}
 if(!names.length)names=['package.zip','project.zip','package.alightmotion','project.alightmotion','project.xml','package'].map(n=>prefix+n);
 const c=[];
 for(const n of names){if(/thumb/i.test(n))continue;try{const r=await get(`${FB}/${encodeURIComponent(n)}`);if(!r.ok){tried.push(n.split('/').pop()+'='+r.status);continue}const j=await r.json();c.push({n,size:+j.size||0,tok:String(j.downloadTokens||'').split(',')[0]})}catch(e){tried.push(n+'='+e.message)}}
 if(!c.length)throw new Error('Berkas paket tidak ditemukan di penyimpanan AM (percobaan: '+tried.join(', ')+')');
 c.sort((a,b)=>b.size-a.size);return get(`${FB}/${encodeURIComponent(c[0].n)}?alt=media`+(c[0].tok?'&token='+c[0].tok:''))}
async function resolve(u,kind){const h=new URL(u).hostname;
 if((/alightcreative\.com$/.test(h)&&SH.test(u))||/(^|\.)alight\.link$/.test(h))return amFile(u);
 const d=u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]+)/);
 if(d)return get('https://drive.usercontent.google.com/download?id='+d[1]+'&export=download&confirm=t');
 if(/tiktok\.com$/.test(h)){const j=await(await get('https://www.tikwm.com/api/?url='+encodeURIComponent(u))).json(),D=j.data||{},s=kind==='audio'?(D.music||D.play):(D.play||D.music);
  if(!s)throw new Error('TikTok tidak bisa diambil: '+(j.msg||'tanpa data'));return get(s)}
 return get(u)}
http.createServer(async(q,s)=>{const U=new URL(q.url,'http://x'),J=(c,o)=>{s.writeHead(c,{'content-type':'application/json','access-control-allow-origin':'*'});s.end(JSON.stringify(o))};
 if(U.pathname==='/api/fetch'){try{const r=await resolve(U.searchParams.get('url')||'',U.searchParams.get('kind'));if(!r.ok)throw new Error('Sumber membalas HTTP '+r.status);
  const b=Buffer.from(await r.arrayBuffer());if(b.length>MAX)throw new Error('File terlalu besar');
  s.writeHead(200,{'content-type':r.headers.get('content-type')||'application/octet-stream','access-control-allow-origin':'*'});s.end(b)}catch(e){J(502,{error:e.message})}return}
 const p=U.pathname==='/'?'/index.html':decodeURIComponent(U.pathname),f=path.join(PUB,path.normalize(p));
 if(!f.startsWith(PUB)){s.writeHead(403);return s.end()}
 fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end('Not found')}s.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});s.end(d)})
}).listen(PORT,()=>console.log('AM Preset Player: http://localhost:'+PORT));
