# 🌷 Muslimah Study 2 — Sambung Ayat by Donita

**Learn • Grow • Pray • Become Better**

Game belajar sambung ayat (HTML/CSS/JS) + **database gratis** via Google Sheets & Apps Script.

## Fitur

### Game
- Sambung Ayat, XP, level, koin, nyawa, streak, combo, timer, badge
- Dark mode, musik & SFX, LocalStorage, responsive

### Cloud & Database
- ☁️ Simpan / restore progres (nama + PIN)
- 🏆 Leaderboard global
- 💌 Feedback / request surah
- 🔐 **Panel Admin** (CRUD Users & Feedback) — password di Script Properties
- 📖 Halaman **Panduan** untuk pengunjung
- Setup sheet **otomatis** (tidak perlu buat header manual)

## Deploy cepat

1. **GitHub Pages:** upload isi folder ini (root = `index.html`)
2. **Apps Script:** paste `appscript/Code.gs` → Deploy Web App (**Anyone**)
3. Di situs: Cloud → tempel URL `/exec` → Ping → **Jalankan Setup DB**
4. Admin: menu **🔐 Admin** → password **`Bismillaah`**

Detail lengkap: [`SETUP-GOOGLE.md`](SETUP-GOOGLE.md)

## Struktur

```
├── index.html / style.css / script.js
├── data.json / data.js / music.js + assets
├── appscript/Code.gs     ← backend (auto-create DB)
├── SETUP-GOOGLE.md
└── README.md
```

Secret (password admin, spreadsheet ID) **hanya** di Apps Script Script Properties — tidak ada di GitHub.

Made with 🌷 for Muslimah Study 2 — by Donita.
