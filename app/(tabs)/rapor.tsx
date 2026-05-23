import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Share,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { haftalikSemptomlarAl, haftalikUyumAl } from '../../lib/supabase';
import { useHasta } from '../../hooks/useHasta';
import { RENKLER, GOLGE } from '../../constants/renkler';
import { GRADE_RENK, GRADE_EMOJI, GRADE_ETIKET, SEMPTOM_MAP } from '../../constants/ctcae';
import type { Semptom, IlacUyum } from '../../types';

// Son 7 günün tarihleri
function sonYediGun() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function RaporEkrani() {
  const { hasta, hastaId } = useHasta();
  const [semptomlar, setSemptomlar] = useState<Semptom[]>([]);
  const [uyumlar, setUyumlar] = useState<IlacUyum[]>([]);
  const [pdfYukleniyor, setPdfYukleniyor] = useState(false);
  const gunler = sonYediGun();

  const yukle = useCallback(async () => {
    if (!hastaId) return;
    const [s, u] = await Promise.all([
      haftalikSemptomlarAl(hastaId),
      haftalikUyumAl(hastaId),
    ]);
    setSemptomlar(s as Semptom[]);
    setUyumlar(u as IlacUyum[]);
  }, [hastaId]);

  useEffect(() => { yukle(); }, [yukle]);

  // Semptom özetleri — her semptom için max grade
  const semptomOzeti = semptomlar.reduce<Record<string, { maxGrade: number; sayac: number }>>((acc, s) => {
    if (!acc[s.ctcae_terim]) acc[s.ctcae_terim] = { maxGrade: 0, sayac: 0 };
    if (s.grade > acc[s.ctcae_terim].maxGrade) acc[s.ctcae_terim].maxGrade = s.grade;
    if (s.grade > 0) acc[s.ctcae_terim].sayac++;
    return acc;
  }, {});

  // Belirgin (grade > 0) semptomları max grade'e göre sırala
  const belirginSemptomlar = Object.entries(semptomOzeti)
    .filter(([, v]) => v.maxGrade > 0)
    .sort(([, a], [, b]) => b.maxGrade - a.maxGrade);

  // Genel uyum oranı
  const toplamUyum = uyumlar.length;
  const alinanUyum = uyumlar.filter(u => u.alindi).length;
  const uyumYuzde = toplamUyum > 0 ? Math.round((alinanUyum / toplamUyum) * 100) : null;

  // Ortalama semptom grade
  const tumGradelar = semptomlar.filter(s => s.grade > 0).map(s => s.grade as number);
  const ortGrade = tumGradelar.length > 0
    ? tumGradelar.reduce((a, b) => a + b, 0) / tumGradelar.length
    : 0;

  // Günlük semptom yoğunluğu (bar chart verisi için)
  const gunlukMaks: Record<string, number> = {};
  gunler.forEach(g => { gunlukMaks[g] = 0; });
  semptomlar.forEach(s => {
    if (s.tarih in gunlukMaks && s.grade > gunlukMaks[s.tarih]) {
      gunlukMaks[s.tarih] = s.grade;
    }
  });

  async function pdfOlustur() {
    if (!hasta) return;
    setPdfYukleniyor(true);
    try {
      const tarihAralik = `${new Date(gunler[0]).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – ${new Date(gunler[6]).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

      const semptomSatirlar = belirginSemptomlar.map(([id, v]) => {
        const tanim = SEMPTOM_MAP[id];
        return `
          <tr>
            <td>${tanim?.emoji ?? ''} ${tanim?.ad ?? id}</td>
            <td style="color:${GRADE_RENK[v.maxGrade]};font-weight:700">Grade ${v.maxGrade} — ${GRADE_ETIKET[v.maxGrade]}</td>
            <td>${v.sayac} gün bildirilen</td>
          </tr>`;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
            h1 { color: #1e3a5f; font-size: 22px; }
            h2 { color: #2563eb; font-size: 16px; margin-top: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
            .ozet { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
            .ozet-kart { background: #f0f4f8; border-radius: 8px; padding: 14px; }
            .ozet-sayi { font-size: 28px; font-weight: 800; color: #1e3a5f; }
            .ozet-etiket { font-size: 12px; color: #64748b; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f0f4f8; padding: 8px; text-align: left; font-size: 12px; color: #64748b; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .dipnot { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <h1>🏥 OnkoMobil — Hasta Semptom Raporu</h1>
          <p style="color:#64748b;font-size:13px;">
            <strong>${hasta.ad} ${hasta.soyad}</strong> &nbsp;|&nbsp;
            ${hasta.protokol_no ? `Protokol: ${hasta.protokol_no} &nbsp;|&nbsp;` : ''}
            ${tarihAralik}
          </p>

          <h2>📊 Özet</h2>
          <div class="ozet">
            <div class="ozet-kart">
              <div class="ozet-sayi">${uyumYuzde !== null ? uyumYuzde + '%' : '-'}</div>
              <div class="ozet-etiket">İlaç Uyum Oranı</div>
            </div>
            <div class="ozet-kart">
              <div class="ozet-sayi">${belirginSemptomlar.length}</div>
              <div class="ozet-etiket">Bildirilen Semptom</div>
            </div>
            <div class="ozet-kart">
              <div class="ozet-sayi">${ortGrade > 0 ? ortGrade.toFixed(1) : '0'}</div>
              <div class="ozet-etiket">Ortalama Semptom Grade</div>
            </div>
            <div class="ozet-kart">
              <div class="ozet-sayi">${belirginSemptomlar.length > 0 ? `Grade ${belirginSemptomlar[0][1].maxGrade}` : '-'}</div>
              <div class="ozet-etiket">En Şiddetli Semptom</div>
            </div>
          </div>

          ${belirginSemptomlar.length > 0 ? `
          <h2>⚠️ Semptom Detayları</h2>
          <table>
            <thead><tr>
              <th>Semptom</th><th>Maksimum Grade</th><th>Sıklık</th>
            </tr></thead>
            <tbody>${semptomSatirlar}</tbody>
          </table>
          ` : '<p style="color:#64748b">Bu hafta semptom bildirilmedi.</p>'}

          ${uyumlar.length > 0 ? `
          <h2>💊 İlaç Uyumu</h2>
          <p>7 günlük kayıt: <strong>${alinanUyum}</strong> alındı / <strong>${toplamUyum - alinanUyum}</strong> atlandı</p>
          ` : ''}

          <div class="dipnot">
            Bu rapor OnkoMobil uygulaması tarafından otomatik oluşturulmuştur.
            Rapor tarihi: ${new Date().toLocaleString('tr-TR')}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      setPdfYukleniyor(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Raporu Paylaş' });
      } else {
        Alert.alert('PDF Oluşturuldu', `Dosya: ${uri}`);
      }
    } catch (e) {
      setPdfYukleniyor(false);
      Alert.alert('Hata', 'PDF oluşturulamadı.');
    }
  }

  const tarihAralik = `${new Date(gunler[0]).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${new Date(gunler[6]).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.icerik}>

      {/* Başlık */}
      <View style={styles.baslikKutu}>
        <View>
          <Text style={styles.baslik}>Haftalık Rapor</Text>
          <Text style={styles.tarihAralik}>{tarihAralik}</Text>
        </View>
        <TouchableOpacity
          style={[styles.pdfBtn, pdfYukleniyor && styles.pdfBtnPasif]}
          onPress={pdfOlustur}
          disabled={pdfYukleniyor}
        >
          {pdfYukleniyor
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.pdfBtnMetin}>📤 PDF</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Günlük semptom barları */}
      <View style={styles.kart}>
        <Text style={styles.kartBaslik}>📅 Günlük Semptom Yoğunluğu</Text>
        <View style={styles.barGraf}>
          {gunler.map(gun => {
            const maks = gunlukMaks[gun];
            const yukseklik = maks > 0 ? (maks / 4) * 60 : 3;
            return (
              <View key={gun} style={styles.barKutu}>
                <View style={styles.barAlan}>
                  <View style={[
                    styles.bar,
                    { height: yukseklik, backgroundColor: maks > 0 ? GRADE_RENK[maks] : RENKLER.kenarlık }
                  ]} />
                </View>
                <Text style={[styles.barEtiket, gun === gunler[6] && styles.bugunEtiket]}>
                  {GUN_KISA[new Date(gun).getDay() === 0 ? 6 : new Date(gun).getDay() - 1]}
                </Text>
                {maks > 0 && <Text style={[styles.barGrade, { color: GRADE_RENK[maks] }]}>{maks}</Text>}
              </View>
            );
          })}
        </View>
        <View style={styles.legKutu}>
          {[1,2,3,4].map(g => (
            <View key={g} style={styles.legSatir}>
              <View style={[styles.legKare, { backgroundColor: GRADE_RENK[g] }]} />
              <Text style={styles.legMetin}>{GRADE_ETIKET[g]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Özet kartlar */}
      <View style={styles.ozetGrid}>
        <View style={[styles.ozetKart, { backgroundColor: RENKLER.ikincil }]}>
          <Text style={styles.ozetSayi}>{uyumYuzde !== null ? `${uyumYuzde}%` : '-'}</Text>
          <Text style={styles.ozetEtiket}>İlaç Uyumu</Text>
        </View>
        <View style={[styles.ozetKart, { backgroundColor: belirginSemptomlar.length > 0 ? GRADE_RENK[Math.min(belirginSemptomlar[0][1].maxGrade, 4)] : RENKLER.basari }]}>
          <Text style={styles.ozetSayi}>{belirginSemptomlar.length}</Text>
          <Text style={styles.ozetEtiket}>Semptom</Text>
        </View>
      </View>

      {/* Semptom detayları */}
      {belirginSemptomlar.length > 0 ? (
        <View style={styles.kart}>
          <Text style={styles.kartBaslik}>⚠️ Bu Haftaki Semptomlar</Text>
          {belirginSemptomlar.map(([id, v]) => {
            const tanim = SEMPTOM_MAP[id];
            return (
              <View key={id} style={styles.semptomSatir}>
                <Text style={styles.semptomEmoji}>{tanim?.emoji ?? '⚠️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.semptomAd}>{tanim?.ad ?? id}</Text>
                  <Text style={styles.semptomSayac}>{v.sayac} gün bildirilen</Text>
                </View>
                <View style={[styles.gradeBadge, { backgroundColor: GRADE_RENK[v.maxGrade] + '20', borderColor: GRADE_RENK[v.maxGrade] }]}>
                  <Text style={[styles.gradeBadgeMetin, { color: GRADE_RENK[v.maxGrade] }]}>
                    {GRADE_EMOJI[v.maxGrade]} {GRADE_ETIKET[v.maxGrade]}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.iyi}>
          <Text style={styles.iyiEmoji}>😊</Text>
          <Text style={styles.iyiBaslik}>Bu hafta semptom bildirilmedi</Text>
          <Text style={styles.iyiAlt}>Harika gidiyorsunuz!</Text>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RENKLER.arkaplan },
  icerik: { padding: 16 },

  baslikKutu: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  baslik: { fontSize: 22, fontWeight: '800', color: RENKLER.metinBirincil },
  tarihAralik: { fontSize: 13, color: RENKLER.metinIkincil, marginTop: 2 },
  pdfBtn: { backgroundColor: RENKLER.birincil, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, minWidth: 70, alignItems: 'center' },
  pdfBtnPasif: { opacity: 0.6 },
  pdfBtnMetin: { color: '#fff', fontWeight: '700', fontSize: 14 },

  kart: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...GOLGE.kucuk },
  kartBaslik: { fontSize: 14, fontWeight: '700', color: RENKLER.metinBirincil, marginBottom: 14 },

  barGraf: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 },
  barKutu: { flex: 1, alignItems: 'center' },
  barAlan: { height: 60, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: 24, borderRadius: 4, minHeight: 3 },
  barEtiket: { fontSize: 10, color: RENKLER.metinAcik, marginTop: 4, fontWeight: '600' },
  bugunEtiket: { color: RENKLER.ikincil, fontWeight: '800' },
  barGrade: { fontSize: 11, fontWeight: '800', marginTop: 1 },

  legKutu: { flexDirection: 'row', gap: 12, marginTop: 10, justifyContent: 'center' },
  legSatir: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legKare: { width: 10, height: 10, borderRadius: 2 },
  legMetin: { fontSize: 11, color: RENKLER.metinIkincil },

  ozetGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  ozetKart: { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center', ...GOLGE.kucuk },
  ozetSayi: { fontSize: 32, fontWeight: '800', color: '#fff' },
  ozetEtiket: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  semptomSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: RENKLER.kenarlık },
  semptomEmoji: { fontSize: 22 },
  semptomAd: { fontSize: 14, fontWeight: '600', color: RENKLER.metinBirincil },
  semptomSayac: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 1 },
  gradeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  gradeBadgeMetin: { fontSize: 12, fontWeight: '700' },

  iyi: { alignItems: 'center', padding: 32, backgroundColor: '#fff', borderRadius: 16, ...GOLGE.kucuk },
  iyiEmoji: { fontSize: 52, marginBottom: 12 },
  iyiBaslik: { fontSize: 18, fontWeight: '700', color: RENKLER.metinBirincil },
  iyiAlt: { fontSize: 14, color: RENKLER.metinIkincil, marginTop: 4 },
});
