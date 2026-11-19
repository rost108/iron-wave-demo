/* Iron Wave — публічний сайт. Секвенція кадрів (Blender Cycles), форма, чат, cookie, вікно при виході,
   власна аналітика, режим редагування для панелі. Налаштування приходять з сервера у window.IW. */
(() => {
const IW = window.IW || {}, W = IW.widgets || {}, T = IW.t || {};
const $ = (s, r = document) => r.querySelector(s);
const post = (u, d) => fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) }).then(r => r.json());
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };


/* ---------- заставка: тягнеш ручку → ламелі відкриваються → проліт крізь щілину в сайт ---------- */
function intro2d() {
  const box = $('#intro'); if (!box || IW.edit || window.IW_introMode) return; window.IW_introMode = '2d'; box.classList.remove('is3d', 'loading');
  let seen = null; try { seen = sessionStorage.getItem('iw_intro'); } catch {}
  if (seen && !/[?&]intro\b/.test(location.search)) return;
  box.hidden = false; document.documentElement.classList.add('intro-on');
  const cv = $('#introCv'), cx = cv.getContext('2d'), lever = $('#lever'), knob = $('.lever-knob', lever), fill = $('.lever-fill', lever);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CLOSED = 57, OPEN = 36, IW_ = 1600, IH_ = 900;               // кадри рендера: вид спереду, закрито → відкрито
  const MOD = { cx: .5 * IW_, cy: .567 * IH_, w: .2568 * IW_, h: .609 * IH_ }, GAP = { x: .4132 * IW_, y: .5394 * IH_ };
  const frames = {}; for (let f = OPEN; f <= CLOSED; f++) { const im = new Image(); im.src = `assets/seq/l_${String(f).padStart(4, '0')}.jpg`; im.onload = draw; frames[f] = im; }
  let p = 0, z = 0, W = 0, H = 0, dpr = 1, done = false;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function size() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; draw(); }
  function draw() {
    if (!W) return;
    const f = Math.round(OPEN + p * (CLOSED - OPEN)); let im = frames[f];               // ручка вниз → ламелі закриваються
    for (let d = 1; !(im && im.complete && im.naturalWidth) && d < 22; d++) im = frames[f + d] || frames[f - d];
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.fillStyle = '#020202'; cx.fillRect(0, 0, W, H);
    if (!(im && im.complete && im.naturalWidth)) return;
    const s0 = Math.min(H * .5 / MOD.h, W * .66 / MOD.w), k = ease(z), s = s0 * (1 + Math.pow(z, 2.4) * 46);
    const fx = MOD.cx + (GAP.x - MOD.cx) * k, fy = MOD.cy + (GAP.y - MOD.cy) * k;      // точка, на яку «летимо»
    const sx = W / 2, sy = H * (.6 - .1 * k);
    cx.drawImage(im, sx - fx * s, sy - fy * s, IW_ * s, IH_ * s);
    if (z > .55) { cx.fillStyle = `rgba(255,240,214,${Math.min(1, (z - .55) / .4)})`; cx.fillRect(0, 0, W, H); }   // світло з-за ламелей
  }
  function setP(v) {
    p = Math.max(0, Math.min(1, v)); const h = lever.clientHeight;
    knob.style.top = (p * (h - 60)) + 'px'; fill.style.height = (p * (h - 60)) + 'px';
    lever.setAttribute('aria-valuenow', Math.round(p * 100)); draw();
    if (p >= 1 && !done) go();
  }
  function tween(from, to, ms, fn, then) { const t0 = performance.now(); (function st(t) { const k = Math.min(1, (t - t0) / ms); fn(from + (to - from) * ease(k)); if (k < 1) requestAnimationFrame(st); else then && then(); })(t0); }
  function finish() {
    box.style.transition = 'opacity .45s ease'; box.style.opacity = '0';
    setTimeout(() => { box.hidden = true; document.documentElement.classList.remove('intro-on'); try { sessionStorage.setItem('iw_intro', '1'); } catch {} dispatchEvent(new Event('resize')); }, 460);
  }
  // жалюзі закрились → «Ти в безпеці.» на місці заголовка → проліт у сайт
  function go() {
    if (done) return; done = true;
    try { navigator.vibrate && navigator.vibrate(18); } catch {}
    box.classList.add('safe'); const t = $('.intro-title', box); if (t) t.style.opacity = 0;
    const ob = $('.intro-open', box); if (ob) { ob.textContent = ob.dataset.enter || 'Увійти'; ob.onclick = fly; }
    setTimeout(fly, RM ? 1200 : 2200);
  }
  let flying = false;
  function fly() {
    if (flying) return; flying = true; box.classList.add('go');
    finish();
  }
  // ручка: тягнути вниз (миша, палець), клавіші, колесо
  let drag = null;
  lever.addEventListener('pointerdown', e => { if (done) return; drag = { y: e.clientY, p }; lever.classList.add('drag'); lever.setPointerCapture(e.pointerId); e.preventDefault(); });
  lever.addEventListener('pointermove', e => { if (drag) setP(drag.p + (e.clientY - drag.y) / (lever.clientHeight - 60)); });
  const release = () => { if (!drag) return; drag = null; lever.classList.remove('drag'); if (!done) tween(p, p > .45 ? 1 : 0, 450, setP); };
  lever.addEventListener('pointerup', release); lever.addEventListener('pointercancel', release);
  lever.addEventListener('keydown', e => { if (['ArrowDown', 'PageDown'].includes(e.key)) { setP(p + .1); e.preventDefault(); } if (['ArrowUp', 'PageUp'].includes(e.key)) { setP(p - .1); e.preventDefault(); } if (e.key === 'Enter' || e.key === ' ') { tween(p, 1, 700, setP); e.preventDefault(); } });
  box.addEventListener('wheel', e => { if (!done) { setP(p + e.deltaY / 900); e.preventDefault(); } }, { passive: false });
  let ty = null; box.addEventListener('touchstart', e => { if (!e.target.closest('.lever,button')) ty = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchmove', e => { if (ty != null && !done) { setP(p + (ty - e.touches[0].clientY) / 500); ty = e.touches[0].clientY; } }, { passive: true });
  $('.intro-open', box).onclick = () => { if (!done) tween(p, 1, 900, setP); };
  $('.intro-skip', box).onclick = () => { done = true; finish(); };
  addEventListener('resize', () => { if (!box.hidden) { size(); setP(p); } });
  size(); setP(0); lever.focus({ preventScroll: true });
}
/* Вибір заставки: за замовчуванням — рендер-кадри з окремою ручкою (intro2d); 3D-версія — лише з ?intro3d. */
(function pickIntro() {
  const box = $('#intro'); if (!box || IW.edit) return;
  let seen = null; try { seen = sessionStorage.getItem('iw_intro'); } catch {}
  if (seen && !/[?&]intro\b/.test(location.search)) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gl = false; try { const c = document.createElement('canvas'); gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch {}
  if (!gl || RM || !/[?&]intro3d\b/.test(location.search)) return intro2d();
  box.hidden = false; box.classList.add('is3d', 'loading'); document.documentElement.classList.add('intro-on');
  window.IW_intro2d = intro2d;
  setTimeout(() => { if (!window.IW_introMode) intro2d(); }, 7000);        // повільний інтернет — не тримати людину
  const s = document.createElement('script'); s.type = 'module'; s.src = 'intro3d.js';
  s.onerror = () => { if (!window.IW_introMode) intro2d(); }; document.head.append(s);
})();

/* ---------- блок «Зовні»: 3D-фасад (facade3d.js) підвантажується, коли блок поруч ---------- */
(function lazyFacade() {
  const f = document.getElementById('facade'); if (!f) return;
  let gl = false; try { const c = document.createElement('canvas'); gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch {}
  if (!gl) { f.classList.add('f3d-fail'); return; }
  const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect();
    const sc = document.createElement('script'); sc.type = 'module'; sc.src = 'facade3d.js'; sc.onerror = () => f.classList.add('f3d-fail'); document.head.append(sc); }, { rootMargin: '900px 0px' });
  io.observe(f);
})();

/* ---------- блок «Покрутіть модуль»: 3D підвантажується, коли блок поруч ---------- */
(function lazyViewer() {
  const v = document.getElementById('viewer3d'); if (!v) return;
  let gl = false; try { const c = document.createElement('canvas'); gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch {}
  if (!gl) { v.classList.add('v3d-fail'); return; }
  const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect();
    const s = document.createElement('script'); s.type = 'module'; s.src = 'viewer3d.js'; s.onerror = () => v.classList.add('v3d-fail'); document.head.append(s); }, { rootMargin: '800px 0px' });
  io.observe(v);
})();

/* ---------- історія: кадри за прогресом гортання ---------- */
const N = 161, SRC = i => `assets/seq/l_${String(i).padStart(4, '0')}.jpg`;
const story = $('#story'), cv = $('#seq'), cx = cv.getContext('2d');
const chaps = [...document.querySelectorAll('.chap')], labs = [...document.querySelectorAll('.lab')], cue = $('#cue');
const imgs = new Array(N); let annot = {}, cur = -1, dpr = 1, CW = 0, CH = 0, want = 0, geo = { s: 1, ox: 0, oy: 0, iw: 1600, ih: 900 };
fetch('assets/seq/annot.json').then(r => r.json()).then(j => { annot = j; cur = -1; tick(); }).catch(() => {});
function load(i) { if (imgs[i]) return imgs[i]; const im = new Image(); im.decoding = 'async'; im.src = SRC(i); im.onload = () => { if (Math.abs(i - want) < 2) { cur = -1; tick(); } }; return imgs[i] = im; }
[0, 40, 80, 120, 160].forEach(load); let q = 0; (function bg() { for (let k = 0; k < 6 && q < N; k++) load(q++); if (q < N) setTimeout(bg, 60); })();
const progress = () => { const r = story.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / (story.offsetHeight - innerHeight))); };
function vis(el, p) { const a = +el.dataset.in, b = +el.dataset.out, f = .03; if (a === 0 && p < b - f) return 1; return Math.max(0, Math.min(1, (p - a) / f, (b - p) / f)); }
function resize() { dpr = Math.min(2, devicePixelRatio || 1); CW = cv.clientWidth; CH = cv.clientHeight; cv.width = CW * dpr; cv.height = CH * dpr; cur = -1; tick(); }
function nearestLoaded(i) { for (let d = 0; d < N; d++) for (const j of [i - d, i + d]) if (j >= 0 && j < N && imgs[j] && imgs[j].complete && imgs[j].naturalWidth) return j; return -1; }
function tick() {
  if (!CW) return;
  const p = progress(); want = Math.round(p * (N - 1)); load(want);
  const j = nearestLoaded(want);
  if (j >= 0 && j !== cur) {
    const im = imgs[j], iw = im.naturalWidth, ih = im.naturalHeight, s = Math.max(CW / iw, CH / ih), ox = (CW - iw * s) / 2, oy = (CH - ih * s) / 2;
    geo = { s, ox, oy, iw, ih };
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.fillStyle = '#020202'; cx.fillRect(0, 0, CW, CH); cx.drawImage(im, ox, oy, iw * s, ih * s); cur = j;
  }
  chaps.forEach(el => { const v = vis(el, p); el.style.opacity = v; el.style.transform = `translateY(${(1 - v) * 16}px)`; });
  const a = annot[`l_${String(cur < 0 ? want : cur).padStart(4, '0')}.png`];
  labs.forEach(el => {
    const v = a ? vis(el, p) : 0; el.style.opacity = v; if (!v) return;
    const [nx, ny] = a[el.dataset.a]; const x = geo.ox + nx * geo.iw * geo.s, y = geo.oy + ny * geo.ih * geo.s;
    el.style.transform = `translate(${Math.min(x + 10, CW - el.offsetWidth - 12)}px,${y - 8}px)`;
  });
  if (cue) cue.style.opacity = p > .02 ? 0 : 1;
}
addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true });
new ResizeObserver(resize).observe(cv);
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.rv').forEach(e => io.observe(e));

if (IW.edit) return editMode();
if (IW.demo) return demoMode();

/* ---------- аналітика (Аналітика / Огляд у панелі) ---------- */
const consent = () => !W.cookie_on || store.get('iw_consent') === '1';
function vid() { if (!consent()) return ''; let v = store.get('iw_vid'); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set('iw_vid', v); } return v; }
const utm = location.search.includes('utm_') ? location.search.slice(1) : '';
const beacon = (u, d) => { try { navigator.sendBeacon(u, new Blob([JSON.stringify(d)], { type: 'application/json' })); } catch {} };
beacon('/api/pv', { path: location.pathname, ref: document.referrer, utm, vid: vid(), w: innerWidth });
document.addEventListener('click', e => { const t = e.target.closest('[data-track]'); if (t) beacon('/api/click', { kind: t.dataset.track, path: location.pathname }); });

/* ---------- форма заявки → Звернення ---------- */
const form = $('#leadForm');
form?.addEventListener('submit', async e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form)); d.page = location.pathname; d.utm = utm; d.source = 'form';
  const btn = form.querySelector('button'); btn.disabled = true;
  try { const r = await post('/api/lead', d); if (r.ok) { form.querySelectorAll('input,textarea,button').forEach(x => x.hidden = true); $('.ok', form).hidden = false; } else { alert(r.error || 'Помилка'); btn.disabled = false; } }
  catch { alert('Мережа недоступна. Спробуйте ще раз.'); btn.disabled = false; }
});

/* ---------- плаваючі кнопки, чат, «передзвоніть» ---------- */
const fab = document.createElement('div'); fab.className = 'iw-fab'; document.body.append(fab);
if (W.callback_on) { const b = document.createElement('button'); b.className = 'cb-b'; b.textContent = T['w.callback']; b.dataset.track = 'callback'; b.onclick = () => modal(W.exit_text, 'callback'); fab.append(b); }
if (W.chat_on) {
  const b = document.createElement('button'); b.className = 'chat-b'; b.textContent = W.chat_title || 'Чат'; b.dataset.track = 'chat-open'; fab.append(b);
  const box = document.createElement('div'); box.className = 'iw-chat'; box.setAttribute('role', 'dialog');
  box.innerHTML = `<header><span></span><button aria-label="Закрити">×</button></header><div class="iw-log"></div><form><input maxlength="800"><button>›</button></form>`;
  document.body.append(box);
  $('header span', box).textContent = W.chat_title || ''; $('input', box).placeholder = T['w.chat_ph'] || '';
  const log = $('.iw-log', box), add = (role, text) => { const m = document.createElement('div'); m.className = 'iw-m ' + role; m.textContent = text; log.append(m); log.scrollTop = 1e9; return m; };
  let started = false, conv = store.get('iw_conv') || '';
  b.onclick = () => { box.classList.toggle('open'); if (!started) { started = true; add('a', W.chat_greeting); } $('input', box).focus(); };
  $('header button', box).onclick = () => box.classList.remove('open');
  $('form', box).onsubmit = async e => {
    e.preventDefault(); const inp = $('input', box), text = inp.value.trim(); if (!text) return; inp.value = ''; add('u', text);
    const wait = add('a', '…');
    try { const r = await post('/api/chat', { conv, text, page: location.pathname, vid: vid() }); conv = r.conv || conv; store.set('iw_conv', conv); wait.textContent = r.reply || 'Помилка'; }
    catch { wait.textContent = 'Мережа недоступна. Залиште телефон у формі внизу сторінки.'; }
  };
}

/* ---------- cookie-банер ---------- */
if (W.cookie_on && !store.get('iw_consent')) {
  const c = document.createElement('div'); c.className = 'iw-cookie'; c.innerHTML = '<span></span><button></button>';
  $('span', c).textContent = T['w.cookie']; $('button', c).textContent = T['w.cookie_ok'];
  $('button', c).onclick = () => { store.set('iw_consent', '1'); c.remove(); document.body.classList.remove('has-cookie'); }; document.body.append(c); document.body.classList.add('has-cookie');
}

/* ---------- вікно при виході (десктоп) ---------- */
if (W.exit_on && !store.get('iw_exit')) document.addEventListener('mouseout', function h(e) { if (!e.relatedTarget && e.clientY < 4) { store.set('iw_exit', '1'); document.removeEventListener('mouseout', h); modal(W.exit_text, 'exit'); } });

function modal(text, source) {
  const m = document.createElement('div'); m.className = 'iw-modal';
  m.innerHTML = `<div class="box"><p></p><form><input name="name" maxlength="80"><input name="phone" required inputmode="tel" maxlength="30"><button></button><button type="button" class="x">Закрити</button></form></div>`;
  $('p', m).textContent = text; $('[name=name]', m).placeholder = T['form.name']; $('[name=phone]', m).placeholder = T['form.phone']; $('form button', m).textContent = T['form.send'];
  $('.x', m).onclick = () => m.remove(); m.onclick = e => { if (e.target === m) m.remove(); };
  $('form', m).onsubmit = async e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); d.source = source; d.page = location.pathname; d.utm = utm; const r = await post('/api/lead', d); $('p', m).textContent = r.ok ? T['form.ok'] : (r.error || 'Помилка'); if (r.ok) e.target.remove(); };
  document.body.append(m); $('[name=phone]', m).focus();
}

/* ---------- демо-копія для показу замовнику: без сервера, нічого не відправляє ---------- */
function demoMode() {
  const form = $('#leadForm');
  form?.addEventListener('submit', e => { e.preventDefault(); const ok = $('.ok', form); ok.textContent = 'Це демо-версія сайту: заявка не відправляється. На робочому сайті вона одразу потрапить менеджеру.'; ok.hidden = false; });
}

/* ---------- режим редагування: клік по тексту → правка → панель зберігає ---------- */
function editMode() {
  document.body.classList.add('iw-edit');
  document.querySelectorAll('.rv').forEach(e => e.classList.add('in'));
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-k],[data-c]'); if (!el) return;
    e.preventDefault(); e.stopPropagation();
    if (el.isContentEditable) return;
    const before = el.innerText; el.contentEditable = 'true'; el.focus();
    const done = () => {
      el.contentEditable = 'false'; el.removeEventListener('blur', done);
      const value = el.innerText.replace(/ /g, ' ').trim();
      if (value !== before.trim()) parent.postMessage({ type: 'iw-save', k: el.dataset.k, c: el.dataset.c, value }, location.origin);
    };
    el.addEventListener('blur', done);
    el.addEventListener('keydown', ev => { if (ev.key === 'Escape') { el.innerText = before; el.blur(); } if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); el.blur(); } });
  }, true);
  addEventListener('message', e => {
    if (e.origin !== location.origin || e.data?.type !== 'iw-saved') return;
    const n = document.createElement('div'); n.className = 'iw-saved'; n.textContent = e.data.ok ? 'Збережено' : ('Не збережено: ' + (e.data.error || '')); document.body.append(n); setTimeout(() => n.remove(), 1600);
  });
  // повідомити панель, які ключі є на сторінці (для вкладки «Поля»)
  parent.postMessage({ type: 'iw-fields', keys: [...new Set([...document.querySelectorAll('[data-k]')].map(e => e.dataset.k))] }, location.origin);
}
})();
