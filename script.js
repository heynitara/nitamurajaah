/* Muslimah Study 2 — Sambung Ayat by Donita
   + Cloud Save via Google Sheets / Apps Script
*/
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const STORAGE = 'muslimahStudy2State';
const API_KEY = 'muslimahStudy2ApiUrl';
const CLOUD_KEY = 'muslimahStudy2CloudCreds';

const defaultState = {
  xp: 0, coins: 100, lives: 3, streak: 0, bestStreak: 0,
  games: 0, correct: 0, answered: 0, combo: 0, theme: 'light',
  cloudName: '', lastSave: null
};

let state = JSON.parse(localStorage.getItem(STORAGE) || 'null') || { ...defaultState };
let DATA = null;
let questions = [];
let qIndex = 0;
let session = { correct: 0, answered: 0, xp: 0, coins: 0, score: 0 };
let timerId = null;
let timeLeft = 30;
let gameOver = false;

/* ── API helper ─────────────────────────────────────────── */
function getApiUrl() {
  return (localStorage.getItem(API_KEY) || '').trim().replace(/\/$/, '');
}

async function apiCall(action, payload = {}) {
  const url = getApiUrl();
  if (!url) throw new Error('URL API belum di-set. Buka tab Cloud → Pengaturan API.');

  // Apps Script Web App accepts both GET query and POST body.
  // We use POST with JSON for reliability, and also append action as query for doGet fallback.
  const fullUrl = url + (url.includes('?') ? '&' : '?') + 'action=' + encodeURIComponent(action);

  const res = await fetch(fullUrl, {
    method: 'POST',
    // Apps Script often needs text/plain to avoid CORS preflight issues
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
    redirect: 'follow'
  });

  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Gagal');
  return json;
}

/* ── Core game ──────────────────────────────────────────── */
async function loadData() {
  try {
    const r = await fetch('data.json');
    DATA = await r.json();
  } catch (e) {
    DATA = window.MUSLIMAH_STUDY_DATA;
  }
  renderSurahs();
  startGame();
}

function save() {
  localStorage.setItem(STORAGE, JSON.stringify(state));
}

function level() {
  return Math.floor(state.xp / 100) + 1;
}
function xpInLevel() {
  return state.xp % 100;
}

function updateStats() {
  $('#homeLevel').textContent = level();
  $('#homeXp').textContent = state.xp;
  $('#homeStreak').textContent = state.streak + ' hari';
  $('#homeCoins').textContent = state.coins;
  $('#level').textContent = level();
  $('#xp').textContent = state.xp;
  $('#xpBar').style.width = xpInLevel() + '%';
  $('#coins').textContent = state.coins;
  $('#lives').textContent = state.lives;
  $('#statsLevel').textContent = level();
  $('#games').textContent = state.games;
  $('#correct').textContent = state.correct;
  $('#accuracy').textContent = (state.answered ? Math.round(state.correct / state.answered * 100) : 0) + '%';
  $('#bestStreak').textContent = state.bestStreak;
  if (state.cloudName) {
    $('#profileName').textContent = state.cloudName;
    $('#profileText').textContent = 'Cloud: ' + state.cloudName + (state.lastSave ? ' · tersimpan' : '');
  }
  renderBadges();
}

function toast(t) {
  const x = $('#toast');
  x.textContent = t;
  x.classList.add('show');
  setTimeout(() => x.classList.remove('show'), 2000);
}

function sfx(name) {
  if (window.MuslimahMusic) window.MuslimahMusic.playSfx(name);
}

function go(page) {
  $$('.page').forEach(x => x.classList.toggle('active', x.id === page));
  $$('[data-page]').forEach(x => x.classList.toggle('active', x.dataset.page === page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (page === 'stats') updateStats();
  if (page === 'game' && questions.length === 0) startGame();
  if (page === 'cloud') {
    // prefill saved creds
    const creds = JSON.parse(localStorage.getItem(CLOUD_KEY) || 'null');
    if (creds) {
      $('#cloudName').value = creds.name || '';
      $('#cloudPin').value = creds.pin || '';
    }
    const api = getApiUrl();
    if (api) $('#apiUrl').value = api;
  }
}

$$('[data-page]').forEach(b => b.addEventListener('click', () => {
  sfx('click');
  go(b.dataset.page);
}));

$('#themeBtn').onclick = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('dark', state.theme === 'dark');
  $('#themeBtn').textContent = state.theme === 'dark' ? '☀️' : '🌙';
  save();
};
if (state.theme === 'dark') {
  document.body.classList.add('dark');
  $('#themeBtn').textContent = '☀️';
}

function allPairs() {
  const arr = [];
  DATA.surahs.forEach(s => s.ayahs.forEach(a => a.next.forEach(n => {
    const next = s.ayahs.find(z => z.n === n);
    if (next) arr.push({ surah: s, ayah: a, next });
  })));
  return arr;
}

function shuffle(a) {
  return a.sort(() => Math.random() - 0.5);
}

function makeQuestions() {
  const pool = shuffle(allPairs().slice());
  return pool.slice(0, Math.min(10, pool.length));
}

function startGame() {
  clearInterval(timerId);
  gameOver = false;
  state.lives = 3;
  state.combo = 0;
  qIndex = 0;
  session = { correct: 0, answered: 0, xp: 0, coins: 0, score: 0 };
  questions = makeQuestions();
  renderQuestion();
  updateStats();
}

function renderQuestion() {
  if (qIndex >= questions.length) {
    finishGame();
    return;
  }
  const q = questions[qIndex];
  const s = q.surah;
  $('#gameSurah').textContent = 'QS. ' + s.name;
  $('#questionCount').textContent = `Pertanyaan ${qIndex + 1}/${questions.length}`;
  $('#currentAyah').textContent = q.ayah.text + ' ۝' + q.ayah.n;
  $('#combo').textContent = 'Combo ×' + state.combo;

  const correct = q.next;
  let candidates = [correct];
  const all = s.ayahs.filter(a => a.n !== correct.n);
  shuffle(all).slice(0, 2).forEach(a => candidates.push(a));
  const global = allPairs()
    .filter(x => x.next.n !== correct.n && x.surah.id !== s.id)
    .map(x => x.next);
  shuffle(global).slice(0, Math.max(0, 4 - candidates.length)).forEach(a => candidates.push(a));
  candidates = shuffle(candidates).slice(0, 4);

  $('#answers').innerHTML = candidates
    .map(a => `<button class="answer" data-n="${a.n}">${a.text} ۝${a.n}</button>`)
    .join('');
  $$('.answer').forEach(b => b.onclick = () => answer(+b.dataset.n, correct.n, b));
  resetTimer();
}

function resetTimer() {
  clearInterval(timerId);
  timeLeft = 30;
  $('#timer').textContent = timeLeft;
  timerId = setInterval(() => {
    timeLeft--;
    $('#timer').textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerId);
      answer(-1, questions[qIndex].next.n, null, true);
    }
  }, 1000);
}

function answer(choice, correct, btn, timeout = false) {
  if (gameOver) return;
  clearInterval(timerId);
  state.answered++;
  session.answered++;

  if (choice === correct) {
    if (btn) btn.classList.add('correct');
    state.correct++;
    session.correct++;
    state.combo++;
    const gain = 10 + Math.min(state.combo * 2, 10);
    state.xp += gain;
    state.coins += 5;
    session.xp += gain;
    session.coins += 5;
    session.score += 100 + state.combo * 10;
    sfx('correct');
    toast(state.combo >= 3 ? '🔥 Combo keren! +' + gain + ' XP' : '✨ Benar! +' + gain + ' XP');
    save();
    updateStats();
    setTimeout(() => { qIndex++; renderQuestion(); }, 650);
  } else {
    if (btn) btn.classList.add('wrong');
    const correctBtn = $$('.answer').find(x => +x.dataset.n === correct);
    if (correctBtn) correctBtn.classList.add('correct');
    state.lives = Math.max(0, state.lives - 1);
    state.combo = 0;
    sfx('wrong');
    toast(timeout ? '⏰ Waktu habis!' : '💗 Belum tepat, coba lagi!');
    save();
    updateStats();
    setTimeout(() => {
      if (state.lives <= 0) finishGame();
      else { qIndex++; renderQuestion(); }
    }, 900);
  }
}

$('#hintBtn').onclick = () => {
  if (state.coins < 10) { toast('🪙 Koin belum cukup'); return; }
  state.coins -= 10;
  save();
  const correct = questions[qIndex]?.next.n;
  if (correct) {
    const wrong = $$('.answer').filter(b => +b.dataset.n !== correct);
    if (wrong.length) {
      wrong[0].style.opacity = '.25';
      wrong[0].disabled = true;
    }
  }
  updateStats();
  sfx('click');
  toast('💡 Satu pilihan disamarkan!');
};

$('#skipBtn').onclick = () => {
  if (gameOver) return;
  clearInterval(timerId);
  state.combo = 0;
  sfx('whoosh');
  toast('⏭️ Pertanyaan dilewati');
  qIndex++;
  renderQuestion();
};

function finishGame() {
  if (gameOver) return;
  gameOver = true;
  clearInterval(timerId);
  sfx('victory');
  // session.xp already added during answers — don't double-count
  state.games++;
  state.streak = Math.min(state.streak + 1, 999);
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  save();
  updateStats();
  const acc = session.answered ? Math.round(session.correct / session.answered * 100) : 0;
  $('#resultTitle').textContent =
    acc >= 80 ? "MasyaAllah, hafalanmu makin kuat! 🌷"
    : acc >= 50 ? 'Bagus! Yuk latihan lagi sedikit demi sedikit. 💗'
    : 'Tidak apa-apa, setiap latihan tetap berarti. 🌱';
  $('#resultScore').textContent = session.score;
  $('#resultAccuracy').textContent = acc + '%';
  $('#resultXp').textContent = '+' + session.xp;
  $('#resultCoins').textContent = '+' + session.coins;
  $('#resultModal').classList.add('show');
}

$('#closeModal').onclick = () => $('#resultModal').classList.remove('show');
$('#againBtn').onclick = () => {
  $('#resultModal').classList.remove('show');
  startGame();
};
$('#saveAfterGame').onclick = () => {
  $('#resultModal').classList.remove('show');
  go('cloud');
  // auto-trigger save if creds exist
  const creds = JSON.parse(localStorage.getItem(CLOUD_KEY) || 'null');
  if (creds && creds.name && creds.pin) {
    setTimeout(() => $('#btnSaveCloud').click(), 300);
  }
};

/* ── Surah list ─────────────────────────────────────────── */
function renderSurahs(filter = '') {
  if (!DATA) return;
  const f = filter.toLowerCase();
  const list = DATA.surahs.filter(s =>
    s.name.toLowerCase().includes(f) || s.arabicName.includes(filter)
  );
  $('#surahList').innerHTML = list.map(s => `
    <article class="surah-card card">
      <div class="arabic">${s.arabicName}</div>
      <h3>${s.name}</h3>
      <small>${s.ayahs.length} ayat dalam dataset</small>
      <p>${s.ayahs.slice(0, 2).map(a => a.text).join(' • ')}</p>
      <button class="secondary play-surah" data-id="${s.id}">▶ Latihan</button>
    </article>
  `).join('') || `<div class="notice card">Surah tidak ditemukan 🌷</div>`;

  $$('.play-surah').forEach(b => b.onclick = () => {
    questions = allPairs().filter(x => x.surah.id === b.dataset.id);
    if (!questions.length) { toast('Surah ini belum punya pasangan ayat.'); return; }
    qIndex = 0;
    session = { correct: 0, answered: 0, xp: 0, coins: 0, score: 0 };
    state.lives = 3;
    go('game');
    renderQuestion();
  });
}
$('#surahSearch').oninput = e => renderSurahs(e.target.value);

/* ── Badges ─────────────────────────────────────────────── */
function renderBadges() {
  const list = [
    ['🌱', 'First Step', state.games >= 1, 'Selesaikan 1 game'],
    ['🔥', 'Streak Girl', state.streak >= 3, 'Streak 3 hari'],
    ['⭐', 'XP Hunter', state.xp >= 100, 'Kumpulkan 100 XP'],
    ['🎯', 'Sharp Mind', state.correct >= 10, 'Jawab 10 soal benar'],
    ['🪙', 'Coin Collector', state.coins >= 150, 'Punya 150 koin'],
    ['🏆', 'Level Up', level() >= 3, 'Capai level 3'],
    ['🌷', 'Consistent', state.games >= 5, 'Selesaikan 5 game'],
    ['💗', "Qur'an Lover", state.correct >= 25, '25 jawaban benar']
  ];
  $('#badges').innerHTML = list.map(b => `
    <div class="badge card ${b[2] ? '' : 'locked'}">
      <div class="emoji">${b[0]}</div>
      <b>${b[1]}</b>
      <small>${b[2] ? 'Terbuka ✨' : b[3]}</small>
    </div>
  `).join('');
}

$('#resetBtn').onclick = () => {
  if (confirm('Yakin ingin menghapus semua progres lokal? (Cloud tidak terpengaruh)')) {
    localStorage.removeItem(STORAGE);
    location.reload();
  }
};

/* ── Cloud features ─────────────────────────────────────── */
function setStatus(el, msg, type) {
  el.textContent = msg;
  el.className = 'cloud-status' + (type ? ' ' + type : '');
}

function getCloudCreds() {
  const name = ($('#cloudName').value || '').trim();
  const pin = ($('#cloudPin').value || '').trim();
  return { name, pin };
}

function rememberCreds(name, pin) {
  localStorage.setItem(CLOUD_KEY, JSON.stringify({ name, pin }));
  state.cloudName = name;
  save();
}

$('#btnSaveCloud').onclick = async () => {
  const { name, pin } = getCloudCreds();
  const el = $('#cloudStatus');
  if (name.length < 2) { setStatus(el, 'Nama minimal 2 karakter', 'error'); return; }
  if (pin.length < 3) { setStatus(el, 'PIN minimal 3 karakter', 'error'); return; }

  setStatus(el, 'Menyimpan...', '');
  try {
    const res = await apiCall('save', {
      name, pin,
      xp: state.xp,
      coins: state.coins,
      lives: state.lives,
      streak: state.streak,
      bestStreak: state.bestStreak,
      games: state.games,
      correct: state.correct,
      answered: state.answered,
      combo: state.combo,
      badges: ''
    });
    rememberCreds(name, pin);
    state.lastSave = new Date().toISOString();
    save();
    updateStats();
    setStatus(el, res.message || 'Berhasil disimpan! 🌷', 'ok');
    toast('☁️ Progres tersimpan di cloud!');
  } catch (err) {
    setStatus(el, err.message || 'Gagal menyimpan', 'error');
  }
};

$('#btnLoadCloud').onclick = async () => {
  const { name, pin } = getCloudCreds();
  const el = $('#cloudStatus');
  if (!name || !pin) { setStatus(el, 'Isi nama dan PIN dulu', 'error'); return; }

  setStatus(el, 'Memuat...', '');
  try {
    const res = await apiCall('load', { name, pin });
    const u = res.user;
    // Merge: take cloud data
    state.xp = u.xp;
    state.coins = u.coins;
    state.lives = u.lives;
    state.streak = u.streak;
    state.bestStreak = u.bestStreak;
    state.games = u.games;
    state.correct = u.correct;
    state.answered = u.answered;
    state.combo = u.combo || 0;
    state.cloudName = u.name;
    state.lastSave = u.lastPlay;
    rememberCreds(name, pin);
    save();
    updateStats();
    setStatus(el, 'Progres berhasil di-restore! 🌷 Level ' + level(), 'ok');
    toast('📥 Progres di-restore dari cloud!');
  } catch (err) {
    setStatus(el, err.message || 'Gagal memuat', 'error');
  }
};

$('#btnRefreshLb').onclick = async () => {
  const box = $('#leaderboardList');
  box.innerHTML = '<div class="lb-empty">Memuat ranking...</div>';
  try {
    const res = await apiCall('leaderboard');
    const list = res.list || [];
    if (!list.length) {
      box.innerHTML = '<div class="lb-empty">Belum ada data ranking 🌷<br>Jadilah yang pertama!</div>';
      return;
    }
    box.innerHTML = list.map((u, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      return `
        <div class="lb-row">
          <div class="lb-rank ${rankClass}">${i + 1}</div>
          <div class="lb-name">${escapeHtml(u.name)}</div>
          <div class="lb-level">Lv.${u.level}</div>
          <div class="lb-xp">${u.xp} XP</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    box.innerHTML = `<div class="lb-empty" style="color:var(--bad)">${escapeHtml(err.message)}</div>`;
  }
};

$('#btnFeedback').onclick = async () => {
  const msg = ($('#feedbackMsg').value || '').trim();
  const el = $('#feedbackStatus');
  if (msg.length < 3) { setStatus(el, 'Pesan terlalu pendek', 'error'); return; }
  const name = ($('#cloudName').value || state.cloudName || 'Anonim').trim();
  setStatus(el, 'Mengirim...', '');
  try {
    const res = await apiCall('feedback', { name, message: msg });
    setStatus(el, res.message || 'Terima kasih! 🌷', 'ok');
    $('#feedbackMsg').value = '';
    toast('💌 Saran terkirim!');
  } catch (err) {
    setStatus(el, err.message || 'Gagal mengirim', 'error');
  }
};

$('#btnSaveApi').onclick = () => {
  const url = ($('#apiUrl').value || '').trim();
  if (!url) {
    setStatus($('#apiStatus'), 'URL kosong', 'error');
    return;
  }
  localStorage.setItem(API_KEY, url);
  setStatus($('#apiStatus'), 'URL API disimpan di browser ini ✓', 'ok');
  toast('⚙️ URL API tersimpan');
};

$('#btnPingApi').onclick = async () => {
  const el = $('#apiStatus');
  setStatus(el, 'Ping...', '');
  try {
    const res = await apiCall('ping');
    setStatus(el, res.message || 'API hidup! 🌷', 'ok');
  } catch (err) {
    setStatus(el, err.message || 'Gagal ping', 'error');
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Boot ───────────────────────────────────────────────── */
loadData();
updateStats();
