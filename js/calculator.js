/* ============================================================
   RPG System — calculator.js — Página "Calculadora"
   ============================================================ */
(function () {
  let display = '0';
  let history = RPG.storage.get('calcHistory', []);
  function saveHistory() { RPG.storage.set('calcHistory', history.slice(0, 200)); }
  function toEvalString(s) { return s.replace(/×/g, '*').replace(/÷/g, '/'); }
  function formatResult(n) { if (Number.isInteger(n)) return String(n); return String(Math.round(n * 1e8) / 1e8); }

  function evalPercent(expr) {
    const m = expr.match(/^(-?\d+(?:\.\d+)?)([+\-*/])(\d+(?:\.\d+)?)$/);
    if (m) {
      const x = parseFloat(m[1]), op = m[2], y = parseFloat(m[3]);
      if (op === '+') return x + (x * y / 100);
      if (op === '-') return x - (x * y / 100);
      if (op === '*') return x * (y / 100);
      if (op === '/') return y !== 0 ? x / (y / 100) : NaN;
    }
    const single = expr.match(/^(-?\d+(?:\.\d+)?)$/);
    if (single) return parseFloat(single[1]) / 100;
    return NaN;
  }
  function evalAverage(expr) {
    const parts = expr.split(',').map(s => s.trim()).filter(Boolean).map(s => parseFloat(s));
    if (!parts.length || parts.some(isNaN)) return NaN;
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }

  function render() { const el = document.getElementById('calc-display'); if (el) el.textContent = display; }

  function renderHistory() {
    const list = document.getElementById('calc-history-list');
    if (!list) return;
    if (!history.length) { list.innerHTML = '<p class="empty-state">Nenhum cálculo no histórico.</p>'; return; }
    list.innerHTML = history.slice(0, 60).map((h, i) => `
      <div class="log-row" data-idx="${i}">
        <div class="log-row-main"><span class="log-expr">${RPG.util.escapeHtml(h.expr)}</span><span class="log-total">= ${RPG.util.escapeHtml(h.result)}</span></div>
        <div class="log-row-sub"><span class="log-time">${RPG.util.formatDateTime(h.timestamp)}</span></div>
      </div>`).join('');
  }

  function pushHistory(expr, result) {
    history.unshift({ expr, result, timestamp: Date.now() });
    if (history.length > 200) history.length = 200;
    saveHistory(); renderHistory();
  }

  function doEquals() {
    const exprForHistory = display;
    const val = RPG.util.safeMathEval(toEvalString(display));
    if (isNaN(val)) { RPG.toast.show('Expressão inválida.', 'error'); RPG.audio.error(); return; }
    display = formatResult(val); pushHistory(exprForHistory, display); render();
  }
  function doPercent() {
    const val = evalPercent(toEvalString(display));
    if (isNaN(val)) { RPG.toast.show('Use o formato número-operador-número, ex.: 20-10', 'error'); RPG.audio.error(); return; }
    const exprForHistory = display + '%'; display = formatResult(val); pushHistory(exprForHistory, display); render();
  }
  function doAverage() {
    const val = evalAverage(display);
    if (isNaN(val)) { RPG.toast.show('Use números separados por vírgula, ex.: 60,40,20,80', 'error'); RPG.audio.error(); return; }
    const exprForHistory = 'média(' + display + ')'; display = formatResult(val); pushHistory(exprForHistory, display); render();
  }

  function handleButton(action, value) {
    if (action === 'digit') { display = (display === '0') ? value : display + value; }
    else if (action === 'comma') { display = (display === '0') ? value : display + value; }
    else if (action === 'dot') {
      const seg = display.split(/[+\-×÷(),]/).pop();
      if (!seg.includes('.')) display = (display === '0') ? '0.' : display + '.';
    } else if (action === 'op') {
      if (/[+\-×÷]$/.test(display)) display = display.slice(0, -1) + value; else display += value;
    } else if (action === 'paren') display = (display === '0') ? value : display + value;
    else if (action === 'clear') display = '0';
    else if (action === 'back') display = display.length > 1 ? display.slice(0, -1) : '0';
    else if (action === 'equals') { doEquals(); return; }
    else if (action === 'percent') { doPercent(); return; }
    else if (action === 'average') { doAverage(); return; }
    render();
  }

  function init() {
    render(); renderHistory();
    const grid = document.getElementById('calc-grid');
    if (grid) grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]'); if (!btn) return;
      handleButton(btn.dataset.action, btn.dataset.value || '');
    });
    document.addEventListener('keydown', (e) => {
      if (!document.getElementById('page-calculadora').classList.contains('active')) return;
      if (/[0-9]/.test(e.key)) handleButton('digit', e.key);
      else if (e.key === '.') handleButton('dot');
      else if (e.key === ',') handleButton('comma', ',');
      else if (['+', '-'].includes(e.key)) handleButton('op', e.key);
      else if (e.key === '*') handleButton('op', '×');
      else if (e.key === '/') handleButton('op', '÷');
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleButton('equals'); }
      else if (e.key === 'Backspace') handleButton('back');
      else if (e.key === 'Escape') handleButton('clear');
    });
    const clearHistBtn = document.getElementById('calc-history-clear');
    if (clearHistBtn) clearHistBtn.addEventListener('click', async () => {
      const ok = await RPG.modal.confirm('Apagar todo o histórico de cálculos? Esta ação não pode ser desfeita.');
      if (!ok) return;
      history = []; saveHistory(); renderHistory(); RPG.toast.show('Histórico de cálculos apagado.', 'success');
    });
    const histList = document.getElementById('calc-history-list');
    if (histList) histList.addEventListener('click', (e) => {
      const row = e.target.closest('.log-row'); if (!row) return;
      const h = history[parseInt(row.dataset.idx, 10)]; if (!h) return;
      display = h.result; render();
    });
  }

  RPG.modules.calculadora = { onShow() { } };
  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.calculadora = `
    <p>Calculadora padrão com dois botões especiais:</p>
    <ul>
      <li><strong>MÉDIA</strong>: digite números separados por vírgula (ex.: <code>60,40,20,80</code>) e toque em MÉDIA.</li>
      <li><strong>%</strong>: digite algo como <code>20-10</code> e toque em % para aplicar 10% de 20 sobre a operação.</li>
    </ul>
    <p>O histórico guarda data e hora de cada cálculo; toque em um item para reaproveitar o resultado.</p>`;
  document.addEventListener('DOMContentLoaded', init);
})();
