/* ============================================================
   RPG System — sheets.js — Página "Ficha de Personagem"
   ============================================================ */
(function () {
  const DEFAULT_ATTRS = [
    { label: 'Força', expr: '4d6' }, { label: 'Velocidade', expr: '4d6' }, { label: 'Vitalidade', expr: '2d20' },
    { label: 'Resistência', expr: '2d6' }, { label: 'Inteligência', expr: '3d6' }, { label: 'Sabedoria', expr: '3d6' }, { label: 'Mana', expr: '4d6' }
  ];
  function blankSheet(name) {
    return {
      id: RPG.util.uid(), name: name || 'Nova Ficha',
      attributes: DEFAULT_ATTRS.map(a => ({ id: RPG.util.uid(), label: a.label, expr: a.expr, value: null, breakdown: null })),
      createdAt: Date.now(), updatedAt: Date.now()
    };
  }

  let profiles = RPG.storage.get('sheets', []);
  let current = RPG.storage.get('currentSheet', null) || blankSheet('Minha Ficha');

  function saveProfiles() { RPG.storage.set('sheets', profiles); }
  function saveCurrent() { current.updatedAt = Date.now(); RPG.storage.set('currentSheet', current); }

  function rollAttribute(attr) {
    const r = RPG.diceEngine.roll(attr.expr);
    if (r.error) { RPG.toast.show(`"${attr.label}": ${r.error}`, 'error'); RPG.audio.error(); return; }
    attr.value = r.total;
    attr.breakdown = r.rolls.map(x => x.type === 'dice' ? `[${x.values.join(',')}]` : String(x.value)).join(' ');
    saveCurrent();
  }

  function renderCurrent() {
    const nameInput = document.getElementById('sheet-name-input');
    if (nameInput && document.activeElement !== nameInput) nameInput.value = current.name;
    const list = document.getElementById('sheet-attr-list');
    if (!list) return;
    if (!current.attributes.length) { list.innerHTML = '<p class="empty-state">Nenhum atributo. Adicione um abaixo.</p>'; return; }
    list.innerHTML = current.attributes.map(a => `
      <div class="attr-card" data-attr-id="${a.id}">
        <div class="attr-card-top">
          <input type="text" class="text-input attr-label-input" value="${RPG.util.escapeHtml(a.label)}" data-role="label" aria-label="Nome do atributo" />
          <button class="icon-btn" data-role="remove" title="Remover atributo"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div class="attr-card-bottom">
          <input type="text" class="text-input attr-expr-input" value="${RPG.util.escapeHtml(a.expr)}" data-role="expr" placeholder="ex: 4d6+2" aria-label="Expressão de dados" />
          <button class="btn btn-small" data-role="roll" type="button"><i class="fa-solid fa-dice"></i> Rolar</button>
        </div>
        <div class="attr-value${a.value === null ? '' : ' show'}">${a.value === null ? '—' : RPG.diceEngine.format(a.value)}</div>
        ${a.breakdown ? `<div class="attr-breakdown">${RPG.util.escapeHtml(a.breakdown)}</div>` : ''}
      </div>`).join('');
  }

  function renderProfiles() {
    const list = document.getElementById('sheet-profiles-list');
    if (!list) return;
    if (!profiles.length) { list.innerHTML = '<p class="empty-state">Nenhum perfil salvo ainda.</p>'; return; }
    list.innerHTML = profiles.map(p => `
      <div class="mini-card" data-id="${p.id}">
        <div class="mini-card-title">${RPG.util.escapeHtml(p.name)}</div>
        <div class="mini-card-sub">${p.attributes.length} atributos · ${RPG.util.formatDateTime(p.updatedAt)}</div>
        <div class="mini-card-actions">
          <button class="btn btn-small" data-role="load" type="button"><i class="fa-solid fa-folder-open"></i> Carregar</button>
          <button class="btn btn-small btn-ghost" data-role="delete" type="button" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join('');
  }

  function buildSheetText() {
    const lines = [`═══ Ficha: ${current.name} ═══`];
    current.attributes.forEach(a => lines.push(`${a.label}: ${a.value === null ? '(não rolado)' : RPG.diceEngine.format(a.value)}  (${a.expr}${a.breakdown ? ' → ' + a.breakdown : ''})`));
    lines.push(`Gerado em ${RPG.util.formatDateTime(Date.now())} — RPG System`);
    return lines.join('\n');
  }

  async function copySheet() {
    const text = buildSheetText();
    try { await navigator.clipboard.writeText(text); RPG.toast.show('Ficha copiada para a área de transferência!', 'success'); }
    catch (e) { RPG.modal.show('Copiar Ficha', `<p>Não foi possível copiar automaticamente. Selecione e copie o texto abaixo:</p><pre class="copy-fallback">${RPG.util.escapeHtml(text)}</pre>`); }
  }

  function init() {
    renderCurrent(); renderProfiles();
    const nameInput = document.getElementById('sheet-name-input');
    if (nameInput) nameInput.addEventListener('input', () => { current.name = nameInput.value || 'Ficha sem nome'; saveCurrent(); });

    const attrList = document.getElementById('sheet-attr-list');
    if (attrList) {
      attrList.addEventListener('input', (e) => {
        const card = e.target.closest('.attr-card'); if (!card) return;
        const attr = current.attributes.find(a => a.id === card.dataset.attrId); if (!attr) return;
        if (e.target.dataset.role === 'label') attr.label = e.target.value;
        if (e.target.dataset.role === 'expr') attr.expr = e.target.value;
        saveCurrent();
      });
      attrList.addEventListener('click', (e) => {
        const card = e.target.closest('.attr-card'); if (!card) return;
        const attr = current.attributes.find(a => a.id === card.dataset.attrId); if (!attr) return;
        const roleEl = e.target.closest('[data-role]'); const role = roleEl && roleEl.dataset.role;
        if (role === 'roll') { rollAttribute(attr); renderCurrent(); }
        if (role === 'remove') { current.attributes = current.attributes.filter(a => a.id !== attr.id); saveCurrent(); renderCurrent(); }
      });
    }
    const addBtn = document.getElementById('sheet-add-attr');
    if (addBtn) addBtn.addEventListener('click', () => {
      current.attributes.push({ id: RPG.util.uid(), label: 'Novo Atributo', expr: '1d20', value: null, breakdown: null });
      saveCurrent(); renderCurrent();
    });
    const rollAllBtn = document.getElementById('sheet-roll-all');
    if (rollAllBtn) rollAllBtn.addEventListener('click', () => {
      RPG.audio.diceRoll();
      current.attributes.forEach((a, i) => setTimeout(() => {
        rollAttribute(a); renderCurrent(); if (i === current.attributes.length - 1) RPG.audio.reveal();
      }, i * 110));
    });
    const copyBtn = document.getElementById('sheet-copy');
    if (copyBtn) copyBtn.addEventListener('click', copySheet);
    const newBtn = document.getElementById('sheet-new');
    if (newBtn) newBtn.addEventListener('click', async () => {
      const ok = await RPG.modal.confirm('Começar uma ficha em branco? A edição atual não salva será perdida (perfis já salvos continuam intactos).');
      if (!ok) return;
      current = blankSheet('Nova Ficha'); saveCurrent(); renderCurrent();
    });
    const saveBtn = document.getElementById('sheet-save');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      const idx = profiles.findIndex(p => p.id === current.id);
      const toSave = JSON.parse(JSON.stringify(current));
      if (idx >= 0) profiles[idx] = toSave; else profiles.unshift(toSave);
      saveProfiles(); renderProfiles();
      RPG.toast.show('Perfil salvo!', 'success'); RPG.audio.notify();
    });
    const profList = document.getElementById('sheet-profiles-list');
    if (profList) profList.addEventListener('click', async (e) => {
      const card = e.target.closest('.mini-card'); if (!card) return;
      const p = profiles.find(x => x.id === card.dataset.id); if (!p) return;
      const roleEl = e.target.closest('[data-role]'); const role = roleEl && roleEl.dataset.role;
      if (role === 'load') { current = JSON.parse(JSON.stringify(p)); saveCurrent(); renderCurrent(); RPG.toast.show(`Perfil "${p.name}" carregado.`, 'success'); }
      if (role === 'delete') {
        const ok = await RPG.modal.confirm(`Excluir o perfil "${p.name}"? Esta ação não pode ser desfeita.`);
        if (!ok) return;
        profiles = profiles.filter(x => x.id !== p.id); saveProfiles(); renderProfiles();
      }
    });
  }

  RPG.modules.ficha = { onShow() { } };
  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.ficha = `
    <p>Monte a ficha do seu personagem com atributos totalmente customizáveis.</p>
    <ul>
      <li>Edite o nome e a expressão de dados de qualquer atributo (ex.: <code>4d6+2</code>).</li>
      <li><strong>Rolar</strong> sorteia um atributo; <strong>Rolar Todos</strong> sorteia a ficha inteira em sequência.</li>
      <li><strong>Copiar Ficha</strong> coloca todos os atributos e valores sorteados na área de transferência.</li>
      <li><strong>Salvar Perfil</strong> guarda esta ficha na sua lista para carregar depois.</li>
    </ul>`;
  document.addEventListener('DOMContentLoaded', init);
})();
