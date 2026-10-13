/**
 * Muslimah Study 2 — Backend (Google Apps Script)
 * Deploy as Web App: Execute as "Me", Who has access: "Anyone"
 *
 * Sheet structure (buat manual di Google Sheets):
 * 1. Sheet "Users"  → header di baris 1:
 *    id | name | pin | xp | coins | lives | streak | bestStreak | games | correct | answered | combo | badges | lastPlay | createdAt
 * 2. Sheet "Leaderboard" (opsional, bisa dihitung dari Users)
 * 3. Sheet "Feedback" → header:
 *    timestamp | name | message
 */

const SHEET_USERS = 'Users';
const SHEET_FEEDBACK = 'Feedback';
const MAX_LEADERBOARD = 20;

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const params = e.parameter || {};
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        body = {};
      }
    }
    const action = (params.action || body.action || '').toLowerCase();
    const data = Object.assign({}, params, body);

    let result;
    switch (action) {
      case 'save':
        result = saveUser(data);
        break;
      case 'load':
        result = loadUser(data);
        break;
      case 'leaderboard':
        result = getLeaderboard();
        break;
      case 'feedback':
        result = submitFeedback(data);
        break;
      case 'ping':
        result = { ok: true, message: 'Muslimah Study 2 API is alive 🌷', time: new Date().toISOString() };
        break;
      default:
        result = { ok: false, error: 'Unknown action. Use: save, load, leaderboard, feedback, ping' };
    }

    output.setContent(JSON.stringify(result));
  } catch (err) {
    output.setContent(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }

  return output;
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === SHEET_USERS) {
      sheet.appendRow([
        'id', 'name', 'pin', 'xp', 'coins', 'lives', 'streak', 'bestStreak',
        'games', 'correct', 'answered', 'combo', 'badges', 'lastPlay', 'createdAt'
      ]);
    } else if (name === SHEET_FEEDBACK) {
      sheet.appendRow(['timestamp', 'name', 'message']);
    }
  }
  return sheet;
}

function normalizeName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40);
}

function normalizePin(pin) {
  return String(pin || '').trim().slice(0, 12);
}

function findUserRow(sheet, name, pin) {
  const data = sheet.getDataRange().getValues();
  const n = normalizeName(name);
  const p = normalizePin(pin);
  for (let i = 1; i < data.length; i++) {
    if (normalizeName(data[i][1]) === n && normalizePin(data[i][2]) === p) {
      return i + 1; // 1-based row
    }
  }
  return -1;
}

function saveUser(data) {
  const name = normalizeName(data.name);
  const pin = normalizePin(data.pin);
  if (!name || name.length < 2) return { ok: false, error: 'Nama minimal 2 karakter' };
  if (!pin || pin.length < 3) return { ok: false, error: 'PIN minimal 3 karakter' };

  const sheet = getSheet(SHEET_USERS);
  const row = findUserRow(sheet, name, pin);
  const now = new Date().toISOString();

  const payload = [
    null, // id placeholder
    name,
    pin,
    Number(data.xp) || 0,
    Number(data.coins) || 0,
    Number(data.lives) || 3,
    Number(data.streak) || 0,
    Number(data.bestStreak) || 0,
    Number(data.games) || 0,
    Number(data.correct) || 0,
    Number(data.answered) || 0,
    Number(data.combo) || 0,
    String(data.badges || ''),
    now,
    null  // createdAt
  ];

  if (row > 0) {
    // Update existing (keep original id & createdAt)
    const existing = sheet.getRange(row, 1, 1, 15).getValues()[0];
    payload[0] = existing[0];
    payload[14] = existing[14] || now;
    sheet.getRange(row, 1, 1, 15).setValues([payload]);
    return { ok: true, message: 'Progres berhasil disimpan 🌷', name: name };
  } else {
    // New user
    const id = Utilities.getUuid().slice(0, 8);
    payload[0] = id;
    payload[14] = now;
    sheet.appendRow(payload);
    return { ok: true, message: 'Akun baru dibuat & progres disimpan 🌷', name: name, isNew: true };
  }
}

function loadUser(data) {
  const name = normalizeName(data.name);
  const pin = normalizePin(data.pin);
  if (!name || !pin) return { ok: false, error: 'Nama dan PIN wajib diisi' };

  const sheet = getSheet(SHEET_USERS);
  const row = findUserRow(sheet, name, pin);
  if (row < 0) return { ok: false, error: 'Nama atau PIN salah / belum terdaftar' };

  const r = sheet.getRange(row, 1, 1, 15).getValues()[0];
  return {
    ok: true,
    user: {
      id: r[0],
      name: r[1],
      xp: Number(r[3]) || 0,
      coins: Number(r[4]) || 100,
      lives: Number(r[5]) || 3,
      streak: Number(r[6]) || 0,
      bestStreak: Number(r[7]) || 0,
      games: Number(r[8]) || 0,
      correct: Number(r[9]) || 0,
      answered: Number(r[10]) || 0,
      combo: Number(r[11]) || 0,
      badges: String(r[12] || ''),
      lastPlay: r[13],
      createdAt: r[14]
    }
  };
}

function getLeaderboard() {
  const sheet = getSheet(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { ok: true, list: [] };

  const users = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const name = String(r[1] || '').trim();
    if (!name) continue;
    users.push({
      name: name,
      xp: Number(r[3]) || 0,
      level: Math.floor((Number(r[3]) || 0) / 100) + 1,
      bestStreak: Number(r[7]) || 0,
      games: Number(r[8]) || 0,
      correct: Number(r[9]) || 0,
      accuracy: (Number(r[10]) || 0) > 0
        ? Math.round((Number(r[9]) || 0) / Number(r[10]) * 100)
        : 0
    });
  }

  users.sort((a, b) => b.xp - a.xp || b.bestStreak - a.bestStreak);
  return { ok: true, list: users.slice(0, MAX_LEADERBOARD) };
}

function submitFeedback(data) {
  const name = String(data.name || 'Anonim').trim().slice(0, 40);
  const message = String(data.message || '').trim().slice(0, 500);
  if (!message || message.length < 3) return { ok: false, error: 'Pesan terlalu pendek' };

  const sheet = getSheet(SHEET_FEEDBACK);
  sheet.appendRow([new Date().toISOString(), name, message]);
  return { ok: true, message: 'Terima kasih atas saranmu! 🌷' };
}
