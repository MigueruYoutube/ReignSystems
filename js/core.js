/* ============================================================
   RPG System — core.js
   Núcleo: utilitários, storage (localStorage), áudio (Web Audio
   API), tema claro/escuro, modais, router SPA, partículas de
   fundo e contador de visitantes. Todos os outros módulos (dice.js,
   npc.js, etc.) se registram em RPG.modules[pageId] = {onShow(){}}.
   ============================================================ */

window.RPG = window.RPG || {};
RPG.modules = {}; // preenchido pelos demais arquivos .js

/* ---------------------------- UTIL ---------------------------- */
RPG.util = {
  randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  randFloat(min, max) { return Math.random() * (max - min) + min; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  pickN(arr, n) {
    const copy = arr.slice(); const out = [];
    n = Math.min(n, copy.length);
    for (let i = 0; i < n; i++) { const idx = Math.floor(Math.random() * copy.length); out.push(copy.splice(idx, 1)[0]); }
    return out;
  },
  uid() { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
  formatDateTime(d) {
    d = d instanceof Date ? d : new Date(d);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  clamp(v, min, max) { return Math.min(Math.max(v, min), max); },
  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  safeMathEval(expr) {
    if (typeof expr !== 'string') return NaN;
    const cleaned = expr.replace(/,/g, '.').trim();
    if (!cleaned || !/^[0-9+\-*/().\s]+$/.test(cleaned)) return NaN;
    try {
      const fn = new Function('"use strict";return (' + cleaned + ')');
      const r = fn();
      return (typeof r === 'number' && isFinite(r)) ? r : NaN;
    } catch (e) { return NaN; }
  },
  download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
  readFileAsText(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); }); },
  readFileAsDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
};

/* --------------------------- STORAGE --------------------------- */
(function () {
  const PREFIX = 'rpgSystem_';
  RPG.storage = {
    PREFIX,
    get(key, fallback) {
      try { const raw = localStorage.getItem(PREFIX + key); return raw === null ? fallback : JSON.parse(raw); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
      catch (e) { RPG.toast && RPG.toast.show('Armazenamento local cheio ou indisponível.', 'error'); return false; }
    },
    remove(key) { localStorage.removeItem(PREFIX + key); },
    allKeys() {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length)); }
      return out;
    },
    exportAll() { const out = {}; this.allKeys().forEach(k => { out[k] = this.get(k, null); }); return out; },
    downloadExport() {
      const payload = { app: 'RPG System', version: 1, exportedAt: new Date().toISOString(), data: this.exportAll() };
      RPG.util.download('rpg-system-backup.json', JSON.stringify(payload, null, 2), 'application/json');
    },
    importFromObject(payload) {
      const data = (payload && typeof payload === 'object' && payload.data) ? payload.data : payload;
      if (!data || typeof data !== 'object') return false;
      Object.keys(data).forEach(k => this.set(k, data[k]));
      return true;
    },
    clearAll() { this.allKeys().forEach(k => this.remove(k)); }
  };
})();

/* ---------------------------- AUDIO ----------------------------
   Todos os efeitos são sintetizados via osciladores (Web Audio API),
   sem nenhum arquivo de áudio externo.                             */
(function () {
  let ctx = null, masterGain = null, ambient = null, ambientAudio = null;
  function isOn() { return RPG.storage.get('soundOn', true); }
  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = RPG.storage.get('sfxVolume', 0.6);
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, gainVal, delay) {
    if (!isOn()) return;
    const c = ensureCtx();
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gainVal || 0.3, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }
  RPG.audio = {
    ensureCtx,
    click() { tone(720, 0.06, 'square', 0.14); },
    diceRoll() {
      if (!isOn()) return; ensureCtx();
      const n = 6 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) tone(170 + Math.random() * 280, 0.045, 'square', 0.17, i * 0.085 + Math.random() * 0.02);
    },
    reveal() {
      if (!isOn()) return; ensureCtx();
      [523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.24, 'triangle', 0.2, i * 0.075));
    },
    notify() {
      if (!isOn()) return; ensureCtx();
      tone(660, 0.12, 'sine', 0.18, 0); tone(880, 0.2, 'sine', 0.2, 0.1);
    },
    error() {
      if (!isOn()) return; ensureCtx();
      tone(220, 0.18, 'sawtooth', 0.12, 0);
    },
    startAmbient() {
      if (!isOn() || !RPG.storage.get('ambientOn', false) || ambientAudio) return;
      const audio = new Audio('audio/ambient-tavern.mp3');
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = RPG.storage.get('sfxVolume', 0.6);
      ambientAudio = audio;
      audio.play().catch(() => {});
    },
    stopAmbient() {
      if (!ambientAudio) return;
      ambientAudio.pause();
      ambientAudio.currentTime = 0;
      ambientAudio.src = '';
      ambientAudio.load();
      ambientAudio = null;
    },
    setVolume(v) { RPG.storage.set('sfxVolume', v); if (masterGain) masterGain.gain.value = v; if (ambientAudio) ambientAudio.volume = v; }
  };
})();

/* ---------------------------- TOAST ---------------------------- */
RPG.toast = {
  show(msg, type) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    const icon = type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${RPG.util.escapeHtml(msg)}</span>`;
    c.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2800);
  }
};

/* ---------------------------- MODAL ----------------------------- */
RPG.modal = {
  _resolve: null,
  _hideTimer: null,
  show(title, html) {
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    box.innerHTML = `<button class="modal-close" aria-label="Fechar" id="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
      <h3 class="modal-title">${title}</h3><div class="modal-body">${html}</div>`;
    if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('show'));
    document.getElementById('modal-close-btn').addEventListener('click', () => RPG.modal.hide());
  },
  hide() {
    const overlay = document.getElementById('modal-overlay');
    if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }
    overlay.classList.remove('show');
    this._hideTimer = setTimeout(() => { overlay.classList.add('hidden'); this._hideTimer = null; }, 200);
    if (this._resolve) { const r = this._resolve; this._resolve = null; r(false); }
  },
  showHelp(pageId) {
    const content = (window.RPGHelp && window.RPGHelp[pageId]) || '<p>Sem ajuda disponível para esta página ainda.</p>';
    this.show('<i class="fa-solid fa-circle-question"></i> Ajuda', content);
  },
  confirm(message) {
    return new Promise(resolve => {
      this._resolve = resolve;
      const html = `<p>${RPG.util.escapeHtml(message)}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="modal-cancel" type="button">Cancelar</button>
          <button class="btn btn-danger" id="modal-confirm" type="button">Confirmar</button>
        </div>`;
      this.show('Confirmação', html);
      document.getElementById('modal-cancel').addEventListener('click', () => { this._resolve = null; resolve(false); this.hide(); });
      document.getElementById('modal-confirm').addEventListener('click', () => { this._resolve = null; resolve(true); this.hide(); });
    });
  },
  confirmTyped(message, word) {
    return new Promise(resolve => {
      this._resolve = resolve;
      const html = `<p>${RPG.util.escapeHtml(message)}</p>
        <p class="modal-hint">Digite <strong>${word}</strong> no campo abaixo para confirmar:</p>
        <input type="text" id="modal-typed-input" class="text-input" autocomplete="off" spellcheck="false" />
        <div class="modal-actions">
          <button class="btn btn-ghost" id="modal-cancel" type="button">Cancelar</button>
          <button class="btn btn-danger" id="modal-confirm" type="button" disabled>Apagar tudo</button>
        </div>`;
      this.show('⚠️ Ação irreversível', html);
      const input = document.getElementById('modal-typed-input');
      const confirmBtn = document.getElementById('modal-confirm');
      input.addEventListener('input', () => { confirmBtn.disabled = input.value.trim().toUpperCase() !== word.toUpperCase(); });
      requestAnimationFrame(() => input.focus());
      document.getElementById('modal-cancel').addEventListener('click', () => { this._resolve = null; resolve(false); this.hide(); });
      confirmBtn.addEventListener('click', () => { this._resolve = null; resolve(true); this.hide(); });
    });
  }
};

/* ---------------------------- THEME ------------------------------ */
RPG.theme = {
  init() {
    const saved = RPG.storage.get('theme', null);
    const theme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    this.updateIcon();
  },
  toggle() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    RPG.storage.set('theme', next);
    this.updateIcon();
  },
  updateIcon() {
    const btn = document.getElementById('btn-theme');
    if (!btn) return;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = dark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }
};

/* -------------------------- PARTICLES ----------------------------- */
RPG.particles = {
  init(canvas) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    function resize() { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);
    if (reduce) return; // respeita preferência de movimento reduzido
    const COUNT = window.innerWidth < 700 ? 26 : 55;
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + 0.4,
        vy: -(Math.random() * 0.22 + 0.04), vx: (Math.random() - 0.5) * 0.12,
        a: Math.random() * 0.45 + 0.12, hue: Math.random() < 0.5 ? '201,169,97' : '107,77,171'
      });
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.y += p.vy; p.x += p.vx;
        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        ctx.beginPath(); ctx.fillStyle = `rgba(${p.hue},${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      requestAnimationFrame(tick);
    }
    tick();
  }
};

/* ---------------------------- ROUTER ------------------------------- */
RPG.router = {
  PAGE_IDS: ['home', 'dados', 'anotacoes', 'ficha', 'calculadora', 'npc', 'itens', 'combate', 'tracker', 'feedback', 'extras', 'config'],
  current: null,
  init() {
    window.addEventListener('hashchange', () => this.go(location.hash.slice(1) || 'home'));
    this.go(location.hash.slice(1) || 'home', true);
  },
  go(id, initial) {
    if (this.PAGE_IDS.indexOf(id) === -1) id = 'home';
    if (this.current === id && !initial) return;
    const prevEl = this.current ? document.getElementById('page-' + this.current) : null;
    const nextEl = document.getElementById('page-' + id);
    if (!nextEl) return;
    if (prevEl) prevEl.classList.remove('active');
    nextEl.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.page === id));
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.current = id;
    const sidemenu = document.getElementById('sidemenu');
    if (sidemenu) sidemenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    const mod = RPG.modules[id];
    if (mod && typeof mod.onShow === 'function') mod.onShow();
  }
};

/* ----------------------------- BOOT --------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  RPG.theme.init();
  RPG.router.init();

  const canvas = document.getElementById('particles-canvas');
  if (canvas) RPG.particles.init(canvas);

  const soundBtn = document.getElementById('btn-sound');
  function updateSoundIcon() {
    const on = RPG.storage.get('soundOn', true);
    if (soundBtn) soundBtn.innerHTML = on ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
  }
  updateSoundIcon();
  if (soundBtn) soundBtn.addEventListener('click', () => {
    const next = !RPG.storage.get('soundOn', true);
    RPG.storage.set('soundOn', next);
    updateSoundIcon();
    if (next) { RPG.audio.click(); if (RPG.storage.get('ambientOn', false)) RPG.audio.startAmbient(); } else { RPG.audio.stopAmbient(); RPG.audio.ensureCtx(); }
  });

  const themeBtn = document.getElementById('btn-theme');
  if (themeBtn) themeBtn.addEventListener('click', () => RPG.theme.toggle());

  const menuBtn = document.getElementById('btn-menu');
  const sidemenu = document.getElementById('sidemenu');
  if (menuBtn && sidemenu) menuBtn.addEventListener('click', () => {
    sidemenu.classList.toggle('open');
    document.body.classList.toggle('menu-open');
  });
  const menuOverlay = document.getElementById('menu-overlay');
  if (menuOverlay) menuOverlay.addEventListener('click', () => {
    sidemenu.classList.remove('open'); document.body.classList.remove('menu-open');
  });

  document.querySelectorAll('[data-help]').forEach(btn => btn.addEventListener('click', () => RPG.modal.showHelp(btn.dataset.help)));

  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target.id === 'modal-overlay') RPG.modal.hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') RPG.modal.hide(); });

  const scrollCta = document.getElementById('btn-scroll-cards');
  if (scrollCta) scrollCta.addEventListener('click', () => document.getElementById('nav-cards').scrollIntoView({ behavior: 'smooth' }));

  // som de clique delegado (cobre elementos criados dinamicamente)
  document.body.addEventListener('click', (e) => {
    const el = e.target.closest('button, a.card-nav, a.nav-link, a.footer-discord');
    if (el && !el.disabled) RPG.audio.click();
  });

  setTimeout(() => { const l = document.getElementById('boot-loader'); if (l) l.classList.add('hide'); }, 350);

  // desbloqueia o AudioContext e tenta iniciar o som ambiente na 1ª interação
  document.addEventListener('click', function firstInteraction() {
    RPG.audio.ensureCtx();
    if (RPG.storage.get('ambientOn', false)) RPG.audio.startAmbient();
    document.removeEventListener('click', firstInteraction);
  }, { once: true });
});
