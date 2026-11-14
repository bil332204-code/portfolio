(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
$('#yr').textContent=new Date().getFullYear();

/* photo fallback */
const photo=$('#photo');
function noPhoto(){photo.remove();$('#me').classList.add('noimg')}
if(photo){if(photo.complete&&!photo.naturalWidth)noPhoto();else photo.addEventListener('error',noPhoto)}

/* loader */
const loader=$('#loader'),ln=$('#ln');
function finishLoad(){loader.classList.add('done');document.body.classList.add('ready');setTimeout(()=>loader.remove(),1000)}
if(reduce){finishLoad()}else{let n=0;const t=setInterval(()=>{n=Math.min(100,n+Math.ceil(Math.random()*9));ln.textContent=n;if(n>=100){clearInterval(t);setTimeout(finishLoad,180)}},35)}

/* live clock (Islamabad) */
function tick(){const d=new Date();
  $('#time').textContent=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  $('#date').textContent=d.toLocaleDateString('en-GB',{timeZone:'Asia/Karachi',day:'numeric',month:'long',year:'numeric'});}
tick();setInterval(tick,1000);

/* flip calendar */
const roles=['Robotics Developer','AI Builder','Software Engineer','Database Designer','Creative Coder','Team Leader'];
let ri=0;const flip=$('#flip');
setInterval(()=>{if(document.hidden)return;
  if(reduce){ri=(ri+1)%roles.length;flip.textContent=roles[ri];return}
  flip.classList.add('out');
  setTimeout(()=>{ri=(ri+1)%roles.length;flip.textContent=roles[ri];flip.classList.remove('out');flip.classList.add('in');setTimeout(()=>flip.classList.remove('in'),450)},320)
},2600);

/* cursor */
const cur=$('#cur'),ring=$('#ring');let mx=-100,my=-100,rx=-100,ry=-100;
addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;cur.style.transform=`translate(${mx-3}px,${my-3}px)`});
(function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`;requestAnimationFrame(loop)})();
document.addEventListener('pointerover',e=>{ring.classList.toggle('big',!!e.target.closest('a,button'))});

/* hero spotlight + 3D photo tilt */
const hero=$('#home'),card=$('#card3d');
hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();
  hero.style.setProperty('--mx',(e.clientX-r.left)+'px');hero.style.setProperty('--my',(e.clientY-r.top)+'px');
  if(reduce)return;const c=card.getBoundingClientRect();const px=(e.clientX-c.left)/c.width-.5,py=(e.clientY-c.top)/c.height-.5;
  card.style.setProperty('--ry',(px*18)+'deg');card.style.setProperty('--rx',(-py*14)+'deg');
  card.style.setProperty('--sx',((px+.5)*100)+'%');card.style.setProperty('--sy',((py+.5)*100)+'%')});
hero.addEventListener('pointerleave',()=>{card.style.setProperty('--ry','0deg');card.style.setProperty('--rx','0deg')});

/* doors */
const rooms={
  ai:{t:'AI & Robotics',c:'var(--blue)',items:[['AEGIS-JD','Humanoid robot that responds to gesture, emotion, pose and voice.','Python · OpenCV · MediaPipe','aegis-jd'],['Milaan','Checks payment screenshots against the seller\'s statement before shipping.','FastAPI · React · Gemini','milaan']]},
  sw:{t:'Software',c:'var(--night)',items:[['FixIt','Desktop marketplace connecting clients and skilled workers.','Java · JavaFX','fixit'],['Smart Electricity Management','Tracks household electricity use and warns near tariff limits.','C++ · file handling','smart-house-management']]},
  data:{t:'Data & Security',c:'var(--sage)',items:[['Freelancing Marketplace Database','MySQL schema for gigs, orders, payments and reviews, normalised to BCNF.','MySQL · triggers','freelancing-marketplace-database'],['Sentinel NIDS','Network intrusion detection with behaviour rules and an Isolation Forest.','Python · Scapy · FastAPI','sentinel-nids']]},
  hw:{t:'Hardware & Art',c:'var(--orange)',items:[['Digital Smart Home','Motion-activated lights and automatic fan control with logic chips.','74LS32 · PIR · W1209','digital-smart-home'],['Fractal Cosmos','Mandelbrot, trees, triangles and spirals combined in one generative picture.','JavaScript · Canvas','fractal-cosmos']]}
};
const behind=$('#behind'),room=$('#room'),doors=$$('.doorbtn');
function closeDoors(){doors.forEach(d=>d.setAttribute('aria-expanded','false'));behind.classList.remove('open')}
doors.forEach(d=>d.addEventListener('click',()=>{
  const open=d.getAttribute('aria-expanded')==='true';closeDoors();if(open)return;
  d.setAttribute('aria-expanded','true');const r=rooms[d.dataset.room];
  room.style.setProperty('--c',r.c);
  room.innerHTML=`<div class="room-head anim"><h3>${r.t}</h3><button class="closebtn" type="button">Close the door</button></div><div class="room-items">${r.items.map(i=>`<a class="mini anim" href="/projects/${i[3]}"><h4>${i[0]}</h4><p>${i[1]}</p><small>${i[2]}</small></a>`).join('')}</div>`;
  room.querySelector('.closebtn').onclick=()=>{closeDoors();d.focus()};
  behind.classList.remove('open');void behind.offsetWidth;setTimeout(()=>{behind.classList.add('open');setTimeout(()=>behind.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'}),350)},300);
}));

/* reveal on scroll */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.2});
$$('.rv').forEach(el=>io.observe(el));

/* Milaan rows + robot labels + traffic feed start when visible */
const phone=$('#phone');
new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){phone.classList.add('live');[...phone.querySelectorAll('.row')].forEach((r,i)=>r.style.animationDelay=(i*.18)+'s')}}),{threshold:.4}).observe(phone);
const G=[['wave','thumbs up','open palm','point'],['happy','surprised','neutral','curious'],['"Ask JD"','"Hello"','"Follow me"','"What\'s this?"']];
let gi=0;setInterval(()=>{gi++;['#g1','#g2','#g3'].forEach((id,k)=>$(id).textContent=G[k][gi%4])},1800);
const eyes=$('#eyes'),robot=$('#robot');
addEventListener('pointermove',e=>{const r=robot.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
  const dx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/400)),dy=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/400));
  eyes.setAttribute('transform',`translate(${dx*8} ${dy*6})`)});
const feed=$('#feed');const ips=()=>`10.0.${Math.floor(Math.random()*9)}.${Math.floor(Math.random()*250)}`;
const kinds=['TCP 443 ok','UDP 53 dns','TCP 80 http','TCP 22 ssh','ICMP echo','TCP 3306 mysql'];
const badKinds=['SYN flood','port scan 1-1024','brute force ssh','DNS tunnel'];
function line(){const bad=Math.random()<.16;const d=document.createElement('div');
  const tm=new Date().toLocaleTimeString('en-GB');d.textContent=`${tm}  ${ips()} → ${ips()}  ${bad?badKinds[Math.floor(Math.random()*4)]:kinds[Math.floor(Math.random()*6)]}`;
  if(bad)d.className='bad';feed.appendChild(d);while(feed.children.length>14)feed.firstChild.remove()}
for(let i=0;i<14;i++)line();setInterval(()=>{if(!reduce)line()},650);

/* stacked cards scale + scroll progress + journey + nav state */
const cards=$$('.pcard'),hdr=$('#hdr'),prog=$('#progress');
const items=$$('.jitem'),yearEl=$('#year'),jfill=$('#jfill'),jright=$('#jright'),jcount=$('#jcount'),jbar=$('#jbar');
const navLinks=$$('nav a'),secs=navLinks.map(a=>$(a.getAttribute('href')));
let curYear='2026';
function onScroll(){
  const sy=scrollY,h=document.documentElement.scrollHeight-innerHeight;
  prog.style.transform=`scaleX(${sy/h})`;hdr.classList.toggle('solid',sy>30);
  cards.forEach((c,i)=>{const next=cards[i+1];if(!next){c.style.transform='';return}
    const nr=next.getBoundingClientRect(),cr=c.getBoundingClientRect();
    const p=Math.max(0,Math.min(1,1-(nr.top-cr.top)/cr.height));
    c.style.transform=reduce?'':`scale(${1-p*.08})`;c.style.filter=`brightness(${1-p*.35})`});
  const mid=innerHeight*.55;let lit=-1;
  items.forEach((it,i)=>{const on=it.getBoundingClientRect().top<mid;it.classList.toggle('lit',on);if(on)lit=i});
  const jr=jright.getBoundingClientRect();jfill.style.height=Math.max(0,Math.min(jr.height,mid-jr.top))+'px';
  const idx=Math.max(0,lit);const y=items[idx].dataset.y;
  jcount.textContent=String(idx+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');jbar.style.width=((idx+1)/items.length*100)+'%';
  if(y!==curYear){curYear=y;yearEl.classList.remove('tick');void yearEl.offsetWidth;yearEl.classList.add('tick');setTimeout(()=>yearEl.textContent=y,170)}
  let active=0;secs.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<innerHeight*.4)active=i});
  navLinks.forEach((a,i)=>a.classList.toggle('on',i===active));
}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();

/* skills sphere */
const sphere=$('#sphere');
const S=[['Python','l'],['Java','l'],['C++','l'],['SQL','l'],['JavaScript','l'],
 ['OpenCV','a'],['MediaPipe','a'],['DeepFace','a'],['YOLOv8','a'],['Faster-Whisper','a'],['LLaMA','a'],['Ollama','a'],['Gemini','a'],['EZ-Robot ARC','a'],
 ['Flask','d'],['FastAPI','d'],['React','d'],['JavaFX','d'],['MySQL','d'],['Firebase','d'],['Firestore','d'],['Git','d'],
 ['Scapy','s'],['scikit-learn','s'],['Packet Tracer','s'],['Wireshark','s'],['Digital logic','s'],['Team leadership','l']];
const col={l:'#EDEBE4',a:'#5E92F0',d:'#9CC8A5',s:'#EE7B3C'};
const pts=S.map((s,i)=>{const phi=Math.acos(-1+(2*i+1)/S.length),th=Math.sqrt(S.length*Math.PI)*phi;
  const el=document.createElement('span');el.textContent=s[0];el.style.color=col[s[1]];sphere.appendChild(el);
  return{x:Math.cos(th)*Math.sin(phi),y:Math.sin(th)*Math.sin(phi),z:Math.cos(phi),el}});
let ax=.003,ay=.005,drag=false,lx=0,ly=0;
sphere.addEventListener('pointerdown',e=>{drag=true;lx=e.clientX;ly=e.clientY;sphere.setPointerCapture(e.pointerId);sphere.style.cursor='grabbing'});
sphere.addEventListener('pointermove',e=>{if(!drag)return;ay=(e.clientX-lx)*.0025;ax=-(e.clientY-ly)*.0025;lx=e.clientX;ly=e.clientY});
sphere.addEventListener('pointerup',()=>{drag=false;sphere.style.cursor='grab'});
function rot(){const R=sphere.clientWidth*.4;
  if(!drag){ax+=(.002-ax)*.02;ay+=(.004-ay)*.02}
  const sa=Math.sin(ax),ca=Math.cos(ax),sb=Math.sin(ay),cb=Math.cos(ay);
  pts.forEach(p=>{let y=p.y*ca-p.z*sa,z=p.y*sa+p.z*ca;p.y=y;p.z=z;let x=p.x*cb+p.z*sb;z=-p.x*sb+p.z*cb;p.x=x;p.z=z;
    const s=.6+.4*(p.z+1)/2;p.el.style.transform=`translate(-50%,-50%) translate(${p.x*R}px,${p.y*R}px) scale(${s})`;
    p.el.style.opacity=.25+.75*(p.z+1)/2;p.el.style.zIndex=Math.round(p.z*100)+100;p.el.style.fontSize=(sphere.clientWidth<420?14:17)+'px'});
  if(!reduce)requestAnimationFrame(rot)}
rot();

/* contact form -> /api/contact */
const form=$('#cform'),st=$('#cf-status');
$('#cf-t').value=Date.now();
form.addEventListener('submit',async e=>{
  e.preventDefault();st.className='cf-status';
  const fd=new FormData(form),data=Object.fromEntries(fd);
  let bad=null;
  [['name',v=>v.trim().length>=2],['email',v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())],['message',v=>v.trim().length>=10]].forEach(([k,ok])=>{
    const el=form.elements[k],good=ok(data[k]||'');el.setAttribute('aria-invalid',!good);if(!good&&!bad)bad=el});
  if(bad){st.textContent='Please fill in your name, a valid email and a message of at least 10 characters.';st.classList.add('err');bad.focus();return}
  const btn=form.querySelector('.send');btn.disabled=true;btn.textContent='Sending…';
  try{
    const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||'Something went wrong.');
    form.reset();$('#cf-t').value=Date.now();st.textContent='Message sent. I usually reply within a day.';st.classList.add('ok');
  }catch(err){st.textContent=err.message+' You can also email bil332204@gmail.com.';st.classList.add('err')}
  finally{btn.disabled=false;btn.textContent='Send message'}
});

/* magnetic button */
const mag=$('#mag');
mag.addEventListener('pointermove',e=>{if(reduce)return;const r=mag.getBoundingClientRect();mag.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.3}px,${(e.clientY-r.top-r.height/2)*.3}px)`});
mag.addEventListener('pointerleave',()=>mag.style.transform='');
mag.addEventListener('click',e=>{e.preventDefault();form.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});setTimeout(()=>form.elements.name.focus({preventScroll:true}),reduce?0:500)});
})();
