/* Iron Wave — 3D-модуль за кресленням «Жалюзі у зборі» (zhaliuzi/geometry.json, мм → м).
   Спільний для заставки (intro3d.js) і блоку «Покрутіть модуль» (viewer3d.js).
   Осі: x — ширина (центр 0), y — вгору від низу модуля, z — до вулиці (+). Кімнатна грань рами z = −0,03.
   Ручку-вилку й тягу поставлено на праву стійку (на фронтальному кресленні місце ручки не вказане). */
import * as THREE from 'three';

export const mm = .001;
export const W = 1500 * mm, H = 2000 * mm, PF = 60 * mm, DEP = 60 * mm, RZ = -DEP / 2;
const MULL = 60 * mm;
export const LEAVES = [[-690 * mm, -30 * mm], [30 * mm, 690 * mm]];
export const AXES = [90, 192, 336, 479, 623, 766, 909, 1053, 1196, 1339, 1483, 1627, 1770].map(y => H - y * mm);
const TAIL = 25 * mm, BELOW = 172 * mm, PIV_Z = RZ - 7 * mm, T = 2.5 * mm;
const CLOSED = 12 * Math.PI / 180, OPEN = 85 * Math.PI / 180;
const BAR = { y0: H - 1816 * mm, y1: H - 66 * mm, d: 28.8 * mm, w: 75 * mm };
const LEVER = [[4.2,1309.6],[47.4,1277.5],[50.8,1274.9],[55,1268.2],[55.9,1260.5],[53.3,1252.1],[25.4,1199.6],[23.7,1193.7],[23.7,1185.2],[49.9,1079.4],[51.6,1074.3],[57.6,1068.4],[64.3,1065],[72.8,1064.1],[80.4,1067.5],[86.3,1073.5],[88.9,1081.1],[88.9,1088.7],[64.3,1187.7],[64.3,1195.4],[66.9,1203],[93.1,1246.2],[94.8,1250.4],[98.2,1261.4],[98.2,1273.2],[94.8,1284.2],[88,1293.6],[79.6,1301.2],[3,1349],[3,1319],[8.5,1319],[7.6,1314.7]];
const ELBOW = [43.2, 1191.0], HEX = [69.4, 1084.5], LT = 8 * mm, SWING = 35 * Math.PI / 180;
const SIDE_X = W / 2 - PF - 120 * mm;                        // ручка й тяга біля правої стійки, з боку кімнати
const LPLATES = [SIDE_X + 0 * mm, SIDE_X + 83 * mm];

export function materials() {
  return {
    body: new THREE.MeshPhysicalMaterial({ color: 0x3a4044, metalness: .55, roughness: .42, clearcoat: .3, clearcoatRoughness: .35, envMapIntensity: .6 }),
    slat: new THREE.MeshPhysicalMaterial({ color: 0x40474b, metalness: .6, roughness: .36, clearcoat: .35, clearcoatRoughness: .3, envMapIntensity: .6 }),
    steel: new THREE.MeshPhysicalMaterial({ color: 0x9aa6a9, metalness: .9, roughness: .28, envMapIntensity: .7 }),
    lever: new THREE.MeshPhysicalMaterial({ color: 0x3a4044, metalness: .55, roughness: .4, clearcoat: .3, emissive: 0xfcde00, emissiveIntensity: 0 }),
  };
}

export function buildModule() {
  const M = materials();
  const root = new THREE.Group(), bar = new THREE.Group(); root.add(bar);
  const box = (w, h, d, mat, x, y, z, g = root) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  // рама, імпост, верхня смуга
  box(W, PF, DEP, M.body, 0, H - PF / 2, 0); box(W, PF, DEP, M.body, 0, PF / 2, 0);
  box(PF, H - 2 * PF, DEP, M.body, -W / 2 + PF / 2, H / 2, 0); box(PF, H - 2 * PF, DEP, M.body, W / 2 - PF / 2, H / 2, 0);
  box(MULL, H - 2 * PF, DEP, M.body, 0, H / 2, 0);
  box(W - 2 * PF, 55 * mm, 4 * mm, M.body, 0, H - 87.5 * mm, DEP / 2 - 2 * mm);
  // ламелі: вісь біля кімнатного краю
  const slats = [];
  for (const [a, b] of LEAVES) {
    const L = b - a - 6 * mm, cx = (a + b) / 2;
    for (const y of AXES) {
      const p = new THREE.Group(); p.position.set(cx, y, PIV_Z); root.add(p);
      const m = new THREE.Mesh(new THREE.BoxGeometry(L, TAIL + BELOW, T), M.slat);
      m.position.set(0, (TAIL - BELOW) / 2, 0); m.castShadow = m.receiveShadow = true; p.add(m); slats.push(p);
    }
  }
  // тяга біля правої стійки + планка-направляюча
  box(BAR.w, BAR.y1 - BAR.y0, BAR.d, M.body, W / 2 - PF - BAR.w / 2 - 6 * mm, (BAR.y0 + BAR.y1) / 2, RZ - BAR.d / 2 - 4 * mm, bar);
  box(PF, BAR.y1 - BAR.y0, 7 * mm, M.steel, W / 2 - PF / 2, (BAR.y0 + BAR.y1) / 2, RZ - 4.5 * mm, bar);
  // ручка-вилка: дві пластини за контуром з креслення, вісь — у ліктьовому отворі
  const leverPivot = new THREE.Group();
  const ELY = H - ELBOW[1] * mm, ELZ = RZ - BAR.d - ELBOW[0] * mm;
  leverPivot.position.set(0, ELY, ELZ); root.add(leverPivot);
  const shape = new THREE.Shape(LEVER.map(([x, y]) => new THREE.Vector2((x - ELBOW[0]) * mm, (ELBOW[1] - y) * mm)));
  const lgeo = new THREE.ExtrudeGeometry(shape, { depth: LT, bevelEnabled: false });
  const leverMeshes = [];
  for (const xp of LPLATES) { const m = new THREE.Mesh(lgeo, M.lever); m.castShadow = true; m.rotation.y = Math.PI / 2; m.position.x = xp - LT / 2; leverPivot.add(m); leverMeshes.push(m); }
  const GRIP = new THREE.Vector3((LPLATES[0] + LPLATES[1]) / 2, (ELBOW[1] - HEX[1]) * mm, -(HEX[0] - ELBOW[0]) * mm);
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(11 * mm, 11 * mm, LPLATES[1] - LPLATES[0] + 30 * mm, 6), M.steel);
  hex.rotation.z = Math.PI / 2; hex.position.copy(GRIP); leverPivot.add(hex); leverMeshes.push(hex);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(8 * mm, 8 * mm, LPLATES[1] - LPLATES[0] + 12 * mm, 20), M.steel);
  axle.rotation.z = Math.PI / 2; axle.position.set((LPLATES[0] + LPLATES[1]) / 2, ELY, ELZ); root.add(axle);
  // кронштейн осі ручки до стійки
  box(W / 2 - PF - LPLATES[1] + 4 * mm, 40 * mm, 12 * mm, M.body, (LPLATES[1] + W / 2 - PF) / 2, ELY, ELZ, root);
  // невидима зона хвату
  const grab = new THREE.Mesh(new THREE.BoxGeometry(.24, .36, .18), new THREE.MeshBasicMaterial({ visible: false }));
  grab.position.set((LPLATES[0] + LPLATES[1]) / 2, ELY - .1, ELZ - .05); root.add(grab);

  /** k: 1 — закрито, 0 — відкрито. Ламелі, тяга й ручка рухаються як один механізм. */
  function setClosed(k) {
    const ang = OPEN + (CLOSED - OPEN) * k;
    for (const p of slats) p.rotation.x = -ang;
    bar.position.y = -0.08 * (Math.sin(ang) - Math.sin(CLOSED));
    leverPivot.rotation.x = (ang - CLOSED) / (OPEN - CLOSED) * SWING;
  }
  return { root, setClosed, leverPivot, GRIP, leverMeshes, grab, materials: M };
}
