# MAINTENANCE BCR

Web app maintenance management (CMMS) — Work Request, Work Order, Backlog,
Maintenance Planning & Scheduling, Asset & Meter Records, Checksheet
(Inspection & Periodical Service), dan Reports. Static front-end
(HTML/CSS/JS) + backend Supabase (database bersama, real-time antar user).

## Struktur file

```
.
├── index.html   # struktur halaman
├── style.css    # semua styling
├── app.js       # logic, data, dan rendering tiap modul
└── setup.sql    # script SQL untuk setup database Supabase
```

## Jalankan lokal

Karena ini static site, cukup buka `index.html` langsung di browser,
atau pakai server statis sederhana:

```bash
npx serve .
# atau
python3 -m http.server 8080
```

## Setup Backend (Supabase) — WAJIB untuk data bersama antar user

Tanpa langkah ini, data tetap tersimpan lokal per-browser (seperti sebelumnya).
Dengan backend, semua user (dan nanti app Android) baca/tulis data yang sama.

1. Buat akun gratis di [supabase.com](https://supabase.com) → **New Project**
   - Isi nama project (bebas), pilih region terdekat (Singapore), buat password database (simpan baik-baik)
   - Tunggu ~2 menit sampai project selesai dibuat
2. Di sidebar kiri project, klik **SQL Editor** → **New query**
3. Buka file `setup.sql` (ada di project ini), **copy semua isinya**, paste ke SQL Editor
4. Klik **Run** (atau Ctrl+Enter) — pastikan muncul "Success"
5. Di sidebar kiri, klik **Settings → API**
6. Copy dua nilai ini:
   - **Project URL** (bentuknya `https://xxxxxxxx.supabase.co`)
   - **anon public** key (string panjang di bagian "Project API keys")
7. Buka `app.js`, cari baris paling atas:
   ```js
   const SUPABASE_URL = "GANTI_DENGAN_SUPABASE_URL";
   const SUPABASE_ANON_KEY = "GANTI_DENGAN_SUPABASE_ANON_KEY";
   ```
   Ganti dengan nilai dari langkah 6.
8. Commit & push perubahan `app.js` ke GitHub → Vercel otomatis redeploy.

Setelah ini, buka web-nya: badge kecil di topbar (dekat tombol Refresh) akan
menunjukkan **"Online (server)"** kalau berhasil terhubung. Coba buka dari
2 device/browser berbeda — data yang diinput di satu tempat akan muncul di
tempat lain (otomatis sinkron tiap 20 detik, atau klik tombol **⟳ Refresh**
untuk langsung tarik data terbaru).

> ⚠️ **Catatan keamanan:** setup di atas membuka akses baca/tulis tabel
> `app_data` untuk siapa saja yang punya link web-nya (tanpa login). Ini wajar
> untuk prototipe/internal terbatas. Kalau nanti dipakai lebih luas, tambahkan
> sistem login (Supabase Auth) dan perketat policy di `setup.sql`.
>
> 👉 Lihat bagian **"Setup Login / User"** di bawah — policy ini sudah
> diperketat otomatis begitu kamu menjalankan `auth_setup.sql`.

## Setup Login / User (Supabase Auth)

Setelah backend Supabase aktif (bagian di atas), tambahkan sistem login supaya
hanya user yang punya akun yang bisa membuka & mengubah data.

1. Buka **SQL Editor → New query** di Supabase
2. Copy semua isi file `auth_setup.sql`, paste, klik **Run**
   - Ini akan membuat tabel `profiles` (nama & role tiap user) DAN
     **mengganti** policy `app_data` supaya hanya bisa diakses user yang
     sudah login (sebelumnya bisa diakses siapa saja yang punya link)
3. Update file `index.html`, `style.css`, `app.js` di GitHub dengan versi
   terbaru (commit seperti biasa) → Vercel redeploy otomatis

### Membuat akun untuk tiap user

Tidak ada halaman "daftar/signup" — admin (kamu) yang buat akun manual lewat
Supabase, supaya tidak sembarang orang bisa daftar sendiri:

1. Di Supabase, buka **Authentication → Users**
2. Klik **Add user → Create new user**
3. Isi **Email** dan **Password** untuk user tersebut, centang **Auto Confirm User**
4. Klik **Create user**
5. Copy **User UID** user yang baru dibuat (kolom UID di list user)
6. Buka **Table Editor → profiles → Insert → Insert row**
7. Isi:
   - `id` → paste User UID dari langkah 5
   - `name` → nama tampilan, misal "Andi Saputra"
   - `role` → bebas, misal `Admin`, `Planner`, `Mekanik`, atau `Viewer` (saat ini hanya label, belum membatasi fitur per role)
8. Klik **Save**

Bagikan email + password itu ke user yang bersangkutan. Mereka tinggal buka
web-nya dan login pakai email + password tersebut.

### Cara user logout / cek akun

Klik lingkaran avatar di pojok kanan atas topbar → muncul info nama, role,
email, dan tombol **Logout**.

## Aplikasi Android (tanpa Android Studio, tanpa Play Store)

Web ini sudah disiapkan sebagai **PWA (Progressive Web App)** — artinya bisa
"di-install" jadi app dengan icon sendiri di HP, dan kita bisa bungkus jadi
file `.apk` yang langsung diinstall di HP tim, tanpa proses build Android
yang rumit dan tanpa upload ke Play Store.

File yang sudah ditambahkan untuk PWA: `manifest.json`, `sw.js` (service
worker), `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`. Upload
semua file ini juga ke GitHub seperti file lainnya.

### Opsi A — Install langsung dari browser (paling simpel, tanpa APK)

Setiap anggota tim cukup buka website-nya di Chrome (Android), lalu:
1. Ketuk menu **⋮** (tiga titik) di pojok kanan atas Chrome
2. Pilih **"Install app"** atau **"Add to Home screen"**
3. Icon MAINTENANCE BCR akan muncul di home screen HP, bisa dibuka seperti app biasa (full-screen, tanpa address bar)

Ini sudah cukup untuk kebanyakan kebutuhan, dan **tidak perlu langkah lain
apapun** — otomatis bisa begitu file PWA di atas sudah online.

### Opsi B — Bikin file APK sungguhan (untuk dibagikan/di-install manual)

Kalau mau benar-benar ada file `.apk` yang bisa dikirim lewat WhatsApp/Drive
dan diinstall di HP tim:

1. Buka **[www.pwabuilder.com](https://www.pwabuilder.com)**
2. Masukkan URL web kamu (`https://maintenance-bcr-waskita.vercel.app`) di kotak yang ada
3. Klik **Start**, tunggu proses analisa (akan mengecek manifest, service worker, icon — semua sudah disiapkan di atas)
4. Setelah selesai, klik **Package for Stores**
5. Pilih **Android**
6. Isi/biarkan default pengaturan yang muncul (Package ID, App name, dll — bisa disesuaikan, misal Package ID: `com.bcr.maintenance`)
7. Klik **Generate** / **Download**
8. Akan terdownload file `.apk` (atau `.aab`, untuk sideload pilih yang `.apk`)

### Install APK ke HP tim

1. Kirim file `.apk` itu ke HP tim (lewat WhatsApp, Google Drive, dll)
2. Di HP Android, buka file `.apk` itu dari Downloads
3. Kalau muncul peringatan "Install blocked" / "Unknown sources" → ketuk
   **Settings**, aktifkan izin **"Allow from this source"**, lalu ulangi install
4. Ketuk **Install** → selesai, icon MAINTENANCE BCR muncul di home screen

> Karena APK ini sebenarnya "membungkus" website yang sama, setiap update
> yang kamu lakukan di GitHub (lalu Vercel redeploy) **otomatis ikut update**
> di app Android ini juga — tidak perlu generate ulang APK setiap ada
> perubahan kecil.

## Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit - Maintenance BCR web app"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

## Deploy ke Vercel

1. Login ke [vercel.com](https://vercel.com), klik **Add New → Project**.
2. Import repo GitHub yang baru dibuat.
3. Framework Preset: pilih **Other** (static site, tidak perlu build command).
4. Klik **Deploy**.

Setiap commit baru ke branch `main` otomatis redeploy.

## Catatan & langkah selanjutnya

- **Integrasi Android**: setelah backend Supabase aktif, app Android bisa
  baca/tulis ke project Supabase yang sama (pakai Supabase Android SDK, atau
  REST API-nya langsung) — strukturnya sudah siap dipakai bersama.
- **Skala lebih besar / banyak user bersamaan**: pendekatan saat ini
  menyimpan semua data dalam satu dokumen JSON (`app_data`). Ini simpel dan
  cukup untuk pemakaian tim kecil–menengah. Kalau kebutuhan sudah besar
  (ratusan transaksi/hari, banyak user mengedit bersamaan), pertimbangkan
  migrasi ke tabel relasional per modul (work_requests, work_orders, dst).
