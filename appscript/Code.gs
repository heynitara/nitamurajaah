/**
 * Muslimah Study 2 — Backend (Google Apps Script)
 * =================================================
 * CARA DEPLOY (sekali saja):
 * 1. Buat project Apps Script BARU (script.google.com) ATAU dari spreadsheet kosong
 * 2. Paste SELURUH file ini ke Code.gs → Save
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Authorize → salin URL .../exec
 * 5. Tempel URL itu di website (tab Cloud / Admin → URL API)
 *
 * OTOMATIS saat request pertama:
 * - Membuat Spreadsheet database (jika belum ada)
 * - Membuat sheet Users, Feedback, Config + header
 * - Menyimpan SPREADSHEET_ID & ADMIN_PASSWORD di Script Properties
 * - Password admin default: Bismillaah (bisa diganti di Script Properties)
 *
 * TIDAK ADA SECRET di frontend / GitHub Pages.
 */

var PROP = PropertiesService.getScriptProperties();
var SHEET_USERS = 'Users';
var SHEET_FEEDBACK = 'Feedback';
var SHEET_CONFIG = 'Config';
var MAX_LEADERBOARD = 30;
var DEFAULT_ADMIN_PASSWORD = 'Bismillaah';

/* ═══════════════ ENTRY ═══════════════ */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);

  try {
    e = e || {};
    var params = e.parameter || {};
    var body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        body = {};
      }
    }
    var data = Object.assign({}, params, body);
    var action = String(data.action || '').toLowerCase().trim();

    // Pastikan database siap sebelum aksi apa pun (kecuali info)
    if (action !== 'info') {
      ensureSetup();
    }

    var result;
    switch (action) {
      /* Public */
      case 'ping':
      case 'info':
        result = apiInfo();
        break;
      case 'setup':
        result = ensureSetup(true);
        break;
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

      /* Admin — butuh password */
      case 'admin_login':
        result = adminLogin(data);
        break;
      case 'admin_users_list':
        result = requireAdmin(data) || adminUsersList();
        break;
      case 'admin_user_get':
        result = requireAdmin(data) || adminUserGet(data);
        break;
      case 'admin_user_create':
        result = requireAdmin(data) || adminUserCreate(data);
        break;
      case 'admin_user_update':
        result = requireAdmin(data) || adminUserUpdate(data);
        break;
      case 'admin_user_delete':
        result = requireAdmin(data) || adminUserDelete(data);
        break;
      case 'admin_feedback_list':
        result = requireAdmin(data) || adminFeedbackList();
        break;
      case 'admin_feedback_delete':
        result = requireAdmin(data) || adminFeedbackDelete(data);
        break;
      case 'admin_feedback_clear':
        result = requireAdmin(data) || adminFeedbackClear();
        break;
      case 'admin_stats':
        result = requireAdmin(data) || adminStats();
        break;
      case 'admin_set_password':
        result = requireAdmin(data) || adminSetPassword(data);
        break;

      default:
        result = {
          ok: false,
          error: 'Action tidak dikenal: ' + action,
          hint: 'Gunakan: ping, save, load, leaderboard, feedback, admin_*'
        };
    }

    out.setContent(JSON.stringify(result));
  } catch (err) {
    out.setContent(JSON.stringify({
      ok: false,
      error: err.message || String(err),
      stack: String(err.stack || '').slice(0, 300)
    }));
  }
  return out;
}

/* ═══════════════ SETUP OTOMATIS ═══════════════ */

function ensureSetup(forceReport) {
  var props = PROP;
  var ssId = props.getProperty('SPREADSHEET_ID');
  var created = false;
  var ss;

  if (!ssId) {
    ss = SpreadsheetApp.create('Muslimah Study 2 — Database');
    ssId = ss.getId();
    props.setProperty('SPREADSHEET_ID', ssId);
    created = true;
  } else {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch (e) {
      ss = SpreadsheetApp.create('Muslimah Study 2 — Database');
      ssId = ss.getId();
      props.setProperty('SPREADSHEET_ID', ssId);
      created = true;
    }
  }

  if (!props.getProperty('ADMIN_PASSWORD')) {
    props.setProperty('ADMIN_PASSWORD', DEFAULT_ADMIN_PASSWORD);
  }

  ensureSheetUsers(ss);
  ensureSheetFeedback(ss);
  ensureSheetConfig(ss);

  var msg = created
    ? 'Database baru dibuat otomatis 🌷'
    : 'Database sudah siap';

  if (forceReport) {
    return {
      ok: true,
      message: msg,
      spreadsheetId: ssId,
      spreadsheetUrl: ss.getUrl(),
      adminPasswordHint: 'Default: Bismillaah (tersimpan di Script Properties, bukan di GitHub)',
      sheets: [SHEET_USERS, SHEET_FEEDBACK, SHEET_CONFIG]
    };
  }
  return { ok: true, message: msg, spreadsheetId: ssId };
}

function getSS() {
  var ssId = PROP.getProperty('SPREADSHEET_ID');
  if (!ssId) {
    ensureSetup();
    ssId = PROP.getProperty('SPREADSHEET_ID');
  }
  return SpreadsheetApp.openById(ssId);
}

function ensureSheetUsers(ss) {
  var sh = ss.getSheetByName(SHEET_USERS);
  var headers = [
    'id', 'name', 'pin', 'xp', 'coins', 'lives', 'streak', 'bestStreak',
    'games', 'correct', 'answered', 'combo', 'badges', 'lastPlay', 'createdAt'
  ];
  if (!sh) {
    sh = ss.insertSheet(SHEET_USERS);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  // Hapus Sheet1 default kalau kosong
  try {
    var def = ss.getSheetByName('Sheet1');
    if (def && ss.getSheets().length > 1 && def.getLastRow() <= 1) {
      ss.deleteSheet(def);
    }
  } catch (e) {}
  return sh;
}

function ensureSheetFeedback(ss) {
  var sh = ss.getSheetByName(SHEET_FEEDBACK);
  var headers = ['id', 'timestamp', 'name', 'message'];
  if (!sh) {
    sh = ss.insertSheet(SHEET_FEEDBACK);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

function ensureSheetConfig(ss) {
  var sh = ss.getSheetByName(SHEET_CONFIG);
  if (!sh) {
    sh = ss.insertSheet(SHEET_CONFIG);
    sh.appendRow(['key', 'value', 'updatedAt']);
    sh.appendRow(['app_name', 'Muslimah Study 2', new Date().toISOString()]);
    sh.appendRow(['version', '2.1', new Date().toISOString()]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function apiInfo() {
  var ssId = PROP.getProperty('SPREADSHEET_ID');
  return {
    ok: true,
    message: 'Muslimah Study 2 API is alive 🌷',
    time: new Date().toISOString(),
    hasDatabase: !!ssId,
    spreadsheetId: ssId || null,
    version: '2.1'
  };
}

/* ═══════════════ HELPERS ═══════════════ */

function normalizeName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40);
}

function normalizePin(pin) {
  return String(pin || '').trim().slice(0, 12);
}

function findUserRow(sheet, name, pin) {
  var data = sheet.getDataRange().getValues();
  var n = normalizeName(name);
  var p = normalizePin(pin);
  for (var i = 1; i < data.length; i++) {
    if (normalizeName(data[i][1]) === n && normalizePin(data[i][2]) === p) {
      return i + 1;
    }
  }
  return -1;
}

function findUserRowById(sheet, id) {
  var data = sheet.getDataRange().getValues();
  var sid = String(id || '');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === sid) return i + 1;
  }
  return -1;
}

function rowToUser(r) {
  return {
    id: String(r[0] || ''),
    name: String(r[1] || ''),
    pin: String(r[2] || ''),
    xp: Number(r[3]) || 0,
    coins: Number(r[4]) || 0,
    lives: Number(r[5]) || 3,
    streak: Number(r[6]) || 0,
    bestStreak: Number(r[7]) || 0,
    games: Number(r[8]) || 0,
    correct: Number(r[9]) || 0,
    answered: Number(r[10]) || 0,
    combo: Number(r[11]) || 0,
    badges: String(r[12] || ''),
    lastPlay: r[13] ? String(r[13]) : '',
    createdAt: r[14] ? String(r[14]) : ''
  };
}

/* ═══════════════ PUBLIC: USERS ═══════════════ */

function saveUser(data) {
  var name = normalizeName(data.name);
  var pin = normalizePin(data.pin);
  if (!name || name.length < 2) return { ok: false, error: 'Nama minimal 2 karakter' };
  if (!pin || pin.length < 3) return { ok: false, error: 'PIN minimal 3 karakter' };

  var sheet = ensureSheetUsers(getSS());
  var row = findUserRow(sheet, name, pin);
  var now = new Date().toISOString();

  var payload = [
    null,
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
    null
  ];

  if (row > 0) {
    var existing = sheet.getRange(row, 1, 1, 15).getValues()[0];
    payload[0] = existing[0];
    payload[14] = existing[14] || now;
    sheet.getRange(row, 1, 1, 15).setValues([payload]);
    return { ok: true, message: 'Progres berhasil disimpan 🌷', name: name, id: payload[0] };
  }

  var id = Utilities.getUuid().slice(0, 8);
  payload[0] = id;
  payload[14] = now;
  sheet.appendRow(payload);
  return { ok: true, message: 'Akun baru dibuat & progres disimpan 🌷', name: name, id: id, isNew: true };
}

function loadUser(data) {
  var name = normalizeName(data.name);
  var pin = normalizePin(data.pin);
  if (!name || !pin) return { ok: false, error: 'Nama dan PIN wajib diisi' };

  var sheet = ensureSheetUsers(getSS());
  var row = findUserRow(sheet, name, pin);
  if (row < 0) return { ok: false, error: 'Nama atau PIN salah / belum terdaftar' };

  var r = sheet.getRange(row, 1, 1, 15).getValues()[0];
  var user = rowToUser(r);
  delete user.pin; // jangan kirim PIN ke klien
  return { ok: true, user: user };
}

function getLeaderboard() {
  var sheet = ensureSheetUsers(getSS());
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { ok: true, list: [] };

  var users = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var name = String(r[1] || '').trim();
    if (!name) continue;
    var xp = Number(r[3]) || 0;
    var answered = Number(r[10]) || 0;
    var correct = Number(r[9]) || 0;
    users.push({
      name: name,
      xp: xp,
      level: Math.floor(xp / 100) + 1,
      bestStreak: Number(r[7]) || 0,
      games: Number(r[8]) || 0,
      correct: correct,
      accuracy: answered > 0 ? Math.round(correct / answered * 100) : 0
    });
  }
  users.sort(function (a, b) {
    return b.xp - a.xp || b.bestStreak - a.bestStreak;
  });
  return { ok: true, list: users.slice(0, MAX_LEADERBOARD) };
}

function submitFeedback(data) {
  var name = String(data.name || 'Anonim').trim().slice(0, 40);
  var message = String(data.message || '').trim().slice(0, 500);
  if (!message || message.length < 3) return { ok: false, error: 'Pesan terlalu pendek' };

  var sheet = ensureSheetFeedback(getSS());
  var id = Utilities.getUuid().slice(0, 8);
  sheet.appendRow([id, new Date().toISOString(), name, message]);
  return { ok: true, message: 'Terima kasih atas saranmu! 🌷', id: id };
}

/* ═══════════════ ADMIN AUTH ═══════════════ */

function checkAdminPassword(password) {
  var expected = PROP.getProperty('ADMIN_PASSWORD') || DEFAULT_ADMIN_PASSWORD;
  return String(password || '') === expected;
}

/** Return error object if not admin, else null */
function requireAdmin(data) {
  if (!checkAdminPassword(data.adminPassword || data.password)) {
    return { ok: false, error: 'Password admin salah', code: 'UNAUTHORIZED' };
  }
  return null;
}

function adminLogin(data) {
  if (!checkAdminPassword(data.adminPassword || data.password)) {
    return { ok: false, error: 'Password admin salah' };
  }
  var ssId = PROP.getProperty('SPREADSHEET_ID');
  var url = '';
  try {
    url = getSS().getUrl();
  } catch (e) {}
  return {
    ok: true,
    message: 'Login admin berhasil 🌷',
    spreadsheetId: ssId,
    spreadsheetUrl: url
  };
}

function adminSetPassword(data) {
  var np = String(data.newPassword || '').trim();
  if (np.length < 4) return { ok: false, error: 'Password baru minimal 4 karakter' };
  PROP.setProperty('ADMIN_PASSWORD', np);
  return { ok: true, message: 'Password admin berhasil diganti' };
}

/* ═══════════════ ADMIN: USERS CRUD ═══════════════ */

function adminUsersList() {
  var sheet = ensureSheetUsers(getSS());
  var data = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0] && !data[i][1]) continue;
    list.push(rowToUser(data[i]));
  }
  return { ok: true, list: list, total: list.length };
}

function adminUserGet(data) {
  var sheet = ensureSheetUsers(getSS());
  var row = findUserRowById(sheet, data.id);
  if (row < 0) return { ok: false, error: 'User tidak ditemukan' };
  return { ok: true, user: rowToUser(sheet.getRange(row, 1, 1, 15).getValues()[0]) };
}

function adminUserCreate(data) {
  var name = normalizeName(data.name);
  var pin = normalizePin(data.pin);
  if (!name || name.length < 2) return { ok: false, error: 'Nama minimal 2 karakter' };
  if (!pin || pin.length < 3) return { ok: false, error: 'PIN minimal 3 karakter' };

  var sheet = ensureSheetUsers(getSS());
  if (findUserRow(sheet, name, pin) > 0) {
    return { ok: false, error: 'User dengan nama+PIN ini sudah ada' };
  }

  var now = new Date().toISOString();
  var id = Utilities.getUuid().slice(0, 8);
  sheet.appendRow([
    id, name, pin,
    Number(data.xp) || 0,
    Number(data.coins) || 100,
    Number(data.lives) || 3,
    Number(data.streak) || 0,
    Number(data.bestStreak) || 0,
    Number(data.games) || 0,
    Number(data.correct) || 0,
    Number(data.answered) || 0,
    Number(data.combo) || 0,
    String(data.badges || ''),
    now, now
  ]);
  return { ok: true, message: 'User dibuat', id: id };
}

function adminUserUpdate(data) {
  var sheet = ensureSheetUsers(getSS());
  var row = findUserRowById(sheet, data.id);
  if (row < 0) return { ok: false, error: 'User tidak ditemukan' };

  var existing = sheet.getRange(row, 1, 1, 15).getValues()[0];
  var name = data.name !== undefined ? normalizeName(data.name) : existing[1];
  var pin = data.pin !== undefined ? normalizePin(data.pin) : existing[2];

  var payload = [
    existing[0],
    name,
    pin,
    data.xp !== undefined ? Number(data.xp) : Number(existing[3]) || 0,
    data.coins !== undefined ? Number(data.coins) : Number(existing[4]) || 0,
    data.lives !== undefined ? Number(data.lives) : Number(existing[5]) || 3,
    data.streak !== undefined ? Number(data.streak) : Number(existing[6]) || 0,
    data.bestStreak !== undefined ? Number(data.bestStreak) : Number(existing[7]) || 0,
    data.games !== undefined ? Number(data.games) : Number(existing[8]) || 0,
    data.correct !== undefined ? Number(data.correct) : Number(existing[9]) || 0,
    data.answered !== undefined ? Number(data.answered) : Number(existing[10]) || 0,
    data.combo !== undefined ? Number(data.combo) : Number(existing[11]) || 0,
    data.badges !== undefined ? String(data.badges) : String(existing[12] || ''),
    existing[13] || new Date().toISOString(),
    existing[14] || new Date().toISOString()
  ];
  sheet.getRange(row, 1, 1, 15).setValues([payload]);
  return { ok: true, message: 'User diupdate', user: rowToUser(payload) };
}

function adminUserDelete(data) {
  var sheet = ensureSheetUsers(getSS());
  var row = findUserRowById(sheet, data.id);
  if (row < 0) return { ok: false, error: 'User tidak ditemukan' };
  sheet.deleteRow(row);
  return { ok: true, message: 'User dihapus' };
}

/* ═══════════════ ADMIN: FEEDBACK CRUD ═══════════════ */

function adminFeedbackList() {
  var sheet = ensureSheetFeedback(getSS());
  var data = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0] && !data[i][3]) continue;
    list.push({
      id: String(data[i][0] || ''),
      timestamp: data[i][1] ? String(data[i][1]) : '',
      name: String(data[i][2] || ''),
      message: String(data[i][3] || '')
    });
  }
  list.reverse(); // terbaru dulu
  return { ok: true, list: list, total: list.length };
}

function adminFeedbackDelete(data) {
  var sheet = ensureSheetFeedback(getSS());
  var dataRows = sheet.getDataRange().getValues();
  var sid = String(data.id || '');
  for (var i = 1; i < dataRows.length; i++) {
    if (String(dataRows[i][0]) === sid) {
      sheet.deleteRow(i + 1);
      return { ok: true, message: 'Feedback dihapus' };
    }
  }
  return { ok: false, error: 'Feedback tidak ditemukan' };
}

function adminFeedbackClear() {
  var sheet = ensureSheetFeedback(getSS());
  var last = sheet.getLastRow();
  if (last > 1) {
    sheet.getRange(2, 1, last - 1, 4).clearContent();
    // lebih aman: hapus baris
    for (var r = last; r >= 2; r--) sheet.deleteRow(r);
  }
  return { ok: true, message: 'Semua feedback dihapus' };
}

/* ═══════════════ ADMIN: STATS ═══════════════ */

function adminStats() {
  var usersSheet = ensureSheetUsers(getSS());
  var fbSheet = ensureSheetFeedback(getSS());
  var uData = usersSheet.getDataRange().getValues();
  var totalUsers = Math.max(0, uData.length - 1);
  var totalXp = 0;
  var totalGames = 0;
  for (var i = 1; i < uData.length; i++) {
    totalXp += Number(uData[i][3]) || 0;
    totalGames += Number(uData[i][8]) || 0;
  }
  var totalFeedback = Math.max(0, fbSheet.getLastRow() - 1);
  return {
    ok: true,
    stats: {
      totalUsers: totalUsers,
      totalXp: totalXp,
      totalGames: totalGames,
      totalFeedback: totalFeedback,
      spreadsheetId: PROP.getProperty('SPREADSHEET_ID')
    }
  };
}
