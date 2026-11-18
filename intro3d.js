/* Iron Wave — 3D-заставка. Модуль за кресленням «Жалюзі у зборі» (geometry.json → копія з zhaliuzi/landing/index_v2_threejs.html).
   Камера в кімнаті: модуль у стіні, ручка-вилка з нашого боку. Тягнеш ручку вниз → ламелі й тяга повертаються разом,
   крізь просвіти в кімнату падає світло → проліт крізь щілину між ламелями в сайт. Якщо щось не так — запасна кадрова заставка. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const box = document.getElementById('intro');
if (box && !window.IW_introMode) { try { start(); } catch (e) { console.error(e); window.IW_intro2d && window.IW_intro2d(); } }

function start() {
  window.IW_introMode = '3d';
  const $ = s => box.querySelector(s);
  const hint = $('.intro-hint'), openBtn = $('.intro-open'), skipBtn = $('.intro-skip');

  /* ── геометрія з креслення, мм → м. x — ширина (центр 0), y — вгору від низу модуля, z — до вулиці (+). */
  const mm = .001, W = 1500 * mm, H = 2000 * mm, PF = 60 * mm, DEP = 60 * mm, RZ = -DEP / 2;
  const MULL = 60 * mm, LEAVES = [[-690 * mm, -30 * mm], [30 * mm, 690 * mm]];
  const AXES = [90, 192, 336, 479, 623, 766, 909, 1053, 1196, 1339, 1483, 1627, 1770].map(y => H - y * mm);
  const TAIL = 25 * mm, BELOW = 172 * mm, PIV_Z = RZ - 7 * mm, T = 2.5 * mm;
  const CLOSED = 12 * Math.PI / 180, OPEN = 85 * Math.PI / 180;
  const BAR = { y0: H - 1816 * mm, y1: H - 66 * mm, d: 28.8 * mm, w: 75 * mm };
  const LEVER = [[4.2,1309.6],[47.4,1277.5],[50.8,1274.9],[55,1268.2],[55.9,1260.5],[53.3,1252.1],[25.4,1199.6],[23.7,1193.7],[23.7,1185.2],[49.9,1079.4],[51.6,1074.3],[57.6,1068.4],[64.3,1065],[72.8,1064.1],[80.4,1067.5],[86.3,1073.5],[88.9,1081.1],[88.9,1088.7],[64.3,1187.7],[64.3,1195.4],[66.9,1203],[93.1,1246.2],[94.8,1250.4],[98.2,1261.4],[98.2,1273.2],[94.8,1284.2],[88,1293.6],[79.6,1301.2],[3,1349],[3,1319],[8.5,1319],[7.6,1314.7]];
  const ELBOW = [43.2, 1191.0], HEX = [69.4, 1084.5], LPLATES = [26 * mm, 109 * mm], LT = 8 * mm, SWING = 35 * Math.PI / 180;
  const SILL = .55;                                            // модуль у стіні над підлогою кімнати

  const canvas = document.createElement('canvas'); canvas.id = 'intro3d';
  canvas.setAttribute('role', 'slider'); canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', hint ? hint.textContent : 'Ручка'); canvas.setAttribute('aria-valuemin', '0'); canvas.setAttribute('aria-valuemax', '100');
  box.insertBefore(canvas, box.firstChild);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0c0d);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(34, 1, .02, 80);

  // матеріали: графіт RAL 7016, порошкове покриття; стіна кімнати — тепла штукатурка
  const mBody = new THREE.MeshPhysicalMaterial({ color: 0x3a4044, metalness: .55, roughness: .42, clearcoat: .3, clearcoatRoughness: .35, envMapIntensity: .6 });
  const mSlat = new THREE.MeshPhysicalMaterial({ color: 0x40474b, metalness: .6, roughness: .36, clearcoat: .35, clearcoatRoughness: .3, envMapIntensity: .6 });
  const mSteel = new THREE.MeshPhysicalMaterial({ color: 0x9aa6a9, metalness: .9, roughness: .28, envMapIntensity: .7 });
  const mLever = new THREE.MeshPhysicalMaterial({ color: 0x3a4044, metalness: .55, roughness: .4, clearcoat: .3, emissive: 0xfcde00, emissiveIntensity: 0 });
  const mWall = new THREE.MeshStandardMaterial({ color: 0xcfc9bf, roughness: .92 });
  const mFloor = new THREE.MeshStandardMaterial({ color: 0x6b6259, roughness: .7 });

  const root = new THREE.Group(); root.position.y = SILL; scene.add(root);
  const bar = new THREE.Group(); root.add(bar);
  function box3(w, h, d, mat, x, y, z, g = root) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; }

  // рама, імпост, верхня смуга
  box3(W, PF, DEP, mBody, 0, H - PF / 2, 0); box3(W, PF, DEP, mBody, 0, PF / 2, 0);
  box3(PF, H - 2 * PF, DEP, mBody, -W / 2 + PF / 2, H / 2, 0); box3(PF, H - 2 * PF, DEP, mBody, W / 2 - PF / 2, H / 2, 0);
  box3(MULL, H - 2 * PF, DEP, mBody, 0, H / 2, 0);
  box3(W - 2 * PF, 55 * mm, 4 * mm, mBody, 0, H - 87.5 * mm, DEP / 2 - 2 * mm);
  // ламелі
  const slats = [];
  for (const [a, b] of LEAVES) {
    const L = b - a - 6 * mm, cx = (a + b) / 2;
    for (const y of AXES) {
      const p = new THREE.Group(); p.position.set(cx, y, PIV_Z); root.add(p);
      const m = new THREE.Mesh(new THREE.BoxGeometry(L, TAIL + BELOW, T), mSlat);
      m.position.set(0, (TAIL - BELOW) / 2, 0); m.castShadow = m.receiveShadow = true; p.add(m); slats.push(p);
    }
  }
  // тяга біля імпоста + планка
  box3(BAR.w, BAR.y1 - BAR.y0, BAR.d, mBody, MULL / 2 + BAR.w / 2, (BAR.y0 + BAR.y1) / 2, RZ - BAR.d / 2, bar);
  box3(MULL, BAR.y1 - BAR.y0, 7 * mm, mSteel, 0, (BAR.y0 + BAR.y1) / 2, RZ - 4.5 * mm, bar);
  // ручка-вилка за контуром з креслення
  const leverPivot = new THREE.Group();
  const ELY = H - ELBOW[1] * mm, ELZ = RZ - ELBOW[0] * mm;
  leverPivot.position.set(0, ELY, ELZ); root.add(leverPivot);
  const lshape = new THREE.Shape(LEVER.map(([x, y]) => new THREE.Vector2((x - ELBOW[0]) * mm, (ELBOW[1] - y) * mm)));
  const lgeo = new THREE.ExtrudeGeometry(lshape, { depth: LT, bevelEnabled: false });
  const leverMeshes = [];
  for (const xp of LPLATES) { const m = new THREE.Mesh(lgeo, mLever); m.castShadow = true; m.rotation.y = Math.PI / 2; m.position.x = xp - LT / 2; leverPivot.add(m); leverMeshes.push(m); }
  const GRIP = new THREE.Vector3((LPLATES[0] + LPLATES[1]) / 2, (ELBOW[1] - HEX[1]) * mm, -(HEX[0] - ELBOW[0]) * mm);
  const hexA = new THREE.Mesh(new THREE.CylinderGeometry(11 * mm, 11 * mm, LPLATES[1] - LPLATES[0] + 30 * mm, 6), mSteel);
  hexA.rotation.z = Math.PI / 2; hexA.position.copy(GRIP); leverPivot.add(hexA); leverMeshes.push(hexA);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(8 * mm, 8 * mm, LPLATES[1] - LPLATES[0] + 12 * mm, 20), mSteel);
  axle.rotation.z = Math.PI / 2; axle.position.set((LPLATES[0] + LPLATES[1]) / 2, ELY, ELZ); root.add(axle);
  // невидима «зона хвату» — щоб у ручку легко влучити пальцем
  const grab = new THREE.Mesh(new THREE.BoxGeometry(.22, .34, .16), new THREE.MeshBasicMaterial({ visible: false }));
  grab.position.set((LPLATES[0] + LPLATES[1]) / 2, ELY - .1, ELZ - .05); root.add(grab);

  // стіна кімнати з прорізом під модуль, підлога, стеля
  const WT = .24, RW = 6, RH = 3.1;
  const wall = (w, h, x, y) => box3(w, h, WT, mWall, x, y, RZ - WT / 2, scene);
  wall((RW - W) / 2, RH, -(W / 2 + (RW - W) / 4), RH / 2); wall((RW - W) / 2, RH, W / 2 + (RW - W) / 4, RH / 2);
  wall(W, SILL, 0, SILL / 2); wall(W, RH - SILL - H, 0, SILL + H + (RH - SILL - H) / 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, 8), mFloor); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, RZ - WT - 4); floor.receiveShadow = true; scene.add(floor);
  const sill = box3(W + .1, .03, WT + .06, new THREE.MeshStandardMaterial({ color: 0xe2ddd4, roughness: .5 }), 0, SILL - .015, RZ - WT / 2 - .03, scene);

  // вулиця за модулем: денне небо й розмиті будинки (світиться саме)
  function streetTex() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 768; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 768); g.addColorStop(0, '#cfe2f2'); g.addColorStop(.55, '#eef3f4'); g.addColorStop(1, '#b7b3aa'); x.fillStyle = g; x.fillRect(0, 0, 1024, 768);
    x.filter = 'blur(10px)'; x.fillStyle = 'rgba(120,128,134,.55)';
    [[40, 300, 170, 470], [230, 250, 140, 520], [400, 330, 210, 440], [640, 280, 150, 490], [820, 340, 180, 430]].forEach(([a, b, w, h]) => x.fillRect(a, b, w, h));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const street = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.75), new THREE.MeshBasicMaterial({ map: streetTex(), toneMapped: false }));
  street.position.set(0, SILL + H / 2, 2.6); street.rotation.y = Math.PI; scene.add(street);

  // світло: сонце з вулиці крізь ламелі (смуги на підвіконні й підлозі) + м'яке кімнатне
  const sun = new THREE.DirectionalLight(0xfff1dc, 3.2); sun.position.set(.9, SILL + 3.4, 3.2); sun.target.position.set(0, 0, -1.6);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -2.5, right: 2.5, top: 3, bottom: -3, near: .5, far: 10 }); sun.shadow.bias = -.0005;
  scene.add(sun, sun.target);
  const roomFill = new THREE.HemisphereLight(0xf2ece2, 0x2a2622, .7); scene.add(roomFill);
  const roomKey = new THREE.DirectionalLight(0xfff6ea, 1.6); roomKey.position.set(-1.2, SILL + 2.6, -3.5); roomKey.target.position.set(0, SILL + H / 2, 0); scene.add(roomKey, roomKey.target);
  const lamp = new THREE.PointLight(0xffe2b0, 1.1, 6); lamp.position.set(.6, 2.7, -2.4); scene.add(lamp);

  /* ── механізм: k = 1 закрито … 0 відкрито; ламелі, тяга й ручка — один рух */
  function setClosed(k) {
    const ang = OPEN + (CLOSED - OPEN) * k;
    for (const p of slats) p.rotation.x = -ang;
    bar.position.y = -0.08 * (Math.sin(ang) - Math.sin(CLOSED));
    leverPivot.rotation.x = (ang - CLOSED) / (OPEN - CLOSED) * SWING;
  }

  /* ── камера: кадр підлаштовується під екран (на телефоні — портрет) */
  let Wd = 0, Hd = 0, camBase = new THREE.Vector3(), lookBase = new THREE.Vector3(0, SILL + H * .6, 0);
  function fit() {
    Wd = innerWidth; Hd = innerHeight; renderer.setSize(Wd, Hd, false); camera.aspect = Wd / Hd;
    const vfov = camera.fov * Math.PI / 180, needH = H * 1.7, needW = W * 1.3;
    const dH = needH / 2 / Math.tan(vfov / 2), dW = needW / 2 / (Math.tan(vfov / 2) * camera.aspect);
    camBase.set(.18, SILL + H * .55, -(Math.max(dH, dW) + .1)); camera.updateProjectionMatrix();
  }
  // проліт: від базової точки до щілини між ламелями лівої стулки, крізь неї — на вулицю
  const gapX = (LEAVES[0][0] + LEAVES[0][1]) / 2, gapY = SILL + (AXES[6] + AXES[7]) / 2;
  let p = 0, z = 0, done = false, t0 = performance.now();
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function place(now) {
    const k = ease(z), breathe = done ? 0 : Math.sin((now - t0) / 2200) * .02;
    const before = new THREE.Vector3(gapX, gapY, RZ - .5), through = new THREE.Vector3(gapX, gapY, 1.6);
    const pos = k < .7 ? camBase.clone().lerp(before, ease(k / .7)) : before.clone().lerp(through, ease((k - .7) / .3));
    pos.x += breathe; camera.position.copy(pos);
    const look = lookBase.clone().lerp(new THREE.Vector3(gapX, gapY, 3), Math.min(1, k * 1.4));
    camera.lookAt(look); camera.fov = 34 - 10 * k; camera.updateProjectionMatrix();
  }
  const tag = document.createElement('div'); tag.className = 'lever-tag'; tag.textContent = 'Ручка — тягніть вниз'; box.appendChild(tag);
  const fade = document.createElement('div'); fade.className = 'intro-fade'; box.appendChild(fade);
  function render(now) {
    setClosed(1 - p); place(now);
    sun.intensity = 1.4 + 2.6 * p; lamp.intensity = 1.1 - .5 * p;
    mLever.emissiveIntensity = done ? 0 : (hover || drag ? .6 : .28 + .2 * Math.sin(now / 380));
    if (tag) { const g = leverPivot.localToWorld(GRIP.clone()).project(camera); tag.style.transform = `translate(${(g.x * .5 + .5) * Wd + 26}px,${(-g.y * .5 + .5) * Hd - 14}px)`; tag.style.opacity = done || p > .05 ? 0 : 1; }
    fade.style.opacity = z > .62 ? Math.min(1, (z - .62) / .3) : 0;
    renderer.render(scene, camera);
    if (!finished) requestAnimationFrame(render);
  }

  /* ── взаємодія: тягнути саму ручку (або будь-де), колесо, стрілки, кнопки */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects([grab, ...leverMeshes], false).length > 0; }
  let drag = null, hover = false, finished = false;
  function setP(v) {
    p = Math.max(0, Math.min(1, v)); canvas.setAttribute('aria-valuenow', Math.round(p * 100));
    if (hint) hint.style.opacity = p > .05 ? 0 : '';
    if (p >= 1 && !done) go();
  }
  function tween(from, to, ms, fn, then) { const s = performance.now(); (function st(t) { const k = Math.min(1, (t - s) / ms); fn(from + (to - from) * ease(k)); if (k < 1) requestAnimationFrame(st); else then && then(); })(s); }
  canvas.addEventListener('pointerdown', e => { if (done) return; drag = { y: e.clientY, p, onLever: hit(e) }; canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag'); });
  canvas.addEventListener('pointermove', e => {
    if (!drag) { hover = hit(e); canvas.style.cursor = hover ? 'grab' : ''; return; }
    setP(drag.p + (e.clientY - drag.y) / (Hd * (drag.onLever ? .28 : .45)));        // за ручку — коротший хід
  });
  const release = () => { if (!drag) return; drag = null; canvas.classList.remove('drag'); if (!done) tween(p, p > .45 ? 1 : 0, 500, setP); };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  box.addEventListener('wheel', e => { if (!done) { setP(p + e.deltaY / 1000); e.preventDefault(); } }, { passive: false });
  canvas.addEventListener('keydown', e => {
    if (['ArrowDown', 'PageDown'].includes(e.key)) { setP(p + .1); e.preventDefault(); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) { setP(p - .1); e.preventDefault(); }
    if (e.key === 'Enter' || e.key === ' ') { tween(p, 1, 900, setP); e.preventDefault(); }
  });
  openBtn && (openBtn.onclick = () => tween(p, 1, 1100, setP));
  skipBtn && (skipBtn.onclick = () => { done = true; finish(); });

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
