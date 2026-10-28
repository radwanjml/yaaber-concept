// p1 step 2: primitive blockout layer over the rendered still.
// Camera = Blender Hero_Cam from yaaber_hero_data.json (Z-up, world units), so objects use Blender coordinates.
// Occlusion: every material discards fragments behind the baked depth map. Shadows: ShadowMaterial catcher.
import * as THREE from 'three';

const DATA = {
  M: [[1, 0, 0, 0], [0, 0.69174027, -0.72214639, -5.0], [0, 0.72214639, 0.69174027, 4.4], [0, 0, 0, 1]],
  lens: 50, sensor: 36, shiftX: -0.07, dNear: 5.4102085, dFar: 8.3384686,
  foot: [-0.02, -0.45], junction: [-0.02, 0.04], left: [-0.4, 0.31], right: [0.5, 0.28],
  doors: { reel: [-0.39, -0.62], song: [0.30, -0.65], news: [0.03, -0.98] },
  pins: { reel: [-0.59, -0.6, 0.44], song: [0.50, -0.62, 0.44], news: [0.03, -1.07, 0.34] },
};
const STREET_Z = 0.027;
const hero = document.querySelector('.hero-still');
const frame = hero.querySelector('.frame');
let calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- renderer + camera ----------
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.className = 'hero3d';
frame.querySelector('picture').after(renderer.domElement);

const camera = new THREE.PerspectiveCamera(2 * Math.atan((DATA.sensor / 2 / DATA.lens) * 9 / 16) * 180 / Math.PI, 16 / 9, 0.5, 20);
camera.matrix.set(...DATA.M.flat());
camera.matrixAutoUpdate = false;
camera.updateMatrixWorld(true);
camera.projectionMatrix.elements[8] = 2 * DATA.shiftX; // Blender lens shift
camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb8ad, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-1.4, 1.6, 3.0); // tuned by eye to match the baked tree shadows (fall down-right)
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 0.5, far: 8 });
scene.add(sun);

// ---------- depth occlusion ----------
let depthReady = false;
const depthTex = new THREE.TextureLoader().load('img/hero/yaaber-depth-rg-1920.png?v=2', () => { depthReady = true; });
depthTex.magFilter = depthTex.minFilter = THREE.NearestFilter;
depthTex.generateMipmaps = false;
const uRes = { value: new THREE.Vector2(1, 1) }, uOcc = { value: 1 };
function occlude(mat) {
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uDepth: { value: depthTex }, uRes, uOcc, uDN: { value: DATA.dNear }, uDF: { value: DATA.dFar }, uCN: { value: camera.near }, uCF: { value: camera.far } });
    sh.fragmentShader = 'uniform sampler2D uDepth; uniform vec2 uRes; uniform float uOcc, uDN, uDF, uCN, uCF;\n' + sh.fragmentShader.replace('void main() {', `void main() {
      vec3 dd = texture2D(uDepth, gl_FragCoord.xy / uRes).rgb;
      float dz = (dd.r * 65280.0 + dd.g * 255.0) / 65535.0;
      float fz = (uCN * uCF) / (uCF - gl_FragCoord.z * (uCF - uCN));
      if (uOcc > 0.5 && dz > 0.0001 && dz < 0.999 && fz > uDN + dz * (uDF - uDN) + 0.012) discard;`);
  };
  return mat;
}

// ---------- materials ----------
const ramp = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 180, 180, 180, 255, 255, 255, 255, 255]), 3, 1);
ramp.magFilter = ramp.minFilter = THREE.NearestFilter; ramp.needsUpdate = true;
const toon = c => occlude(new THREE.MeshToonMaterial({ color: c, gradientMap: ramp }));
const inkMat = occlude(new THREE.MeshBasicMaterial({ color: 0x0b1f19, side: THREE.BackSide }));
function inked(geo, mat, s = 1.07) {
  const g = new THREE.Group(), m = new THREE.Mesh(geo, mat), o = new THREE.Mesh(geo, inkMat);
  m.castShadow = true; o.scale.setScalar(s); g.add(m, o); return g;
}

// shadow catcher: invisible ground that only shows the characters' shadows
const catcher = new THREE.Mesh(new THREE.CircleGeometry(1.42, 64), occlude(new THREE.ShadowMaterial({ color: 0x0f3d2e, opacity: 0.32 })));
catcher.position.z = STREET_Z; catcher.receiveShadow = true; scene.add(catcher);

// ---------- characters (primitive blockout) ----------
function person(color) {
  const g = new THREE.Group(), body = new THREE.Group();
  const torso = inked(new THREE.CapsuleGeometry(0.03, 0.045, 4, 12), toon(color));
  torso.rotation.x = Math.PI / 2; torso.position.z = 0.055;
  const head = inked(new THREE.SphereGeometry(0.03, 16, 12), toon(0xf6f3ea));
  head.position.z = 0.128;
  body.add(torso, head); g.add(body); g.userData.body = body;
  scene.add(g); return g;
}
const you = person(0x16533f), f1 = person(0xa9c9b8), f2 = person(0xf6f3ea); // site palette: forest-2, sage, cream (inked like the shops)
const place = (p, xy) => p.position.set(xy[0], xy[1], STREET_Z);
place(you, DATA.foot); place(f1, DATA.left); place(f2, DATA.right);

// ---------- props ----------
function prop(kind) {
  const g = new THREE.Group();
  if (kind === 'reel') { const b = inked(new THREE.BoxGeometry(0.05, 0.012, 0.075), toon(0x22302b)); const s = inked(new THREE.BoxGeometry(0.038, 0.014, 0.05), toon(0xf6f3ea)); g.add(b, s); }
  if (kind === 'song') { const d = inked(new THREE.CylinderGeometry(0.04, 0.04, 0.006, 32), toon(0x161616)); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.008, 20), toon(0xf6f3ea)); d.add(l); g.add(d); }
  if (kind === 'news') { const p = inked(new THREE.BoxGeometry(0.07, 0.006, 0.05), toon(0xf6f3ea)); g.add(p); }
  if (kind === 'chat') { const c = inked(new THREE.SphereGeometry(0.026, 16, 12), toon(0xf6f3ea)); c.scale.set(1.3, 0.5, 1); g.add(c); }
  g.visible = false; scene.add(g); return g;
}

// ---------- tiny tween helpers ----------
const tweens = [];
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const tween = (sec, fn) => new Promise(res => { const d = calm ? 0.001 : sec * 1000, t0 = performance.now(); tweens.push(now => { const t = Math.min(1, (now - t0) / d); fn(ease(t), t); if (t >= 1) { res(); return true; } }); });
const v2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const face = (p, to) => { p.rotation.z = Math.atan2(to[1] - p.position.y, to[0] - p.position.x) - Math.PI / 2; };
async function walk(p, to) {
  const from = [p.position.x, p.position.y], dist = Math.hypot(to[0] - from[0], to[1] - from[1]);
  face(p, to);
  await tween(Math.max(0.35, dist * 1.6), (t, raw) => { const q = v2(from, to, t); p.position.x = q[0]; p.position.y = q[1]; p.userData.body.position.z = Math.abs(Math.sin(raw * dist * 40)) * 0.012; });
  p.userData.body.position.z = 0;
}
const hop = (p, n = 2) => tween(0.35 * n, (t, raw) => { p.userData.body.position.z = Math.abs(Math.sin(raw * Math.PI * n)) * 0.05; });
async function fly(obj, path, sec, z = 0.2) {
  obj.visible = true;
  for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i]; await tween(sec / (path.length - 1), (t, raw) => { const q = v2(a, b, t); obj.position.set(q[0], q[1], STREET_Z + z + Math.sin(raw * Math.PI) * 0.03); obj.rotation.z = raw * Math.PI; }); }
}

// ---------- the story: fetch -> up the Y -> friends react -> return trip ----------
let busy = false, lastInput = performance.now();
const props = { reel: [prop('reel'), prop('reel')], song: [prop('song'), prop('song')], news: [prop('news'), prop('news')] };
const chats = [prop('chat'), prop('chat')];
async function story(kind) {
  if (busy) return; busy = true; hero.classList.add('busy');
  const [a, b] = props[kind], J = DATA.junction, L = DATA.left, R = DATA.right, F = DATA.foot;
  await walk(you, DATA.doors[kind]);
  a.position.set(you.position.x, you.position.y, STREET_Z + 0.2); a.visible = true; await hop(you, 1);
  await walk(you, F); face(you, J);
  b.position.copy(a.position);
  await fly(a, [F, J], 0.9); b.visible = true;
  await Promise.all([fly(a, [J, L], 0.8), fly(b, [J, R], 0.8)]);
  await Promise.all([hop(f1), hop(f2)]);
  a.visible = b.visible = false;
  await Promise.all([fly(chats[0], [L, J, F], 1.4, 0.18), fly(chats[1], [R, J, F], 1.4, 0.18)]); // return trip: they reply
  chats.forEach(c => (c.visible = false)); await hop(you);
  busy = false; hero.classList.remove('busy'); lastInput = performance.now();
}
hero.querySelectorAll('.hit').forEach(h => h.addEventListener('click', () => {
  lastInput = performance.now();
  if (h.dataset.obj === 'y') { if (!busy) Promise.all([hop(f1), hop(f2), hop(you, 1)]); return; }
  story(h.dataset.obj);
}));

// ---------- pins above each stop (HTML, projected through the same camera) ----------
const ICON = { reel: 'i-film', song: 'i-music', news: 'i-news' };
for (const [k, p] of Object.entries(DATA.pins)) {
  const v = new THREE.Vector3(...p).project(camera), el = document.createElement('span');
  el.className = 'hero-pin'; el.setAttribute('aria-hidden', 'true');
  el.style.left = ((v.x + 1) / 2 * 100) + '%'; el.style.top = ((1 - v.y) / 2 * 100) + '%';
  el.innerHTML = `<svg class="ic"><use href="#${ICON[k]}"/></svg>`; frame.appendChild(el);
}

// ---------- motion control (Hana) + attract mode ~8 s ----------
const mBtn = document.createElement('button');
mBtn.className = 'hero-motion'; mBtn.type = 'button';
mBtn.innerHTML = '<svg class="ic mo-on"><use href="#i-pause"/></svg><svg class="ic mo-off"><use href="#i-play"/></svg>';
const syncM = () => { mBtn.classList.toggle('off', calm); mBtn.setAttribute('aria-label', calm ? 'Turn motion on' : 'Turn motion off'); mBtn.setAttribute('aria-pressed', String(!calm)); };
mBtn.addEventListener('click', () => { calm = !calm; lastInput = performance.now(); syncM(); });
mBtn.style.cssText = 'left:84%;top:80%;right:auto;bottom:auto;pointer-events:auto'; frame.appendChild(mBtn); syncM(); // beside the island's lower-right rim, inside the frame so it scales
const ORDER = ['reel', 'song', 'news']; let next = 0;

// ---------- loop: only while on screen ----------
let onScreen = true;
new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(hero);
function resize() {
  const w = frame.clientWidth, h = frame.clientHeight;
  renderer.setSize(w, h, false); renderer.getDrawingBufferSize(uRes.value);
}
new ResizeObserver(resize).observe(frame); resize();
renderer.setAnimationLoop(now => {
  if (!onScreen || !depthReady) return;
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i](now)) tweens.splice(i, 1);
  if (!calm && !busy && now - lastInput > 8000) story(ORDER[next++ % 3]);
  renderer.render(scene, camera);
});
hero.classList.add('has-3d');
if (location.search.includes('lab=1')) window.__y3 = { you, f1, f2, story, uOcc, uRes, renderer }; // debug handle for occlusion tests
