# 🌷 Muslimah Study 2 — Sambung Ayat by Donita

**Learn • Grow • Pray • Become Better**

Game belajar sambung ayat (HTML/CSS/JS) + **database gratis** via Google Sheets & Apps Script.

## Fitur baru (update)

* **114 surah lengkap** (Juz 1–30) — dataset Arab Uthmani, bisa dicari per nama / nomor / juz
* **Musik background selalu ON** (default) + loop terus agar tidak bosan; preferensi tersimpan
* **30 soal = 30 juz** — setiap game mengambil 1 soal dari tiap Juz 1–30
* **Sertifikat Murojaah** — setelah selesai 30 soal + akurasi ≥ 60%. Bisa diisi nama, unduh PNG, atau cetak. Ditandatangani atas nama **Putri Donita Al-Hafidzah**
* Nyawa default **5** (karena soal lebih banyak)

## Fitur

### Game
* Sambung Ayat, XP, level, koin, nyawa, streak, combo, timer, badge
* Dark mode, musik & SFX, LocalStorage, responsive

### Cloud & Database
* ☁️ Simpan / restore progres (nama + PIN)
* 🏆 Leaderboard global
* 💌 Feedback / request surah
* 🔐 **Panel Admin** (CRUD Users & Feedback)
* 📖 Halaman **Panduan**

## Deploy cepat

1. **GitHub Pages:** upload isi folder ini (root = `index.html`)
2. **Apps Script:** paste `appscript/Code.gs` → Deploy Web App (**Anyone**)
3. Di situs: Cloud → tempel URL `/exec` → Ping → **Jalankan Setup DB**
4. Admin: menu **🔐 Admin** → password di Script Properties

Detail: lihat `SETUP-GOOGLE.md` di repo asli jika masih dipakai.

## Struktur

```
├── index.html / style.css / script.js
├── data.json          ← 114 surah (Juz 1–30)
├── music.js + assets audio
└── ...
```

Made with 🌷 for Muslimah Study 2 — by **Putri Donita Al-Hafidzah**.
