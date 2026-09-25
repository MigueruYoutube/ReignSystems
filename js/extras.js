/* ============================================================
   RPG System — extras.js
   Página 💫 Extras. Os anúncios são opcionais e ficam isolados
   nesta página; nenhum recurso essencial é bloqueado.
   ============================================================ */
(function () {
  const AD_SCRIPT_SRC = 'https://pl31496892.profitableratecpmnetwork.com/e37c20e4c8733a9997019452a98d1a8b/invoke.js';
  const AD_CONTAINER_ID = 'container-e37c20e4c8733a9997019452a98d1a8b';
  let adLoaded = false;

  function loadAd() {
    if (adLoaded) return;

    const container = document.getElementById(AD_CONTAINER_ID);
    if (!container) return;

    adLoaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = AD_SCRIPT_SRC;

    container.replaceChildren();
    container.appendChild(script);

    const adTarget = document.createElement('div');
    adTarget.id = AD_CONTAINER_ID;
    container.appendChild(adTarget);
  }

  function setupPixCopy() {
    const button = document.getElementById('extras-pix-copy');
    if (!button || button.dataset.ready === '1') return;
    button.dataset.ready = '1';

    button.addEventListener('click', async () => {
      const pix = button.dataset.pix || '';
      try {
        await navigator.clipboard.writeText(pix);
        const original = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-check"></i> Pix copiado!';
        setTimeout(() => { button.innerHTML = original; }, 1800);
      } catch {
        window.prompt('Copie a chave Pix:', pix);
      }
    });
  }

  // Carrega o anúncio assim que o sistema inicia, e não apenas ao abrir Extras.
  // Assim ele já fica pronto quando o usuário navegar até a aba.
  setupPixCopy();
  loadAd();

  RPG.modules.extras = {
    onShow() {
      setupPixCopy();
      loadAd();
    }
  };

  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.extras = `
    <p>Esta área existe para apoiar a manutenção do Reign System's.</p>
    <p>Se você não puder ajudar via Pix, os anúncios desta aba também ajudam na manutenção do projeto.</p>
    <p>Não é necessário clicar em anúncios para apoiar. Se algum anúncio for do seu interesse, interaja com ele apenas se quiser.</p>
    <p>Os anúncios não aparecem nas outras ferramentas e não bloqueiam nenhuma função essencial.</p>`;
})();
