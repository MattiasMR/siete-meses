(() => {
  'use strict';

  // ---------- Configuración ----------
  const START = new Date(2026, 3, 3); // 3 de abril de 2026 (los meses parten en 0)
  const GOAL = 7;
  const MONTHS = ['Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre'];
  const PALETTE = ['#5a1426', '#7a1f33', '#9b2c45', '#c45a72', '#e8a0b0', '#f6d3da'];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s) => document.querySelector(s);

  // ---------- Días juntos ----------
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.round((today - START) / 86400000));
  document.querySelectorAll('[data-days]').forEach((el) => { el.textContent = days; });

  // ---------- Utilidades ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  }

  function fitCanvas(cv, ctx) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return r;
  }

  // Corazón centrado en (cx, cy) de alto `s`
  function heartAt(c, cx, cy, s) {
    const x = cx, y = cy - s / 2;
    c.beginPath();
    c.moveTo(x, y + s * 0.3);
    c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    c.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    c.fill();
  }

  // ---------- Efectos (corazoncitos que explotan / lluvia) ----------
  const fx = $('#fx');
  const fctx = fx.getContext('2d');
  let fxRect = fitCanvas(fx, fctx);
  let parts = [];
  let fxRunning = false;
  let fxLast = 0;

  function burst(x, y, n) {
    if (reduceMotion) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 80 + Math.random() * 220;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, g: 520,
        s: 6 + Math.random() * 10, life: 1, fade: 0.8, c: PALETTE[i % PALETTE.length], r: Math.random() * 6 });
    }
    runFx();
  }

  function rain(n) {
    if (reduceMotion) n = Math.ceil(n / 4);
    for (let i = 0; i < n; i++) {
      parts.push({ x: Math.random() * fxRect.width, y: -20 - Math.random() * fxRect.height * 0.8,
        vx: (Math.random() - 0.5) * 50, vy: 70 + Math.random() * 90, g: 30,
        s: 8 + Math.random() * 12, life: 1, fade: 0.18, c: PALETTE[i % PALETTE.length], r: Math.random() * 6 });
    }
    runFx();
  }

  function runFx() {
    if (!fxRunning) { fxRunning = true; fxLast = 0; requestAnimationFrame(loopFx); }
  }

  function loopFx(t) {
    const dt = fxLast ? Math.min(0.05, (t - fxLast) / 1000) : 0.016;
    fxLast = t;
    fctx.clearRect(0, 0, fxRect.width, fxRect.height);
    for (const p of parts) {
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.fade * dt;
      p.r += dt * 2;
      fctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
      fctx.fillStyle = p.c;
      fctx.save();
      fctx.translate(p.x, p.y);
      fctx.rotate(Math.sin(p.r) * 0.5);
      heartAt(fctx, 0, 0, p.s);
      fctx.restore();
    }
    fctx.globalAlpha = 1;
    parts = parts.filter((p) => p.life > 0 && p.y < fxRect.height + 40);
    if (parts.length) requestAnimationFrame(loopFx);
    else { fxRunning = false; fctx.clearRect(0, 0, fxRect.width, fxRect.height); }
  }

  // ---------- Juego ----------
  const game = $('#game');
  const cv = $('#canvas');
  const ctx = cv.getContext('2d');
  const husky = $('#husky');
  const slots = $('#slots');
  const toast = $('#toast');

  const HEART_ICON = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>';

  let W = 0, H = 0, catchY = 0, gameLeft = 0;
  let hearts = [], caught = 0, running = false, last = 0, spawnT = 0;
  let hx = 0, tx = 0;
  const keys = { left: false, right: false };

  function renderSlots() {
    slots.innerHTML = '';
    for (let i = 0; i < GOAL; i++) {
      const s = document.createElement('span');
      s.className = 'slot';
      s.innerHTML = HEART_ICON;
      slots.appendChild(s);
    }
    slots.setAttribute('aria-label', `0 de ${GOAL} corazones`);
  }

  function measure() {
    const r = fitCanvas(cv, ctx);
    W = r.width; H = r.height; gameLeft = r.left;
    const hr = husky.getBoundingClientRect();
    catchY = hr.top - r.top + hr.height * 0.3;
    const hw = husky.offsetWidth;
    tx = Math.max(hw / 2, Math.min(W - hw / 2, tx || W / 2));
    hx = Math.max(hw / 2, Math.min(W - hw / 2, hx || W / 2));
  }

  function startGame() {
    caught = 0; hearts = []; hx = tx = 0;
    renderSlots();
    show('game');
    requestAnimationFrame(() => {
      measure();
      running = true; last = 0; spawnT = 0.4;
      requestAnimationFrame(tick);
    });
  }

  function spawn() {
    const s = 28 + Math.random() * 14;
    hearts.push({
      x: s + Math.random() * (W - 2 * s), y: -s,
      v: H * (0.26 + Math.random() * 0.14),
      s, t: Math.random() * 6, w: 1.5 + Math.random() * 1.5, a: 6 + Math.random() * 10,
      c: Math.random() < 0.5 ? '#9b2c45' : '#c45a72'
    });
  }

  function tick(t) {
    if (!running) return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
    last = t;

    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = 0.65 + Math.random() * 0.5; }

    const hw = husky.offsetWidth;
    if (keys.left) tx -= 560 * dt;
    if (keys.right) tx += 560 * dt;
    tx = Math.max(hw / 2, Math.min(W - hw / 2, tx));
    hx += (tx - hx) * Math.min(1, dt * 14);
    husky.style.transform = `translateX(${hx - hw / 2}px)`;

    ctx.clearRect(0, 0, W, H);
    for (const h of hearts) {
      h.y += h.v * dt;
      h.t += dt;
      const x = h.x + Math.sin(h.t * h.w) * h.a;
      if (h.y > catchY - 12 && h.y < catchY + 34 && Math.abs(x - hx) < hw * 0.5) {
        h.done = true;
        onCatch(x, h.y);
        if (!running) break;
        continue;
      }
      if (h.y > H + 50) { h.done = true; continue; }
      ctx.fillStyle = h.c;
      heartAt(ctx, x, h.y, h.s);
    }
    hearts = hearts.filter((h) => !h.done);

    if (running) requestAnimationFrame(tick);
  }

  function onCatch(x, y) {
    caught++;
    const slot = slots.children[caught - 1];
    if (slot) slot.classList.add('filled');
    slots.setAttribute('aria-label', `${caught} de ${GOAL} corazones`);

    toast.textContent = `${MONTHS[caught - 1]} 💕`;
    toast.classList.remove('show'); void toast.offsetWidth; toast.classList.add('show');

    husky.classList.remove('happy'); void husky.offsetWidth; husky.classList.add('happy');
    burst(x + gameLeft, y, 14);
    if (navigator.vibrate) navigator.vibrate(20);

    if (caught >= GOAL) {
      running = false;
      hearts = [];
      ctx.clearRect(0, 0, W, H);
      toast.textContent = '¡Los 7 meses! 💕';
      burst(fxRect.width / 2, fxRect.height / 2, 40);
      setTimeout(() => show('letter'), 1300);
    }
  }

  // Controles
  function pointTo(e) { tx = e.clientX - gameLeft; }
  game.addEventListener('pointerdown', pointTo);
  game.addEventListener('pointermove', pointTo);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });
  window.addEventListener('resize', () => {
    fxRect = fitCanvas(fx, fctx);
    if (running) measure();
  });

  // ---------- Cartita ----------
  const letter = $('#letter');
  const envelope = $('#envelope');

  envelope.addEventListener('click', () => {
    if (envelope.classList.contains('open')) return;
    envelope.classList.add('open');
    setTimeout(() => {
      letter.classList.add('reveal');
      rain(70);
    }, 650);
  });

  $('#replay').addEventListener('click', () => {
    letter.classList.remove('reveal');
    envelope.classList.remove('open');
    startGame();
  });

  $('#start').addEventListener('click', startGame);
})();
