import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase, bugunSemptomlarAl, bugunIlaclarAl, sonrakiIVAl, ilacUyumKaydet } from '../../lib/supabase';
import { useHasta } from '../../hooks/useHasta';
import { RENKLER, GOLGE } from '../../constants/renkler';
import { GRADE_RENK, GRADE_EMOJI, SEMPTOM_MAP } from '../../constants/ctcae';
import type { Semptom, Ilac } from '../../types';

export default function AnaSayfa() {
  const { hasta, hastaId, yukleniyor } = useHasta();
  const [semptomlar, setSemptomlar] = useState<Semptom[]>([]);
  const [ilaclar, setIlaclar] = useState<Ilac[]>([]);
  const [uyumlar, setUyumlar] = useState<Record<string, boolean>>({});
  const [sonrakiIV, setSonrakiIV] = useState<{ tarih: string; protokol: string } | null>(null);
  const [yenileniyor, setYenileniyor] = useState(false);

  const veriyiYukle = useCallback(async () => {
    if (!hastaId) return;
    const [s, i, iv] = await Promise.all([
      bugunSemptomlarAl(hastaId),
      bugunIlaclarAl(hastaId),
      sonrakiIVAl(hastaId),
    ]);
    setSemptomlar(s as Semptom[]);
    setIlaclar(i as Ilac[]);
    setSonrakiIV(iv as any);

    // Bugünkü uyum durumlarını çek
    const bugun = new Date().toISOString().split('T')[0];
    const { data: uyumData } = await supabase
      .from('ilac_uyum')
      .select('ilac_id, alindi')
      .eq('hasta_id', hastaId)
      .eq('tarih', bugun);
    const map: Record<string, boolean> = {};
    (uyumData ?? []).forEach((u: any) => { map[u.ilac_id] = u.alindi; });
    setUyumlar(map);
  }, [hastaId]);

  useEffect(() => { veriyiYukle(); }, [veriyiYukle]);

  const onYenile = useCallback(async () => {
    setYenileniyor(true);
    await veriyiYukle();
    setYenileniyor(false);
  }, [veriyiYukle]);

  async function ilacIsaretle(ilac: Ilac, alindi: boolean) {
    if (!hastaId) return;
    if (!alindi) {
      Alert.alert(
        'İlaç Atlandı',
        'Neden bu ilacı almadınız?',
        [
          { text: 'Unuttum', onPress: () => uyumKaydet(ilac.id, false, 'Unuttum') },
          { text: 'Yan etki', onPress: () => uyumKaydet(ilac.id, false, 'Yan etki') },
          { text: 'Diğer', onPress: () => uyumKaydet(ilac.id, false, 'Diğer') },
          { text: 'İptal', style: 'cancel' },
        ]
      );
    } else {
      uyumKaydet(ilac.id, true);
    }
  }

  async function uyumKaydet(ilacId: string, alindi: boolean, neden?: string) {
    if (!hastaId) return;
    await ilacUyumKaydet({ hastaId, ilacId, alindi, atlamaNedeni: neden });
    setUyumlar(prev => ({ ...prev, [ilacId]: alindi }));
  }

  const ivGunFarki = sonrakiIV
    ? Math.ceil((new Date(sonrakiIV.tarih).getTime() - Date.now()) / 86400000)
    : null;

  const enKotuSemptom = semptomlar.length > 0
    ? semptomlar.reduce((a, b) => (a.grade > b.grade ? a : b))
    : null;

  if (yukleniyor) {
    return <View style={styles.merkez}><Text style={styles.yuklemeText}>Yükleniyor...</Text></View>;
  }

  if (!hasta) {
    return (
      <View style={styles.merkez}>
        <Text style={styles.uyariEmoji}>👤</Text>
        <Text style={styles.uyariBaslik}>Profil Bulunamadı</Text>
        <Text style={styles.uyariText}>Doktorunuz sizi sisteme eklememiş olabilir. Kliniğinizle iletişime geçin.</Text>
        <TouchableOpacity style={styles.cikisBtn} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.cikisBtnMetin}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.icerik}
      refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={onYenile} tintColor={RENKLER.ikincil} />}
    >
      {/* Hoş geldiniz */}
      <View style={styles.hosgeldin}>
        <Text style={styles.hosgeldinAlt}>Merhaba,</Text>
        <Text style={styles.hosgeldinIsim}>{hasta.ad} {hasta.soyad} 👋</Text>
        <Text style={styles.hosgeldinTarih}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      {/* Hızlı durum kartı */}
      {enKotuSemptom ? (
        <View style={[styles.durumKart, { borderLeftColor: GRADE_RENK[enKotuSemptom.grade] }]}>
          <Text style={styles.durumEmoji}>{GRADE_EMOJI[enKotuSemptom.grade]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.durumBaslik}>Bugünkü en kötü semptom</Text>
            <Text style={styles.durumDetay}>
              {SEMPTOM_MAP[enKotuSemptom.ctcae_terim]?.ad ?? enKotuSemptom.ctcae_terim} — Grade {enKotuSemptom.grade}
            </Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.checkInKart} onPress={() => router.push('/(tabs)/semptom')}>
          <Text style={styles.checkInEmoji}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.checkInBaslik}>Günlük kontrol</Text>
            <Text style={styles.checkInAlt}>Bugün nasıl hissediyorsunuz?</Text>
          </View>
          <Text style={styles.okMetin}>→</Text>
        </TouchableOpacity>
      )}

      {/* Sonraki IV */}
      {sonrakiIV && ivGunFarki !== null && (
        <View style={[styles.kart, { borderLeftWidth: 4, borderLeftColor: RENKLER.iv }]}>
          <View style={styles.kartBaslik}>
            <Text style={styles.kartBaslikMetin}>🏥 Sonraki Kemoterapi</Text>
          </View>
          <Text style={styles.ivTarih}>{sonrakiIV.protokol}</Text>
          <View style={styles.ivAlt}>
            <Text style={styles.ivGun}>
              {ivGunFarki === 0 ? '🔴 Bugün!' : ivGunFarki === 1 ? '🟡 Yarın' : `🟢 ${ivGunFarki} gün sonra`}
            </Text>
            <Text style={styles.ivTarihText}>
              {new Date(sonrakiIV.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
            </Text>
          </View>
        </View>
      )}

      {/* Bugünkü ilaçlar */}
      <View style={styles.kart}>
        <View style={styles.kartBaslik}>
          <Text style={styles.kartBaslikMetin}>💊 Bugünkü İlaçlar</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/ilac')}>
            <Text style={styles.tumunuGor}>Tümü →</Text>
          </TouchableOpacity>
        </View>

        {ilaclar.length === 0 ? (
          <Text style={styles.bos}>Bugün oral ilaç bulunmuyor</Text>
        ) : (
          ilaclar.map(ilac => {
            const alindi = uyumlar[ilac.id];
            const belirsiz = alindi === undefined;
            return (
              <View key={ilac.id} style={styles.ilacSatir}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ilacAdi}>{ilac.ilac_adi}</Text>
                  <Text style={styles.ilacDoz}>{ilac.doz} {ilac.birim}</Text>
                </View>
                <View style={styles.ilacButonlar}>
                  <TouchableOpacity
                    style={[styles.ilacBtn, styles.aldiBtn, alindi === true && styles.secilenBtn]}
                    onPress={() => ilacIsaretle(ilac, true)}
                  >
                    <Text style={[styles.ilacBtnMetin, alindi === true && styles.secilenBtnMetin]}>
                      {alindi === true ? '✓ Aldım' : 'Aldım'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ilacBtn, styles.atlaBtn, alindi === false && styles.secilenHataBtn]}
                    onPress={() => ilacIsaretle(ilac, false)}
                  >
                    <Text style={[styles.ilacBtnMetin, alindi === false && styles.secilenBtnMetin]}>
                      {alindi === false ? '✗ Atladım' : 'Atladım'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Bugünkü semptomlar özet */}
      {semptomlar.length > 0 && (
        <View style={styles.kart}>
          <View style={styles.kartBaslik}>
            <Text style={styles.kartBaslikMetin}>⚠️ Bugünkü Semptomlar</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/semptom')}>
              <Text style={styles.tumunuGor}>Düzenle →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.semptomGrid}>
            {semptomlar.filter(s => s.grade > 0).map(s => (
              <View key={s.id} style={[styles.semptomChip, { backgroundColor: GRADE_RENK[s.grade] + '20', borderColor: GRADE_RENK[s.grade] }]}>
                <Text style={styles.semptomChipEmoji}>{SEMPTOM_MAP[s.ctcae_terim]?.emoji ?? '⚠️'}</Text>
                <Text style={[styles.semptomChipMetin, { color: GRADE_RENK[s.grade] }]}>
                  {SEMPTOM_MAP[s.ctcae_terim]?.ad ?? s.ctcae_terim}
                </Text>
                <Text style={[styles.semptomChipGrade, { color: GRADE_RENK[s.grade] }]}>{s.grade}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Hızlı butonlar */}
      <View style={styles.hizliButonlar}>
        <TouchableOpacity style={[styles.hizliBtn, { backgroundColor: RENKLER.ikincil }]} onPress={() => router.push('/(tabs)/semptom')}>
          <Text style={styles.hizliBtnEmoji}>⚠️</Text>
          <Text style={styles.hizliBtnMetin}>Semptom Bildir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.hizliBtn, { backgroundColor: '#7c3aed' }]} onPress={() => router.push('/(tabs)/rapor')}>
          <Text style={styles.hizliBtnEmoji}>📊</Text>
          <Text style={styles.hizliBtnMetin}>Haftalık Rapor</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RENKLER.arkaplan },
  icerik: { padding: 16 },
  merkez: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  yuklemeText: { color: RENKLER.metinIkincil, fontSize: 16 },
  uyariEmoji: { fontSize: 48, marginBottom: 16 },
  uyariBaslik: { fontSize: 20, fontWeight: '700', color: RENKLER.metinBirincil, textAlign: 'center' },
  uyariText: { fontSize: 14, color: RENKLER.metinIkincil, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  cikisBtn: { marginTop: 24, padding: 12, backgroundColor: RENKLER.hata, borderRadius: 8 },
  cikisBtnMetin: { color: '#fff', fontWeight: '700' },

  hosgeldin: { marginBottom: 16 },
  hosgeldinAlt: { fontSize: 14, color: RENKLER.metinIkincil },
  hosgeldinIsim: { fontSize: 24, fontWeight: '700', color: RENKLER.metinBirincil },
  hosgeldinTarih: { fontSize: 13, color: RENKLER.metinIkincil, marginTop: 2 },

  durumKart: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 5,
    marginBottom: 12,
    ...GOLGE.orta,
  },
  durumEmoji: { fontSize: 32 },
  durumBaslik: { fontSize: 12, color: RENKLER.metinIkincil, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  durumDetay: { fontSize: 15, fontWeight: '600', color: RENKLER.metinBirincil, marginTop: 2 },

  checkInKart: {
    backgroundColor: RENKLER.ikincil,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    ...GOLGE.orta,
  },
  checkInEmoji: { fontSize: 32 },
  checkInBaslik: { fontSize: 15, fontWeight: '700', color: '#fff' },
  checkInAlt: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  okMetin: { color: '#fff', fontSize: 20, fontWeight: '700' },

  kart: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...GOLGE.kucuk },
  kartBaslik: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  kartBaslikMetin: { fontSize: 15, fontWeight: '700', color: RENKLER.metinBirincil },
  tumunuGor: { fontSize: 13, color: RENKLER.ikincil, fontWeight: '600' },
  bos: { color: RENKLER.metinAcik, fontSize: 14, textAlign: 'center', paddingVertical: 8 },

  ivTarih: { fontSize: 16, fontWeight: '600', color: RENKLER.metinBirincil },
  ivAlt: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  ivGun: { fontSize: 14, fontWeight: '600' },
  ivTarihText: { fontSize: 13, color: RENKLER.metinIkincil },

  ilacSatir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: RENKLER.kenarlık },
  ilacAdi: { fontSize: 14, fontWeight: '600', color: RENKLER.metinBirincil },
  ilacDoz: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 2 },
  ilacButonlar: { flexDirection: 'row', gap: 6 },
  ilacBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  aldiBtn: { borderColor: RENKLER.basari },
  atlaBtn: { borderColor: RENKLER.uyari },
  secilenBtn: { backgroundColor: RENKLER.basari, borderColor: RENKLER.basari },
  secilenHataBtn: { backgroundColor: RENKLER.uyari, borderColor: RENKLER.uyari },
  ilacBtnMetin: { fontSize: 12, fontWeight: '600', color: RENKLER.metinIkincil },
  secilenBtnMetin: { color: '#fff' },

  semptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  semptomChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  semptomChipEmoji: { fontSize: 14 },
  semptomChipMetin: { fontSize: 12, fontWeight: '600' },
  semptomChipGrade: { fontSize: 12, fontWeight: '800' },

  hizliButonlar: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  hizliBtn: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', ...GOLGE.kucuk },
  hizliBtnEmoji: { fontSize: 24, marginBottom: 6 },
  hizliBtnMetin: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
