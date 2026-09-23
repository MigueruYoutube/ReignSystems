/* ============================================================
   RPG System — npc.js — Página "Criador de NPCs"
   ============================================================ */
(function () {
  function generateNPC(opts) {
    opts = opts || {};
    const D = window.RPGData;
    const gender = Math.random() < 0.5 ? 'M' : 'F';
    const firstName = RPG.util.pick(gender === 'M' ? D.firstNamesM : D.firstNamesF);
    const surname = RPG.util.pick(D.surnames);
    const epithet = Math.random() < 0.35 ? RPG.util.pick(D.epithets) : null;
    const name = firstName + ' ' + surname + (epithet ? ', ' + epithet : '');

    const archKeys = Object.keys(D.archetypes);
    const archetype = (opts.archetype && opts.archetype !== 'Aleatório' && D.archetypes[opts.archetype]) ? opts.archetype : RPG.util.pick(archKeys);
    const arch = D.archetypes[archetype];
    const trait = RPG.util.pick(arch.traits), fear = RPG.util.pick(arch.fears), motivation = RPG.util.pick(arch.motivations), speech = RPG.util.pick(arch.speech);
    const personality = `${firstName} é ${trait}. Teme, acima de tudo, ${fear}. No fundo, o que mais deseja é ${motivation}.`;

    const ap = D.appearance;
    const altura = RPG.util.pick(ap.alturas), compleicao = RPG.util.pick(ap.compleicoes), pele = RPG.util.pick(ap.peles),
      cabelo = RPG.util.pick(ap.cabelos), olho = RPG.util.pick(ap.olhos), marca = RPG.util.pick(ap.marcas), roupa = RPG.util.pick(ap.roupas);
    const appearancePt = `${firstName} é ${altura.pt}, de compleição ${compleicao.pt}, com ${pele.pt}, ${cabelo.pt} e ${olho.pt}. Possui ${marca.pt}. Veste ${roupa.pt}.`;
    const appearanceEn = `${altura.en}, ${compleicao.en}, ${pele.en}, ${cabelo.en}, ${olho.en}, ${marca.en}, wearing ${roupa.en}, fantasy character portrait, detailed, cinematic lighting`;

    return {
      id: RPG.util.uid(), name, gender, archetype, personality, speech,
      appearancePt, appearanceEn,
      strengths: RPG.util.pickN(D.strengths, 3), weaknesses: RPG.util.pickN(D.weaknesses, 2),
      createdAt: Date.now()
    };
  }

  function buildNPCText(npc) {
    return [
      `═══ NPC: ${npc.name} ═══`, `Classificação: ${npc.archetype}`, '',
      `Aparência: ${npc.appearancePt}`, `Prompt (EN): ${npc.appearanceEn}`, '',
      `Personalidade: ${npc.personality}`, `Modo de falar: ${npc.speech}`, '',
      'Pontos fortes:', ...npc.strengths.map(s => `- ${s}`), '',
      'Fraquezas:', ...npc.weaknesses.map(s => `- ${s}`), '',
      `Gerado em ${RPG.util.formatDateTime(npc.createdAt)} — RPG System`
    ].join('\n');
  }

  async function copyText(text, msg) {
    try { await navigator.clipboard.writeText(text); RPG.toast.show(msg, 'success'); }
    catch (e) { RPG.modal.show('Copiar', `<p>Não foi possível copiar automaticamente. Copie manualmente abaixo:</p><pre class="copy-fallback">${RPG.util.escapeHtml(text)}</pre>`); }
  }

  let current = null;
  let saved = RPG.storage.get('npcs', []);
  function saveSavedList() { RPG.storage.set('npcs', saved); }

  function renderNPCCard(npc) {
    const el = document.getElementById('npc-result');
    if (!el) return;
    el.classList.remove('show');
    el.innerHTML = `
      <div class="gen-card">
        <div class="gen-card-header"><h3>${RPG.util.escapeHtml(npc.name)}</h3><span class="badge badge-archetype">${npc.archetype}</span></div>
        <p class="gen-field"><strong>Aparência:</strong> ${RPG.util.escapeHtml(npc.appearancePt)}</p>
        <div class="gen-field">
          <strong>Prompt de imagem (EN):</strong>
          <div class="prompt-box"><span>${RPG.util.escapeHtml(npc.appearanceEn)}</span><button class="icon-btn" data-role="copy-prompt" type="button" title="Copiar prompt"><i class="fa-solid fa-copy"></i></button></div>
        </div>
        <p class="gen-field"><strong>Personalidade:</strong> ${RPG.util.escapeHtml(npc.personality)}</p>
        <p class="gen-field"><strong>Modo de falar:</strong> ${RPG.util.escapeHtml(npc.speech)}</p>
        <div class="gen-field-cols">
          <div><strong>Pontos fortes</strong><ul>${npc.strengths.map(s => `<li>${RPG.util.escapeHtml(s)}</li>`).join('')}</ul></div>
          <div><strong>Fraquezas</strong><ul>${npc.weaknesses.map(s => `<li>${RPG.util.escapeHtml(s)}</li>`).join('')}</ul></div>
        </div>
        <div class="gen-card-actions">
          <button class="btn" data-role="regen" type="button"><i class="fa-solid fa-dice"></i> Gerar Novamente</button>
          <button class="btn btn-gold" data-role="save" type="button"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
          <button class="btn btn-ghost" data-role="copy" type="button"><i class="fa-solid fa-copy"></i> Copiar</button>
          <button class="btn btn-ghost" data-role="export" type="button"><i class="fa-solid fa-file-export"></i> Exportar JSON</button>
        </div>
      </div>`;
    requestAnimationFrame(() => el.classList.add('show'));
  }

  function renderSavedList() {
    const list = document.getElementById('npc-saved-list');
    if (!list) return;
    if (!saved.length) { list.innerHTML = '<p class="empty-state">Nenhum NPC salvo ainda.</p>'; return; }
    list.innerHTML = saved.map(n => `
      <div class="mini-card" data-id="${n.id}">
        <div class="mini-card-title">${RPG.util.escapeHtml(n.name)}</div>
        <div class="mini-card-sub"><span class="badge badge-archetype">${n.archetype}</span> · ${RPG.util.formatDateTime(n.createdAt)}</div>
        <div class="mini-card-actions">
          <button class="btn btn-small" data-role="view" type="button"><i class="fa-solid fa-eye"></i> Ver</button>
          <button class="btn btn-small btn-ghost" data-role="delete" type="button" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join('');
  }

  function doGenerate() {
    const select = document.getElementById('npc-archetype-select');
    current = generateNPC({ archetype: select ? select.value : 'Aleatório' });
    renderNPCCard(current);
    RPG.audio.notify();
  }

  function init() {
    renderSavedList();
    const genBtn = document.getElementById('npc-generate-btn');
    if (genBtn) genBtn.addEventListener('click', doGenerate);

    const resultEl = document.getElementById('npc-result');
    if (resultEl) resultEl.addEventListener('click', (e) => {
      const roleEl = e.target.closest('[data-role]'); if (!roleEl || !current) return;
      const role = roleEl.dataset.role;
      if (role === 'regen') doGenerate();
      else if (role === 'copy-prompt') copyText(current.appearanceEn, 'Prompt copiado!');
      else if (role === 'copy') copyText(buildNPCText(current), 'NPC copiado para a área de transferência!');
      else if (role === 'save') { saved.unshift(JSON.parse(JSON.stringify(current))); saveSavedList(); renderSavedList(); RPG.toast.show('NPC salvo!', 'success'); }
      else if (role === 'export') RPG.util.download(`npc-${current.name.split(',')[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`, JSON.stringify(current, null, 2), 'application/json');
    });

    const savedList = document.getElementById('npc-saved-list');
    if (savedList) savedList.addEventListener('click', async (e) => {
      const card = e.target.closest('.mini-card'); if (!card) return;
      const n = saved.find(x => x.id === card.dataset.id); if (!n) return;
      const roleEl = e.target.closest('[data-role]'); const role = roleEl && roleEl.dataset.role;
      if (role === 'view') { current = n; renderNPCCard(n); resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (role === 'delete') {
        const ok = await RPG.modal.confirm(`Excluir o NPC "${n.name}"? Esta ação não pode ser desfeita.`);
        if (!ok) return;
        saved = saved.filter(x => x.id !== n.id); saveSavedList(); renderSavedList();
      }
    });
  }

  RPG.modules.npc = { onShow() { } };
  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.npc = `
    <p>Escolha uma classificação (ou deixe em <strong>Aleatório</strong>) e clique em <strong>Gerar</strong>.</p>
    <p>Cada NPC vem com nome, aparência física, um prompt em inglês pronto para gerar arte, personalidade completa, modo de falar, pontos fortes e fraquezas.</p>
    <p>Use <strong>Copiar</strong> para colar o NPC inteiro em qualquer lugar, ou <strong>Salvar</strong> para guardá-lo na sua lista.</p>`;
  document.addEventListener('DOMContentLoaded', init);
})();
