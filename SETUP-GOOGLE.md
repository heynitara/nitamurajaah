# 🌷 Setup Google Sheets + Apps Script (otomatis)

**Kamu TIDAK perlu membuat sheet manual.**  
Script akan membuat Spreadsheet + sheet Users / Feedback / Config sendiri saat request pertama (atau tombol **Jalankan Setup DB**).

Password admin default: **`Bismillaah`**  
Disimpan di **Script Properties** (bukan di file GitHub Pages).

---

## Langkah 1 — Buat project Apps Script

1. Buka [https://script.google.com](https://script.google.com)
2. **New project**
3. Hapus kode default → paste **seluruh** isi file `appscript/Code.gs`
4. Save → beri nama project: `Muslimah Study 2 API`

> Boleh juga dari spreadsheet kosong: Extensions → Apps Script.  
> Versi ini **tidak bergantung** pada spreadsheet aktif; ID sheet disimpan di Script Properties.

---

## Langkah 2 — Deploy Web App

1. **Deploy → New deployment**
2. Type: **Web app**
3. Settings:
   - Description: `v2`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. **Deploy** → Authorize (Advanced → Go to … → Allow)
5. **Salin URL** yang berakhiran `/exec`  
   Contoh: `https://script.google.com/macros/s/AKfycb.../exec`

---

## Langkah 3 — Hubungkan ke website (GitHub Pages)

1. Deploy folder project ke GitHub Pages (root = `index.html`)
2. Buka situs → tab **☁️ Cloud** → buka **⚙️ URL API**
3. Tempel URL `/exec` → **Simpan URL API**
4. Klik **Ping API** → harus muncul *API is alive*
5. Klik **Jalankan Setup DB** → spreadsheet database dibuat otomatis di Drive akun Google-mu

URL API disimpan di **LocalStorage browser** saja (bukan di repo GitHub).

---

## Langkah 4 — Panel Admin

1. Menu **🔐 Admin**
2. Password: **`Bismillaah`** (kecuali sudah diganti)
3. Isi URL API jika belum
4. **Masuk** → kelola Users & Feedback (CRUD)

Ganti password admin: tab **Settings** di panel admin (tersimpan di Script Properties).

---

## Apa yang otomatis dibuat?

| Item | Keterangan |
|------|------------|
| Spreadsheet | `Muslimah Study 2 — Database` di Google Drive |
| Sheet **Users** | id, name, pin, xp, coins, lives, streak, bestStreak, games, correct, answered, combo, badges, lastPlay, createdAt |
| Sheet **Feedback** | id, timestamp, name, message |
| Sheet **Config** | meta aplikasi |
| Script Property `SPREADSHEET_ID` | ID spreadsheet |
| Script Property `ADMIN_PASSWORD` | default `Bismillaah` |

---

## Fitur database (ringkas)

| Fitur | Siapa | Cara |
|-------|--------|------|
| Simpan / restore progres | Pemain | Cloud → Nama + PIN |
| Leaderboard | Semua | Cloud → Refresh |
| Kirim saran | Pemain | Cloud → Feedback |
| Lihat / edit / hapus / tambah user | Admin | Admin → Users |
| Lihat / hapus feedback | Admin | Admin → Feedback |
| Ganti password admin | Admin | Admin → Settings |

---

## Update kode Apps Script

1. Edit `Code.gs` → Save  
2. **Deploy → Manage deployments** → pensil ✏️ → **New version** → Deploy  
3. URL `/exec` biasanya **tidak berubah**

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Failed to fetch / CORS | Deploy ulang: **Anyone** + Authorize |
| Respon bukan JSON | Pastikan URL berakhiran `/exec`, bukan `/dev` |
| Password admin salah | Default `Bismillaah`. Cek Script Properties → `ADMIN_PASSWORD` |
| Database belum ada | Klik **Jalankan Setup DB** atau `action=setup` |
| Sheet tidak muncul | Buka Drive akun yang sama dengan yang deploy script |

### Cek / ganti Script Properties manual

Apps Script editor → ⚙️ **Project Settings** → **Script properties**  
- `ADMIN_PASSWORD`  
- `SPREADSHEET_ID`

---

## Keamanan

- Tidak ada password/secret di file yang di-commit ke GitHub Pages.
- Admin password hanya di Script Properties + dicek di server.
- PIN user disimpan di sheet (sederhana; jangan pakai PIN penting).
- Cocok untuk komunitas belajar / skala kecil–menengah (kuota gratis Apps Script ~20k request/hari).

Selamat deploy! 🌷
