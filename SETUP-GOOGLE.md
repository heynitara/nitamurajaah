# 🌷 Setup Google Sheets + Apps Script

Panduan lengkap agar fitur Cloud Save, Leaderboard, dan Feedback berfungsi.

---

## Langkah 1 — Buat Google Spreadsheet

1. Buka [https://sheets.google.com](https://sheets.google.com)
2. Klik **Blank spreadsheet**
3. Ganti nama spreadsheet menjadi: `Muslimah Study 2 Database`
4. Rename sheet pertama menjadi **`Users`**
5. Di baris 1 (header), isi kolom A–O persis seperti ini:

| A  | B    | C   | D  | E     | F     | G      | H          | I     | J       | K        | L     | M      | N        | O         |
|----|------|-----|----|-------|-------|--------|------------|-------|---------|----------|-------|--------|----------|-----------|
| id | name | pin | xp | coins | lives | streak | bestStreak | games | correct | answered | combo | badges | lastPlay | createdAt |

6. Buat sheet baru bernama **`Feedback`**
7. Di baris 1 sheet Feedback, isi:

| A         | B    | C       |
|-----------|------|---------|
| timestamp | name | message |

---

## Langkah 2 — Pasang Apps Script

1. Di spreadsheet yang sama, klik menu **Extensions → Apps Script**
2. Hapus semua kode default di `Code.gs`
3. Buka file `appscript/Code.gs` dari folder project ini
4. **Copy seluruh isinya** → paste ke editor Apps Script
5. Klik ikon 💾 **Save** (atau Ctrl+S)
6. Ganti nama project menjadi: `Muslimah Study 2 API`

---

## Langkah 3 — Deploy sebagai Web App

1. Klik tombol biru **Deploy → New deployment**
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**
3. Isi:
   - **Description:** `v1`
   - **Execute as:** `Me` (akun Google-mu)
   - **Who has access:** `Anyone`
4. Klik **Deploy**
5. Akan muncul popup **Authorization required**
   - Klik **Authorize access**
   - Pilih akun Google-mu
   - Klik **Advanced → Go to Muslimah Study 2 API (unsafe)**
   - Klik **Allow**
6. **Salin URL** yang muncul (bentuknya seperti):
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   URL ini adalah **API URL** yang akan kamu tempel di website.

---

## Langkah 4 — Hubungkan ke Website

### Cara A — Via UI website (paling mudah)
1. Buka website yang sudah di-deploy di GitHub Pages
2. Klik tab **☁️ Cloud**
3. Scroll ke bawah → buka **⚙️ Pengaturan API (untuk admin)**
4. Tempel URL Web App tadi
5. Klik **Simpan URL API**
6. Klik **Ping API** — harusnya muncul "Muslimah Study 2 API is alive 🌷"

### Cara B — Default untuk semua pengunjung (opsional)
Kalau kamu mau URL API sudah terisi otomatis untuk semua user:
1. Buka `script.js`
2. Cari baris:
   ```js
   function getApiUrl() {
     return (localStorage.getItem(API_KEY) || '').trim().replace(/\/$/, '');
   }
   ```
3. Ganti menjadi:
   ```js
   function getApiUrl() {
     const saved = (localStorage.getItem(API_KEY) || '').trim().replace(/\/$/, '');
     // Default API URL (ganti dengan URL-mu)
     return saved || 'https://script.google.com/macros/s/XXXX/exec';
   }
   ```
4. Commit & push ulang ke GitHub.

---

## Langkah 5 — Uji Coba

1. Buka tab **☁️ Cloud**
2. Isi **Nama** (contoh: `Donita`) dan **PIN** (contoh: `1234`)
3. Klik **💾 Simpan ke Cloud**
4. Harusnya muncul pesan sukses
5. Cek Google Sheet → baris baru muncul di sheet `Users`
6. Klik **🔄 Refresh** di Leaderboard → namamu harus muncul
7. Coba **📥 Ambil dari Cloud** di browser/device lain dengan nama + PIN yang sama

---

## Update / Redeploy Apps Script

Kalau kamu mengubah kode `Code.gs`:
1. Save di Apps Script editor
2. **Deploy → Manage deployments**
3. Klik ikon pensil ✏️ di deployment aktif
4. Ubah Version ke **New version**
5. Klik **Deploy**
6. URL biasanya **tidak berubah**

---

## Keamanan (penting dibaca)

- PIN disimpan **plain text** di Google Sheet (sederhana, bukan bank).
- Jangan pakai PIN penting (password email/bank).
- Siapa pun yang punya nama + PIN bisa restore progres akun itu.
- Sheet hanya bisa diakses oleh akun Google yang punya spreadsheet (dan Apps Script yang jalan sebagai "Me").
- Untuk penggunaan komunitas kecil / belajar, ini sudah cukup aman dan gratis.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "URL API belum di-set" | Tempel URL di Pengaturan API |
| "Failed to fetch" / CORS | Pastikan deploy "Who has access: Anyone" |
| "Nama atau PIN salah" | Pastikan sama persis (case-insensitive untuk nama) |
| Leaderboard kosong | Belum ada user yang save — save dulu |
| Authorization error | Redeploy + Authorize ulang |
| Sheet kosong setelah save | Cek nama sheet harus tepat: `Users` dan `Feedback` |

---

## Kuota Gratis Google

- Apps Script: ~20.000 request/hari (lebih dari cukup untuk komunitas kecil–menengah)
- Google Sheets: unlimited rows untuk praktisnya

Selamat! Website-mu sekarang punya database gratis 🌷
