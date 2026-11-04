/* Muslimah Study 2 — background music + cute game sound effects
   Musik default ON & loop terus agar tidak bosan. */
(() => {
  let audio = null;
  let playing = false;
  const sfx = {};
  let soundEnabled = true;
  const MUSIC_PREF = 'muslimahStudy2MusicOn';

  function preferredOn() {
    const v = localStorage.getItem(MUSIC_PREF);
    // default true (selalu on) jika belum pernah set
    return v === null ? true : v === '1';
  }

  function setup() {
    if (audio) return;
    audio = new Audio('muslimah-study-2-bg-music.wav');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.22;

    sfx.correct = new Audio('sfx-correct.wav');
    sfx.wrong = new Audio('sfx-wrong.wav');
    sfx.whoosh = new Audio('sfx-whoosh.wav');
    sfx.victory = new Audio('sfx-victory.wav');
    sfx.click = new Audio('sfx-click.wav');
    Object.values(sfx).forEach(a => { a.preload = 'auto'; a.volume = 0.34; });

    audio.addEventListener('play', () => { playing = true; updateButton(); });
    audio.addEventListener('pause', () => { playing = false; updateButton(); });
    audio.addEventListener('ended', () => {
      if (preferredOn()) audio.play().catch(() => {});
    });
    audio.addEventListener('error', () => {
      playing = false;
      updateButton();
      const btn = document.getElementById('musicBtn');
      if (btn) btn.title = 'File musik tidak dapat diputar';
    });
  }

  async function start() {
    setup();
    try {
      await audio.play();
      playing = true;
      localStorage.setItem(MUSIC_PREF, '1');
      updateButton();
    } catch (err) {
      toastMusic('Klik tombol 🎵 sekali untuk mulai musik (browser butuh interaksi)');
    }
  }

  function stop() {
    if (!audio) return;
    audio.pause();
    playing = false;
    localStorage.setItem(MUSIC_PREF, '0');
    updateButton();
  }

  function playSfx(name) {
    setup();
    if (!soundEnabled || !sfx[name]) return;
    const a = sfx[name].cloneNode(true);
    a.volume = sfx[name].volume;
    a.play().catch(() => {});
  }

  function updateButton() {
    const btn = document.getElementById('musicBtn');
    if (!btn) return;
    btn.textContent = playing ? '🔊 Musik ON' : '🎵 Musik OFF';
    btn.setAttribute('aria-pressed', String(playing));
    btn.title = playing ? 'Matikan musik' : 'Nyalakan musik (disarankan ON)';
    btn.classList.toggle('music-on', playing);
  }

  function toastMusic(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2400);
  }

  window.MuslimahMusic = {
    toggle: () => playing ? stop() : start(),
    start,
    stop,
    isPlaying: () => playing,
    setVolume: (v) => { setup(); audio.volume = Math.max(0, Math.min(1, v)); },
    toggleSounds: () => { soundEnabled = !soundEnabled; return soundEnabled; },
    playSfx,
    preferredOn
  };

  document.addEventListener('DOMContentLoaded', () => {
    setup();
    const btn = document.getElementById('musicBtn');
    if (btn) btn.addEventListener('click', () => window.MuslimahMusic.toggle());
    updateButton();

    // Auto-start setelah interaksi pertama (kebijakan browser)
    if (preferredOn()) {
      const tryPlay = () => {
        if (!playing && preferredOn()) start();
        document.removeEventListener('pointerdown', tryPlay);
        document.removeEventListener('keydown', tryPlay);
        document.removeEventListener('touchstart', tryPlay);
      };
      document.addEventListener('pointerdown', tryPlay, { once: true });
      document.addEventListener('keydown', tryPlay, { once: true });
      document.addEventListener('touchstart', tryPlay, { once: true });
      setTimeout(() => { if (preferredOn() && !playing) start(); }, 800);
    }
  });
})();
