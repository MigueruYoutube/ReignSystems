/* ============================================================
   RPG System — notes.js — Página "Anotações"
   ============================================================ */
(function () {
  function escapeHtml(s) { return RPG.util.escapeHtml(s); }

  function parseInline(text) {
    let html = escapeHtml(text);
    html = html.replace(/\$\((\d{1,3}),(\d{1,3}),(\d{1,3})\)([^$]*)/g, (m, r, g, b, t) => `<span style="color:rgb(${r},${g},${b})">${t}</span>`);
    html = html.replace(/\$\((#[0-9a-fA-F]{3,6})\)([^$]*)/g, (m, hex, t) => `<span style="color:${hex}">${t}</span>`);
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    html = html.replace(/~([^~]+)~/g, '<s>$1</s>');
    html = html.replace(/!([^!]+)!/g, '<strong class="note-important-inline"><i class="fa-solid fa-triangle-exclamation"></i> $1</strong>');
    return html;
  }

  function parseContent(raw) {
    if (!raw) return '';
    const lines = raw.split('\n');
    let html = '', bulletIndex = 0;
    for (const line of lines) {
      const imgMatch = line.match(/^\[\[img:(.+)\]\]$/);
      if (imgMatch) { html += `<div class="note-image-wrap"><img src="${imgMatch[1]}" alt="Imagem da anotação" class="note-image" /></div>`; continue; }
      if (line.startsWith('# ')) { html += `<div class="note-h1">${parseInline(line.slice(2))}</div>`; continue; }
      if (line.startsWith('## ')) { html += `<div class="note-h2">${parseInline(line.slice(3))}</div>`; continue; }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const tone = (bulletIndex % 3) + 1; bulletIndex++;
        html += `<div class="note-bullet note-bullet-tone${tone}"><span class="note-bullet-dot">•</span>${parseInline(line.slice(2))}</div>`;
        continue;
      }
      if (line.startsWith('>')) {
        let content = line.slice(1); if (content.endsWith('<')) content = content.slice(0, -1);
        html += `<div class="note-important-box"><i class="fa-solid fa-thumbtack"></i> ${parseInline(content)}</div>`;
        continue;
      }
      if (line.trim() === '') { html += '<div class="note-blank"></div>'; continue; }
      html += `<div class="note-line">${parseInline(line)}</div>`;
    }
    return html;
  }

  function extractImportantNotes() {
    const results = [];
    pages.forEach(p => {
      const re = /!([^!\n]+)!/g; let m;
      while ((m = re.exec(p.content)) !== null) results.push({ pageId: p.id, pageTitle: p.title, text: m[1] });
    });
    return results;
  }

  /* ---- estado / páginas ---- */
  let pages = RPG.storage.get('notesPages', null);
  if (!pages || !pages.length) pages = [{ id: RPG.util.uid(), title: 'Página 1', content: '', updatedAt: Date.now() }];
  function savePages() { RPG.storage.set('notesPages', pages); }
  let currentPageId = RPG.storage.get('notesCurrentPage', pages[0].id);
  if (!pages.find(p => p.id === currentPageId)) currentPageId = pages[0].id;
  function saveCurrentPageId() { RPG.storage.set('notesCurrentPage', currentPageId); }
  function getCurrentPage() { return pages.find(p => p.id === currentPageId) || pages[0]; }

  function renderEditor() {
    const page = getCurrentPage();
    const textarea = document.getElementById('notes-textarea');
    const titleInput = document.getElementById('notes-title-input');
    const preview = document.getElementById('notes-preview');
    const indexLabel = document.getElementById('notes-page-index');
    if (textarea && document.activeElement !== textarea) textarea.value = page.content;
    if (titleInput && document.activeElement !== titleInput) titleInput.value = page.title;
    if (preview) preview.innerHTML = parseContent(page.content) || '<p class="empty-state">Comece a escrever para ver o preview aqui...</p>';
    if (indexLabel) indexLabel.textContent = `${pages.findIndex(p => p.id === page.id) + 1} / ${pages.length}`;
  }

  function renderImportantSidebar(filter) {
    const list = document.getElementById('notes-important-list');
    if (!list) return;
    const all = extractImportantNotes();
    const filtered = filter ? all.filter(x => x.text.toLowerCase().includes(filter.toLowerCase())) : all;
    if (!filtered.length) { list.innerHTML = '<p class="empty-state">Nenhuma anotação importante (use !assim!).</p>'; return; }
    list.innerHTML = filtered.map(x => `
      <div class="mini-card note-important-item" data-page-id="${x.pageId}">
        <div class="mini-card-title"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(x.text)}</div>
        <div class="mini-card-sub">${escapeHtml(x.pageTitle)}</div>
      </div>`).join('');
  }

  function insertImageToken(dataUrl) {
    const textarea = document.getElementById('notes-textarea');
    const page = getCurrentPage();
    const start = textarea.selectionStart, end = textarea.selectionEnd;
    const token = `\n[[img:${dataUrl}]]\n`;
    const newVal = textarea.value.slice(0, start) + token + textarea.value.slice(end);
    textarea.value = newVal;
    const newPos = start + token.length;
    textarea.setSelectionRange(newPos, newPos);
    page.content = newVal; page.updatedAt = Date.now(); savePages();
    document.getElementById('notes-preview').innerHTML = parseContent(page.content);
    RPG.toast.show('Imagem adicionada à anotação.', 'success');
  }

  function init() {
    renderEditor(); renderImportantSidebar();
    const textarea = document.getElementById('notes-textarea');
    const titleInput = document.getElementById('notes-title-input');
    const preview = document.getElementById('notes-preview');

    if (textarea) {
      textarea.addEventListener('input', () => {
        const page = getCurrentPage();
        page.content = textarea.value; page.updatedAt = Date.now(); savePages();
        if (preview) preview.innerHTML = parseContent(page.content) || '<p class="empty-state">Comece a escrever para ver o preview aqui...</p>';
        renderImportantSidebar(document.getElementById('notes-important-search') ? document.getElementById('notes-important-search').value : '');
      });
      textarea.addEventListener('paste', async (e) => {
        const items = (e.clipboardData || window.clipboardData) ? (e.clipboardData || window.clipboardData).items : null;
        if (!items) return;
        for (const item of items) {
          if (item.type.indexOf('image') !== -1) {
            e.preventDefault();
            const file = item.getAsFile();
            if (!file) return;
            try { insertImageToken(await RPG.util.readFileAsDataURL(file)); } catch (err) { RPG.toast.show('Não foi possível colar a imagem.', 'error'); }
            return;
          }
        }
      });
      let pressTimer = null;
      textarea.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        pressTimer = setTimeout(() => showAddImagePopup(t.clientX, t.clientY), 550);
      });
      ['touchend', 'touchmove', 'touchcancel'].forEach(evt => textarea.addEventListener(evt, () => clearTimeout(pressTimer)));
    }
    if (titleInput) titleInput.addEventListener('input', () => { const page = getCurrentPage(); page.title = titleInput.value || 'Sem título'; page.updatedAt = Date.now(); savePages(); });

    function showAddImagePopup(x, y) {
      const popup = document.getElementById('notes-image-popup');
      if (!popup) return;
      popup.style.left = Math.min(x, window.innerWidth - 180) + 'px';
      popup.style.top = Math.max(y - 50, 10) + 'px';
      popup.classList.add('show');
    }
    const imgPopup = document.getElementById('notes-image-popup');
    const imgFileInput = document.getElementById('notes-image-file-input');
    if (imgPopup && imgFileInput) {
      imgPopup.addEventListener('click', () => { imgFileInput.click(); imgPopup.classList.remove('show'); });
      document.addEventListener('touchstart', (e) => { if (imgPopup.classList.contains('show') && !imgPopup.contains(e.target)) imgPopup.classList.remove('show'); });
    }
    const addImgBtn = document.getElementById('notes-add-image-btn');
    if (addImgBtn && imgFileInput) addImgBtn.addEventListener('click', () => imgFileInput.click());
    if (imgFileInput) imgFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { insertImageToken(await RPG.util.readFileAsDataURL(file)); } catch (err) { RPG.toast.show('Não foi possível carregar a imagem.', 'error'); }
      e.target.value = '';
    });

    const prevBtn = document.getElementById('notes-prev');
    if (prevBtn) prevBtn.addEventListener('click', () => { const idx = pages.findIndex(p => p.id === currentPageId); if (idx > 0) { currentPageId = pages[idx - 1].id; saveCurrentPageId(); renderEditor(); } });
    const nextBtn = document.getElementById('notes-next');
    if (nextBtn) nextBtn.addEventListener('click', () => { const idx = pages.findIndex(p => p.id === currentPageId); if (idx < pages.length - 1) { currentPageId = pages[idx + 1].id; saveCurrentPageId(); renderEditor(); } });
    const newPageBtn = document.getElementById('notes-new-page');
    if (newPageBtn) newPageBtn.addEventListener('click', () => {
      const p = { id: RPG.util.uid(), title: `Página ${pages.length + 1}`, content: '', updatedAt: Date.now() };
      pages.push(p); currentPageId = p.id; savePages(); saveCurrentPageId(); renderEditor();
      RPG.toast.show('Nova página criada.', 'success');
    });
    const delPageBtn = document.getElementById('notes-delete-page');
    if (delPageBtn) delPageBtn.addEventListener('click', async () => {
      if (pages.length <= 1) { RPG.toast.show('Mantenha ao menos uma página.', 'error'); return; }
      const ok = await RPG.modal.confirm(`Excluir a página "${getCurrentPage().title}"? Esta ação não pode ser desfeita.`);
      if (!ok) return;
      const idx = pages.findIndex(p => p.id === currentPageId);
      pages = pages.filter(p => p.id !== currentPageId);
      currentPageId = pages[Math.max(0, idx - 1)].id;
      savePages(); saveCurrentPageId(); renderEditor(); renderImportantSidebar();
    });

    const toggleViewBtn = document.getElementById('notes-toggle-view');
    if (toggleViewBtn) toggleViewBtn.addEventListener('click', () => {
      const area = document.getElementById('notes-editor-area');
      area.classList.toggle('show-preview');
      toggleViewBtn.innerHTML = area.classList.contains('show-preview') ? '<i class="fa-solid fa-pen"></i> Editar' : '<i class="fa-solid fa-eye"></i> Visualizar';
    });

    const sidebarToggle = document.getElementById('notes-sidebar-toggle');
    const sidebar = document.getElementById('notes-sidebar');
    const sidebarClose = document.getElementById('notes-sidebar-close');
    if (sidebarToggle && sidebar) sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    if (sidebarClose && sidebar) sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

    const searchInput = document.getElementById('notes-important-search');
    if (searchInput) searchInput.addEventListener('input', (e) => renderImportantSidebar(e.target.value));
    const importantList = document.getElementById('notes-important-list');
    if (importantList) importantList.addEventListener('click', (e) => {
      const item = e.target.closest('.note-important-item'); if (!item) return;
      currentPageId = item.dataset.pageId; saveCurrentPageId(); renderEditor();
      if (sidebar) sidebar.classList.remove('open');
    });
  }

  RPG.modules.anotacoes = { onShow() { renderEditor(); renderImportantSidebar(); } };
  window.RPGHelp = window.RPGHelp || {};
  window.RPGHelp.anotacoes = `
    <p>Sintaxe especial de formatação (estilo Discord):</p>
    <ul>
      <li><code># Título</code> — título grande</li>
      <li><code>## Subtítulo</code> — subtítulo</li>
      <li><code>- item</code> ou <code>* item</code> — lista com marcadores coloridos</li>
      <li><code>$(255,0,0)texto</code> ou <code>$(#ff0000)texto</code> — cor personalizada</li>
      <li><code>&gt;texto</code> — caixa de "Anotação Importante"</li>
      <li><code>!texto!</code> — negrito + aparece na busca lateral, em qualquer página</li>
      <li><code>**negrito**</code>, <code>_itálico_</code>, <code>~riscado~</code></li>
    </ul>
    <p>Cole uma imagem copiada (Ctrl+V) ou toque e segure no texto para adicionar uma imagem da galeria — ela aparece centralizada, e você pode continuar escrevendo logo abaixo.</p>
    <p>⚠️ Não apague os dados do navegador ou você perderá suas anotações.</p>`;
  document.addEventListener('DOMContentLoaded', init);
})();
