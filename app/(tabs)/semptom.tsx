import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { supabase, bugunSemptomlarAl, semptomEkle } from '../../lib/supabase';
import { useHasta } from '../../hooks/useHasta';
import { SEMPTOMLAR, GRADE_RENK, GRADE_EMOJI, GRADE_ETIKET } from '../../constants/ctcae';
import { RENKLER, GOLGE } from '../../constants/renkler';
import { acilBildirimGoster } from '../../lib/bildirim';
import type { Semptom } from '../../types';

export default function SemptomEkrani() {
  const { hastaId } = useHasta();
  const [gradeMap, setGradeMap] = useState<Record<string, number>>({});
  const [kayit, setKayit] = useState(false);
  const [aktifSemptom, setAktifSemptom] = useState<string | null>(null);
  const [not, setNot] = useState('');
  const [notModal, setNotModal] = useState(false);

  const yukle = useCallback(async () => {
    if (!hastaId) return;
    const data = await bugunSemptomlarAl(hastaId);
    const map: Record<string, number> = {};
    (data as Semptom[]).forEach(s => { map[s.ctcae_terim] = s.grade; });
    setGradeMap(map);
  }, [hastaId]);

  useEffect(() => { yukle(); }, [yukle]);

  async function gradeGuncelle(semptomId: string, grade: number) {
    if (!hastaId) return;
    setKayit(true);
    const mevcut = gradeMap[semptomId];
    const yeniGrade = mevcut === grade ? 0 : grade; // aynı grade'e tekrar basınca sıfırla

    setGradeMap(prev => ({ ...prev, [semptomId]: yeniGrade }));

    const semptomTanim = SEMPTOMLAR.find(s => s.id === semptomId)!;
    const bildirimTuru = yeniGrade >= semptomTanim.acilGrade ? 'acil' : 'gunluk';

    await semptomEkle({
      hastaId,
      ctcaeTerm: semptomId,
      grade: yeniGrade,
      bildirimTuru,
    });

    if (yeniGrade >= semptomTanim.acilGrade && yeniGrade >= 3) {
      await acilBildirimGoster(semptomTanim.ad);
      Alert.alert(
        '🚨 Şiddetli Semptom',
        `${semptomTanim.ad} Grade ${yeniGrade} bildiriminiz doktorunuza iletildi.\n\nGerekirse kliniğinizi arayın.`,
        [{ text: 'Anladım' }]
      );
    }

    setKayit(false);
  }

  async function notKaydet(semptomId: string) {
    if (!hastaId || !not.trim()) { setNotModal(false); return; }
    const grade = gradeMap[semptomId] ?? 0;
    await semptomEkle({ hastaId, ctcaeTerm: semptomId, grade, notlar: not.trim() });
    setNot('');
    setNotModal(false);
  }

  const bugunkuSemptomSayisi = Object.values(gradeMap).filter(g => g > 0).length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.icerik}>

        {/* Başlık özet */}
        <View style={styles.ozet}>
          <Text style={styles.ozetBaslik}>
            {bugunkuSemptomSayisi === 0
              ? '😊 Bugün şikayetiniz yok'
              : `⚠️ Bugün ${bugunkuSemptomSayisi} semptom var`}
          </Text>
          <Text style={styles.ozetAlt}>
            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} • Düğmeye basarak grade'i işaretleyin
          </Text>
        </View>

        {/* Grade açıklaması */}
        <View style={styles.gradeLegend}>
          {[0,1,2,3,4].map(g => (
            <View key={g} style={styles.gradeChip}>
              <Text style={styles.gradeChipEmoji}>{GRADE_EMOJI[g]}</Text>
              <Text style={[styles.gradeChipMetin, { color: GRADE_RENK[g] }]}>{GRADE_ETIKET[g]}</Text>
            </View>
          ))}
        </View>

        {/* Semptom listesi */}
        {SEMPTOMLAR.map(semptom => {
          const mevcutGrade = gradeMap[semptom.id] ?? 0;
          return (
            <View key={semptom.id} style={styles.semptomKart}>
              <View style={styles.semptomBaslik}>
                <Text style={styles.semptomEmoji}>{semptom.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.semptomAd}>{semptom.ad}</Text>
                  <Text style={styles.semptomAciklama}>{semptom.aciklama}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setAktifSemptom(semptom.id); setNotModal(true); }}
                  style={styles.notBtn}
                >
                  <Text style={styles.notBtnMetin}>📝</Text>
                </TouchableOpacity>
              </View>

              {/* Grade seçici */}
              <View style={styles.gradeSecici}>
                {[0,1,2,3,4].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.gradeBtn,
                      mevcutGrade === g && g > 0 && { backgroundColor: GRADE_RENK[g], borderColor: GRADE_RENK[g] },
                      g === 0 && mevcutGrade === 0 && { backgroundColor: GRADE_RENK[0] + '30', borderColor: GRADE_RENK[0] },
                    ]}
                    onPress={() => gradeGuncelle(semptom.id, g)}
                    disabled={kayit}
                  >
                    <Text style={[
                      styles.gradeBtnEmoji,
                      mevcutGrade === g && g > 0 && { opacity: 1 },
                      mevcutGrade !== g && { opacity: 0.3 },
                    ]}>
                      {GRADE_EMOJI[g]}
                    </Text>
                    <Text style={[
                      styles.gradeBtnMetin,
                      mevcutGrade === g && g > 0 && { color: '#fff', fontWeight: '700' },
                    ]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Seçilen grade açıklaması */}
              {mevcutGrade > 0 && (
                <View style={[styles.gradeAciklama, { borderColor: GRADE_RENK[mevcutGrade] + '40', backgroundColor: GRADE_RENK[mevcutGrade] + '10' }]}>
                  <Text style={[styles.gradeAciklamaMetin, { color: GRADE_RENK[mevcutGrade] }]}>
                    {semptom.gradeAciklamalari[mevcutGrade]}
                  </Text>
                  {mevcutGrade >= semptom.acilGrade && (
                    <Text style={styles.acilUyari}>🚨 Bu düzeyde doktorunuzu bilgilendirmeniz önerilir</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Not modal */}
      <Modal visible={notModal} transparent animationType="slide">
        <View style={styles.modalArkaplan}>
          <View style={styles.modal}>
            <Text style={styles.modalBaslik}>
              {SEMPTOMLAR.find(s => s.id === aktifSemptom)?.ad} — Not Ekle
            </Text>
            <TextInput
              style={styles.modalGiris}
              placeholder="Semptomla ilgili not ekleyin..."
              placeholderTextColor={RENKLER.metinAcik}
              multiline
              numberOfLines={4}
              value={not}
              onChangeText={setNot}
              autoFocus
            />
            <View style={styles.modalButonlar}>
              <TouchableOpacity style={styles.modalIptal} onPress={() => { setNotModal(false); setNot(''); }}>
                <Text style={styles.modalIptalMetin}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalKaydet, !not.trim() && { opacity: 0.5 }]}
                onPress={() => aktifSemptom && notKaydet(aktifSemptom)}
                disabled={!not.trim()}
              >
                <Text style={styles.modalKaydetMetin}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {kayit && (
        <View style={styles.kayitGostergesi}>
          <ActivityIndicator size="small" color={RENKLER.ikincil} />
          <Text style={styles.kayitMetin}>Kaydediliyor...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RENKLER.arkaplan },
  icerik: { padding: 16 },

  ozet: { marginBottom: 12 },
  ozetBaslik: { fontSize: 18, fontWeight: '700', color: RENKLER.metinBirincil },
  ozetAlt: { fontSize: 13, color: RENKLER.metinIkincil, marginTop: 2 },

  gradeLegend: { flexDirection: 'row', gap: 6, marginBottom: 16, justifyContent: 'center' },
  gradeChip: { alignItems: 'center', gap: 2 },
  gradeChipEmoji: { fontSize: 16 },
  gradeChipMetin: { fontSize: 10, fontWeight: '600' },

  semptomKart: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, ...GOLGE.kucuk },
  semptomBaslik: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  semptomEmoji: { fontSize: 26 },
  semptomAd: { fontSize: 15, fontWeight: '700', color: RENKLER.metinBirincil },
  semptomAciklama: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 1 },
  notBtn: { padding: 4 },
  notBtnMetin: { fontSize: 18 },

  gradeSecici: { flexDirection: 'row', gap: 6 },
  gradeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: RENKLER.kenarlık,
    backgroundColor: '#f8fafc',
  },
  gradeBtnEmoji: { fontSize: 18 },
  gradeBtnMetin: { fontSize: 11, fontWeight: '600', color: RENKLER.metinIkincil, marginTop: 2 },

  gradeAciklama: { marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 1 },
  gradeAciklamaMetin: { fontSize: 13, fontWeight: '500' },
  acilUyari: { fontSize: 12, color: RENKLER.hata, fontWeight: '600', marginTop: 4 },

  modalArkaplan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalBaslik: { fontSize: 17, fontWeight: '700', color: RENKLER.metinBirincil, marginBottom: 14 },
  modalGiris: {
    borderWidth: 1.5, borderColor: RENKLER.kenarlık, borderRadius: 10,
    padding: 12, fontSize: 14, color: RENKLER.metinBirincil, minHeight: 90,
    textAlignVertical: 'top',
  },
  modalButonlar: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalIptal: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: RENKLER.kenarlık, alignItems: 'center' },
  modalIptalMetin: { color: RENKLER.metinIkincil, fontWeight: '600' },
  modalKaydet: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: RENKLER.ikincil, alignItems: 'center' },
  modalKaydetMetin: { color: '#fff', fontWeight: '700' },

  kayitGostergesi: {
    position: 'absolute', bottom: 20, alignSelf: 'center',
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  kayitMetin: { color: '#fff', fontSize: 13 },
});
