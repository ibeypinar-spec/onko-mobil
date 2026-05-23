// ─── Kimlik / Auth ────────────────────────────────────────────────────────────

export interface HastaProfil {
  id: string;
  hasta_id: string;
  ad: string;
  soyad: string;
}

// ─── Hasta ────────────────────────────────────────────────────────────────────

export interface Hasta {
  id: string;
  doktor_id: string;
  protokol_no: string | null;
  ad: string;
  soyad: string;
  telefon: string | null;
  dogum_tarihi: string | null;
  aktif: boolean;
}

// ─── Tedavi ───────────────────────────────────────────────────────────────────

export interface TedaviPlani {
  id: string;
  hasta_id: string;
  protokol_adi: string;
  protokol_kodu: string | null;
  baslangic_tarihi: string | null;
  aktif: boolean;
}

export type IlacYol = 'oral' | 'iv' | 'sc';

export interface Ilac {
  id: string;
  plan_id: string;
  hasta_id: string;
  ilac_adi: string;
  doz: string | null;
  birim: string | null;
  yol: IlacYol;
  // Oral için
  gunler: string | null;            // JSON: [1,2,3] veya "her_gun"
  hatirlatma_saatleri: string | null; // JSON: ["08:00","20:00"]
  // IV için
  iv_tarihler: string | null;       // JSON: ["2026-05-25"]
  aktif: boolean;
}

export interface Infuzyon {
  id: string;
  hasta_id: string;
  plan_id: string | null;
  tarih: string;
  saat: string | null;
  protokol: string | null;
  durum: 'planli' | 'tamamlandi' | 'iptal';
}

// ─── Hasta Girişleri ──────────────────────────────────────────────────────────

export interface IlacUyum {
  id: string;
  hasta_id: string;
  ilac_id: string;
  tarih: string;
  alindi: boolean;
  atlama_nedeni: string | null;
  notlar: string | null;
  created_at: string;
}

export interface Semptom {
  id: string;
  hasta_id: string;
  tarih: string;
  ctcae_terim: string;
  grade: 0 | 1 | 2 | 3 | 4;
  notlar: string | null;
  bildirim_turu: 'gunluk' | 'post_iv' | 'acil';
  okundu: boolean;
  created_at: string;
}

// ─── UI Yardımcıları ──────────────────────────────────────────────────────────

export interface SemptomTanim {
  id: string;
  ad: string;
  emoji: string;
  aciklama: string;
  gradeAciklamalari: [string, string, string, string, string];
  acilGrade: number; // Bu grade ve üzeri → acil bildirim
}
