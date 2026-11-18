/* Iron Wave — 3D-вхід. Темна студія, модуль за кресленням (iw-model.js), за ним — денне світло.
   Ламелі відкриті; людина опускає ручку (1:1 за пальцем) → жалюзі закриваються, світло зникає →
   зверху «Ти в безпеці» → вхід на сайт. Рух — пружина з передачею швидкості (інтерактивна, перехоплюється).
   Збій → запасна кадрова заставка (site.js → intro2d). */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildModule, W, H } from './iw-model.js';

const box = document.getElementById('intro');
if (box && !window.IW_introMode) { try { start(); } catch (e) { console.error(e); window.IW_introMode = null; window.IW_intro2d && window.IW_intro2d(); } }

function start() {
  window.IW_introMode = '3d';
  const $ = s => box.querySelector(s);
  const hint = $('.intro-hint'), actBtn = $('.intro-open'), skipBtn = $('.intro-skip'), safe = $('.intro-safe'), title = $('.intro-title');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas'); canvas.id = 'intro3d';
  canvas.setAttribute('role', 'slider'); canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', hint ? hint.textContent : 'Ручка'); canvas.setAttribute('aria-valuemin', '0'); canvas.setAttribute('aria-valuemax', '100');
  box.insertBefore(canvas, box.firstChild);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020202); scene.fog = new THREE.Fog(0x020202, 6, 13);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 60);

  const mod = buildModule(); scene.add(mod.root);
  const { setClosed, leverPivot, GRIP, leverMeshes, grab } = mod, mLever = mod.materials.lever;

  // за модулем — світла площина денного світла (з вулиці), що світить крізь просвіти
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfff1d6, toneMapped: false });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(W * .9, H * .9), glowMat);
  glow.position.set(0, H / 2, .22); glow.rotation.y = Math.PI; scene.add(glow);
  const back = new THREE.SpotLight(0xfff0d2, 0, 9, Math.PI / 5, .6, 1.2);              // промені крізь ламелі на підлогу кімнати
  back.position.set(.3, H * 1.25, 1.9); back.target.position.set(0, 0, -1.8); back.castShadow = true;
  back.shadow.mapSize.set(2048, 2048); back.shadow.bias = -.0004; scene.add(back, back.target);
  // студія: темна підлога з легким відбиттям, м'яке світло з боку кімнати
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: .55, metalness: .05 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const key = new THREE.DirectionalLight(0xfff6ea, 1.5); key.position.set(-2.2, 3.6, -3.4); key.target.position.set(0, H / 2, 0); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xcfe0ff, .7); rim.position.set(3, 2.2, -1.5); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xdfe6e8, 0x0a0b0c, .25));

  // камера: з боку кімнати, трохи збоку — ручку на стійці видно; кадр під будь-який екран
  let Wd = 0, Hd = 0; const target = new THREE.Vector3(.12, H * .5, 0), base = new THREE.Vector3();
  function fit() {
    Wd = innerWidth; Hd = innerHeight; renderer.setSize(Wd, Hd, false); camera.aspect = Wd / Hd;
    const v = camera.fov * Math.PI / 180, d = Math.max(H * 1.8 / 2 / Math.tan(v / 2), W * 1.5 / 2 / (Math.tan(v / 2) * camera.aspect));
    const az = -.42;                                                                      // з кімнати (−z), зсув у бік ручки (+x)
    base.set(Math.sin(-az) * d * .55 + .1, H * .52, -Math.cos(az) * d); camera.updateProjectionMatrix();
  }

  /* ── стан і фізика: p — наскільки закрито (0 відкрито … 1 закрито); пружина з критичним згасанням */
  let p = 0, v = 0, goal = null, drag = null, hover = false, phase = 'play', zoom = 0, finished = false;
  const RESP = .38, OM = 2 * Math.PI / RESP;                                             // Apple: damping 1.0, response ≈ 0.4
  const hist = [];
  const project = (vel, d = .996) => (vel / 1000) * d / (1 - d);                          // проекція імпульсу
  function setP(x) { p = Math.max(0, Math.min(1, x)); canvas.setAttribute('aria-valuenow', Math.round(p * 100)); if (hint) hint.style.opacity = p > .04 ? 0 : ''; }
  function springTo(t, vel = v) { goal = t; v = vel; }
  function closedReached() {
    if (phase !== 'play') return; phase = 'safe';
    try { navigator.vibrate && navigator.vibrate(18); } catch {}
    box.classList.add('safe'); if (title) title.style.opacity = 0;
    if (actBtn) { actBtn.textContent = actBtn.dataset.enter || 'Увійти'; actBtn.onclick = enter; }
    setTimeout(enter, RM ? 1200 : 2400);
  }
  function enter() { if (phase === 'enter' || finished) return; phase = 'enter'; box.classList.add('go'); if (RM) return finish(); const s = performance.now(); (function st(t) { zoom = Math.min(1, (t - s) / 1100); if (zoom < 1) requestAnimationFrame(st); else finish(); })(s); }
  function finish() {
    box.style.transition = 'opacity .5s ease'; box.style.opacity = '0';
    setTimeout(() => { finished = true; box.hidden = true; document.documentElement.classList.remove('intro-on'); try { sessionStorage.setItem('iw_intro', '1'); } catch {} renderer.dispose(); pmrem.dispose(); dispatchEvent(new Event('resize')); }, 520);
  }

  const tag = document.createElement('div'); tag.className = 'lever-tag'; tag.textContent = 'Ручка'; box.appendChild(tag);
  let last = performance.now(); const t0 = last;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (goal !== null && !drag) {                                                         // критично згасаюча пружина
      const a = OM * OM * (goal - p) - 2 * OM * v; v += a * dt; setP(p + v * dt);
      if (goal === 1 && p > .995) closedReached();
      if (Math.abs(goal - p) < .002 && Math.abs(v) < .05) { setP(goal); v = 0; goal = null; }
    }
    setClosed(p);
    const open = 1 - p;
    glowMat.color.setScalar(.12 + .88 * open).multiply(new THREE.Color(0xfff1d6));
    back.intensity = 9 * open; key.intensity = 1.5 - .5 * p;
    mLever.emissiveIntensity = phase !== 'play' ? 0 : (hover || drag ? .65 : .3 + .22 * Math.sin(now / 380));
    // камера: ледь «дихає»; на вході — наближення й затемнення
    const k = zoom * zoom * (3 - 2 * zoom), br = phase === 'play' ? Math.sin((now - t0) / 2600) * .03 : 0;
    camera.position.copy(base).lerp(new THREE.Vector3(.0, H * .5, -1.2), k).add(new THREE.Vector3(br, 0, 0));
    camera.lookAt(target); camera.fov = 30 - 6 * k; camera.updateProjectionMatrix();
    // мітка ручки
    const gp = leverPivot.localToWorld(GRIP.clone()).project(camera), tx = (gp.x * .5 + .5) * Wd, ty = (-gp.y * .5 + .5) * Hd, left = tx + 160 > Wd;
    tag.classList.toggle('left', left);
    tag.style.transform = left ? `translate(${tx - 22}px,${ty - 14}px) translateX(-100%)` : `translate(${tx + 22}px,${ty - 14}px)`;
    tag.style.opacity = phase === 'play' && p < .04 ? 1 : 0;
    renderer.render(scene, camera);
    if (!finished) requestAnimationFrame(frame);
  }

  /* ── жести: ручка йде за пальцем 1:1, на відпусканні — проекція імпульсу й пружина з тією ж швидкістю */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects([grab, ...leverMeshes], false).length > 0; }
  const travel = () => Hd * .32;                                                          // хід ручки на екрані
  canvas.addEventListener('pointerdown', e => {
    if (phase !== 'play') return;
    drag = { y: e.clientY, p, onLever: hit(e) }; goal = null; v = 0; hist.length = 0;    // перехоплення будь-якої миті
    canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag');
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) { hover = hit(e); canvas.style.cursor = hover ? 'grab' : ''; return; }
    setP(drag.p + (e.clientY - drag.y) / (travel() * (drag.onLever ? 1 : 1.4)));
    hist.push([performance.now(), p]); if (hist.length > 6) hist.shift();
  });
  const release = () => {
    if (!drag) return; drag = null; canvas.classList.remove('drag');
    let vel = 0; if (hist.length > 1) { const [ta, pa] = hist[0], [tb, pb] = hist[hist.length - 1]; vel = (pb - pa) / Math.max(.016, (tb - ta) / 1000); }
    const projected = p + project(vel * 1000) / 1000;                                    // куди «летить» жест
    springTo(projected > .5 ? 1 : 0, vel);
  };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  box.addEventListener('wheel', e => { if (phase !== 'play') return; e.preventDefault(); setP(p + e.deltaY / 900); goal = null; clearTimeout(box._w); box._w = setTimeout(() => springTo(p > .5 ? 1 : 0, 0), 140); }, { passive: false });
  canvas.addEventListener('keydown', e => {
    if (phase !== 'play') { if (e.key === 'Enter') enter(); return; }
    if (['ArrowDown', 'PageDown'].includes(e.key)) { setP(p + .1); e.preventDefault(); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) { setP(p - .1); e.preventDefault(); }
    if (e.key === 'Enter' || e.key === ' ') { springTo(1, 0); e.preventDefault(); }
    if (p > .995) closedReached();
  });
  if (actBtn) actBtn.onclick = () => springTo(1, 0);
  if (skipBtn) skipBtn.onclick = () => { phase = 'enter'; finish(); };

  addEventListener('resize', () => { if (!finished) fit(); });
  fit(); setP(0); box.classList.remove('loading'); canvas.focus({ preventScroll: true });
  requestAnimationFrame(frame);
}
