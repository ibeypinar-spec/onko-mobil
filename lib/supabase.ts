import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase proje bilgilerini buraya girin (supabase.com → Settings → API)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Yardımcı sorgular ────────────────────────────────────────────────────────

export async function hastaIdAl(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('hasta_profil')
    .select('hasta_id')
    .eq('id', userId)
    .single();
  return data?.hasta_id ?? null;
}

export async function bugunSemptomlarAl(hastaId: string) {
  const bugun = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('semptomlar')
    .select('*')
    .eq('hasta_id', hastaId)
    .eq('tarih', bugun);
  return data ?? [];
}

export async function semptomEkle(params: {
  hastaId: string;
  ctcaeTerm: string;
  grade: number;
  notlar?: string;
  bildirimTuru?: string;
}) {
  const bugun = new Date().toISOString().split('T')[0];
  return supabase.from('semptomlar').upsert({
    hasta_id: params.hastaId,
    tarih: bugun,
    ctcae_terim: params.ctcaeTerm,
    grade: params.grade,
    notlar: params.notlar ?? null,
    bildirim_turu: params.bildirimTuru ?? 'gunluk',
  }, { onConflict: 'hasta_id,tarih,ctcae_terim' });
}

export async function bugunIlaclarAl(hastaId: string) {
  const { data } = await supabase
    .from('ilaclar')
    .select('*')
    .eq('hasta_id', hastaId)
    .eq('aktif', true)
    .eq('yol', 'oral');
  return data ?? [];
}

export async function ilacUyumKaydet(params: {
  hastaId: string;
  ilacId: string;
  alindi: boolean;
  atlamaNedeni?: string;
}) {
  const bugun = new Date().toISOString().split('T')[0];
  return supabase.from('ilac_uyum').upsert({
    hasta_id: params.hastaId,
    ilac_id: params.ilacId,
    tarih: bugun,
    alindi: params.alindi,
    atlama_nedeni: params.atlamaNedeni ?? null,
  }, { onConflict: 'hasta_id,ilac_id,tarih' });
}

export async function sonrakiIVAl(hastaId: string) {
  const bugun = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('infuzyonlar')
    .select('*')
    .eq('hasta_id', hastaId)
    .eq('durum', 'planli')
    .gte('tarih', bugun)
    .order('tarih', { ascending: true })
    .limit(1)
    .single();
  return data;
}

export async function haftalikSemptomlarAl(hastaId: string) {
  const yediGunOnce = new Date();
  yediGunOnce.setDate(yediGunOnce.getDate() - 6);
  const baslangic = yediGunOnce.toISOString().split('T')[0];
  const { data } = await supabase
    .from('semptomlar')
    .select('*')
    .eq('hasta_id', hastaId)
    .gte('tarih', baslangic)
    .order('tarih', { ascending: true });
  return data ?? [];
}

export async function haftalikUyumAl(hastaId: string) {
  const yediGunOnce = new Date();
  yediGunOnce.setDate(yediGunOnce.getDate() - 6);
  const baslangic = yediGunOnce.toISOString().split('T')[0];
  const { data } = await supabase
    .from('ilac_uyum')
    .select('*')
    .eq('hasta_id', hastaId)
    .gte('tarih', baslangic);
  return data ?? [];
}
