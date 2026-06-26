-- =========================================================
-- MAINTENANCE BCR — Setup Login / User (Supabase Auth)
-- Jalankan SETELAH setup.sql, di Supabase SQL Editor > New query
-- =========================================================

-- 1. Tabel profil user (nama tampilan & role)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  role text default 'Viewer',  -- contoh role: Admin, Planner, Mekanik, Viewer
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles readable by authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- 2. Perketat akses tabel app_data: HARUS login dulu (hapus policy lama yang terbuka untuk semua)
drop policy if exists "Allow read for all" on app_data;
drop policy if exists "Allow update for all" on app_data;
drop policy if exists "Allow insert for all" on app_data;

create policy "Authenticated read app_data"
  on app_data for select
  using (auth.role() = 'authenticated');

create policy "Authenticated update app_data"
  on app_data for update
  using (auth.role() = 'authenticated');

create policy "Authenticated insert app_data"
  on app_data for insert
  with check (auth.role() = 'authenticated');

-- =========================================================
-- SELESAI. Cara bikin akun user baru:
-- 1. Supabase Dashboard > Authentication > Users > Add user
--    - Isi email & password, centang "Auto Confirm User"
-- 2. Buka Table Editor > tabel "profiles" > Insert row
--    - id   : copy User UID dari halaman Authentication > Users
--    - name : nama tampilan user tersebut
--    - role : Admin / Planner / Mekanik / Viewer (bebas, untuk label saja)
-- =========================================================
