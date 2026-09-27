/* ============================================================
   RPG System — music.js — Player de músicas
   Músicas do site são descobertas automaticamente pela API pública do GitHub.
   Músicas do usuário ficam somente neste navegador (IndexedDB).
   ============================================================ */
(function () {
  const DB_NAME = 'ReignSystemsMusicDB';
  const DB_VERSION = 1;
  const STORE = 'tracks';
  const AUDIO_EXT = /\.(mp3|mp4|ogg|wav|m4a|webm)$/i;

  let db = null;
  let tracks = [];
  let currentIndex = -1;
  let audio = null;
  let objectUrl = null;
  let initialized = false;
  let pendingAutoplay = false;
  let autoStartArmed = true;
  let userPaused = false;

  const state = {
    shuffle: false,
    repeat: false,
    volume: 0.65,
    currentId: null,
    favorites: []
  };

  function saveState() {
    RPG.storage.set('musicPlayerState', {
      shuffle: state.shuffle,
      repeat: state.repeat,
      volume: state.volume,
      currentId: state.currentId,
      favorites: state.favorites
    });
  }

  function loadState() {
    const s = RPG.storage.get('musicPlayerState', {});
    state.shuffle = !!s.shuffle;
    state.repeat = !!s.repeat;
    state.volume = typeof s.volume === 'number' ? RPG.util.clamp(s.volume, 0, 1) : 0.65;
    state.currentId = s.currentId || null;
    state.favorites = Array.isArray(s.favorites) ? s.favorites : [];
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => { db = req.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }

  async function getUserTracks() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function putUserTrack(track) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction(STORE, 'readwrite').objectStore(STORE).put(track);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteUserTrack(id) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const req = d.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function builtInTracks() {
    return tracks.filter(t => t.sourceType === 'site');
  }

  function userTracks() {
    return tracks.filter(t => t.sourceType === 'user');
  }

  function allIds() {
    return tracks.map(t => t.id);
  }

  const SITE_TRACKS_CACHE_KEY = 'reignSystemsSiteMusicTracks';

  function getCachedSiteTracks() {
    try {
      const raw = localStorage.getItem(SITE_TRACKS_CACHE_KEY);
      const cached = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(cached)) return [];
      return cached.filter(t => t && t.id && t.name && t.src && t.sourceType === 'site');
    } catch (_) {
      return [];
    }
  }

  function saveCachedSiteTracks(siteTracks) {
    try {
      // Só metadados/URLs ficam no localStorage; os arquivos continuam no GitHub.
      localStorage.setItem(SITE_TRACKS_CACHE_KEY, JSON.stringify(siteTracks));
    } catch (e) {
      console.warn('[RPG.music] Não foi possível salvar a playlist no localStorage:', e);
    }
  }

  async function discoverSiteTracks() {
    const apiUrl = 'https://api.github.com/repos/MigueruYoutube/ReignSystems/contents/audio';

    try {
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: { 'Accept': 'application/vnd.github+json' }
      });
      if (!response.ok) throw new Error('GitHub API: ' + response.status);

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Resposta inválida da API do GitHub.');

      const siteTracks = data
        .filter(x => x && x.type === 'file' && AUDIO_EXT.test(x.name || ''))
        .map(x => {
          const filename = String(x.name);
          return {
            id: 'site_' + String(x.sha || filename),
            name: filename.replace(/\.[^.]+$/, ''),
            src: String(x.download_url || ('https://raw.githubusercontent.com/MigueruYoutube/ReignSystems/main/audio/' + encodeURIComponent(filename))),
            filename,
            sourceType: 'site'
          };
        });

      // A lista descoberta diretamente da pasta /audio vira o cache local.
      saveCachedSiteTracks(siteTracks);
      return siteTracks;
    } catch (e) {
      console.warn('[RPG.music] Não foi possível consultar a pasta /audio:', e);
      const cached = getCachedSiteTracks();
      if (!cached.length) {
        RPG.toast.show('Não foi possível carregar as músicas do site.', 'error');
      }
      return cached;
    }
  }

  async function loadTracks() {
    // Não existe playlist.json: a lista é descoberta diretamente no GitHub
    // e guardada no localStorage para funcionar mesmo quando a API estiver indisponível.
    const siteTracks = await discoverSiteTracks();
    const stored = await getUserTracks().catch(() => []);

    tracks = siteTracks.concat(stored.map(x => ({
      id: x.id,
      name: x.name,
      filename: x.filename,
      sourceType: 'user',
      blob: x.blob,
      createdAt: x.createdAt
    })));

    state.favorites = state.favorites.filter(id => allIds().includes(id));

    if (state.currentId) {
      currentIndex = tracks.findIndex(t => t.id === state.currentId);
    }
    if (currentIndex < 0 && tracks.length) currentIndex = 0;

    render();
  }

  function currentTrack() {
    return currentIndex >= 0 ? tracks[currentIndex] : null;
  }

  function sourceFor(track) {
    if (!track) return '';
    if (track.sourceType === 'site') return track.src;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(track.blob);
    return objectUrl;
  }

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'auto';
    audio.volume = state.volume;
    audio.addEventListener('loadedmetadata', () => render());
    audio.addEventListener('durationchange', () => render());
    audio.addEventListener('timeupdate', () => {
      const root = document.getElementById('music-player');
      if (!root) return;
      const progress = root.querySelector('#music-progress');
      const time = root.querySelector('#music-time');
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      if (progress) {
        progress.max = duration;
        progress.value = Math.min(currentTime, duration || 0);
      }
      if (time) time.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    });
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', () => {
      RPG.toast.show('Não foi possível reproduzir esta música.', 'error');
      if (tracks.length > 1) next(true);
    });
    return audio;
  }

  function setTrack(index, autoplay) {
    if (!tracks.length) return;
    currentIndex = (index + tracks.length) % tracks.length;
    const track = currentTrack();
    state.currentId = track.id;
    saveState();

    const player = ensureAudio();
    player.pause();
    player.src = sourceFor(track);
    player.load();

    render();

    if (autoplay) {
      pendingAutoplay = true;
      const p = player.play();
      if (p && p.catch) p.catch(() => {
        pendingAutoplay = false;
        render();
      });
    }
  }

  function play() {
    userPaused = false;
    const track = currentTrack();
    if (!track) return;
    const player = ensureAudio();
    if (!player.src) {
      setTrack(currentIndex < 0 ? 0 : currentIndex, false);
    }
    pendingAutoplay = true;
    const p = player.play();
    if (p && p.catch) p.catch(() => {
      pendingAutoplay = false;
      render();
    });
    render();
  }

  function pause() {
    userPaused = true;
    if (!audio) return;
    audio.pause();
    pendingAutoplay = false;
    render();
  }

  function next(fromEnded) {
    if (!tracks.length) return;

    if (fromEnded && state.repeat) {
      setTrack(currentIndex, true);
      return;
    }

    if (state.shuffle && tracks.length > 1) {
      let nextIndex = currentIndex;
      while (nextIndex === currentIndex) nextIndex = Math.floor(Math.random() * tracks.length);
      setTrack(nextIndex, true);
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= tracks.length) {
      setTrack(0, true);
    } else {
      setTrack(nextIndex, true);
    }
  }

  function previous() {
    if (!tracks.length) return;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const prevIndex = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
    setTrack(prevIndex, true);
  }

  function onEnded() {
    next(true);
  }

  function togglePlay() {
    if (audio && !audio.paused) pause();
    else play();
  }

  function toggleFavorite(id) {
    const i = state.favorites.indexOf(id);
    if (i >= 0) state.favorites.splice(i, 1);
    else state.favorites.push(id);
    saveState();
    render();
  }

  function isFavorite(id) {
    return state.favorites.includes(id);
  }

  function toggleShuffle() {
    state.shuffle = !state.shuffle;
    saveState();
    render();
  }

  function toggleRepeat() {
    state.repeat = !state.repeat;
    saveState();
    render();
  }

  function selectTrack(id) {
    const i = tracks.findIndex(t => t.id === id);
    if (i >= 0) setTrack(i, true);
  }

  function setVolume(value) {
    state.volume = RPG.util.clamp(parseFloat(value) || 0, 0, 1);
    if (audio) audio.volume = state.volume;
    saveState();
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function render() {
    const root = document.getElementById('music-player');
    if (!root) return;

    const track = currentTrack();
    const playing = !!(audio && !audio.paused);
    const duration = audio && isFinite(audio.duration) ? audio.duration : 0;
    const currentTime = audio ? audio.currentTime : 0;

    root.querySelector('#music-now-name').textContent = track ? track.name : 'Nenhuma música disponível';
    root.querySelector('#music-now-source').textContent = track
      ? (track.sourceType === 'user' ? 'Música do usuário' : 'Música do site')
      : '';

    const playBtn = root.querySelector('#music-play');
    if (playBtn) {
      playBtn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
      playBtn.setAttribute('aria-label', playing ? 'Pausar' : 'Tocar');
    }

    const shuffleBtn = root.querySelector('#music-shuffle');
    const repeatBtn = root.querySelector('#music-repeat');
    if (shuffleBtn) shuffleBtn.classList.toggle('active', state.shuffle);
    if (repeatBtn) repeatBtn.classList.toggle('active', state.repeat);

    const progress = root.querySelector('#music-progress');
    if (progress) {
      progress.max = duration || 0;
      progress.value = Math.min(currentTime, duration || 0);
    }
    const time = root.querySelector('#music-time');
    if (time) time.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;

    const vol = root.querySelector('#music-volume');
    if (vol) vol.value = state.volume;

    const list = root.querySelector('#music-list');
    if (list) {
      if (!tracks.length) {
        list.innerHTML = '<div class="music-empty">Nenhuma música encontrada.</div>';
      } else {
        list.innerHTML = tracks.map((t, i) => {
          const active = i === currentIndex;
          const fav = isFavorite(t.id);
          return `<div class="music-track ${active ? 'active' : ''}">
            <button class="music-track-main" type="button" data-music-select="${RPG.util.escapeHtml(t.id)}">
              <span class="music-track-icon"><i class="fa-solid ${active && playing ? 'fa-volume-high' : 'fa-music'}"></i></span>
              <span class="music-track-text">
                <strong>${RPG.util.escapeHtml(t.name)}</strong>
                <small>${t.sourceType === 'user' ? 'Seu arquivo' : 'Do site'}</small>
              </span>
            </button>
            <button class="music-fav ${fav ? 'active' : ''}" type="button" data-music-fav="${RPG.util.escapeHtml(t.id)}" aria-label="${fav ? 'Desfavoritar' : 'Favoritar'}">
              <i class="fa-${fav ? 'solid' : 'regular'} fa-star"></i>
            </button>
            ${t.sourceType === 'site'
              ? `<a class="music-download" href="${RPG.util.escapeHtml(t.src)}" download="${RPG.util.escapeHtml(t.filename || t.name)}" aria-label="Baixar ${RPG.util.escapeHtml(t.name)}"><i class="fa-solid fa-download"></i></a>`
              : `<button class="music-delete" type="button" data-music-delete="${RPG.util.escapeHtml(t.id)}" aria-label="Excluir música"><i class="fa-solid fa-trash"></i></button>`}
          </div>`;
        }).join('');
      }
    }
  }

  function bindUI() {
    const root = document.getElementById('music-player');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = '1';

    root.addEventListener('click', async e => {
      const select = e.target.closest('[data-music-select]');
      const fav = e.target.closest('[data-music-fav]');
      const del = e.target.closest('[data-music-delete]');

      if (select) return selectTrack(select.dataset.musicSelect);
      if (fav) return toggleFavorite(fav.dataset.musicFav);
      if (del) {
        const id = del.dataset.musicDelete;
        const track = tracks.find(t => t.id === id);
        if (!track || track.sourceType !== 'user') return;
        const ok = await RPG.modal.confirm(`Excluir "${track.name}" deste navegador?`);
        if (!ok) return;
        await deleteUserTrack(id);
        state.favorites = state.favorites.filter(x => x !== id);
        if (state.currentId === id) {
          if (audio) audio.pause();
          state.currentId = null;
          currentIndex = tracks.findIndex(t => t.sourceType === 'site');
        }
        saveState();
        await loadTracks();
        if (currentIndex >= 0 && currentTrack()) setTrack(currentIndex, false);
        return;
      }

      if (e.target.closest('#music-play')) return togglePlay();
      if (e.target.closest('#music-prev')) return previous();
      if (e.target.closest('#music-next')) return next(false);
      if (e.target.closest('#music-shuffle')) return toggleShuffle();
      if (e.target.closest('#music-repeat')) return toggleRepeat();
    });

    const progress = root.querySelector('#music-progress');
    progress.addEventListener('input', () => {
      if (audio && isFinite(audio.duration)) audio.currentTime = parseFloat(progress.value);
    });

    const volume = root.querySelector('#music-volume');
    volume.addEventListener('input', () => setVolume(volume.value));

    const fileInput = root.querySelector('#music-file');
    const nameInput = root.querySelector('#music-name');
    const addBtn = root.querySelector('#music-add');

    addBtn.addEventListener('click', async () => {
      const file = fileInput.files[0];
      const name = nameInput.value.trim();
      if (!file) return RPG.toast.show('Escolha um arquivo de música.', 'error');
      if (!AUDIO_EXT.test(file.name)) return RPG.toast.show('Formato não suportado. Use MP3, MP4, OGG, WAV, M4A ou WEBM.', 'error');
      if (!name) return RPG.toast.show('Digite o nome que aparecerá no player.', 'error');

      const track = {
        id: 'user_' + RPG.util.uid(),
        name,
        filename: file.name,
        blob: file,
        createdAt: Date.now()
      };
      await putUserTrack(track);
      nameInput.value = '';
      fileInput.value = '';
      await loadTracks();
      const i = tracks.findIndex(t => t.id === track.id);
      if (i >= 0) setTrack(i, false);
      RPG.toast.show('Música adicionada somente neste navegador.', 'success');
    });
  }


  async function clearUserTracks() {
    const list = await getUserTracks().catch(() => []);
    for (const t of list) await deleteUserTrack(t.id);
    state.favorites = [];
    state.currentId = null;
    if (audio) { audio.pause(); audio.src = ''; }
    currentIndex = -1;
    saveState();
    await loadTracks();
    if (tracks.length) setTrack(0, false);
  }

  function buildUI() {
    const host = document.getElementById('music-player-host');
    if (!host) return;
    host.innerHTML = `
      <div class="music-player" id="music-player">
        <div class="music-now">
          <div class="music-now-icon"><i class="fa-solid fa-music"></i></div>
          <div class="music-now-info">
            <strong id="music-now-name">Carregando músicas...</strong>
            <small id="music-now-source"></small>
          </div>
        </div>

        <div class="music-controls">
          <button class="icon-btn" id="music-shuffle" type="button" title="Ordem aleatória" aria-label="Ordem aleatória"><i class="fa-solid fa-shuffle"></i></button>
          <button class="icon-btn" id="music-prev" type="button" title="Música anterior" aria-label="Música anterior"><i class="fa-solid fa-backward-step"></i></button>
          <button class="music-play-btn" id="music-play" type="button" aria-label="Tocar"><i class="fa-solid fa-play"></i></button>
          <button class="icon-btn" id="music-next" type="button" title="Próxima música" aria-label="Próxima música"><i class="fa-solid fa-forward-step"></i></button>
          <button class="icon-btn" id="music-repeat" type="button" title="Repetir música atual" aria-label="Repetir música atual"><i class="fa-solid fa-repeat"></i></button>
        </div>

        <div class="music-progress-row">
          <span id="music-time">0:00 / 0:00</span>
          <input id="music-progress" type="range" min="0" max="0" step="0.1" value="0" aria-label="Progresso da música" />
        </div>

        <div class="music-volume-row">
          <i class="fa-solid fa-volume-low"></i>
          <input id="music-volume" type="range" min="0" max="1" step="0.01" value="0.65" aria-label="Volume da música" />
          <i class="fa-solid fa-volume-high"></i>
        </div>

        <div class="music-section-title">
          <span><i class="fa-solid fa-list"></i> Playlist</span>
          <small>Lista normal repete automaticamente</small>
        </div>
        <div id="music-list" class="music-list"></div>

        <div class="music-add-box">
          <h4><i class="fa-solid fa-plus"></i> Adicionar música do seu dispositivo</h4>
          <p>Ela fica salva apenas neste navegador e não é enviada para o site.</p>
          <div class="music-add-grid">
            <input id="music-name" class="text-input" type="text" maxlength="100" placeholder="Nome da música" />
            <input id="music-file" class="file-input" type="file" accept="audio/*,.mp4,.m4a,.webm" />
            <button id="music-add" class="btn btn-gold" type="button"><i class="fa-solid fa-plus"></i> Adicionar</button>
          </div>
        </div>
      </div>`;
    bindUI();
  }

  function tick() {
    const root = document.getElementById('music-player');
    if (root && audio) {
      const progress = root.querySelector('#music-progress');
      const time = root.querySelector('#music-time');
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      if (progress) {
        progress.max = duration;
        progress.value = Math.min(currentTime, duration || 0);
      }
      if (time) time.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }
    requestAnimationFrame(tick);
  }

  async function init() {
    if (initialized) return;
    initialized = true;
    loadState();
    buildUI();
    await loadTracks();
    tick();

    // Tenta iniciar quando o usuário já interagiu com o site.
    if (tracks.length && !state.currentId) setTrack(0, false);

    // Autoplay de navegador só pode começar após uma interação do usuário.
    // No primeiro toque/clique no site, iniciamos a playlist automaticamente.
    document.addEventListener('pointerdown', () => {
      if (!autoStartArmed || userPaused || !audio || !currentTrack()) return;
      autoStartArmed = false;
      if (audio.paused) play();
    }, { once: true, passive: true });
  }

  RPG.music = {
    init,
    play,
    pause,
    next: () => next(false),
    previous,
    setVolume,
    get tracks() { return tracks.slice(); },
    get current() { return currentTrack(); },
    clearUserTracks
  };

  // Mantém o antigo "Som Ambiente" compatível com o novo player.
  const oldStart = RPG.audio.startAmbient;
  RPG.audio.startAmbient = function () {
    if (RPG.music) RPG.music.play();
    else oldStart();
  };
  const oldStop = RPG.audio.stopAmbient;
  RPG.audio.stopAmbient = function () {
    if (RPG.music) RPG.music.pause();
    else oldStop();
  };

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', () => {
    if (RPG.music) RPG.music.init();
  });
})();