/* ============================================================
   RPG System — tracker.js — Página "Status de NPCs/Players"
   ============================================================ */
(function () {
  let entries = RPG.storage.get('trackerEntries', []);
  function saveEntries() { RPG.storage.set('trackerEntries', entries); }
  let renderCount = 80;
  let searchTerm = '';
  let openPanels = [];

  function hpColorFor(pct) { return pct > 60 ? 'var(--hp-high)' : pct > 25 ? 'var(--hp-mid)' : 'var(--hp-low)'; }

  function applyHpModifiers(base, expression) {
    const text = String(expression || '').trim();
    if (!text) return { value: base, steps: [], error: '' };
    const normalized = text.replace(/,/g, '.').replace(/[×]/g, 'x').replace(/[÷]/g, '/');
    const tokenRe = /([+-])\s*(\d+(?:\.\d+)?)\s*(%)?|x\s*(\d+(?:\.\d+)?)|\/\s*(\d+(?:\.\d+)?)/gi;
    let pos = 0, value = base, match;
    const steps = [];
    while ((match = tokenRe.exec(normalized)) !== null) {
      const between = normalized.slice(pos, match.index).trim();
      if (between) return { value: base, steps: [], error: `Trecho inválido: "${between}"` };
      if (match[1]) {
        const amount = parseFloat(match[2]);
        const isPercent = !!match[3];
        const signed = match[1] === '-' ? -amount : amount;
        const before = value;
        value = isPercent ? value * (1 + signed / 100) : value + signed;
        steps.push({ text: `${match[1]}${amount}${isPercent ? '%' : ''}`, before, after: value });
      } else if (match[4]) {
        const factor = parseFloat(match[4]);
        if (!Number.isFinite(factor)) return { value: base, steps: [], error: 'Multiplicador inválido.' };
        const before = value; value *= factor; steps.push({ text: `×${factor}`, before, after: value });
      } else if (match[5]) {
        const divisor = parseFloat(match[5]);
        if (!Number.isFinite(divisor) || divisor === 0) return { value: base, steps: [], error: 'Não é possível dividir por zero.' };
        const before = value; value /= divisor; steps.push({ text: `÷${divisor}`, before, after: value });
      }
      pos = tokenRe.lastIndex;
    }
    if (!steps.length) return { value: base, steps: [], error: 'Use operações como +20, +20%, -10%, x2 ou ÷4.' };
    const rest = normalized.slice(pos).trim();
    if (rest) return { value: base, steps: [], error: `Trecho inválido: "${rest}"` };
    if (!Number.isFinite(value)) return { value: base, steps: [], error: 'O cálculo resultou em um valor inválido.' };
    return { value, steps, error: '' };
  }

  function renderList() {
    const list = document.getElementById('tracker-list');
    const countEl = document.getElementById('tracker-count');
    if (!list) return;
    const filtered = searchTerm ? entries.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())) : entries;
    if (countEl) countEl.textContent = `${filtered.length} ficha${filtered.length === 1 ? '' : 's'}${searchTerm ? ` de ${entries.length}` : ''}`;
    if (!filtered.length) { list.innerHTML = '<p class="empty-state">Nenhuma ficha encontrada. Adicione uma acima.</p>'; const s = document.getElementById('tracker-sentinel'); if (s) s.style.display = 'none'; return; }
    entries.forEach(e => { if (!Number.isFinite(e.baseHp)) e.baseHp = Number.isFinite(e.maxHp) ? e.maxHp : 100; if (!Number.isFinite(e.maxHp)) e.maxHp = e.baseHp; });
    const shown = filtered.slice(0, renderCount);
    list.innerHTML = shown.map(e => {
      const pct = e.maxHp > 0 ? RPG.util.clamp(Math.round((e.currentHp / e.maxHp) * 100), 0, 100) : 0;
      return `
      <div class="tracker-card" data-id="${e.id}">
        <div class="tracker-card-img">${e.image ? `<img src="${e.image}" alt="" />` : '<i class="fa-solid fa-user-shield"></i>'}</div>
        <div class="tracker-card-info">
          <div class="tracker-card-name">${RPG.util.escapeHtml(e.name)}</div>
          <div class="tracker-hp-bar small"><div class="tracker-hp-fill" style="width:${pct}%;background:${hpColorFor(pct)}"></div></div>
          <div class="tracker-card-hp">${Math.round(e.currentHp)}/${Math.round(e.maxHp)}</div>
        </div>
        <button class="icon-btn tracker-card-expand" data-role="expand" type="button" title="Expandir"><i class="fa-solid fa-plus"></i></button>
      </div>`;
    }).join('');
    const sentinel = document.getElementById('tracker-sentinel');
    if (sentinel) sentinel.style.display = filtered.length > shown.length ? '' : 'none';
  }

  function renderPanels() {
    const container = document.getElementById('tracker-panels');
    if (!container) return;
    container.classList.toggle('has-panels', openPanels.length > 0);
    container.innerHTML = openPanels.map(id => {
      const e = entries.find(x => x.id === id); if (!e) return '';
      const pct = e.maxHp > 0 ? RPG.util.clamp(Math.round((e.currentHp / e.maxHp) * 100), 0, 100) : 0;
      return `
      <div class="tracker-panel" data-id="${e.id}">
        <div class="tracker-panel-head">
          <input class="text-input tracker-panel-name" data-role="name" value="${RPG.util.escapeHtml(e.name)}" aria-label="Nome" />
          <button class="icon-btn" data-role="close" type="button" title="Fechar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <label class="tracker-panel-image" data-role="image-trigger">
          ${e.image ? `<img src="${e.image}" alt="${RPG.util.escapeHtml(e.name)}" />` : '<i class="fa-solid fa-user-shield placeholder-icon"></i>'}
          <span class="tracker-panel-image-edit"><i class="fa-solid fa-camera"></i></span>
          <input type="file" accept="image/*" class="hidden-file-input" data-role="image-input" />
        </label>
        <div class="tracker-hp-bar"><div class="tracker-hp-fill" style="width:${pct}%;background:${hpColorFor(pct)}"></div></div>
        <div class="tracker-hp-numbers">${Math.round(e.currentHp)} / ${Math.round(e.maxHp)} HP${e.currentHp > e.maxHp ? ` <span class="tracker-hp-buff">+${Math.round(e.currentHp - e.maxHp)} buff</span>` : ''}</div>
        <div class="tracker-hp-controls">
          <div class="tracker-hp-row"><input type="text" class="text-input" placeholder="Ex.: +20 +20% -10% x2 ÷4" data-role="hp-delta-input" /><button class="btn btn-small" data-role="hp-delta-apply" type="button">Aplicar</button></div>
          <div class="tracker-hp-row"><input type="number" class="text-input" placeholder="Definir HP atual" data-role="hp-set-input" /><button class="btn btn-small" data-role="hp-set-apply" type="button">Definir</button></div>
          <div class="tracker-hp-row"><input type="number" class="text-input" placeholder="Definir HP base/máximo" value="${e.maxHp}" data-role="hp-max-input" /><button class="btn btn-small" data-role="hp-max-apply" type="button">Definir</button></div>
          <button class="btn btn-ghost btn-small" data-role="hp-heal" type="button"><i class="fa-solid fa-heart"></i> Cura total</button>
        </div>
        <div class="tracker-attrs">
          <strong>Atributos</strong>
          <div class="tracker-attrs-list">
            ${e.attributes.map(a => `<div class="tracker-attr-row" data-attr-id="${a.id}">
              <input type="text" class="text-input" value="${RPG.util.escapeHtml(a.label)}" data-role="attr-label" placeholder="Nome" />
              <input type="text" class="text-input" value="${RPG.util.escapeHtml(a.value)}" data-role="attr-value" placeholder="Valor" />
              <button class="icon-btn tiny" data-role="attr-remove" type="button"><i class="fa-solid fa-xmark"></i></button>
            </div>`).join('')}
          </div>
          <button class="btn btn-small btn-ghost" data-role="attr-add" type="button"><i class="fa-solid fa-plus"></i> Atributo</button>
        </div>
        <button class="btn btn-danger btn-small tracker-panel-delete" data-role="delete" type="button"><i class="fa-solid fa-trash"></i> Excluir Ficha</button>
      </div>`;
    }).join('');
  }

  function openPanel(id) {
    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    if (isMobile) openPanels = [id];
    else if (!openPanels.includes(id)) {
      if (openPanels.length >= 4) { RPG.toast.show('Máximo de 4 fichas abertas ao mesmo tempo. Feche uma para abrir outra.', 'error'); return; }
      openPanels.push(id);
    }
    renderPanels();
    document.getElementById('tracker-panels').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function closePanel(id) { openPanels = openPanels.filter(x => x !== id); renderPanels(); }

  function setupInfiniteScroll() {
    const sentinel = document.getElementById('tracker-sentinel');
    if (!sentinel || !('IntersectionObserver' in window)) return;
    new IntersectionObserver((obs) => { if (obs[0].isIntersecting) { renderCount += 80; renderList(); } }, { rootMargin: '250px' }).observe(sentinel);
  }

  function init() {
    renderList(); renderPanels(); setupInfiniteScroll();

    const addBtn = document.getElementById('tracker-add-btn');
    if (addBtn) addBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('tracker-new-name');
      const hpInput = document.getElementById('tracker-new-hp');
      const name = nameInput.value.trim() || 'Sem nome';
      const maxHp = parseFloat(hpInput.value) || 100;
      const entry = { id: RPG.util.uid(), name, image: null, baseHp: maxHp, maxHp, currentHp: maxHp, attributes: [], createdAt: Date.now(), updatedAt: Date.now() };
      entries.unshift(entry); saveEntries();
      nameInput.value = ''; hpInput.value = '';
      renderList(); RPG.toast.show(`"${name}" adicionado(a)!`, 'success'); RPG.audio.notify();
      openPanel(entry.id);
    });

    const searchInput = document.getElementById('tracker-search');
    if (searchInput) searchInput.addEventListener('input', (e) => { searchTerm = e.target.value; renderCount = 80; renderList(); });

    const list = document.getElementById('tracker-list');
    if (list) list.addEventListener('click', (e) => { const card = e.target.closest('.tracker-card'); if (card) openPanel(card.dataset.id); });

    const container = document.getElementById('tracker-panels');
    if (!container) return;

    container.addEventListener('click', async (e) => {
      const panel = e.target.closest('.tracker-panel'); if (!panel) return;
      const id = panel.dataset.id; const entry = entries.find(x => x.id === id); if (!entry) return;
      const roleEl = e.target.closest('[data-role]'); const role = roleEl && roleEl.dataset.role;
      if (role === 'close') closePanel(id);
      else if (role === 'image-trigger') { /* o clique no <label> já ativa o input file */ }
      else if (role === 'hp-delta-apply') {
        const input = panel.querySelector('[data-role="hp-delta-input"]');
        const result = applyHpModifiers(entry.currentHp, input.value);
        if (result.error) { RPG.toast.show(result.error, 'error'); return; }
        entry.currentHp = Math.max(0, result.value);
        entry.updatedAt = Date.now(); saveEntries(); renderPanels(); renderList();
      } else if (role === 'hp-set-apply') {
        const v = parseFloat(panel.querySelector('[data-role="hp-set-input"]').value);
        if (isNaN(v)) { RPG.toast.show('Valor inválido.', 'error'); return; }
        entry.currentHp = Math.max(0, v);
        entry.updatedAt = Date.now(); saveEntries(); renderPanels(); renderList();
      } else if (role === 'hp-max-apply') {
        const v = parseFloat(panel.querySelector('[data-role="hp-max-input"]').value);
        if (isNaN(v) || v < 0) { RPG.toast.show('Valor inválido.', 'error'); return; }
        entry.baseHp = v; entry.maxHp = v;
        entry.updatedAt = Date.now(); saveEntries(); renderPanels(); renderList();
      } else if (role === 'hp-heal') {
        entry.currentHp = entry.maxHp; entry.updatedAt = Date.now(); saveEntries(); renderPanels(); renderList(); RPG.audio.notify();
      } else if (role === 'attr-add') {
        entry.attributes.push({ id: RPG.util.uid(), label: 'Novo Atributo', value: '' }); saveEntries(); renderPanels();
      } else if (role === 'attr-remove') {
        const row = e.target.closest('[data-attr-id]');
        entry.attributes = entry.attributes.filter(a => a.id !== row.dataset.attrId);
        saveEntries(); renderPanels();
      } else if (role === 'delete') {
        const ok = await RPG.modal.confirm(`Excluir "${entry.name}" definitivamente? Esta ação não pode ser desfeita.`);
        if (!ok) return;
        entries = entries.filter(x => x.id !== id); saveEntries(); closePanel(id); renderList();
      }
    });

    container.addEventListener('input', (e) => {
      const panel = e.target.closest('.tracker-panel'); if (!panel) return;
      const entry = entries.find(x => x.id === panel.dataset.id); if (!entry) return;
      const role = e.target.dataset.role;
      if (role === 'name') { entry.name = e.target.value; saveEntries(); renderList(); }
      else if (role === 'attr-label' || role === 'attr-value') {
        const row = e.target.closest('[data-attr-id]');
        const attr = entry.attributes.find(a => a.id === row.dataset.attrId); if (!attr) return;
        if (role === 'attr-label') attr.label = e.target.value; else attr.value = e.target.value;
        saveEntries();
      }
    });

    container.addEventListener('change', async (e) => {
      if (e.target.dataset.role !== 'image-input') return;
      const panel = e.target.closest('.tracker-panel');
      const entry = entries.find(x => x.id === panel.dataset.id); if (!entry) return;
      const file = e.target.files[0]; if (!file) return;
      try { entry.image = await RPG.util.readFileAsDataURL(file); saveEntries(); renderPanels(); renderList(); }
      catch (err) { RPG.toast.show('Não foi possível carregar a imagem.', 'error'); }
    });
  }

  RPG.modules.tracker = { onShow() { } };
  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.tracker = `
    <p>Cadastre NPCs e Players (suporta mais de mil fichas) com nome, imagem e HP.</p>
    <ul>
      <li>Toque no <i class="fa-solid fa-plus"></i> de um card para abrir a ficha completa.</li>
      <li>No celular abre em tela cheia; no computador é possível abrir até 4 fichas lado a lado.</li>
      <li>Ajuste o HP com cálculo encadeado, incluindo pontos, porcentagens, multiplicação e divisão (ex.: <code>+20 +20% -10% x2 ÷4</code>).</li>
      <li>Adicione atributos personalizados livremente em cada ficha.</li>
    </ul>`;
  document.addEventListener('DOMContentLoaded', init);
})();
