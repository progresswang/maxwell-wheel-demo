import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { idealState } from './motion.js';

const $ = id => document.getElementById(id);
function latex(source,display=false){return window.katex.renderToString(source,{throwOnError:true,displayMode:display,output:'htmlAndMathml',strict:'ignore'})}
function renderFormulas(){document.querySelectorAll('[data-tex]').forEach(el=>{el.innerHTML=latex(el.dataset.tex,el.dataset.display==='true')})}
renderFormulas();
const energyColors={rotation:'#9b173f',translation:'#00826e',potential:'#635c51'};
function plotLabels(kind){
 const specs=kind==='energy'?['能量',String.raw`E\,/\,\mathrm{J}`]:kind==='speed'?['速度',String.raw`v\,/\,(\mathrm{m}\!\cdot\!\mathrm{s}^{-1})`]:['向下位移',String.raw`x\,/\,\mathrm{mm}`];
 const key=kind==='energy'?'energy':kind==='speed'?'speed':'position';
 if($('plot-labels').dataset.kind===key)return;
 $('plot-labels').dataset.kind=key;$('plot-y').innerHTML=specs[0]+' '+latex(specs[1]);$('plot-x').innerHTML='时间 '+latex(String.raw`t\,/\,\mathrm{s}`);
}
const host = $('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e5eae7');
scene.fog = new THREE.Fog('#e5eae7', 19, 39);
const camera = new THREE.PerspectiveCamera(34, 1, .05, 80);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
host.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .085;
controls.minDistance = 2;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI * .49;
controls.target.set(0, 2.25, 0);
camera.position.set(10.8, 4.6, 6.6);
controls.update();
scene.add(new THREE.HemisphereLight(0xf4f7f3, 0xa7afa6, 1.8));
const key = new THREE.DirectionalLight(0xfff7e9, 2.8);
key.position.set(-4, 9, 6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 8, bottom: -5, near: .5, far: 25 });
key.shadow.bias = -.0003;
key.shadow.normalBias = .025;
key.shadow.radius = 4;
scene.add(key);
const fill = new THREE.DirectionalLight(0xc2dcf0, 1.5);
fill.position.set(5, 5, -5);
scene.add(fill);
const front = new THREE.DirectionalLight(0xffffff, .9);
front.position.set(4, 3, 9);
scene.add(front);

// Large studio cards provide real reflections without image textures.
const studio = new THREE.Scene();
studio.background = new THREE.Color('#bcc6c4');
for (const [x, y, z, sx, sy, value] of [[0,7,0,10,10,5],[-6,2,0,7,9,3],[4,2,6,5,8,2]]) {
  const card = new THREE.Mesh(new THREE.PlaneGeometry(sx, sy), new THREE.MeshBasicMaterial({color: new THREE.Color(value,value,value), side:THREE.DoubleSide}));
  card.position.set(x,y,z);card.lookAt(0,1,0);studio.add(card);
}
const pmrem = new THREE.PMREMGenerator(renderer);
const envTarget = pmrem.fromScene(studio, .12);
scene.environment = envTarget.texture;
pmrem.dispose();

const mats = {
  frame: new THREE.MeshStandardMaterial({ color: 0x394946, metalness: .7, roughness: .32 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xc2c9c8, metalness: .85, roughness: .3 }),
  face: new THREE.MeshStandardMaterial({ color: 0x82999d, metalness: .8, roughness: .29 }),
  sleeve: new THREE.MeshStandardMaterial({ color: 0xb67536, metalness: .8, roughness: .27 }),
  orange: new THREE.MeshStandardMaterial({ color: 0xe06e2d, metalness: .35, roughness: .35 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x27332f, metalness: .15, roughness: .72 }),
  rope: new THREE.MeshStandardMaterial({ color: 0x837554, roughness: .94 }),
  base: new THREE.MeshStandardMaterial({ color: 0x899a91, metalness: .65, roughness: .39 }),
};
function box(w,h,d,mat,x=0,y=0,z=0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function cylinder(radius,depth,mat,x=0,y=0,z=0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,depth,64),mat);
  mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function annulus(outer,inner,depth,mat) {
  const shape = new THREE.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);
  const hole = new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.002,bevelThickness:.002,curveSegments:64});
  geo.translate(0,0,-depth/2);
  const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:0xd4dbd5,roughness:.92}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.13;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(60,120,0x8b9a8f,0xb2bdb2);grid.position.y=-.125;grid.material.transparent=true;grid.material.opacity=.14;scene.add(grid);
const apparatus=new THREE.Group();scene.add(apparatus);
apparatus.add(box(2.25,.17,3.65,mats.base,0,.03,0));
apparatus.add(box(2.19,.025,3.59,mats.metal,0,.128,0));
for (const x of [-.8,.8]) for (const z of [-1.54,1.54]) {
  const foot=cylinder(.13,.12,mats.rubber,x,-.075,z);foot.rotation.x=0;apparatus.add(foot);
  const screw=cylinder(.045,.015,mats.frame,x,.151,z);screw.rotation.x=0;apparatus.add(screw);
}
for (const z of [-1.48,1.48]) {
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.046,.046,4.45,32),mats.metal);
  post.position.set(0,2.36,z);post.castShadow=true;apparatus.add(post);
  apparatus.add(box(.22,.17,.22,mats.frame,0,.22,z));
}
apparatus.add(box(.13,.17,3.18,mats.metal,0,4.63,0));
for (const z of [-.46,.46]) {
  const hook=new THREE.Mesh(new THREE.TorusGeometry(.038,.008,8,24),mats.frame);
  hook.position.set(0,4.49,z);hook.rotation.y=Math.PI/2;apparatus.add(hook);
}

const ruler=new THREE.Group();ruler.position.set(.1,.35,1.12);ruler.rotation.y=Math.PI/2;apparatus.add(ruler);
ruler.add(box(.12,3.55,.018,mats.metal,0,1.78,0));
for(let i=0;i<=35;i++) ruler.add(box(i%5===0?.09:.047,.008,.006,mats.frame,-.015,i*.1,.014));
const eventLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.1,1.87,-1),new THREE.Vector3(.1,1.87,1.14)]),new THREE.LineDashedMaterial({color:0xd36432,dashSize:.08,gapSize:.05,transparent:true,opacity:.7}));
eventLine.computeLineDistances();apparatus.add(eventLine);eventLine.visible=false;ruler.visible=false;

const releaseY=3.15;
const rotor=new THREE.Group();rotor.position.y=releaseY;apparatus.add(rotor);
const shaft=new THREE.Group();rotor.add(shaft);
shaft.add(cylinder(.018,1.46,mats.metal));
shaft.add(cylinder(.078,.19,mats.metal));
const centerCap=cylinder(.049,.027,mats.orange,0,0,.76);shaft.add(centerCap);
function wheelFactory(kind) {
  const group=new THREE.Group();
  const thick=kind==='ring'?.093506:Number(kind)/500*.047653;
  if(kind==='ring') {
    group.add(annulus(.8,.65,thick,mats.face));
    group.add(annulus(.153,.0816,thick,mats.metal));
    for(let i=0;i<3;i++) {
      const theta=i*Math.PI*2/3+Math.PI/2;
      const spoke=box(.55,.085,thick,mats.face,Math.cos(theta)*.4,Math.sin(theta)*.4,0);
      spoke.rotation.z=theta;group.add(spoke);
    }
  } else group.add(annulus(.8,.0816,thick,mats.face));
  const groove=new THREE.Mesh(new THREE.TorusGeometry(.753,.0025,6,100),mats.metal);
  groove.position.z=thick/2+.003;group.add(groove);
  const stripe=box(.055,kind==='ring'?.133:.58,.002,mats.orange,0,kind==='ring'?.715:.45,thick/2+.004);group.add(stripe);
  for(let i=0;i<3;i++) {
    const a=i*2*Math.PI/3;
    group.add(cylinder(.016,.011,mats.frame,Math.cos(a)*.12,Math.sin(a)*.12,thick/2+.008));
  }
  group.userData.part='wheel';group.traverse(o=>{if(o.isMesh)o.userData.part='wheel'});
  return group;
}
function sleeveFactory(d) {
  const group=new THREE.Group(),radius=Number(d)/1000*4;
  group.add(annulus(radius,.019,.21,mats.sleeve));
  for(const z of [-.114,.114]) {
    const lip=annulus(radius+.014,.019,.014,mats.sleeve);lip.position.z=z;group.add(lip);
  }
  // A visible schematic of single-layer winding, not a contact solver.
  const pts=[];
  for(let i=0;i<=280;i++) {
    const a=i/280*Math.PI*2*6;
    pts.push(new THREE.Vector3(Math.cos(a)*(radius+.004),Math.sin(a)*(radius+.004),-.075+i/280*.15));
  }
  const wound=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),280,.0035,5,false),mats.rope);
  group.add(wound);group.userData.part='sleeve';group.traverse(o=>{if(o.isMesh)o.userData.part='sleeve'});return group;
}
let wheel=wheelFactory('500');rotor.add(wheel);
let sleeves=[sleeveFactory(12),sleeveFactory(12)];sleeves.forEach((s,i)=>{s.position.z=i===0?-.46:.46;rotor.add(s)});
const collars=[-1,1].map(sign=>{
  const g=new THREE.Group();g.position.z=sign*.64;
  g.add(annulus(.054,.019,.056,mats.frame));
  const screw=box(.026,.023,.03,mats.metal,0,.061,0);g.add(screw);rotor.add(g);return g;
});
const ropeGeo=new THREE.CylinderGeometry(.004,.004,1,7);
const ropes=[-.46,.46].map(z=>{const m=new THREE.Mesh(ropeGeo,mats.rope);m.position.z=z;m.castShadow=true;apparatus.add(m);return m});
const forceGroup=new THREE.Group();apparatus.add(forceGroup);forceGroup.visible=false;
const gravity=new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(),.65,0xc8602d,.14,.07);forceGroup.add(gravity);

const state={mode:'ordinary',wheel:'500',diameter:12,playing:false,measurement:false,time:0,phase:0,busy:false,speed:1,turn:0};
const experiments={
 mass:{title:'圆盘质量对照',conditions:'改变圆盘厚度与质量；固定外径、轴与附件、12 mm绕线筒、160 mm下降距离。',choices:[['250',12],['500',12],['750',12]]},
 distribution:{title:'质量分布对照',conditions:'轮体均为500 g；固定12 mm裸鼓、160 mm下降距离。',choices:[['500',12],['ring',12]]},
 radius:{title:'绕线半径对照',conditions:'固定500 g圆盘、参考总质量和参考转动惯量；仅改变有效绕绳半径。',choices:[['500',8],['500',12],['500',16]]}
};
const colors=['#cb541c','#146cc2','#9137b5'];
const linePatterns=[[],[10,5],[3,5]];
let experiment='mass',runRecorded=false;
let records={mass:[],distribution:[],radius:[]};
try{const saved=JSON.parse(localStorage.getItem('maxwell-experiments-v1'));if(saved&&Object.keys(records).every(k=>Array.isArray(saved[k])))records=saved}catch{}
function choiceKey(c){return c.wheel+'-'+c.diameter}
function configLabel(c){return experiment==='radius'?'直径 '+c.diameter+' mm':c.wheel==='ring'?'三辐轮500 g':'圆盘'+c.wheel+' g'}
function updateGuidance(){
 const hint=$('action-hint');
 if(state.mode==='ordinary'){
  hint.textContent=state.time===0?'点击“释放轮摆”观察升降；右侧“曲线与能量”可查看实时变化。':'左侧高亮对应运动阶段；切换顶部“模块化装置”可改变部件并比较。';return;
 }
 const done=records[experiment],spec=experiments[experiment],hasCurrent=done.some(r=>choiceKey(r)===choiceKey(state));
 const next=spec.choices.find(([wheel,diameter])=>!done.some(r=>r.wheel===wheel&&r.diameter===diameter));
 hint.textContent=state.busy?'换装完成后，点击“释放轮摆”运行这一配置。':!hasCurrent?`已安装${configLabel(state)}；点击“释放轮摆”，完成首次下降后自动填入表格。`:next?`已记录${done.length}/${spec.choices.length}项；在底部换装${configLabel({wheel:next[0],diameter:next[1]})}，再释放一次。`:'本组已完成；比较右侧表格与曲线，可切换实验或清除本组后重做。';
}
function updateResults(){
 document.querySelector('.experiment-results').hidden=state.mode!=='modular';
 const spec=experiments[experiment];
 $('experiment-title').textContent=spec.title;$('experiment-conditions').textContent=spec.conditions;
 document.querySelectorAll('[data-experiment]').forEach(b=>b.classList.toggle('active',b.dataset.experiment===experiment));
 $('experiment-rows').innerHTML=spec.choices.map(([wheel,diameter],i)=>{
  const c={wheel,diameter},row=records[experiment].find(r=>choiceKey(r)===choiceKey(c));
  return `<tr><td><i style="background:${colors[i]}"></i>${configLabel(c)}</td><td>${row?row.end.toFixed(3):'未运行'}</td><td>${row?(row.a*row.end).toFixed(3):'—'}</td></tr>`;
 }).join('');
 $('series-legend').innerHTML=spec.choices.map(([wheel,diameter],i)=>{const c={wheel,diameter};return records[experiment].some(r=>choiceKey(r)===choiceKey(c))?`<span><i style="background:${colors[i]}"></i>${configLabel(c)}</span>`:''}).join('');
 const rows=records[experiment];
 $('experiment-conclusion').hidden=rows.length<2;
 if(rows.length>=2){
  const ordered=[...rows].sort((a,b)=>a.end-b.end),fast=ordered[0],slow=ordered.at(-1);
  const diff=(slow.end/fast.end-1)*100;
  $('experiment-conclusion').textContent=`已记录结果：${configLabel(fast)}下降用时较短；${configLabel(slow)}用时增加${diff.toFixed(1)}%。`+(experiment==='radius'?'在总质量与转动惯量固定时，较粗的绕线筒提供更大的张力力臂，使下降加速度更大。':experiment==='distribution'?'相同质量下，三辐轮的质量更靠外，转动惯量更大，因此下降较慢。':'本组越重的盘略慢：轮体增厚时惯量也增大，且固定附件不变，使总惯量与总质量的比值增大；不能推广为所有重物都下落更慢。');
 }
 document.querySelectorAll('[data-wheel]').forEach(b=>{b.hidden=experiment==='radius'?b.dataset.wheel!=='500':experiment==='distribution'?!['500','ring'].includes(b.dataset.wheel):b.dataset.wheel==='ring'});
 document.querySelectorAll('[data-sleeve]').forEach(b=>{b.hidden=experiment!=='radius'&&b.dataset.sleeve!=='12'});
 updateGuidance();
}
function recordDescent(){
 if(runRecorded)return;runRecorded=true;
 if(state.mode!=='modular')return;
 const valid=experiments[experiment].choices.some(([wheel,diameter])=>wheel===state.wheel&&diameter===state.diameter);if(!valid)return;
 const row={wheel:state.wheel,diameter:state.diameter,...prediction()},items=records[experiment],index=items.findIndex(r=>choiceKey(r)===choiceKey(row));
 if(index<0)items.push(row);else items[index]=row;
 try{localStorage.setItem('maxwell-experiments-v1',JSON.stringify(records))}catch{}
 updateResults();drawChart();
}
function selectExperiment(kind){
 if(state.busy)return;resetMotion();experiment=kind;
 const target=experiments[kind].choices[0];
 if(state.wheel!==target[0]){rotor.remove(wheel);disposeGeometry(wheel);wheel=wheelFactory(target[0]);rotor.add(wheel);state.wheel=target[0]}
 if(state.diameter!==target[1]){sleeves.forEach(s=>{rotor.remove(s);disposeGeometry(s)});sleeves=[sleeveFactory(target[1]),sleeveFactory(target[1])];sleeves.forEach((s,i)=>{s.position.z=i===0?-.46:.46;rotor.add(s)});state.diameter=target[1]}
 updateCards();updateResults();showPanel('chart');home();
}
let swap=null,highlightUntil=0,highlightPart=null;
const modeNames={wheel:'轮体、轴及附件共同构成运动总质量。',sleeve:'有效绕绳半径是绳中心线至转轴的距离，由轴筒直径与绳径共同确定。',distribution:'质量相对转轴的分布决定转动惯量。'};
function highlight(part) {
  highlightPart=part;highlightUntil=performance.now()+2600;
  $('part-note').textContent=modeNames[part]||'主轴与轮体连接，双绳提供悬挂与转动约束。';
  document.querySelectorAll('[data-part]').forEach(b=>b.classList.toggle('selected',b.dataset.part===part));
  if(part==='sleeve') focusSleeve();
}
function setMode(mode) {
  if(state.busy)return;
  setMeasurement(false);state.mode=mode;document.body.classList.toggle('modular',mode==='modular');
  $('rack').hidden=mode!=='modular';$('ordinary').classList.toggle('active',mode==='ordinary');$('modular').classList.toggle('active',mode==='modular');
  $('title').textContent=mode==='ordinary'?'普通麦克斯韦轮摆':'模块化麦克斯韦轮摆';
  ruler.visible=mode==='modular';configureChartOptions();
  if(mode==='ordinary') {
    rotor.remove(wheel);wheel=wheelFactory('500');rotor.add(wheel);state.wheel='500';state.diameter=12;
    sleeves.forEach(s=>rotor.remove(s));sleeves=[sleeveFactory(12),sleeveFactory(12)];sleeves.forEach((s,i)=>{s.position.z=i===0?-.46:.46;rotor.add(s)});
    updateCards();updateResults();
  }
  if(mode==='modular')selectExperiment(experiment);
  updateResults();showPanel(mode==='ordinary'?'formula':'chart');
  home();requestAnimationFrame(resize);
}
function home(){focusTransition=null;camera.position.set(10.8,4.6,6.6);controls.target.set(0,2.25,0);controls.update()}
let focusTransition=null;
function focusSleeve(){focusTransition={start:performance.now(),from:camera.position.clone(),targetFrom:controls.target.clone()}}
function updateCards(){
  document.querySelectorAll('[data-wheel]').forEach(b=>b.classList.toggle('selected',b.dataset.wheel===state.wheel));
  document.querySelectorAll('[data-sleeve]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.sleeve)===state.diameter));
}
function resetMotion(){state.playing=false;state.time=0;state.phase=0;state.turn=0;rotor.position.y=releaseY;rotor.rotation.z=0;runRecorded=false;updatePlay();$('status').textContent='装置就绪';$('time').textContent='0.000';$('distance').textContent='0.0';updateCaption();drawChart()}
function updatePlay(){$('play').innerHTML=state.playing?'Ⅱ <span>暂停运动</span>':'▶ <span>释放轮摆</span>'}
function setMeasurement(on){
  if(state.busy)return;resetMotion();state.measurement=on;eventLine.visible=on;ruler.visible=on||state.mode==='modular';
  $('measure').textContent=on?'连续往复':'单次下降';
  configureChartOptions();


  if(on)showPanel('chart');drawChart();
}
function showPanel(kind){$('formula-panel').hidden=kind!=='formula';$('chart-panel').hidden=kind!=='chart';$('formula-tab').classList.toggle('active',kind==='formula');$('chart-tab').classList.toggle('active',kind==='chart');drawChart()}
// Existing reference assembly. Radius changes are an ideal fixed-m/J isolation,
// not an assertion that the new physical sleeves preserve component inertia.
function prediction(config=state){
  const M=config.wheel==='ring'?.5:Number(config.wheel)/1000;
  const m=M+.0965519154237808;
  const J=config.wheel==='ring'?.0035253303698756006:M/.5*.00252601+.0000086903698756006;
  const r=(config.diameter+1)/2000,a=9.80665/(1+J/(m*r*r)),end=Math.sqrt(.32/a);
  return {m,J,r,a,end};
}
function beginSwap(kind,value){
  if(state.busy)return;if(kind==='wheel'&&state.wheel===value||kind==='sleeve'&&state.diameter===Number(value))return;

  resetMotion();state.busy=true;document.querySelectorAll('.module-card,[data-experiment],#play,#measure,nav button,#reset').forEach(b=>b.disabled=true);
  let oldParts,newParts;
  if(kind==='wheel') {
    oldParts=[wheel];newParts=[wheelFactory(value)];newParts[0].position.set(-2.3,-2.5,1.55);rotor.add(newParts[0]);
  } else {
    oldParts=sleeves;newParts=[sleeveFactory(value),sleeveFactory(value)];newParts.forEach((p,i)=>{p.position.set(-2.3,-2.5,i===0?-1.3:1.3);rotor.add(p)});
  }
  swap={kind,value,oldParts,newParts,start:performance.now()};
  updateGuidance();
  $('status').textContent='正在退出原模块';$('part-note').textContent=kind==='wheel'?'轮体沿主轴退出，再对准定位段装入。':'左右套筒沿主轴两端退出，主轴保持原位。';
  if(kind==='sleeve')focusSleeve();
}
const ease=t=>t*t*(3-2*t),clamp=t=>Math.max(0,Math.min(1,t));
function swapFrame(now){
  if(!swap)return;const p=(now-swap.start)/3200,{kind,oldParts,newParts}=swap;
  if(p<.2)$('status').textContent='松开锁紧件 · 原件退出';else if(p<.55)$('status').textContent='原件归位 · 新件对准轴线';else $('status').textContent='沿轴线装入 · 锁紧复位';
  const out=ease(clamp(p/.35)),away=ease(clamp((p-.25)/.25)),approach=ease(clamp((p-.35)/.3)),insert=ease(clamp((p-.7)/.25));
  // Remove collars and end cap radially before modules slide on the shaft.
  const clear=ease(clamp(p/.12))*(1-ease(clamp((p-.92)/.08)));
  collars.forEach((c,i)=>{c.position.z=i===0?-.64:.64;c.position.x=.3*clear});
  centerCap.position.x=.3*clear;
  oldParts.forEach((part,i)=>{
    const sign=kind==='wheel'?1:i===0?-1:1;
    const safeOut=ease(clamp((p-.14)/.21));
    part.position.z=sign*((kind==='wheel'?0:.46)+safeOut*.95);part.position.x=-2.3*away;part.position.y=-2.5*away;
  });
  newParts.forEach((part,i)=>{
    const sign=kind==='wheel'?1:i===0?-1:1;
    part.position.x=-2.3*(1-approach);part.position.y=-2.5*(1-approach);
    part.position.z=sign*(kind==='wheel'?1.55*(1-insert):1.3-(1.3-.46)*insert);
  });
  if(p>=1){
    oldParts.forEach(part=>{rotor.remove(part);disposeGeometry(part)});
    if(kind==='wheel'){wheel=newParts[0];state.wheel=swap.value}else{ sleeves=newParts;state.diameter=Number(swap.value)}
    swap=null;state.busy=false;collars.forEach((c,i)=>{c.position.z=i===0?-.64:.64;c.position.x=0});centerCap.position.x=0;updateCards();
    document.querySelectorAll('.module-card,[data-experiment],#play,#measure,nav button,#reset').forEach(b=>b.disabled=false);
    $('status').textContent='换装完成';$('part-note').textContent='';updateResults();drawChart();
  }
}
function disposeGeometry(group){group.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
function configureChartOptions(){
 const ordinary=state.mode==='ordinary';
 for(const option of $('chart-kind').options){
  option.hidden=option.value==='xt'&&!ordinary;
  if(option.value==='displacement')option.textContent=ordinary?'首次下降位移':'各模块下降位移';
  if(option.value==='speed')option.textContent=ordinary?'首次下降速度':'各模块下降速度';
  if(option.value==='energy')option.textContent=ordinary?'能量分配':'当前配置能量';
 }
 $('chart-kind').value=ordinary?'xt':'displacement';
 $('chart-kind').options[0].textContent=state.measurement?'位移 x–t（实时）':'往复位移 x–t（实时）';
}
function updateCaption(){
 const caption=$('motion-caption');
 caption.hidden=state.mode!=='ordinary';
 if(caption.hidden)return;
 const p=prediction(),s=idealState(state.time,p,!state.measurement),nearTop=s.local<.13||s.local>2*p.end-.13,nearBottom=Math.abs(s.local-p.end)<.14;
 const phase=nearTop?'top':nearBottom?'bottom':s.up?'up':'down';
 if(caption.dataset.phase===phase)return;
 caption.dataset.phase=phase;
 caption.querySelectorAll('[data-phase]').forEach(row=>{const active=row.dataset.phase===phase;row.classList.toggle('active',active);if(active)row.setAttribute('aria-current','step');else row.removeAttribute('aria-current')});
}
function drawLiveXT(ctx,canvas,p){
 const w=canvas.width,h=canvas.height,left=66,right=w-20,top=40,bottom=275;
 const duration=state.measurement?p.end:Math.max(2*p.end,Math.ceil(state.time/(2*p.end))*2*p.end);
 // Extend as time advances; long sessions retain the most recent four returns.
 const span=Math.min(duration,8*p.end),start=Math.max(0,duration-span),stop=Math.min(state.time,duration);
 ctx.clearRect(0,0,w,h);ctx.font='18px Segoe UI';ctx.fillStyle='#657360';ctx.lineWidth=1;ctx.strokeStyle='#d6ded2';plotLabels('xt');
 for(let i=0;i<=4;i++){const y=bottom-i/4*(bottom-top);ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.fillText(String(i*40),7,y+6)}
 for(let i=0;i<=4;i++){ctx.textAlign=i===4?'right':i===0?'left':'center';ctx.fillText((start+span*i/4).toFixed(1),left+i/4*(right-left),306)}ctx.textAlign='left';
 ctx.strokeStyle=colors[0];ctx.lineWidth=3;ctx.beginPath();
 const count=Math.max(1,Math.ceil((stop-start)*110));
 for(let i=0;i<=count&&stop>=start;i++){const t=start+(stop-start)*i/count,s=idealState(t,p,!state.measurement),x=left+(t-start)/span*(right-left),y=bottom-s.y/.16*(bottom-top);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();
 if(stop>=start){const s=idealState(stop,p,!state.measurement);ctx.beginPath();ctx.arc(left+(stop-start)/span*(right-left),bottom-s.y/.16*(bottom-top),4,0,Math.PI*2);ctx.fillStyle=colors[0];ctx.fill()}
 canvas.dataset.elapsed=String(state.time);canvas.dataset.start=String(start);canvas.dataset.end=String(duration);
}
function drawChart(){
 if($('chart-panel').hidden)return;
 const canvas=$('chart'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,kind=$('chart-kind').value,p=prediction(),items=state.mode==='ordinary'?[{wheel:state.wheel,diameter:state.diameter,...prediction()}]:records[experiment];
 const energy=kind==='energy',speed=kind==='speed',spec=experiments[experiment];
 plotLabels(kind);
 if(kind==='xt'&&state.mode==='ordinary'){
  $('energy-legend').hidden=true;$('series-legend').hidden=true;
  if($('chart-title').dataset.kind!=='xt'){$('chart-title').innerHTML='实时位移 '+latex('x(t)');$('chart-title').dataset.kind='xt'}
  if($('chart-description').dataset.kind!=='xt'){$('chart-description').innerHTML=latex('x')+' 为从释放点向下的轴心位移；曲线随运动延伸，160 mm 为下端，0 mm 为上端。';$('chart-description').dataset.kind='xt'}
  document.querySelector('.chart-foot').textContent='理想无损往复模型；下端采用瞬时换向，回升高度保持不变。';
  document.querySelector('.chart-foot').dataset.kind='xt';
  drawLiveXT(ctx,canvas,p);return;
 }
 $('energy-legend').hidden=!energy;$('series-legend').hidden=energy;
 $('series-legend').hidden=energy||state.mode==='ordinary';
 $('chart-title').textContent=energy?'能量分配':speed?'下降速度—时间':'下降位移—时间';
 $('chart-title').dataset.kind=kind;$('chart-description').dataset.kind=kind;
 $('chart-description').textContent=energy?'势能随高度降低而减小，平动与转动动能随速度增加而增大；三者总和保持不变。':state.mode==='ordinary'?'横轴为释放后的时间；曲线表示首次下降。':speed?'同一时刻，曲线越高表示下降速度越大；每条线对应表格中的一种模块。':'各条曲线均在下降160 mm处结束；终点越靠左，用时越短。颜色与表格对应。';
 if(document.querySelector('.chart-foot').dataset.kind!=='descent'){document.querySelector('.chart-foot').innerHTML='下降距离 '+latex(String.raw`h=160\,\mathrm{mm}`)+'；理想模型结果，尚未经过实物验证。';document.querySelector('.chart-foot').dataset.kind='descent'}
 const xmax=energy?p.end*2:Math.max(p.end,...items.map(r=>r.end))*1.08;
 const ymax=energy?p.m*9.80665*.16:speed?Math.max(p.a*p.end,...items.map(r=>r.a*r.end))*1.1:160;
 const left=66,right=w-20,top=40,bottom=275;
 ctx.clearRect(0,0,w,h);ctx.font='18px Segoe UI';ctx.fillStyle='#657360';
 ctx.lineWidth=1;ctx.strokeStyle='#d6ded2';
 for(let i=0;i<=4;i++){const y=bottom-i/4*(bottom-top);ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.fillText((ymax*i/4).toFixed(energy||speed?2:0),5,y+6)}
 for(let i=0;i<=4;i++)ctx.fillText((xmax*i/4).toFixed(1),left+i/4*(right-left)-10,306);
 if(!energy&&!items.length){ctx.fillStyle='#819077';ctx.textAlign='center';ctx.fillText('完成一次下降后显示该模块曲线',w/2,155);ctx.textAlign='left';return}
 const series=energy?[
  {color:energyColors.rotation,end:xmax,f:t=>.5*p.J*idealState(t,p,true).omega**2},
  {color:energyColors.translation,dash:[10,5],end:xmax,f:t=>.5*p.m*idealState(t,p,true).v**2},
  {color:energyColors.potential,dash:[3,5],end:xmax,f:t=>p.m*9.80665*(.16-idealState(t,p,true).y)}
 ]:items.map(r=>{const index=state.mode==='ordinary'?0:spec.choices.findIndex(([wheel,diameter])=>wheel===r.wheel&&diameter===r.diameter);return {color:colors[index],dash:linePatterns[index],end:r.end,f:t=>speed?r.a*t:.5*r.a*t*t*1000}});
 for(const line of series){ctx.strokeStyle=line.color;ctx.lineWidth=3;ctx.setLineDash(line.dash||[]);ctx.beginPath();for(let i=0;i<=150;i++){const t=i/150*line.end,x=left+t/xmax*(right-left),y=bottom-line.f(t)/ymax*(bottom-top);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()}ctx.setLineDash([]);
}

$('ordinary').onclick=()=>setMode('ordinary');$('modular').onclick=()=>setMode('modular');
$('home').onclick=home;$('focus').onclick=focusSleeve;
$('play').onclick=()=>{if(state.busy)return;if(state.measurement&&state.time>=prediction().end)resetMotion();state.playing=!state.playing;updatePlay();drawChart();updateCaption();updateGuidance()};
$('reset').onclick=()=>{if(!state.busy){resetMotion();drawChart()}};
$('speed').onchange=e=>state.speed=Number(e.target.value);
$('measure').onclick=()=>setMeasurement(!state.measurement);
document.querySelectorAll('[data-experiment]').forEach(b=>b.onclick=()=>{if(state.mode!=='modular')setMode('modular');selectExperiment(b.dataset.experiment)});
$('chart-kind').onchange=drawChart;
$('clear-experiment').onclick=()=>{
 if(state.busy)return;resetMotion();records[experiment]=[];
 try{localStorage.setItem('maxwell-experiments-v1',JSON.stringify(records))}catch{}
 updateResults();drawChart();
};
$('formula-tab').onclick=()=>showPanel('formula');$('chart-tab').onclick=()=>showPanel('chart');
document.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>highlight(b.dataset.part));
document.querySelectorAll('[data-wheel]').forEach(b=>b.onclick=()=>beginSwap('wheel',b.dataset.wheel));
document.querySelectorAll('[data-sleeve]').forEach(b=>b.onclick=()=>beginSwap('sleeve',b.dataset.sleeve));
const raycaster=new THREE.Raycaster();let pointerStart;
renderer.domElement.addEventListener('pointerdown',e=>pointerStart={x:e.clientX,y:e.clientY});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6||state.busy)return;
  const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
  const hit=raycaster.intersectObjects([wheel,...sleeves],true)[0];if(hit){highlight(hit.object.userData.part);showPanel('formula')}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){state.playing=false;updatePlay()}});
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(host);

function thumbnails(){
  const tr=new THREE.WebGLRenderer({antialias:true,alpha:true});tr.setSize(220,120);tr.setPixelRatio(1);tr.toneMapping=THREE.ACESFilmicToneMapping;tr.toneMappingExposure=1.35;
  const ts=new THREE.Scene();ts.environment=scene.environment;ts.add(new THREE.HemisphereLight(0xffffff,0x839681,3));const tl=new THREE.DirectionalLight(0xffffff,4);tl.position.set(-3,5,7);ts.add(tl);
  const tc=new THREE.PerspectiveCamera(34,220/120,.01,30);tc.position.set(1.8,.75,3.2);tc.lookAt(0,0,0);
  for(const b of document.querySelectorAll('.module-card')){
    const obj=b.dataset.wheel?wheelFactory(b.dataset.wheel):sleeveFactory(b.dataset.sleeve);
    if(b.dataset.sleeve){obj.scale.setScalar(5);obj.rotation.y=-.6}
    ts.add(obj);tr.render(ts,tc);b.querySelector('img').src=tr.domElement.toDataURL();ts.remove(obj);disposeGeometry(obj);
  }
  tr.dispose();tr.forceContextLoss();
}
thumbnails();updateResults();configureChartOptions();
let last=performance.now(),chartTick=0,readoutTick=0;
function frame(now){
  requestAnimationFrame(frame);const dt=Math.max(0,(now-last)/1000);last=now;
  if(state.playing&&!state.busy){
    const p=prediction();state.time+=dt*state.speed;
    if(state.measurement)state.time=Math.min(state.time,p.end);
    const current=idealState(state.time,p,!state.measurement);
    let visualY=current.y;
    if(!state.measurement){
      // Blend only the small visual neighbourhood of the ideal bottom impulse.
      // Exact readings and saved first-descent results retain idealState values.
      const z=Math.abs(current.local-p.end),epsilon=Math.min(.18,p.end*.1);
      if(z<epsilon){const q=2*z*z/epsilon-z*z*z/(epsilon*epsilon);visualY=.16-p.a*p.end*q+.5*p.a*z*z}
    }
    rotor.position.y=releaseY-visualY*8;rotor.rotation.z=-current.theta;
    if(state.time>=p.end)recordDescent();
    if(now-readoutTick>80){$('time').textContent=state.time.toFixed(3);$('distance').textContent=(current.y*1000).toFixed(1);$('status').textContent=state.measurement?'单次下降':`第 ${current.cycle+1} 次往复 · ${current.up?'回升':'下降'}`;readoutTick=now}
    if(state.measurement&&state.time>=p.end){state.playing=false;updatePlay();$('status').textContent='下降完成';$('time').textContent=p.end.toFixed(3);$('distance').textContent='160.0'}
  }
  swapFrame(now);
  // Stable world-space suspension: no lateral sweep at top/bottom boundaries.
  // Local string rewrapping is schematic; do not move the hanging free spans.
  const rr=state.diameter/1000*4+.004;
  ropes.forEach(m=>{const start=new THREE.Vector3(rr,4.47,m.position.z),end=new THREE.Vector3(rr,rotor.position.y,m.position.z),dir=start.clone().sub(end);m.scale.y=dir.length();m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize())});
  forceGroup.position.copy(rotor.position);
  for(const [k,mat] of Object.entries(mats)){
    if(!mat.emissive)continue;
    const lit=now<highlightUntil&&((highlightPart==='sleeve'&&k==='sleeve')||((highlightPart==='wheel'||highlightPart==='distribution')&&k==='face'));
    mat.emissive.setHex(lit?0x6b2b08:0x000000);mat.emissiveIntensity=lit?.33:0;
  }
  if(focusTransition){const p=ease(clamp((now-focusTransition.start)/850));camera.position.lerpVectors(focusTransition.from,new THREE.Vector3(2.45,3.65,3.6),p);controls.target.lerpVectors(focusTransition.targetFrom,new THREE.Vector3(0,releaseY,.18),p);if(p>=1)focusTransition=null}
  controls.update();
  if(now-chartTick>100){drawChart();updateCaption();chartTick=now}
  renderer.render(scene,camera);
}
resize();renderer.render(scene,camera);$('loading').remove();requestAnimationFrame(frame);
window.prototypeLab={state,snapshot:()=>({...state}),setMode,home,focusSleeve,prediction,idealState,selectExperiment,records:()=>structuredClone(records),experiment:()=>experiment};
