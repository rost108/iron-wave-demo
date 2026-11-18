/* Iron Wave — блок «Зовні»: 3D-фасад із трьома модулями за кресленням (iw-model.js), вид з вулиці.
   Гортання повертає ламелі (як справжні жалюзі), за склом — тепле світло офісу, яке зникає при закритті. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildModule, W, H } from './iw-model.js';

const sec = document.getElementById('facade');
if (sec) try { init(); } catch (e) { console.error(e); sec.classList.add('f3d-fail'); }

function init() {
  const cv = document.getElementById('facadeCv'), chaps = [...sec.querySelectorAll('.fchap')];
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xdfe5e8);
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 80);

  // штукатурка фасаду: світлий тон із дрібним шумом
  function plaster() {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    x.fillStyle = '#d9d8d3'; x.fillRect(0, 0, 512, 512);
    const d = x.getImageData(0, 0, 512, 512); for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - .5) * 18; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; } x.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // офіс за склом: тепле світло, силуети столів і моніторів (розмито)
  function office(seed) {
    const c = document.createElement('canvas'); c.width = 384; c.height = 512; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#f6e7c8'); g.addColorStop(.6, '#d9c39a'); g.addColorStop(1, '#7a6648'); x.fillStyle = g; x.fillRect(0, 0, 384, 512);
    x.filter = 'blur(6px)'; x.fillStyle = 'rgba(255,250,236,.9)'; for (let i = 0; i < 3; i++) x.fillRect(30 + i * 120, 40, 80, 10);
    x.fillStyle = 'rgba(40,34,26,.6)'; x.fillRect(20, 330, 344, 22); for (let i = 0; i < 3; i++) x.fillRect(40 + i * 110 + seed * 8, 260, 60, 60);
    x.fillStyle = 'rgba(40,34,26,.45)'; x.fillRect(60 + seed * 30, 300, 40, 140);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const GAP = 1.15, N = 3, SILL = .9, WALL_W = N * W + (N + 1) * GAP, WALL_H = 4.2, T = .35;
  const mWall = new THREE.MeshStandardMaterial({ map: plaster(), roughness: .95 });
  const slab = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, T), mWall); m.position.set(x, y, .03 + T / 2); m.castShadow = m.receiveShadow = true; scene.add(m); };
  // стіна з трьома прорізами: суцільні простінки + перемички
  const x0 = -WALL_W / 2;
  for (let i = 0; i <= N; i++) slab(GAP, WALL_H, x0 + i * (W + GAP) + GAP / 2, WALL_H / 2);
  for (let i = 0; i < N; i++) { const cx = x0 + GAP + W / 2 + i * (W + GAP); slab(W, SILL, cx, SILL / 2); slab(W, WALL_H - SILL - H, cx, SILL + H + (WALL_H - SILL - H) / 2); }
  // модулі в прорізах (з вулиці) + офіс за ними + підвіконня
  const mods = [], offices = [];
  for (let i = 0; i < N; i++) {
    const cx = x0 + GAP + W / 2 + i * (W + GAP);
    const m = buildModule(); m.root.position.set(cx, SILL, 0); m.root.rotation.y = Math.PI; scene.add(m.root); mods.push(m);   // лице модуля — на вулицю (камера з +z)
    const om = new THREE.MeshBasicMaterial({ map: office(i), toneMapped: false });
    const o = new THREE.Mesh(new THREE.PlaneGeometry(W, H), om); o.position.set(cx, SILL + H / 2, .5); o.rotation.y = Math.PI; scene.add(o); offices.push(om);
    const s = new THREE.Mesh(new THREE.BoxGeometry(W + .12, .05, .14), new THREE.MeshStandardMaterial({ color: 0x8e9396, metalness: .5, roughness: .4 }));
    s.position.set(cx, SILL - .025, -.07); s.castShadow = true; scene.add(s);
  }
  // тротуар і світло: сонце збоку, небо
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: 0xa6a8a6, roughness: .9 }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -9; ground.receiveShadow = true; scene.add(ground);
  const sun = new THREE.DirectionalLight(0xfff4e2, 2.4); sun.position.set(-6, 9, -7); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 7, bottom: -2, near: 1, far: 30 }); sun.shadow.bias = -.0004;
  scene.add(sun, new THREE.HemisphereLight(0xe8f0f6, 0x8a8a86, .7));

  let Wd = 0, Hd = 0;
  function fit() { Wd = cv.clientWidth; Hd = cv.clientHeight; renderer.setSize(Wd, Hd, false); camera.aspect = Wd / Hd; camera.updateProjectionMatrix(); }
  new ResizeObserver(fit).observe(cv); fit();
  const prog = () => { const r = sec.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / (sec.offsetHeight - innerHeight))); };
  const ease = t => t * t * (3 - 2 * t);
  let shown = 0, visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(loop); }).observe(sec);
  function loop() {
    if (!visible) return;
    const p = prog(), k = ease(Math.min(1, Math.max(0, (p - .14) / .62)));
    shown += (k - shown) * .18;                                                           // м'яко доганяє гортання
    mods.forEach(m => m.setClosed(shown));
    offices.forEach(o => o.color.setScalar(1 - .82 * shown));
    // камера: усі три вікна на широкому екрані; на вузькому — середнє ближче
    const v = camera.fov * Math.PI / 180, wide = Wd / Hd > 1.1;
    const span = wide ? (N * W + (N - 1) * GAP) * 1.2 : W * 1.9, d = Math.max(span / 2 / (Math.tan(v / 2) * camera.aspect), H * 1.7 / 2 / Math.tan(v / 2));
    camera.position.set(-1.2 + 2.4 * p, SILL + H * .55, -(d * (1.04 - .06 * p)));
    camera.lookAt(0, SILL + H * .5, 0);
    chaps.forEach(el => { const a = +el.dataset.in, b = +el.dataset.out, f = .05, vv = a === 0 && p < b - f ? 1 : Math.max(0, Math.min(1, (p - a) / f, (b - p) / f)); el.style.opacity = vv; el.style.transform = `translateY(${(1 - vv) * 14}px)`; });
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  sec.classList.add('f3d-ready'); requestAnimationFrame(loop);
}
