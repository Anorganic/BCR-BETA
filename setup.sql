-- =========================================================
-- MAINTENANCE BCR — Setup Database (Supabase)
-- Jalankan script ini di: Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- 1. Tabel penyimpanan data aplikasi (pendekatan single-document)
create table if not exists app_data (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Baris awal kosong (akan otomatis diisi data contoh oleh web saat pertama dibuka)
insert into app_data (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- 3. Aktifkan Row Level Security
alter table app_data enable row level security;

-- 4. Policy: izinkan baca & tulis untuk siapa saja yang membawa anon key
--    (cocok untuk prototipe internal tanpa login. Untuk produksi yang lebih aman,
--     tambahkan sistem login/auth dan ganti policy ini supaya dibatasi per-user/role.)
create policy "Allow read for all"
  on app_data for select
  using (true);

create policy "Allow update for all"
  on app_data for update
  using (true);

create policy "Allow insert for all"
  on app_data for insert
  with check (true);

-- =========================================================
-- SELESAI. Setelah ini:
-- 1. Buka Settings > API di Supabase
-- 2. Copy "Project URL" dan "anon public" key
-- 3. Paste ke app.js (SUPABASE_URL & SUPABASE_ANON_KEY)
-- =========================================================
