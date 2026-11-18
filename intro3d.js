/* Iron Wave — 3D-заставка. Модуль за кресленням (iw-model.js). Камера в кімнаті, модуль у стіні,
   ручка-вилка на правій стійці. Повертаєш ручку вниз → ламелі й тяга рухаються разом, крізь просвіти
   в кімнату падає світло → проліт крізь щілину між ламелями в сайт. Збій → запасна кадрова заставка. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildModule, W, H, RZ, LEAVES, AXES } from './iw-model.js';

const box = document.getElementById('intro');
if (box && !window.IW_introMode) { try { start(); } catch (e) { console.error(e); window.IW_introMode = null; window.IW_intro2d && window.IW_intro2d(); } }

function start() {
  window.IW_introMode = '3d';
  const $ = s => box.querySelector(s);
  const hint = $('.intro-hint'), openBtn = $('.intro-open'), skipBtn = $('.intro-skip');
  const SILL = .55;

  const canvas = document.createElement('canvas'); canvas.id = 'intro3d';
  canvas.setAttribute('role', 'slider'); canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', hint ? hint.textContent : 'Ручка'); canvas.setAttribute('aria-valuemin', '0'); canvas.setAttribute('aria-valuemax', '100');
  box.insertBefore(canvas, box.firstChild);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0c0d);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(34, 1, .02, 80);

  const mod = buildModule(); mod.root.position.y = SILL; scene.add(mod.root);
  const { setClosed, leverPivot, GRIP, leverMeshes, grab } = mod, mLever = mod.materials.lever;

  // кімната: стіна з прорізом, підлога, підвіконня
  const mWall = new THREE.MeshStandardMaterial({ color: 0xcfc9bf, roughness: .92 });
  const solid = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
  const WT = .24, RW = 6, RH = 3.1;
  solid((RW - W) / 2, RH, WT, mWall, -(W / 2 + (RW - W) / 4), RH / 2, RZ - WT / 2); solid((RW - W) / 2, RH, WT, mWall, W / 2 + (RW - W) / 4, RH / 2, RZ - WT / 2);
  solid(W, SILL, WT, mWall, 0, SILL / 2, RZ - WT / 2); solid(W, RH - SILL - H, WT, mWall, 0, SILL + H + (RH - SILL - H) / 2, RZ - WT / 2);
  solid(W + .1, .03, WT + .06, new THREE.MeshStandardMaterial({ color: 0xe2ddd4, roughness: .5 }), 0, SILL - .015, RZ - WT / 2 - .03);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, 8), new THREE.MeshStandardMaterial({ color: 0x6b6259, roughness: .7 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, RZ - WT - 4); floor.receiveShadow = true; scene.add(floor);

  // вулиця за модулем: денне небо й розмиті будинки
  const c = document.createElement('canvas'); c.width = 1024; c.height = 768; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 768); g.addColorStop(0, '#cfe2f2'); g.addColorStop(.55, '#eef3f4'); g.addColorStop(1, '#b7b3aa'); x.fillStyle = g; x.fillRect(0, 0, 1024, 768);
  x.filter = 'blur(10px)'; x.fillStyle = 'rgba(120,128,134,.55)';
  [[40, 300, 170, 470], [230, 250, 140, 520], [400, 330, 210, 440], [640, 280, 150, 490], [820, 340, 180, 430]].forEach(([a, b, w, h]) => x.fillRect(a, b, w, h));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const street = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.75), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  street.position.set(0, SILL + H / 2, 2.6); street.rotation.y = Math.PI; scene.add(street);

  // світло: сонце з вулиці крізь ламелі + кімнатне
  const sun = new THREE.DirectionalLight(0xfff1dc, 3.2); sun.position.set(.9, SILL + 3.4, 3.2); sun.target.position.set(0, 0, -1.6);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -2.5, right: 2.5, top: 3, bottom: -3, near: .5, far: 10 }); sun.shadow.bias = -.0005;
  scene.add(sun, sun.target, new THREE.HemisphereLight(0xf2ece2, 0x2a2622, .7));
  const roomKey = new THREE.DirectionalLight(0xfff6ea, 1.6); roomKey.position.set(-1.2, SILL + 2.6, -3.5); roomKey.target.position.set(0, SILL + H / 2, 0); scene.add(roomKey, roomKey.target);
  const lamp = new THREE.PointLight(0xffe2b0, 1.1, 6); lamp.position.set(.6, 2.7, -2.4); scene.add(lamp);

  // камера підлаштовується під екран
  let Wd = 0, Hd = 0; const camBase = new THREE.Vector3(), lookBase = new THREE.Vector3(.08, SILL + H * .6, 0);
  function fit() {
    Wd = innerWidth; Hd = innerHeight; renderer.setSize(Wd, Hd, false); camera.aspect = Wd / Hd;
    const v = camera.fov * Math.PI / 180, dH = H * 1.7 / 2 / Math.tan(v / 2), dW = W * 1.3 / 2 / (Math.tan(v / 2) * camera.aspect);
    camBase.set(.28, SILL + H * .55, -(Math.max(dH, dW) + .1)); camera.updateProjectionMatrix();
  }
  const gapX = (LEAVES[0][0] + LEAVES[0][1]) / 2, gapY = SILL + (AXES[6] + AXES[7]) / 2;
  let p = 0, z = 0, done = false, finished = false, drag = null, hover = false; const t0 = performance.now();
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function place(now) {
    const k = ease(z), breathe = done ? 0 : Math.sin((now - t0) / 2200) * .02;
    const before = new THREE.Vector3(gapX, gapY, RZ - .5), through = new THREE.Vector3(gapX, gapY, 1.6);
    const pos = k < .7 ? camBase.clone().lerp(before, ease(k / .7)) : before.clone().lerp(through, ease((k - .7) / .3));
    pos.x += breathe; camera.position.copy(pos);
    camera.lookAt(lookBase.clone().lerp(new THREE.Vector3(gapX, gapY, 3), Math.min(1, k * 1.4)));
    camera.fov = 34 - 10 * k; camera.updateProjectionMatrix();
  }
  const tag = document.createElement('div'); tag.className = 'lever-tag'; tag.textContent = 'Ручка — поверніть її'; box.appendChild(tag);
  const fade = document.createElement('div'); fade.className = 'intro-fade'; box.appendChild(fade);
  function render(now) {
    setClosed(1 - p); place(now);
    sun.intensity = 1.4 + 2.6 * p; lamp.intensity = 1.1 - .5 * p;
    mLever.emissiveIntensity = done ? 0 : (hover || drag ? .6 : .28 + .2 * Math.sin(now / 380));
    const gp = leverPivot.localToWorld(GRIP.clone()).project(camera), tx = (gp.x * .5 + .5) * Wd, ty = (-gp.y * .5 + .5) * Hd;
    const left = tx + 230 > Wd;                                 // мітка не вилазить за правий край
    tag.classList.toggle('left', left);
    tag.style.transform = left ? `translate(${tx - 26}px,${ty - 14}px) translateX(-100%)` : `translate(${tx + 26}px,${ty - 14}px)`;
    tag.style.opacity = done || p > .05 ? 0 : 1;
    fade.style.opacity = z > .62 ? Math.min(1, (z - .62) / .3) : 0;
    renderer.render(scene, camera);
    if (!finished) requestAnimationFrame(render);
  }

  // взаємодія: повернути саму ручку (або тягнути будь-де), колесо, стрілки, кнопки
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects([grab, ...leverMeshes], false).length > 0; }
  function setP(v) { p = Math.max(0, Math.min(1, v)); canvas.setAttribute('aria-valuenow', Math.round(p * 100)); if (hint) hint.style.opacity = p > .05 ? 0 : ''; if (p >= 1 && !done) go(); }
  function tween(from, to, ms, fn, then) { const s = performance.now(); (function st(t) { const k = Math.min(1, (t - s) / ms); fn(from + (to - from) * ease(k)); if (k < 1) requestAnimationFrame(st); else then && then(); })(s); }
  canvas.addEventListener('pointerdown', e => { if (done) return; drag = { y: e.clientY, p, onLever: hit(e) }; canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag'); });
  canvas.addEventListener('pointermove', e => { if (!drag) { hover = hit(e); canvas.style.cursor = hover ? 'grab' : ''; return; } setP(drag.p + (e.clientY - drag.y) / (Hd * (drag.onLever ? .28 : .45))); });
  const release = () => { if (!drag) return; drag = null; canvas.classList.remove('drag'); if (!done) tween(p, p > .45 ? 1 : 0, 500, setP); };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  box.addEventListener('wheel', e => { if (!done) { setP(p + e.deltaY / 1000); e.preventDefault(); } }, { passive: false });
  canvas.addEventListener('keydown', e => {
    if (['ArrowDown', 'PageDown'].includes(e.key)) { setP(p + .1); e.preventDefault(); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) { setP(p - .1); e.preventDefault(); }
    if (e.key === 'Enter' || e.key === ' ') { tween(p, 1, 900, setP); e.preventDefault(); }
  });
  if (openBtn) openBtn.onclick = () => tween(p, 1, 1100, setP);
  if (skipBtn) skipBtn.onclick = () => { done = true; finish(); };
  function go() { if (done) return; done = true; box.classList.add('go'); tween(0, 1, 1700, v => { z = v; }, finish); }
  function finish() {
    box.style.transition = 'opacity .45s ease'; box.style.opacity = '0';
    setTimeout(() => {
      finished = true; box.hidden = true; document.documentElement.classList.remove('intro-on');
      try { sessionStorage.setItem('iw_intro', '1'); } catch {}
      renderer.dispose(); pmrem.dispose(); dispatchEvent(new Event('resize'));
    }, 460);
  }
  addEventListener('resize', () => { if (!finished) fit(); });
  fit(); setP(0); box.classList.remove('loading'); canvas.focus({ preventScroll: true });
  requestAnimationFrame(render);
}
