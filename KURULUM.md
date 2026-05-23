# OnkoMobil — Kurulum Kılavuzu

## 1. Supabase Projesi Oluşturun

1. https://supabase.com adresine gidin → **New Project** oluşturun
2. **SQL Editor** → **New Query** → `supabase/migrations/001_initial.sql` dosyasının içeriğini yapıştırın → **Run**
3. **Settings → API** sayfasından `Project URL` ve `anon/public` key'i kopyalayın

## 2. .env.local Dosyasını Doldurun

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

## 3. Supabase Auth Ayarları

1. **Authentication → Providers → Phone** — SMS provider seçin (Twilio veya test için "Test OTP" açık bırakın)
2. **Authentication → URL Configuration** → Redirect URL: `onkomobil://`

> **Geliştirme için:** Phone Auth yerine test OTP kullanabilirsiniz. Supabase Dashboard → Auth → Users → "Invite" ile manuel kullanıcı ekleyin.

## 4. Uygulamayı Çalıştırın

```bash
cd C:\onko-mobil
npx expo start
```

- Telefona **Expo Go** uygulamasını indirin
- QR kodu tarayın → uygulama açılır

## 5. Test Hastası Ekleyin

SQL Editor'da:

```sql
-- Doktor ekle
insert into public.doktorlar (email, ad, soyad) 
values ('doktor@test.com', 'Test', 'Doktor');

-- Hasta ekle
insert into public.hastalar_mobil (doktor_id, ad, soyad, telefon, protokol_no)
values (
  (select id from public.doktorlar limit 1),
  'Test', 'Hasta',
  '+905001234567',
  '12345'
);

-- Auth user oluştur (Supabase Dashboard → Auth → Users → Add User)
-- Sonra profil bağla:
insert into public.hasta_profil (id, hasta_id, ad, soyad)
values (
  '<AUTH_USER_ID>',
  (select id from public.hastalar_mobil limit 1),
  'Test', 'Hasta'
);

-- Oral ilaç ekle
insert into public.ilaclar (hasta_id, ilac_adi, doz, birim, yol, hatirlatma_saatleri)
values (
  (select id from public.hastalar_mobil limit 1),
  'Kapesitabin', '500', 'mg', 'oral',
  '["08:00","20:00"]'
);

-- IV infüzyon ekle
insert into public.infuzyonlar (hasta_id, tarih, protokol, durum)
values (
  (select id from public.hastalar_mobil limit 1),
  current_date + interval '5 days',
  'XELOX 3. Siklus',
  'planli'
);
```

## 6. onko-takip Entegrasyonu (Faz 4)

`onko-takip` masaüstü uygulamasına şu özellikler eklenecek:
- **Hastayı Mobil'e Kaydet** → hasta ve tedavi planını Supabase'e gönderir
- **Mobil Bildirimleri Al** → Grade 3+ semptomları `toksisite_kayitlari`'na ekler

---

## Proje Yapısı

```
app/
  (auth)/giris.tsx        ← SMS OTP giriş ekranı
  (tabs)/
    index.tsx             ← Ana sayfa (günlük özet)
    semptom.tsx           ← Yan etki bildirimi (CTCAE 0-4)
    ilac.tsx              ← İlaç takibi + 7 günlük uyum
    rapor.tsx             ← Haftalık rapor + PDF paylaşım
constants/
  ctcae.ts                ← 12 semptom tanımı
  renkler.ts              ← Renk paleti
lib/
  supabase.ts             ← Client + yardımcı sorgular
  bildirim.ts             ← Push + yerel bildirimler
supabase/
  migrations/001_initial.sql ← Veritabanı şeması
```
