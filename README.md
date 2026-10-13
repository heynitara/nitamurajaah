# 🌷 Muslimah Study 2 — Sambung Ayat by Donita

**Learn • Grow • Pray • Become Better**

Aplikasi game belajar sambung ayat berbasis HTML, CSS, JavaScript, dan JSON.  
Sekarang dilengkapi **Cloud Save + Leaderboard** via Google Sheets & Apps Script (100% gratis).

---

## Fitur

### Game
- 🎮 Game Sambung Ayat dengan soal acak
- ⭐ XP & level
- ❤️ 3 lives
- 🪙 Coins + hint
- 🔥 streak & combo
- ⏱️ timer
- 🎯 skor & akurasi otomatis
- 🏅 badge/pencapaian
- 🔎 pencarian surah
- 🌙 dark mode
- 💾 Local Storage — progres tersimpan di browser
- 📱 responsive untuk HP, tablet, dan laptop

### Cloud (baru!)
- ☁️ **Simpan & Restore progres** ke Google Sheets (nama + PIN)
- 🏆 **Leaderboard global** (ranking berdasarkan XP)
- 💌 **Kirim saran / request surah**
- ⚙️ Setup API sekali, lalu semua user bisa pakai

---

## Cara Deploy ke GitHub Pages

1. Buat repository baru di GitHub (misalnya `muslimah-study-2`).
2. Upload **semua file di folder ini** (kecuali folder `appscript` boleh ikut, tidak mengganggu).
3. Pastikan `index.html` berada di **root** repository.
4. Buka **Settings → Pages**.
5. **Build and deployment** → **Deploy from a branch**.
6. Pilih branch `main` dan folder `/ (root)` → **Save**.
7. Tunggu beberapa saat, lalu buka URL GitHub Pages.

---

## Setup Database (Google Sheets + Apps Script)

**Ikuti panduan lengkap di file:** [`SETUP-GOOGLE.md`](SETUP-GOOGLE.md)

Ringkasan:
1. Buat Google Spreadsheet dengan sheet `Users` dan `Feedback`.
2. Paste kode dari `appscript/Code.gs` ke Apps Script.
3. Deploy sebagai **Web App** (Execute as: Me, Who has access: Anyone).
4. Salin URL Web App → tempel di website (tab Cloud → Pengaturan API).

---

## Struktur File

```
├── index.html          # Struktur halaman
├── style.css           # Desain cute pink/cream + dark mode
├── script.js           # Game + Cloud Save + Leaderboard
├── data.js             # Fallback loader
├── data.json           # Bank data surah & ayat (demo)
├── music.js            # Background music + SFX
├── favicon.svg
├── *.wav / *.png       # Assets audio & gambar
├── appscript/
│   └── Code.gs         # Backend Google Apps Script
├── SETUP-GOOGLE.md     # Panduan setup database
└── README.md
```

---

## Catatan Data Al-Qur'an

`data.json` berisi dataset demo untuk fungsi game (7 surah pendek).  
Untuk penggunaan belajar yang serius, verifikasi teks ayat dengan mushaf atau sumber Al-Qur'an tepercaya sebelum memperluas dataset.

---

Made with 🌷 for Muslimah Study 2 — Sambung Ayat by Donita.
