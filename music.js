/* Muslimah Study 2 — soft original background music
   Generated with the Web Audio API, so no external audio file is required. */
(() => {
  let ctx = null;
  let master = null;
  let timer = null;
  let playing = false;
  let step = 0;

  const melody = [
    [261.63, 0.42], [329.63, 0.42], [392.00, 0.60], [329.63, 0.42],
    [293.66, 0.42], [349.23, 0.42], [440.00, 0.60], [349.23, 0.42],
    [261.63, 0.42], [329.63, 0.42], [392.00, 0.42], [523.25, 0.70],
    [440.00, 0.42], [392.00, 0.42], [329.63, 0.60], [293.66, 0.70]
  ];
  const chords = [
    [261.63, 329.63, 392.00],
    [293.66, 349.23, 440.00],
    [261.63, 329.63, 392.00],
    [246.94, 329.63, 392.00]
  ];

  function setup() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.055;
    master.connect(ctx.destination);
  }

  function tone(freq, duration, when, type='sine', gain=0.045) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.035);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(g).connect(master);
    osc.start(when);
    osc.stop(when + duration + 0.03);
  }

  function playStep() {
    if (!playing || !ctx) return;
    const now = ctx.currentTime + 0.02;
    const [freq, dur] = melody[step % melody.length];
    const chord = chords[Math.floor(step / 4) % chords.length];
    tone(freq, dur, now, 'sine', 0.035);
    if (step % 4 === 0) chord.forEach((f, i) => tone(f / 2, 1.55, now + i * 0.03, 'triangle', 0.010));
    step++;
  }

  async function start() {
    setup();
    if (ctx.state === 'suspended') await ctx.resume();
    if (playing) return;
    playing = true;
    playStep();
    timer = setInterval(playStep, 520);
    updateButton();
  }

  function stop() {
    playing = false;
    clearInterval(timer);
    timer = null;
    updateButton();
  }

  function updateButton() {
    const btn = document.getElementById('musicBtn');
    if (!btn) return;
    btn.textContent = playing ? '🔊 Musik' : '🎵 Musik';
    btn.setAttribute('aria-pressed', String(playing));
    btn.title = playing ? 'Matikan musik' : 'Nyalakan musik';
    btn.classList.toggle('music-on', playing);
  }

  window.MuslimahMusic = {
    toggle: () => playing ? stop() : start(),
    start,
    stop,
    isPlaying: () => playing
  };

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('musicBtn');
    if (!btn) return;
    btn.addEventListener('click', () => window.MuslimahMusic.toggle());
    updateButton();
  });
})();
