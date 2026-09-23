/* ============================================================
   RPG System — settings.js — Página "Configurações"
   ============================================================ */
(function () {
  function syncToggles() {
    const themeToggle = document.getElementById('settings-theme-toggle');
    if (themeToggle) themeToggle.checked = document.documentElement.getAttribute('data-theme') === 'light';
    const soundToggle = document.getElementById('settings-sound-toggle');
    if (soundToggle) soundToggle.checked = RPG.storage.get('soundOn', true);
    const ambientToggle = document.getElementById('settings-ambient-toggle');
    if (ambientToggle) ambientToggle.checked = RPG.storage.get('ambientOn', false);
    const volumeSlider = document.getElementById('settings-volume-slider');
    if (volumeSlider) volumeSlider.value = RPG.storage.get('sfxVolume', 0.6);
  }

  function init() {
    syncToggles();
    const themeToggle = document.getElementById('settings-theme-toggle');
    if (themeToggle) themeToggle.addEventListener('change', () => RPG.theme.toggle());

    const soundToggle = document.getElementById('settings-sound-toggle');
    if (soundToggle) soundToggle.addEventListener('change', () => {
      RPG.storage.set('soundOn', soundToggle.checked);
      if (soundToggle.checked) { RPG.audio.click(); if (RPG.storage.get('ambientOn', false)) RPG.audio.startAmbient(); } else { RPG.audio.stopAmbient(); RPG.audio.ensureCtx(); }
      const btn = document.getElementById('btn-sound');
      if (btn) btn.innerHTML = soundToggle.checked ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
    });

    const ambientToggle = document.getElementById('settings-ambient-toggle');
    if (ambientToggle) ambientToggle.addEventListener('change', () => {
      RPG.storage.set('ambientOn', ambientToggle.checked);
      if (ambientToggle.checked) RPG.audio.startAmbient(); else RPG.audio.stopAmbient();
    });

    const volumeSlider = document.getElementById('settings-volume-slider');
    if (volumeSlider) volumeSlider.addEventListener('input', () => RPG.audio.setVolume(parseFloat(volumeSlider.value)));

    const clearBtn = document.getElementById('settings-clear-all');
    if (clearBtn) clearBtn.addEventListener('click', async () => {
      const ok1 = await RPG.modal.confirm('Tem certeza que deseja apagar TODOS os dados salvos? Isso inclui fichas, NPCs, itens, anotações, rastreador e configurações.');
      if (!ok1) return;
      const ok2 = await RPG.modal.confirmTyped('Esta ação é irreversível e não pode ser desfeita.', 'CONFIRMAR');
      if (!ok2) return;
      RPG.storage.clearAll();
      RPG.toast.show('Todos os dados foram apagados. Recarregando...', 'success');
      setTimeout(() => location.reload(), 1200);
    });

    const exportBtn = document.getElementById('settings-export');
    if (exportBtn) exportBtn.addEventListener('click', () => { RPG.storage.downloadExport(); RPG.toast.show('Backup exportado!', 'success'); });

    const importInput = document.getElementById('settings-import-input');
    const importBtn = document.getElementById('settings-import-btn');
    if (importBtn && importInput) importBtn.addEventListener('click', () => importInput.click());
    if (importInput) importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const payload = JSON.parse(await RPG.util.readFileAsText(file));
        const ok = await RPG.modal.confirm('Importar este backup vai sobrescrever os dados atuais correspondentes. Deseja continuar?');
        if (!ok) return;
        const success = RPG.storage.importFromObject(payload);
        if (!success) { RPG.toast.show('Arquivo de backup inválido.', 'error'); return; }
        RPG.toast.show('Backup importado! Recarregando...', 'success');
        setTimeout(() => location.reload(), 1200);
      } catch (err) { RPG.toast.show('Não foi possível ler o arquivo de backup.', 'error'); }
      e.target.value = '';
    });
  }

  RPG.modules.config = { onShow() { syncToggles(); } };
  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.config = `
    <p>Ajuste tema, som e som ambiente por aqui.</p>
    <p><strong>Exportar Backup</strong> baixa um arquivo JSON com absolutamente tudo: fichas, NPCs, itens, anotações e rastreador. Use <strong>Importar Backup</strong> para restaurar em outro navegador ou dispositivo.</p>
    <p><strong>Limpar Todos os Dados</strong> apaga tudo permanentemente — use com cuidado.</p>`;
  document.addEventListener('DOMContentLoaded', init);
})();
