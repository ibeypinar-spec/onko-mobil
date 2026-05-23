import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, RefreshControl,
} from 'react-native';
import { supabase, ilacUyumKaydet } from '../../lib/supabase';
import { useHasta } from '../../hooks/useHasta';
import { RENKLER, GOLGE } from '../../constants/renkler';
import type { Ilac, IlacUyum } from '../../types';

// Son 7 günün tarihlerini üret
function sonYediGun(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function IlacEkrani() {
  const { hastaId } = useHasta();
  const [ilaclar, setIlaclar] = useState<Ilac[]>([]);
  const [ivIlaclar, setIvIlaclar] = useState<Ilac[]>([]);
  const [uyumlar, setUyumlar] = useState<IlacUyum[]>([]);
  const [yenileniyor, setYenileniyor] = useState(false);
  const gunler = sonYediGun();
  const bugun = gunler[6];

  const yukle = useCallback(async () => {
    if (!hastaId) return;
    const { data: ilacData } = await supabase
      .from('ilaclar')
      .select('*')
      .eq('hasta_id', hastaId)
      .eq('aktif', true);

    const tumIlaclar = (ilacData ?? []) as Ilac[];
    setIlaclar(tumIlaclar.filter(i => i.yol === 'oral'));
    setIvIlaclar(tumIlaclar.filter(i => i.yol === 'iv'));

    const { data: uyumData } = await supabase
      .from('ilac_uyum')
      .select('*')
      .eq('hasta_id', hastaId)
      .gte('tarih', gunler[0]);

    setUyumlar((uyumData ?? []) as IlacUyum[]);
  }, [hastaId]);

  useEffect(() => { yukle(); }, [yukle]);

  const onYenile = useCallback(async () => {
    setYenileniyor(true);
    await yukle();
    setYenileniyor(false);
  }, [yukle]);

  function uyumDurumu(ilacId: string, tarih: string): boolean | null {
    const kayit = uyumlar.find(u => u.ilac_id === ilacId && u.tarih === tarih);
    return kayit ? kayit.alindi : null;
  }

  function uyumOrani(ilacId: string): number {
    const kayitlar = uyumlar.filter(u => u.ilac_id === ilacId);
    if (kayitlar.length === 0) return 0;
    const alindi = kayitlar.filter(u => u.alindi).length;
    return Math.round((alindi / kayitlar.length) * 100);
  }

  async function bugunIsaretle(ilac: Ilac, alindi: boolean) {
    if (!hastaId) return;
    if (!alindi) {
      Alert.alert(
        'İlaç Neden Atlandı?',
        'Lütfen bir neden seçin:',
        [
          { text: 'Unuttum', onPress: () => kaydet(ilac.id, false, 'Unuttum') },
          { text: 'Yan etki/ağrı', onPress: () => kaydet(ilac.id, false, 'Yan etki') },
          { text: 'Stok bitti', onPress: () => kaydet(ilac.id, false, 'Stok bitti') },
          { text: 'Diğer', onPress: () => kaydet(ilac.id, false, 'Diğer') },
          { text: 'İptal', style: 'cancel' },
        ]
      );
    } else {
      kaydet(ilac.id, true);
    }
  }

  async function kaydet(ilacId: string, alindi: boolean, neden?: string) {
    if (!hastaId) return;
    await ilacUyumKaydet({ hastaId, ilacId, alindi, atlamaNedeni: neden });
    await yukle();
  }

  // Genel uyum oranı (tüm oral ilaçlar)
  const genelUyum = ilaclar.length > 0
    ? Math.round(ilaclar.reduce((acc, i) => acc + uyumOrani(i.id), 0) / ilaclar.length)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.icerik}
      refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={onYenile} tintColor={RENKLER.ikincil} />}
    >
      {/* Uyum özet */}
      {ilaclar.length > 0 && (
        <View style={styles.uyumKart}>
          <Text style={styles.uyumYuzde}>{genelUyum}%</Text>
          <Text style={styles.uyumBaslik}>7 Günlük İlaç Uyumu</Text>
          <View style={styles.uyumBarKap}>
            <View style={[styles.uyumBar, { width: `${genelUyum}%` as any }]} />
          </View>
          <Text style={styles.uyumAlt}>
            {genelUyum >= 80
              ? '✅ Mükemmel — devam edin!'
              : genelUyum >= 60
                ? '⚠️ İyi — biraz daha düzenli olun'
                : '❌ Düşük — doktorunuzla görüşün'}
          </Text>
        </View>
      )}

      {/* Oral ilaçlar */}
      {ilaclar.length > 0 && (
        <>
          <Text style={styles.bolumBaslik}>💊 Oral İlaçlar</Text>
          {ilaclar.map(ilac => {
            const bugunkuDurum = uyumDurumu(ilac.id, bugun);
            const oran = uyumOrani(ilac.id);
            return (
              <View key={ilac.id} style={styles.ilacKart}>
                <View style={styles.ilacKartUst}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ilacAdi}>{ilac.ilac_adi}</Text>
                    <Text style={styles.ilacBilgi}>{ilac.doz} {ilac.birim} • {ilac.hatirlatma_saatleri ? JSON.parse(ilac.hatirlatma_saatleri).join(', ') : '-'}</Text>
                  </View>
                  <View style={[styles.uyumRozetKutu, { backgroundColor: oran >= 80 ? RENKLER.basari + '20' : RENKLER.uyari + '20' }]}>
                    <Text style={[styles.uyumRozet, { color: oran >= 80 ? RENKLER.basari : RENKLER.uyari }]}>{oran}%</Text>
                  </View>
                </View>

                {/* 7 günlük takvim */}
                <View style={styles.haftalikTakvim}>
                  {gunler.map((gun, idx) => {
                    const durum = uyumDurumu(ilac.id, gun);
                    const bugunMu = gun === bugun;
                    return (
                      <View key={gun} style={styles.gunKutu}>
                        <Text style={[styles.gunLabel, bugunMu && styles.bugunLabel]}>
                          {GUN_KISA[new Date(gun).getDay() === 0 ? 6 : new Date(gun).getDay() - 1]}
                        </Text>
                        <View style={[
                          styles.gunDaire,
                          bugunMu && styles.bugunDaire,
                          durum === true && styles.aldiDaire,
                          durum === false && styles.atladiDaire,
                          durum === null && bugunMu && styles.belirsizBugunDaire,
                        ]}>
                          <Text style={styles.gunDaireMetin}>
                            {durum === true ? '✓' : durum === false ? '✗' : bugunMu ? '!' : '-'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Bugünkü aksiyon */}
                {bugunkuDurum === null && (
                  <View style={styles.bugunAksiyon}>
                    <Text style={styles.bugunAksiyonMetin}>Bugün aldınız mı?</Text>
                    <View style={styles.bugunButonlar}>
                      <TouchableOpacity style={styles.aldiBtn} onPress={() => bugunIsaretle(ilac, true)}>
                        <Text style={styles.aldiMetin}>✓ Aldım</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.atladiBtn} onPress={() => bugunIsaretle(ilac, false)}>
                        <Text style={styles.atladiMetin}>✗ Atladım</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {bugunkuDurum !== null && (
                  <View style={[styles.bugunOzet, { backgroundColor: bugunkuDurum ? RENKLER.basari + '15' : RENKLER.uyari + '15' }]}>
                    <Text style={[styles.bugunOzetMetin, { color: bugunkuDurum ? RENKLER.basari : RENKLER.uyari }]}>
                      {bugunkuDurum ? '✓ Bugün alındı' : '✗ Bugün atlandı'}
                    </Text>
                    <TouchableOpacity onPress={() => kaydet(ilac.id, !bugunkuDurum)}>
                      <Text style={styles.duzelBtn}>Düzelt</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* IV ilaçlar */}
      {ivIlaclar.length > 0 && (
        <>
          <Text style={styles.bolumBaslik}>🏥 Kemoterapi (IV)</Text>
          {ivIlaclar.map(ilac => {
            const gelecekTarihler = ilac.iv_tarihler
              ? (JSON.parse(ilac.iv_tarihler) as string[]).filter(t => t >= bugun).slice(0, 3)
              : [];
            return (
              <View key={ilac.id} style={[styles.ilacKart, { borderLeftColor: RENKLER.iv, borderLeftWidth: 4 }]}>
                <Text style={styles.ilacAdi}>{ilac.ilac_adi}</Text>
                <Text style={styles.ilacBilgi}>{ilac.doz} {ilac.birim}</Text>
                {gelecekTarihler.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.ivBaslik}>Planlanan tarihler:</Text>
                    {gelecekTarihler.map(t => (
                      <Text key={t} style={styles.ivTarih}>
                        📅 {new Date(t).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {t === bugun ? '  🔴 Bugün!' : ''}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.ivBos}>Yakın zamanda planlanmış tarih yok</Text>
                )}
              </View>
            );
          })}
        </>
      )}

      {ilaclar.length === 0 && ivIlaclar.length === 0 && (
        <View style={styles.bos}>
          <Text style={styles.bosEmoji}>💊</Text>
          <Text style={styles.bosMetin}>Henüz ilaç eklenmemiş</Text>
          <Text style={styles.bosAlt}>Doktorunuz tedavi planınızı girdikten sonra burada görünecek</Text>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RENKLER.arkaplan },
  icerik: { padding: 16 },
  bolumBaslik: { fontSize: 15, fontWeight: '700', color: RENKLER.metinBirincil, marginBottom: 10, marginTop: 4 },

  uyumKart: {
    backgroundColor: RENKLER.birincil, borderRadius: 18, padding: 20,
    alignItems: 'center', marginBottom: 16, ...GOLGE.orta,
  },
  uyumYuzde: { fontSize: 48, fontWeight: '800', color: '#fff' },
  uyumBaslik: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  uyumBarKap: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  uyumBar: { height: '100%', backgroundColor: RENKLER.basari, borderRadius: 4 },
  uyumAlt: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'center' },

  ilacKart: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, ...GOLGE.kucuk },
  ilacKartUst: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  ilacAdi: { fontSize: 16, fontWeight: '700', color: RENKLER.metinBirincil },
  ilacBilgi: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 3 },
  uyumRozetKutu: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  uyumRozet: { fontSize: 13, fontWeight: '800' },

  haftalikTakvim: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  gunKutu: { alignItems: 'center', gap: 4 },
  gunLabel: { fontSize: 10, color: RENKLER.metinAcik, fontWeight: '600' },
  bugunLabel: { color: RENKLER.ikincil, fontWeight: '800' },
  gunDaire: { width: 32, height: 32, borderRadius: 16, backgroundColor: RENKLER.kenarlık, alignItems: 'center', justifyContent: 'center' },
  bugunDaire: { borderWidth: 2, borderColor: RENKLER.ikincil },
  aldiDaire: { backgroundColor: RENKLER.basari },
  atladiDaire: { backgroundColor: RENKLER.uyari },
  belirsizBugunDaire: { backgroundColor: RENKLER.ikincil + '20' },
  gunDaireMetin: { fontSize: 13, fontWeight: '700', color: '#fff' },

  bugunAksiyon: { borderTopWidth: 1, borderTopColor: RENKLER.kenarlık, paddingTop: 12 },
  bugunAksiyonMetin: { fontSize: 13, color: RENKLER.metinIkincil, marginBottom: 8 },
  bugunButonlar: { flexDirection: 'row', gap: 8 },
  aldiBtn: { flex: 1, padding: 12, backgroundColor: RENKLER.basari, borderRadius: 10, alignItems: 'center' },
  aldiMetin: { color: '#fff', fontWeight: '700', fontSize: 14 },
  atladiBtn: { flex: 1, padding: 12, backgroundColor: RENKLER.uyari + '20', borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: RENKLER.uyari },
  atladiMetin: { color: RENKLER.uyari, fontWeight: '700', fontSize: 14 },

  bugunOzet: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: RENKLER.kenarlık, paddingTop: 10 },
  bugunOzetMetin: { fontSize: 13, fontWeight: '600' },
  duzelBtn: { fontSize: 13, color: RENKLER.ikincil, fontWeight: '600' },

  ivBaslik: { fontSize: 12, color: RENKLER.metinIkincil, marginBottom: 4, fontWeight: '600' },
  ivTarih: { fontSize: 14, color: RENKLER.metinBirincil, paddingVertical: 3 },
  ivBos: { fontSize: 13, color: RENKLER.metinAcik, marginTop: 6 },

  bos: { alignItems: 'center', padding: 40 },
  bosEmoji: { fontSize: 48, marginBottom: 12 },
  bosMetin: { fontSize: 18, fontWeight: '700', color: RENKLER.metinBirincil },
  bosAlt: { fontSize: 14, color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 8 },
});
