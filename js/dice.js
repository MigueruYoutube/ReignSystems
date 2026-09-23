/* ============================================================
   RPG System — dice.js — Página "Rolagem de Dados"
   ============================================================ */
(function () {
  const LIMITS = { maxDice: 500, maxSides: 1000000 };

  /* ---- histórico ponderado (armazenado em rpgSystem_userHistory) ---- */
  let userHistory = RPG.storage.get('userHistory', {});
  function saveUserHistory(h) { RPG.storage.set('userHistory', h); }

  /* ---- BLOCO EXATO fornecido — não alterar a lógica ---- */
  function weightedRandomInteger(min, max, probability) {
    const range = max - min + 1;
    const midpoint = min + Math.floor(range / 2);
    const randomNumber = Math.random();
    const bias = probability / 2;
    const weighted = randomNumber + bias * (randomNumber - 0.5);
    const weightedNormalized = Math.min(Math.max(weighted, 0), 1);
    if (probability >= 1) {
      const start = Math.floor(max / 2) + 1;
      return Math.floor(Math.random() * (max - start + 1)) + start;
    } else if (probability <= -1) {
      const end = Math.floor(max / 2);
      return Math.floor(Math.random() * end) + 1;
    } else {
      return Math.min(Math.max(min, Math.floor(min + weightedNormalized * range)), max);
    }
  }
  function randomFloat(min, max) { return Math.random() * (max - min) + min; }
  function updateProbability(userId, newDice, sides) {
    const half = Math.floor(sides / 2);
    if (!userHistory[userId]) userHistory[userId] = { lastDice: null, probability: 0, rollCount: 0 };
    const user = userHistory[userId];
    let lastDice = user.lastDice;
    if (lastDice === null || !lastDice) lastDice = weightedRandomInteger(1, 20);
    if (lastDice !== null) {
      const wasLastAboveHalf = lastDice > half;
      const isNewAboveHalf = newDice > half;
      if (wasLastAboveHalf && isNewAboveHalf) {
        if (newDice === sides) user.probability = Math.max(user.probability - 0.5, -1);
        else if (lastDice === newDice) user.probability = Math.max(user.probability - randomFloat(0.3, 0.5), -1);
        else user.probability = Math.max(user.probability - randomFloat(0.05, 0.15), -1);
      } else if (!wasLastAboveHalf && !isNewAboveHalf) {
        if (newDice === 1) user.probability = Math.min(user.probability + 0.5, 1);
        else if (lastDice === newDice) user.probability = Math.min(user.probability + randomFloat(0.3, 0.5), 1);
        else user.probability = Math.min(user.probability + randomFloat(0.05, 0.15), 1);
      } else {
        user.probability = 0;
      }
    }
    user.lastDice = newDice;
    user.rollCount = (user.rollCount || 0) + 1;
    if (user.rollCount >= 50) { user.lastDice = null; user.probability = 0; user.rollCount = 0; }
    saveUserHistory(userHistory);
    return {
      guess: user.probability === 0 ? Math.floor(Math.random() * sides) + 1 : weightedRandomInteger(1, sides, user.probability),
      Lastdice: lastDice,
      probabilityInPercent: (user.probability * 100).toFixed(2)
    };
  }
  /* ---- fim do bloco exato ---- */

  /* ---- parser de expressões (NdM, +/-, *,/ por grupo) ---- */
  function parseExpression(raw) {
    const cleaned = raw.replace(/\s+/g, '').toLowerCase();
    if (!cleaned || !/^[0-9d+\-*/.]+$/.test(cleaned)) return null;
    const normalized = /^[+-]/.test(cleaned) ? cleaned : '+' + cleaned;
    const tokenRe = /([+-])(\d*d\d+(?:[*/]\d+(?:\.\d+)?)?|\d+(?:\.\d+)?)/gi;
    const terms = []; let m; let consumed = 0;
    while ((m = tokenRe.exec(normalized)) !== null) { terms.push({ sign: m[1] === '-' ? -1 : 1, raw: m[2] }); consumed += m[0].length; }
    if (!terms.length || consumed !== normalized.length) return null;
    return terms;
  }
  function evaluateTerms(terms) {
    let total = 0, totalDice = 0; const rolls = [];
    for (const t of terms) {
      const diceMatch = t.raw.match(/^(\d*)d(\d+)(?:([*/])(\d+(?:\.\d+)?))?$/i);
      if (diceMatch) {
        const count = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1;
        const sides = parseInt(diceMatch[2], 10);
        if (count < 1) return { error: 'Quantidade de dados inválida.' };
        if (sides < 1) return { error: 'Um dado precisa de ao menos 1 lado.' };
        if (sides > LIMITS.maxSides) return { error: `Máximo de ${LIMITS.maxSides.toLocaleString('pt-BR')} lados por dado.` };
        totalDice += count;
        if (totalDice > LIMITS.maxDice) return { error: `Máximo de ${LIMITS.maxDice} dados por rolagem.` };
        const values = []; for (let i = 0; i < count; i++) values.push(RPG.util.randInt(1, sides));
        let subtotal = values.reduce((a, b) => a + b, 0);
        let op = null, opVal = null;
        if (diceMatch[3]) { op = diceMatch[3]; opVal = parseFloat(diceMatch[4]); subtotal = op === '*' ? subtotal * opVal : subtotal / opVal; }
        rolls.push({ type: 'dice', count, sides, values, subtotal, op, opVal, sign: t.sign });
        total += t.sign * subtotal;
      } else {
        const num = parseFloat(t.raw);
        if (isNaN(num)) return { error: 'Expressão inválida.' };
        rolls.push({ type: 'mod', value: num, sign: t.sign });
        total += t.sign * num;
      }
    }
    return { total, rolls };
  }
  function fmt(n) { return Number.isInteger(n) ? n.toLocaleString('pt-BR') : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }

  /* ---- estado / histórico de rolagens (log) ---- */
  let log = RPG.storage.get('diceLog', []);
  function saveLog() { RPG.storage.set('diceLog', log.slice(0, 300)); }
  let lastStats = null;

  function renderBreakdown(entry) {
    const parts = entry.rolls.map((r, i) => {
      const signStr = r.sign < 0 ? '−' : (i === 0 ? '' : '+');
      if (r.type === 'dice') {
        let s = `${signStr} ${r.count}d${r.sides} [${r.values.join(', ')}]`;
        if (r.op) s += ` ${r.op} ${r.opVal}`;
        return s + ` = ${fmt(r.subtotal)}`;
      }
      return `${signStr} ${fmt(r.value)}`;
    });
    return parts.join(' &nbsp; ');
  }

  function renderStatsPanel() {
    const el = document.getElementById('dice-stats-panel');
    if (!el) return;
    if (!lastStats) { el.innerHTML = '<p class="empty-state">Role um dado para ver as estatísticas.</p>'; return; }
    const p = parseFloat(lastStats.probabilityInPercent);
    const sign = p >= 0 ? '+' : '';
    el.innerHTML = `
      <div class="stat-box"><span class="stat-label">Ult. D</span><span class="stat-value">${lastStats.Lastdice}</span></div>
      <div class="stat-box"><span class="stat-label">Est. D</span><span class="stat-value">${lastStats.guess}</span></div>
      <div class="stat-box stat-box-wide"><span class="stat-label">Tendência (d${lastStats.sides})</span><span class="stat-value">${sign}${lastStats.probabilityInPercent}%</span>
        <span class="stat-desc">chute do próximo dado baseado na tendência atual</span></div>`;
  }

  function renderLog() {
    const container = document.getElementById('dice-log-list');
    const moreBtn = document.getElementById('dice-log-more');
    if (!container) return;
    if (!log.length) { container.innerHTML = '<p class="empty-state">Nenhuma rolagem ainda. Role os dados para começar!</p>'; if (moreBtn) moreBtn.style.display = 'none'; return; }
    const showAll = container.dataset.showAll === '1';
    const items = showAll ? log : log.slice(0, 20);
    container.innerHTML = items.map(e => `
      <div class="log-row">
        <div class="log-row-main"><span class="log-expr">${RPG.util.escapeHtml(e.expr)}</span><span class="log-total">${fmt(e.total)}</span></div>
        <div class="log-row-sub"><span class="log-values">${e.rolls.filter(r => r.type === 'dice').map(r => `[${r.values.join(',')}]`).join(' ')}</span><span class="log-time">${RPG.util.formatDateTime(e.timestamp)}</span></div>
      </div>`).join('');
    if (moreBtn) moreBtn.style.display = (log.length > 20 && !showAll) ? '' : 'none';
  }

  function animateAndRender(entry) {
    const dieEl = document.getElementById('dice-die-visual');
    const resultEl = document.getElementById('dice-result-total');
    const breakdownEl = document.getElementById('dice-result-breakdown');
    if (dieEl) { dieEl.classList.remove('die-rolling'); void dieEl.offsetWidth; dieEl.classList.add('die-rolling'); }
    if (resultEl) resultEl.classList.remove('show');
    RPG.audio.diceRoll();
    setTimeout(() => {
      if (dieEl) dieEl.classList.remove('die-rolling');
      if (resultEl) { resultEl.textContent = fmt(entry.total); resultEl.classList.add('show'); }
      if (breakdownEl) breakdownEl.innerHTML = renderBreakdown(entry);
      RPG.audio.reveal();
      renderStatsPanel(); renderLog();
    }, 900);
  }

  function doRoll(expr) {
    const terms = parseExpression(expr);
    if (!terms) { RPG.toast.show('Expressão inválida. Ex.: 2d20+3d6-5', 'error'); RPG.audio.error(); return; }
    const result = evaluateTerms(terms);
    if (result.error) { RPG.toast.show(result.error, 'error'); RPG.audio.error(); return; }
    let statSides = null, statValue = null;
    for (let i = result.rolls.length - 1; i >= 0; i--) {
      const r = result.rolls[i];
      if (r.type === 'dice' && r.values.length) { statSides = r.sides; statValue = r.values[r.values.length - 1]; break; }
    }
    if (statSides) { lastStats = updateProbability('d' + statSides, statValue, statSides); lastStats.sides = statSides; }
    const entry = { expr, rolls: result.rolls, total: result.total, timestamp: Date.now() };
    log.unshift(entry); if (log.length > 300) log.length = 300; saveLog();
    animateAndRender(entry);
  }

  function init() {
    const input = document.getElementById('dice-expr-input');
    const rollBtn = document.getElementById('dice-roll-btn');
    const dieVisual = document.getElementById('dice-die-visual');
    function triggerRoll() { doRoll((input && input.value.trim()) || '1d20'); }
    if (rollBtn) rollBtn.addEventListener('click', triggerRoll);
    if (dieVisual) dieVisual.addEventListener('click', triggerRoll);
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') triggerRoll(); });
    document.querySelectorAll('[data-quick-die]').forEach(btn => btn.addEventListener('click', () => {
      const sides = btn.dataset.quickDie; if (input) input.value = `1d${sides}`; doRoll(`1d${sides}`);
    }));
    const moreBtn = document.getElementById('dice-log-more');
    if (moreBtn) moreBtn.addEventListener('click', () => { document.getElementById('dice-log-list').dataset.showAll = '1'; renderLog(); });
    const clearBtn = document.getElementById('dice-log-clear');
    const statsHelpBtn = document.getElementById('dice-stats-help');
    if (statsHelpBtn) statsHelpBtn.addEventListener('click', () => {
      RPG.modal.show('<i class="fa-solid fa-chart-simple"></i> Estatísticas de Operação', `
        <p><strong>Ult. D</strong> é o último resultado do dado considerado para a tendência.</p>
        <p><strong>Est. D</strong> é um chute do próximo resultado, calculado a partir da tendência acumulada. Ele não é uma previsão garantida e não altera a rolagem real.</p>
        <p><strong>Tendência (d20)</strong> acompanha a sequência de resultados:</p>
        <ul>
          <li>Resultados abaixo da metade do dado fazem a tendência subir em direção a <strong>+100%</strong>, aumentando a chance estimada de um próximo resultado acima da metade.</li>
          <li>Resultados acima da metade fazem a tendência descer em direção a <strong>-100%</strong>, aumentando a chance estimada de um próximo resultado abaixo da metade.</li>
          <li>Quando o padrão muda de lado, a tendência volta em direção a <strong>0%</strong>.</li>
          <li>Em <strong>+100%</strong>, o chute é garantido na metade superior; em <strong>-100%</strong>, na metade inferior.</li>
        </ul>
        <p>Exemplo no d20: vários resultados baixos podem levar a <strong>+40%</strong>, <strong>+70%</strong> e até <strong>+100%</strong>. Vários resultados altos fazem o caminho inverso.</p>
      `);
    });
    if (clearBtn) clearBtn.addEventListener('click', async () => {
      const ok = await RPG.modal.confirm('Apagar todo o histórico de rolagens de dados? Esta ação não pode ser desfeita.');
      if (!ok) return;
      log = []; saveLog(); renderLog(); RPG.toast.show('Histórico de dados apagado.', 'success');
    });
    renderLog(); renderStatsPanel();
  }

  /* expõe o motor de dados para outras páginas (ficha, combate, tracker) */
  RPG.diceEngine = {
    roll(expr) { const terms = parseExpression(expr); if (!terms) return { error: 'Expressão inválida.' }; return evaluateTerms(terms); },
    format: fmt
  };

  RPG.modules.dados = { onShow() { } };
  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.dados = `
    <p>Digite uma expressão de dados e toque em <strong>Rolar</strong> ou no d20 grande.</p>
    <ul>
      <li><code>1d20</code> — rola um dado de 20 lados</li>
      <li><code>4d6+8</code> — soma quatro d6 e adiciona 8</li>
      <li><code>2d20+3d6-5</code> — combina vários grupos de dados</li>
      <li><code>2d20*5</code> ou <code>3d20/3</code> — multiplica/divide o resultado do grupo</li>
    </ul>
    <p>Limite: até 500 dados por rolagem e 1.000.000 de lados por dado.</p>
    <p>O painel de estatísticas mostra uma <strong>tendência lúdica</strong> calculada a partir do seu histórico — é só um efeito visual e não altera o resultado real, que é sempre aleatório e justo.</p>`;

  document.addEventListener('DOMContentLoaded', init);
})();
