/* Iron Wave — 3D-ручка праворуч на вході. Сталевий повзунок на рейці з жовтою смугою ходу (three.js).
   Положення бере з intro2d (window.IW_lever3d(p)); перетягування лишається на елементі .lever.
   Збій — лишається звичайна CSS-ручка. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const lever = document.getElementById('lever'), box = document.getElementById('intro');
if (lever && box && !box.hidden) try { init(); } catch (e) { console.error(e); }

function init() {
  const PADX = 34, PADY = 26;                                          // запас полотна довкола ручки, щоб об'єм не обрізався
  const cv = document.createElement('canvas'); cv.className = 'lever3d'; cv.setAttribute('aria-hidden', 'true');
  lever.appendChild(cv);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const key = new THREE.DirectionalLight(0xfff4e4, 2.2); key.position.set(-120, 260, 300); scene.add(key);
  const rim = new THREE.DirectionalLight(0xfcde00, .6); rim.position.set(200, -80, -120); scene.add(rim);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000); camera.position.set(0, 0, 600);

  const steel = new THREE.MeshPhysicalMaterial({ color: 0x8c979a, metalness: .92, roughness: .32, clearcoat: .4, clearcoatRoughness: .3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1d2224, metalness: .7, roughness: .5 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xfcde00, emissive: 0xfcde00, emissiveIntensity: .55, roughness: .4 });
  const groove = new THREE.MeshStandardMaterial({ color: 0x2a3033, metalness: .6, roughness: .6 });

  const rig = new THREE.Group(); scene.add(rig);
  const rail = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 2, .4), dark); rig.add(rail);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), yellow); rig.add(fill);
  const capT = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 24), dark), capB = capT.clone(); rig.add(capT, capB);
  const knob = new THREE.Group(); rig.add(knob);
  const body = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 4, .12), steel); knob.add(body);
  const g1 = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 2, .3), groove), g2 = g1.clone(); knob.add(g1, g2);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), yellow); tip.rotation.z = Math.PI; knob.add(tip);

  let lw = 56, lh = 380, cw = 0, ch = 0, p = +(lever.getAttribute('aria-valuenow') || 0) / 100, tilt = 0, raf = 0;
  function layout() {
    lw = lever.clientWidth; lh = lever.clientHeight; if (!lw || !lh) return;
    cw = lw + PADX * 2; ch = lh + PADY * 2 + 30;
    Object.assign(cv.style, { left: -PADX + 'px', top: -PADY + 'px', width: cw + 'px', height: ch + 'px' });
    renderer.setSize(cw, ch, false);
    Object.assign(camera, { left: -cw / 2, right: cw / 2, top: ch / 2, bottom: -ch / 2 }); camera.updateProjectionMatrix();
    const kw = lw, kh = lw * 1.36, kd = lw * .55;
    rail.scale.set(8, lh, 8); rail.position.set(0, ch / 2 - PADY - lh / 2, -kd * .15);
    [capT, capB].forEach((c, i) => { c.scale.set(7, 6, 7); c.position.set(0, ch / 2 - PADY - (i ? lh : 0), -kd * .15); });
    body.scale.set(kw, kh, kd);
    [g1, g2].forEach((g, i) => { g.scale.set(4, kh * .5, 4); g.position.set((i ? 1 : -1) * kw * .2, 0, kd / 2 - 1); });
    tip.scale.set(6, 9, 6); tip.position.set(0, -kh / 2 - 7, 0);
    knob.userData = { kh, kd };
    draw();
  }
  function draw() {
    if (!cw) return;
    const { kh } = knob.userData, top = ch / 2 - PADY;                  // верх рейки в координатах сцени
    const cy = top - (p * (lh - 60) - 10 + kh / 2);                    // як у CSS-ручки: хід lh-60, зсув -10
    knob.position.set(0, cy, 0);
    const fl = Math.max(.001, top - cy); fill.scale.set(4, fl, 4); fill.position.set(0, top - fl / 2, -knob.userData.kd * .15 + 4.5);
    const drag = lever.classList.contains('drag'), goal = (drag ? -.62 : -.42) + (box.classList.contains('safe') ? .2 : 0);
    tilt += (goal - tilt) * .2;
    rig.rotation.set(.16, tilt, 0);
    yellow.emissiveIntensity = box.classList.contains('safe') ? .9 : .55;
    renderer.render(scene, camera);
    if (Math.abs(goal - tilt) > .002) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
  }
  window.IW_lever3d = v => { p = v; draw(); };
  new ResizeObserver(layout).observe(lever);
  ['pointerdown', 'pointerup', 'pointercancel'].forEach(t => lever.addEventListener(t, () => requestAnimationFrame(draw)));
  new MutationObserver(() => { if (box.hidden) { renderer.dispose(); pmrem.dispose(); window.IW_lever3d = null; } else draw(); }).observe(box, { attributes: true, attributeFilter: ['hidden', 'class'] });
  layout();
  lever.classList.add('is3d');
}
