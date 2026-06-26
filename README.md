# MAINTENANCE BCR

Web app maintenance management (CMMS) — Work Request, Work Order, Backlog,
Maintenance Planning & Scheduling, Asset & Meter Records, Checksheet
(Inspection & Periodical Service), dan Reports. Murni static site
(HTML/CSS/JS, tanpa build step), siap untuk dihubungkan ke backend/app
Android di tahap berikutnya.

## Struktur file

```
.
├── index.html   # struktur halaman
├── style.css    # semua styling
├── app.js       # logic, data, dan rendering tiap modul
└── vercel.json  # konfigurasi deploy (static site)
```

## Jalankan lokal

Karena ini static site, cukup buka `index.html` langsung di browser,
atau pakai server statis sederhana:

```bash
npx serve .
# atau
python3 -m http.server 8080
```

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
   - Build Command: (kosongkan)
   - Output Directory: `.`
4. Klik **Deploy**.

Atau lewat CLI:

```bash
npm i -g vercel
vercel
```

## Catatan penting (data)

- Data saat ini disimpan di **browser storage milik tiap user** (belum ada
  backend/database bersama). Artinya data tidak otomatis sinkron antar
  device/user, dan tidak terhubung ke app Android.
- Untuk integrasi nyata web ⇄ Android, langkah selanjutnya: buat backend
  (REST API + database, mis. Node/Express + PostgreSQL atau Supabase/Firebase),
  lalu ganti bagian `loadDB()` / `saveDB()` di `app.js` agar membaca/menulis
  ke API tersebut, bukan ke storage lokal.
