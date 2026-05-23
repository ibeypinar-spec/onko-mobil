-- ============================================================
-- OnkoMobil — Supabase Veritabanı Şeması
-- supabase.com > SQL Editor > New Query > Çalıştır
-- ============================================================

-- Uzantılar
create extension if not exists "uuid-ossp";

-- ─── Doktor profilleri ────────────────────────────────────────────────────────
create table public.doktorlar (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  ad           text,
  soyad        text,
  kurum        text,
  created_at   timestamptz default now()
);

-- ─── Hastalar (onko-takip'ten senkronize) ────────────────────────────────────
create table public.hastalar_mobil (
  id                  uuid primary key default gen_random_uuid(),
  doktor_id           uuid references public.doktorlar(id) on delete cascade,
  protokol_no         text,
  ad                  text not null,
  soyad               text,
  telefon             text unique,         -- OTP girişi için
  dogum_tarihi        date,
  aktif               boolean default true,
  onkotakip_hasta_id  integer,             -- onko-takip local SQLite ID
  created_at          timestamptz default now()
);

-- ─── Hasta auth profili ───────────────────────────────────────────────────────
-- Supabase auth.users tablosu ile eşleşir
create table public.hasta_profil (
  id         uuid primary key references auth.users(id) on delete cascade,
  hasta_id   uuid references public.hastalar_mobil(id) on delete cascade,
  ad         text,
  soyad      text
);

-- ─── Tedavi planları ──────────────────────────────────────────────────────────
create table public.tedavi_planlari_mobil (
  id                  uuid primary key default gen_random_uuid(),
  hasta_id            uuid references public.hastalar_mobil(id) on delete cascade,
  protokol_adi        text not null,
  protokol_kodu       text,
  baslangic_tarihi    date,
  aktif               boolean default true,
  onkotakip_plan_id   integer,
  created_at          timestamptz default now()
);

-- ─── İlaçlar ──────────────────────────────────────────────────────────────────
create table public.ilaclar (
  id                    uuid primary key default gen_random_uuid(),
  plan_id               uuid references public.tedavi_planlari_mobil(id) on delete set null,
  hasta_id              uuid references public.hastalar_mobil(id) on delete cascade,
  ilac_adi              text not null,
  doz                   text,
  birim                 text,
  yol                   text not null check (yol in ('oral', 'iv', 'sc')),
  -- Oral ilaç için
  gunler                text,    -- JSON: [1,2,3] gün numaraları VEYA "her_gun"
  hatirlatma_saatleri   text,    -- JSON: ["08:00","20:00"]
  -- IV ilaç için
  iv_tarihler           text,    -- JSON: ["2026-05-25","2026-06-15"]
  aktif                 boolean default true,
  created_at            timestamptz default now()
);

-- ─── İnfüzyonlar ──────────────────────────────────────────────────────────────
create table public.infuzyonlar (
  id          uuid primary key default gen_random_uuid(),
  hasta_id    uuid references public.hastalar_mobil(id) on delete cascade,
  plan_id     uuid references public.tedavi_planlari_mobil(id) on delete set null,
  tarih       date not null,
  saat        text,
  protokol    text,
  durum       text default 'planli' check (durum in ('planli', 'tamamlandi', 'iptal')),
  notlar      text,
  created_at  timestamptz default now()
);

-- ─── Semptomlar / Yan etkiler (hasta girer) ───────────────────────────────────
create table public.semptomlar (
  id              uuid primary key default gen_random_uuid(),
  hasta_id        uuid references public.hastalar_mobil(id) on delete cascade,
  tarih           date not null,
  ctcae_terim     text not null,
  grade           integer not null check (grade between 0 and 4),
  notlar          text,
  bildirim_turu   text default 'gunluk' check (bildirim_turu in ('gunluk', 'post_iv', 'acil')),
  okundu          boolean default false,
  created_at      timestamptz default now(),
  -- Aynı gün aynı semptom → güncelleme (upsert)
  unique (hasta_id, tarih, ctcae_terim)
);

-- ─── İlaç uyumu (hasta girer) ────────────────────────────────────────────────
create table public.ilac_uyum (
  id              uuid primary key default gen_random_uuid(),
  hasta_id        uuid references public.hastalar_mobil(id) on delete cascade,
  ilac_id         uuid references public.ilaclar(id) on delete cascade,
  tarih           date not null,
  alindi          boolean not null,
  atlama_nedeni   text,
  notlar          text,
  created_at      timestamptz default now(),
  unique (hasta_id, ilac_id, tarih)
);

-- ─── Doktor bildirimleri ──────────────────────────────────────────────────────
create table public.doktor_bildirimleri (
  id          uuid primary key default gen_random_uuid(),
  hasta_id    uuid references public.hastalar_mobil(id) on delete cascade,
  doktor_id   uuid references public.doktorlar(id) on delete cascade,
  tip         text check (tip in ('acil_semptom', 'doz_atlama', 'haftalik_ozet')),
  icerik      text,
  okundu      boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.hasta_profil          enable row level security;
alter table public.hastalar_mobil        enable row level security;
alter table public.tedavi_planlari_mobil enable row level security;
alter table public.ilaclar               enable row level security;
alter table public.infuzyonlar           enable row level security;
alter table public.semptomlar            enable row level security;
alter table public.ilac_uyum             enable row level security;
alter table public.doktor_bildirimleri   enable row level security;

-- Hasta kendi verilerine erişir (hasta_id üzerinden)
create policy "hasta_kendi_profili" on public.hasta_profil
  for all using (auth.uid() = id);

create policy "hasta_kendi_hasta_id" on public.hastalar_mobil
  for select using (
    id = (select hasta_id from public.hasta_profil where id = auth.uid())
  );

create policy "hasta_kendi_tedavi" on public.tedavi_planlari_mobil
  for select using (
    hasta_id = (select hasta_id from public.hasta_profil where id = auth.uid())
  );

create policy "hasta_kendi_ilaclar" on public.ilaclar
  for select using (
    hasta_id = (select hasta_id from public.hasta_profil where id = auth.uid())
  );

create policy "hasta_kendi_infuzyonlar" on public.infuzyonlar
  for select using (
    hasta_id = (select hasta_id from public.hasta_profil where id = auth.uid())
  );

create policy "hasta_semptom_okuyaz" on public.semptomlar
  for all using (
    hasta_id = (select hasta_id from public.hasta_profil where id = auth.uid())
  );

create policy "hasta_uyum_okuyaz" on public.ilac_uyum
  for all using (
    hasta_id = (select hasta_id from public.hasta_profil where id = auth.uid())
  );

-- ============================================================
-- Otomatik doktor bildirimi: Grade >= 3 → kayıt ekle
-- ============================================================
create or replace function public.acil_semptom_bildir()
returns trigger language plpgsql security definer as $$
declare
  v_doktor_id uuid;
begin
  if new.grade >= 3 then
    select d.id into v_doktor_id
    from public.doktorlar d
    join public.hastalar_mobil h on h.doktor_id = d.id
    where h.id = new.hasta_id
    limit 1;

    if v_doktor_id is not null then
      insert into public.doktor_bildirimleri (hasta_id, doktor_id, tip, icerik)
      values (
        new.hasta_id,
        v_doktor_id,
        'acil_semptom',
        new.ctcae_terim || ' Grade ' || new.grade || ' — ' || new.tarih::text
      )
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

create trigger semptom_acil_kontrol
  after insert or update on public.semptomlar
  for each row execute function public.acil_semptom_bildir();

-- ============================================================
-- Örnek test verisi (isteğe bağlı — geliştirme için)
-- ============================================================
-- insert into public.doktorlar (email, ad, soyad, kurum)
-- values ('doktor@klinik.com', 'Ahmet', 'Yılmaz', 'Onkoloji Kliniği');
