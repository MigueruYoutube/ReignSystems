/* ============================================================
   RPG System — items.js — Página "Gerador de Itens"
   ============================================================ */
(function () {
  function generateItem(opts) {
    opts = opts || {};
    const D = window.RPGData.items;
    const category = (opts.category && opts.category !== 'Aleatório' && D.coreByCategory[opts.category]) ? opts.category : RPG.util.pick(D.categories);
    const rarity = (opts.rarity && opts.rarity !== 'Aleatório' && D.rarityConfig[opts.rarity]) ? opts.rarity : RPG.util.pick(D.rarityOrder);
    const cfg = D.rarityConfig[rarity];
    const core = RPG.util.pick(D.coreByCategory[category]);
    let name = core;
    if (Math.random() < 0.8) name = RPG.util.pick(D.prefixes) + ' ' + name;
    if (Math.random() < 0.75) name = name + ' ' + RPG.util.pick(D.suffixes);

    const app = RPG.util.pick(D.appearance);
    const appearancePt = `${app.pt}`;
    const appearanceEn = `a fantasy ${category.toLowerCase()} that is ${app.en}, item concept art, detailed, dramatic lighting`;

    const baseStatLabel = category === 'Arma' ? 'Dano Base' : category === 'Armadura' ? 'Defesa Base' : 'Poder Base';
    const baseStatValue = Math.round((8 + Math.random() * 10) * cfg.baseMult);

    const pool = cfg.unit === '%' ? D.passivesPercent : D.passivesPoints;
    const count = RPG.util.randInt(cfg.passiveMin, cfg.passiveMax);
    const chosen = RPG.util.pickN(pool, count);
    const passives = chosen.map(p => {
      const v = cfg.unit === '%' ? Math.round(RPG.util.randFloat(cfg.valMin, cfg.valMax) * 10) / 10 : RPG.util.randInt(cfg.valMin, cfg.valMax);
      return { name: p.name, text: p.desc(v) };
    });

    const order = D.rarityOrder, idx = order.indexOf(rarity);
    if ((rarity === 'Lendário' || rarity === 'Mítico') && Math.random() < 0.5 && idx > 0) {
      const neighborRarity = order[idx - 1], nCfg = D.rarityConfig[neighborRarity];
      const nPool = nCfg.unit === '%' ? D.passivesPercent : D.passivesPoints;
      const candidates = nPool.filter(p => !chosen.includes(p));
      if (candidates.length) {
        const extra = RPG.util.pick(candidates);
        const v = nCfg.unit === '%' ? Math.round(RPG.util.randFloat(nCfg.valMin, nCfg.valMax) * 10) / 10 : RPG.util.randInt(nCfg.valMin, nCfg.valMax);
        passives.push({ name: extra.name, text: extra.desc(v) + ` (bônus de tier ${neighborRarity})` });
      }
    }
    return { id: RPG.util.uid(), name, category, rarity, appearancePt, appearanceEn, baseStatLabel, baseStatValue, passives, createdAt: Date.now() };
  }

  function buildItemText(item) {
    return [
      `═══ Item: ${item.name} ═══`, `Categoria: ${item.category}  ·  Raridade: ${item.rarity}`, '',
      `Aparência: ${item.appearancePt}`, `Prompt (EN): ${item.appearanceEn}`, '',
      `${item.baseStatLabel}: ${item.baseStatValue}`, '',
      'Passivas:', ...item.passives.map(p => `- ${p.name}: ${p.text}`), '',
      `Gerado em ${RPG.util.formatDateTime(item.createdAt)} — RPG System`
    ].join('\n');
  }

  async function copyText(text, msg) {
    try { await navigator.clipboard.writeText(text); RPG.toast.show(msg, 'success'); }
    catch (e) { RPG.modal.show('Copiar', `<p>Não foi possível copiar automaticamente. Copie manualmente abaixo:</p><pre class="copy-fallback">${RPG.util.escapeHtml(text)}</pre>`); }
  }

  let current = null;
  let saved = RPG.storage.get('items', []);
  function saveSavedList() { RPG.storage.set('items', saved); }

  function renderItemCard(item) {
    const el = document.getElementById('item-result');
    if (!el) return;
    const cfg = window.RPGData.items.rarityConfig[item.rarity];
    el.classList.remove('show');
    el.innerHTML = `
      <div class="gen-card item-card${cfg.glow ? ' item-glow' : ''}" style="--rarity-color:${cfg.color}">
        <div class="gen-card-header"><h3>${RPG.util.escapeHtml(item.name)}</h3><span class="badge badge-rarity">${item.rarity}</span></div>
        <p class="gen-field"><em>${item.category}</em> · ${RPG.util.escapeHtml(item.appearancePt)}</p>
        <div class="gen-field">
          <strong>Prompt de imagem (EN):</strong>
          <div class="prompt-box"><span>${RPG.util.escapeHtml(item.appearanceEn)}</span><button class="icon-btn" data-role="copy-prompt" type="button" title="Copiar prompt"><i class="fa-solid fa-copy"></i></button></div>
        </div>
        <p class="gen-field"><strong>${item.baseStatLabel}:</strong> ${item.baseStatValue}</p>
        <div class="gen-field"><strong>Passivas</strong>
          <ul class="passive-list">${item.passives.map(p => `<li><strong>${RPG.util.escapeHtml(p.name)}:</strong> ${RPG.util.escapeHtml(p.text)}</li>`).join('')}</ul>
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
    const list = document.getElementById('item-saved-list');
    if (!list) return;
    if (!saved.length) { list.innerHTML = '<p class="empty-state">Nenhum item salvo ainda.</p>'; return; }
    list.innerHTML = saved.map(it => {
      const cfg = window.RPGData.items.rarityConfig[it.rarity];
      return `<div class="mini-card" data-id="${it.id}" style="--rarity-color:${cfg.color}">
        <div class="mini-card-title">${RPG.util.escapeHtml(it.name)}</div>
        <div class="mini-card-sub"><span class="badge badge-rarity">${it.rarity}</span> · ${it.category} · ${RPG.util.formatDateTime(it.createdAt)}</div>
        <div class="mini-card-actions">
          <button class="btn btn-small" data-role="view" type="button"><i class="fa-solid fa-eye"></i> Ver</button>
          <button class="btn btn-small btn-ghost" data-role="delete" type="button" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    }).join('');
  }

  function doGenerate() {
    const catSel = document.getElementById('item-category-select');
    const raritySel = document.getElementById('item-rarity-select');
    current = generateItem({ category: catSel ? catSel.value : 'Aleatório', rarity: raritySel ? raritySel.value : 'Aleatório' });
    renderItemCard(current);
    RPG.audio.notify();
  }

  function init() {
    renderSavedList();
    const genBtn = document.getElementById('item-generate-btn');
    if (genBtn) genBtn.addEventListener('click', doGenerate);

    const resultEl = document.getElementById('item-result');
    if (resultEl) resultEl.addEventListener('click', (e) => {
      const roleEl = e.target.closest('[data-role]'); if (!roleEl || !current) return;
      const role = roleEl.dataset.role;
      if (role === 'regen') doGenerate();
      else if (role === 'copy-prompt') copyText(current.appearanceEn, 'Prompt copiado!');
      else if (role === 'copy') copyText(buildItemText(current), 'Item copiado para a área de transferência!');
      else if (role === 'save') { saved.unshift(JSON.parse(JSON.stringify(current))); saveSavedList(); renderSavedList(); RPG.toast.show('Item salvo!', 'success'); }
      else if (role === 'export') RPG.util.download(`item-${current.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`, JSON.stringify(current, null, 2), 'application/json');
    });

    const savedList = document.getElementById('item-saved-list');
    if (savedList) savedList.addEventListener('click', async (e) => {
      const card = e.target.closest('.mini-card'); if (!card) return;
      const it = saved.find(x => x.id === card.dataset.id); if (!it) return;
      const roleEl = e.target.closest('[data-role]'); const role = roleEl && roleEl.dataset.role;
      if (role === 'view') { current = it; renderItemCard(it); resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (role === 'delete') {
        const ok = await RPG.modal.confirm(`Excluir o item "${it.name}"? Esta ação não pode ser desfeita.`);
        if (!ok) return;
        saved = saved.filter(x => x.id !== it.id); saveSavedList(); renderSavedList();
      }
    });
  }

  RPG.modules.itens = { onShow() { } };
  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.itens = `
    <p>Escolha categoria e raridade (ou deixe em <strong>Aleatório</strong>) e clique em <strong>Gerar</strong>.</p>
    <p>De <strong>Comum</strong> a <strong>Raro</strong> as passivas somam pontos fixos; de <strong>Épico</strong> a <strong>Mítico</strong> elas viram bônus percentuais, mais raros e mais poderosos.</p>
    <p>Use <strong>Copiar</strong> para colar o item inteiro em qualquer lugar, ou <strong>Salvar</strong> para guardá-lo na sua lista.</p>`;
  document.addEventListener('DOMContentLoaded', init);
})();
