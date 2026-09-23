/* ============================================================
   RPG System — combat.js — Página "Sistema de Combate"
   ============================================================ */
(function () {
  const BODY_PARTS = {
    cabeca: 1.5, temporal: 1.4, pescoco: 1.3, nuca: 1.3, coracao: 1.3, coluna: 1.2, rosto: 1.1, queixo: 1.0,
    peito: 0.8, abdomen: 0.7, estomago: 0.7, costelas: 0.6, lombar: 0.6, quadril: 0.4, joelho: 0.3, ombro: 0.2, cotovelo: 0.2,
    braco: 0, antebraco: -0.1, mao: -0.3, coxa: -0.1, panturrilha: -0.3, canela: -0.4, tornozelo: -0.45, pe: -0.5
  };
  const BODY_PART_LABELS = {
    cabeca:'Cabeça', temporal:'Temporal', pescoco:'Pescoço', nuca:'Nuca', coracao:'Coração', coluna:'Coluna', rosto:'Rosto', queixo:'Queixo',
    peito:'Peito', abdomen:'Abdômen', estomago:'Estômago', costelas:'Costelas', lombar:'Lombar', quadril:'Quadril', joelho:'Joelho',
    ombro:'Ombro', cotovelo:'Cotovelo', braco:'Braço', antebraco:'Antebraço', mao:'Mão', coxa:'Coxa', panturrilha:'Panturrilha',
    canela:'Canela', tornozelo:'Tornozelo', pe:'Pé'
  };
  const DAMAGE_TYPE_DIVISOR = { Debuffado: 10, Normal: 8, Crítico: 4, Real: 10 };
  const fmt = n => { const r = Math.round(n * 100) / 100; return Number.isInteger(r) ? r.toLocaleString('pt-BR') : r.toLocaleString('pt-BR', { maximumFractionDigits: 2 }); };

  function renderBodyParts() {
    const menu = document.getElementById('combat-body-part-options');
    if (!menu) return;
    const custom = RPG.storage.get('combatCustomParts', []);
    const all = Object.keys(BODY_PARTS).map(k => ({ key:k, label:BODY_PART_LABELS[k], delta:BODY_PARTS[k] }))
      .concat(custom.map(c => ({ key:c.key, label:c.label, delta:c.delta })));
    menu.innerHTML = all.map(p => `<label class="body-part-option"><input type="checkbox" value="${RPG.util.escapeHtml(p.key)}" data-delta="${p.delta}" data-label="${RPG.util.escapeHtml(p.label)}"><span>${RPG.util.escapeHtml(p.label)}</span><small>${p.delta >= 0 ? '+' : ''}${p.delta}</small></label>`).join('');
    menu.querySelectorAll('input[type="checkbox"]').forEach(input => input.addEventListener('change', updateBodyPartMenu));
    updateBodyPartMenu();
  }

  function getSelectedBody() {
    const options = document.querySelectorAll('#combat-body-part-options input[type="checkbox"]:checked');
    const parts = Array.from(options).map(input => ({ key:input.value, label:input.dataset.label, delta:parseFloat(input.dataset.delta) || 0 }));
    const sum = parts.reduce((total, part) => total + part.delta, 0);
    return { multiplier: 1 + sum, sum, count: parts.length, parts, label: parts.length ? parts.map(p => p.label).join(', ') : 'Nenhuma / Neutro' };
  }

  function updateBodyPartMenu() {
    const trigger = document.getElementById('combat-body-part-trigger');
    const label = document.getElementById('combat-body-part-label');
    if (!label) return;
    const body = getSelectedBody();
    label.textContent = body.count ? `${body.count} parte${body.count > 1 ? 's' : ''} selecionada${body.count > 1 ? 's' : ''} (${body.multiplier.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}x)` : 'Nenhuma / Neutro (1x)';
    if (trigger) trigger.classList.toggle('active', body.count > 0);
  }

  function showCustomBodyModal() {
    RPG.modal.show('Adicionar parte do corpo', `<p>Crie uma parte personalizada e defina o multiplicador que será somado ao cálculo.</p><div class="modal-form-grid"><label class="field-label">Nome da parte<input type="text" id="modal-custom-body-name" class="text-input" placeholder="Ex.: Olho esquerdo"></label><label class="field-label">Multiplicador<input type="number" id="modal-custom-body-delta" class="text-input" step="0.01" placeholder="Ex.: 1.2"></label></div><div class="modal-actions"><button class="btn" type="button" id="modal-custom-body-cancel">Cancelar</button><button class="btn btn-gold" type="button" id="modal-custom-body-save"><i class="fa-solid fa-plus"></i> Adicionar</button></div>`);
    document.getElementById('modal-custom-body-cancel').addEventListener('click', () => RPG.modal.hide());
    document.getElementById('modal-custom-body-save').addEventListener('click', addCustomBodyPart);
  }

  function addCustomBodyPart() {
    const nameInput = document.getElementById('modal-custom-body-name');
    const deltaInput = document.getElementById('modal-custom-body-delta');
    const name = nameInput && nameInput.value.trim();
    const delta = deltaInput ? parseFloat(deltaInput.value) : NaN;
    if (!name || !Number.isFinite(delta)) { RPG.toast.show('Informe o nome e o multiplicador da parte personalizada.', 'error'); return; }
    const custom = RPG.storage.get('combatCustomParts', []);
    const key = `custom_${Date.now()}`;
    custom.push({ key, label:name, delta });
    RPG.storage.set('combatCustomParts', custom);
    RPG.modal.hide();
    renderBodyParts();
    const input = document.querySelector(`#combat-body-part-options input[value="${CSS.escape(key)}"]`);
    if (input) { input.checked = true; updateBodyPartMenu(); }
    RPG.toast.show('Parte do corpo personalizada adicionada.', 'success');
  }

  function renderResult(r) {
    const el = document.getElementById('combat-result');
    if (!el) return;
    el.classList.remove('show');
    el.innerHTML = `<div class="gen-card combat-card">
      <div class="combat-attack-meta">
        <div><span>Parte atingida</span><strong>${RPG.util.escapeHtml(r.body.label)}</strong></div>
      </div>
      <div class="combat-finals">
        <div class="combat-final-box combat-final-main"><span class="stat-label">Dano Final</span><span class="stat-value">${fmt(r.danoFinal)}</span></div>
        <div class="combat-final-box"><span class="stat-label">d20 Rolado</span><span class="stat-value">${r.d20}</span></div>
        <div class="combat-final-box"><span class="stat-label">Dano Físico</span><span class="stat-value">${fmt(r.danoFisico)}</span></div>
        <div class="combat-final-box"><span class="stat-label">Dano da Arma</span><span class="stat-value">${fmt(r.danoArmaEfetivo)}</span></div>
        <div class="combat-final-box"><span class="stat-label">Multiplicador das Partes</span><span class="stat-value">${fmt(r.body.multiplier)}x</span></div>
      </div>
      <details class="combat-breakdown" open><summary>Ver cálculo detalhado</summary><ul class="calc-steps">
        <li>Tipo base: <strong>${r.tipoBase}</strong> | Tipo de dano: <strong>${r.tipoDano}</strong></li>
        <li>d20 de Ataque = <strong>${r.d20}</strong> ${r.rolledAutomatically ? '(sorteado automaticamente)' : '(definido/rolado manualmente)'}</li>
        <li>Multiplicador de d20 = mín(${r.d20} ÷ 10, 1.5) = <strong>${fmt(r.multiplicadorD20)}</strong></li>
        <li>Dano da Arma Efetivo = ${r.danoArma} × ${fmt(r.multiplicadorD20)} = <strong>${fmt(r.danoArmaEfetivo)}</strong></li>
        <li>Partes do Corpo = ${r.body.parts.length ? r.body.parts.map(p => `${RPG.util.escapeHtml(p.label)} (${p.delta >= 0 ? '+' : ''}${fmt(p.delta)})`).join(' + ') : 'Nenhuma'} → soma = <strong>${r.body.sum >= 0 ? '+' : ''}${fmt(r.body.sum)}</strong> → multiplicador final = <strong>${fmt(r.body.multiplier)}x</strong></li>
        <li>Dano Físico = ${r.danoFisico} × (${fmt(r.body.multiplier)} + ${r.d20}) = <strong>${fmt(r.danoFisicoComPartes)}</strong></li>
        <li>Dano ÷ divisor = ${fmt(r.danoFisicoComPartes)} ÷ ${r.divisor} = <strong>${fmt(r.danoResistido)}</strong></li>
        <li>Dano Base = ${fmt(r.danoResistido)} + ${fmt(r.danoArmaEfetivo)} = <strong>${fmt(r.danoBase)}</strong></li>
        <li>Modificadores = <strong>${RPG.util.escapeHtml(r.modifierText || 'Nenhum')}</strong></li>
        ${r.modifierSteps.length ? r.modifierSteps.map(s => `<li>${fmt(s.before)} ${RPG.util.escapeHtml(s.text)} = <strong>${fmt(s.after)}</strong></li>`).join('') : ''}
        <li>Dano Final após modificadores = <strong>${fmt(r.danoFinal)}</strong></li>
      </ul></details>
    </div>`;
    requestAnimationFrame(() => { el.classList.add('show'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    RPG.audio.reveal();
  }

  function rollD20(manual = true) {
    const input = document.getElementById('combat-d20');
    const info = document.getElementById('combat-roll-info');
    const value = RPG.util.randInt(1, 20);
    if (manual && input) input.value = value;
    if (info) info.innerHTML = `<i class="fa-solid fa-dice-d20"></i> d20 rolado: <strong>${value}</strong>${manual ? ' — definido para este ataque.' : ' — sorteado automaticamente para este ataque.'}`;
    RPG.audio.diceRoll();
    setTimeout(() => RPG.audio.reveal(), 350);
    return value;
  }

  function applyDamageModifiers(base, expression) {
    const text = String(expression || '').trim();
    if (!text) return { value: base, steps: [], error: '' };
    const normalized = text.replace(/,/g, '.').replace(/[×]/g, 'x').replace(/[÷]/g, '/');
    const tokenRe = /([+-])\s*(\d+(?:\.\d+)?)\s*(%)?|x\s*(\d+(?:\.\d+)?)|\/\s*(\d+(?:\.\d+)?)/gi;
    let pos = 0;
    let value = base;
    const steps = [];
    let match;
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
        const before = value;
        value *= factor;
        steps.push({ text: `×${factor}`, before, after: value });
      } else if (match[5]) {
        const divisor = parseFloat(match[5]);
        if (!Number.isFinite(divisor) || divisor === 0) return { value: base, steps: [], error: 'Não é possível dividir por zero.' };
        const before = value;
        value /= divisor;
        steps.push({ text: `÷${divisor}`, before, after: value });
      }
      pos = tokenRe.lastIndex;
    }
    if (!steps.length) return { value: base, steps: [], error: 'Use operações como +10, -5%, x2 ou ÷4.' };
    const rest = normalized.slice(pos).trim();
    if (rest) return { value: base, steps: [], error: `Trecho inválido: "${rest}"` };
    if (!Number.isFinite(value)) return { value: base, steps: [], error: 'O cálculo resultou em um valor inválido.' };
    return { value, steps, error: '' };
  }

  function calculate() {
    const val = id => parseFloat(document.getElementById(id).value) || 0;
    const d20Input = document.getElementById('combat-d20');
    const hasD20 = d20Input.value.trim() !== '' && !isNaN(parseFloat(d20Input.value));
    const d20 = hasD20 ? RPG.util.clamp(parseFloat(d20Input.value), 1, 20) : rollD20(false);
    const danoFisico = val('combat-dano-fisico');
    const danoArma = val('combat-dano-arma');
    const modifierText = document.getElementById('combat-modifiers').value.trim();
    const tipoDano = document.getElementById('combat-tipo-dano').value;
    const tipoBase = document.getElementById('combat-tipo-base').value;
    const body = getSelectedBody();
    const multiplicadorD20 = Math.min(d20 / 10, 1.5);
    const danoArmaEfetivo = danoArma * multiplicadorD20;
    const multiplicadorFisico = body.multiplier + d20;
    const danoFisicoComPartes = danoFisico * multiplicadorFisico;
    const divisor = DAMAGE_TYPE_DIVISOR[tipoDano] || 8;
    const danoResistido = danoFisicoComPartes / divisor;
    const danoBase = danoResistido + danoArmaEfetivo;
    const modifiers = applyDamageModifiers(danoBase, modifierText);
    if (modifiers.error) { RPG.toast.show(modifiers.error, 'error'); return; }
    const danoFinal = Math.max(0, modifiers.value);
    const r = { tipoBase, danoFisico, danoArma, d20, rolledAutomatically:!hasD20, multiplicadorD20, danoArmaEfetivo, multiplicadorFisico, danoFisicoComPartes, body, danoBase, tipoDano, divisor, danoResistido, modifierText, modifierSteps: modifiers.steps, danoFinal };
    renderResult(r);
  }

  function init() {
    renderBodyParts();
    const calcBtn = document.getElementById('combat-calc-btn');
    if (calcBtn) calcBtn.addEventListener('click', calculate);
    const customBtn = document.getElementById('combat-add-custom-body');
    if (customBtn) customBtn.addEventListener('click', showCustomBodyModal);
    const trigger = document.getElementById('combat-body-part-trigger');
    const menu = document.getElementById('combat-body-part-menu');
    if (trigger && menu) trigger.addEventListener('click', () => menu.classList.toggle('open'));
    document.addEventListener('click', e => { if (menu && !menu.contains(e.target)) menu.classList.remove('open'); });
    const damageType = document.getElementById('combat-tipo-dano');
    const realPopup = document.getElementById('combat-real-popup');
    if (damageType && realPopup) {
      const updateRealPopup = () => realPopup.classList.toggle('show', damageType.value === 'Real');
      damageType.addEventListener('change', updateRealPopup);
      updateRealPopup();
    }
    const d20RollBtn = document.getElementById('combat-d20-roll');
    if (d20RollBtn) d20RollBtn.addEventListener('click', rollD20);
    const d20Input = document.getElementById('combat-d20');
    if (d20Input) d20Input.addEventListener('input', () => { const info=document.getElementById('combat-roll-info'); if (info) info.textContent=d20Input.value.trim() ? 'd20 definido manualmente para este ataque.' : 'd20 vazio: cada ataque sorteará um novo valor automaticamente.'; });
  }

  RPG.modules.combate = { onShow() { } };
  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.combate = `<p>Monte um ataque completo, role o d20 separadamente e depois execute o ataque.</p><ul><li>Se o d20 estiver vazio, o sistema sorteia automaticamente entre 1 e 20.</li><li>Selecione uma ou várias partes do corpo; os multiplicadores são somados e só depois aplicados como 1 + soma.</li><li>Você também pode criar partes personalizadas com multiplicador próprio.</li><li>Use um único campo de modificadores para encadear operações como +10% +10 -5% +200% x2 ÷4, sem limite prático de operações.</li><li>O resultado mostra d20, dano físico, dano de arma, partes atingidas, tipo de dano e cálculo completo.</li><li>Divisores: Debuffado ÷10, Normal ÷8, Crítico ÷4, Real ÷10.</li></ul>`;
  document.addEventListener('DOMContentLoaded', init);
})();
