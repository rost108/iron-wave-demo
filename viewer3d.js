/* Iron Wave — блок «Покрутіть модуль»: 3D за кресленням (iw-model.js), обертання пальцем/мишею,
   повзунок «відкрито ↔ закрито», вид з кімнати / з вулиці. Підвантажується лише коли блок поруч. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildModule, H } from './iw-model.js';

const host = document.getElementById('viewer3d');
if (host) try { init(); } catch (e) { console.error(e); host.classList.add('v3d-fail'); }

function init() {
  const stage = host.querySelector('.v3d-stage'), range = host.querySelector('#v3dRange'), views = host.querySelectorAll('[data-view]');
  const canvas = document.createElement('canvas'); canvas.setAttribute('aria-label', 'Модуль Iron Wave у 3D: тягніть, щоб покрутити'); stage.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 50);

  const mod = buildModule(); scene.add(mod.root);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 4, 3.5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 3, bottom: -1, near: .5, far: 12 }); key.shadow.bias = -.0004;
  const rim = new THREE.DirectionalLight(0xdfe8ff, 1.1); rim.position.set(-3, 2.5, -3);
  scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x8a8f91, .5));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: .18 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, H / 2, 0); controls.enableDamping = true; controls.enablePan = false; controls.enableZoom = false;   // колесо гортає сторінку
  controls.minPolarAngle = Math.PI * .28; controls.maxPolarAngle = Math.PI * .56;
  controls.autoRotate = true; controls.autoRotateSpeed = .6;
  controls.addEventListener('start', () => { controls.autoRotate = false; host.classList.add('touched'); });

  let k = +range.value / 100, kTarget = k;
  const setView = v => {
    const dist = camera.position.distanceTo(controls.target), az = v === 'room' ? Math.PI - .5 : .5;
    camera.position.set(Math.sin(az) * dist, H * .62, Math.cos(az) * dist); controls.autoRotate = false;
    views.forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v));
  };
  range.addEventListener('input', () => { kTarget = +range.value / 100; });
  views.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

  function fit() {
    const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
    const v = camera.fov * Math.PI / 180, d = Math.max(H * 1.25 / 2 / Math.tan(v / 2), 1.7 * 1.2 / 2 / (Math.tan(v / 2) * camera.aspect));
    if (!camera.userData.placed) { camera.position.set(Math.sin(.6) * d, H * .62, Math.cos(.6) * d); camera.userData.placed = true; }
    else camera.position.sub(controls.target).setLength(d).add(controls.target);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(fit).observe(stage); fit();

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(loop); }).observe(stage);
  function loop() {
    if (!visible) return;
    k += (kTarget - k) * .14; mod.setClosed(k); controls.update(); renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  host.classList.add('v3d-ready'); requestAnimationFrame(loop);
}
