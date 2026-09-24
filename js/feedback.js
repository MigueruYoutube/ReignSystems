/* ============================================================
   RPG System — feedback.js
   Feedback via Giscus / GitHub Discussions.
   Antes de ativar: habilite Discussions no repositório e preencha
   REPO_ID e CATEGORY_ID abaixo com os valores gerados pelo giscus.app.
   ============================================================ */
(function () {
  const CONFIG = {
    repo: 'MigueruYoutube/ReignSystems',
    repoId: '',       // Ex.: R_kgDO...
    category: '',     // Ex.: General ou uma categoria própria de feedback
    categoryId: ''    // Ex.: DIC_kwDO...
  };

  let loaded = false;

  function isConfigured() {
    return Boolean(CONFIG.repo && CONFIG.repoId && CONFIG.category && CONFIG.categoryId);
  }

  function loadGiscus() {
    const container = document.getElementById('giscus-comments');
    const notice = document.getElementById('giscus-setup-notice');
    if (!container || loaded) return;

    if (!isConfigured()) {
      if (notice) notice.classList.remove('hidden');
      return;
    }

    if (notice) notice.classList.add('hidden');

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', CONFIG.repo);
    script.setAttribute('data-repo-id', CONFIG.repoId);
    script.setAttribute('data-category', CONFIG.category);
    script.setAttribute('data-category-id', CONFIG.categoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'pt');
    script.setAttribute('data-loading', 'lazy');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;
    container.appendChild(script);
    loaded = true;
  }

  RPG.modules.feedback = {
    onShow() {
      loadGiscus();
    }
  };

  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.feedback = `
    <p>Use esta página para enviar sugestões, relatar problemas ou compartilhar ideias para o Reign System's.</p>
    <p>Os comentários são fornecidos pelo Giscus e ficam vinculados às GitHub Discussions do projeto. Para comentar, o visitante precisa autorizar o Giscus com o GitHub.</p>
    <p>O envio do feedback é separado dos seus dados de RPG, que continuam salvos localmente.</p>`;
})();
