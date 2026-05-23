import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { RENKLER } from '../../constants/renkler';

export default function GirisEkrani() {
  const [telefon, setTelefon] = useState('');
  const [kod, setKod] = useState('');
  const [aşama, setAşama] = useState<'telefon' | 'kod'>('telefon');
  const [yukleniyor, setYukleniyor] = useState(false);

  async function kodGonder() {
    const temizTelefon = telefon.trim().replace(/\s/g, '');
    if (!temizTelefon.startsWith('+')) {
      Alert.alert('Hata', 'Telefon numaranızı +90 ile başlayarak girin\nÖrnek: +905321234567');
      return;
    }
    setYukleniyor(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: temizTelefon });
    setYukleniyor(false);
    if (error) {
      Alert.alert('Hata', 'Kod gönderilemedi. Numaranızı kontrol edin.');
      return;
    }
    setAşama('kod');
  }

  async function kodDogrula() {
    const temizTelefon = telefon.trim().replace(/\s/g, '');
    setYukleniyor(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: temizTelefon,
      token: kod.trim(),
      type: 'sms',
    });
    setYukleniyor(false);
    if (error) {
      Alert.alert('Hata', 'Kod hatalı veya süresi dolmuş. Tekrar deneyin.');
    }
    // Başarılı girişte _layout.tsx auth listener otomatik yönlendirir
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">

        {/* Logo alanı */}
        <View style={styles.logoKutu}>
          <Text style={styles.logoEmoji}>🏥</Text>
          <Text style={styles.logoBaslik}>OnkoMobil</Text>
          <Text style={styles.logoAlt}>Tedavi Takip Uygulaması</Text>
        </View>

        <View style={styles.kart}>
          {aşama === 'telefon' ? (
            <>
              <Text style={styles.baslik}>Giriş Yap</Text>
              <Text style={styles.aciklama}>
                Doktorunuzun kaydettiği telefon numaranızı girin. Size doğrulama kodu göndereceğiz.
              </Text>

              <Text style={styles.etiket}>Telefon Numarası</Text>
              <TextInput
                style={styles.giris}
                placeholder="+90 532 123 45 67"
                placeholderTextColor={RENKLER.metinAcik}
                value={telefon}
                onChangeText={setTelefon}
                keyboardType="phone-pad"
                autoFocus
              />

              <TouchableOpacity
                style={[styles.buton, yukleniyor && styles.butonPasif]}
                onPress={kodGonder}
                disabled={yukleniyor}
              >
                {yukleniyor
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.butonMetin}>Kod Gönder →</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.baslik}>Kodu Girin</Text>
              <Text style={styles.aciklama}>
                {telefon} numarasına gönderilen 6 haneli kodu girin.
              </Text>

              <Text style={styles.etiket}>Doğrulama Kodu</Text>
              <TextInput
                style={[styles.giris, styles.kodGiris]}
                placeholder="123456"
                placeholderTextColor={RENKLER.metinAcik}
                value={kod}
                onChangeText={setKod}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.buton, (kod.length !== 6 || yukleniyor) && styles.butonPasif]}
                onPress={kodDogrula}
                disabled={kod.length !== 6 || yukleniyor}
              >
                {yukleniyor
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.butonMetin}>Giriş Yap ✓</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.geriBtn} onPress={() => { setAşama('telefon'); setKod(''); }}>
                <Text style={styles.geriBtnMetin}>← Telefon numarasını değiştir</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.dipNot}>
          Bu uygulama yalnızca doktorunuzun kaydettiği hastalara açıktır.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RENKLER.birincil },
  icerik: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoKutu: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 56, marginBottom: 8 },
  logoBaslik: { fontSize: 28, fontWeight: '700', color: '#fff' },
  logoAlt: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  kart: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  baslik: { fontSize: 22, fontWeight: '700', color: RENKLER.metinBirincil, marginBottom: 8 },
  aciklama: { fontSize: 14, color: RENKLER.metinIkincil, lineHeight: 20, marginBottom: 20 },
  etiket: { fontSize: 13, fontWeight: '600', color: RENKLER.metinBirincil, marginBottom: 6 },
  giris: {
    borderWidth: 1.5,
    borderColor: RENKLER.kenarlık,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: RENKLER.metinBirincil,
    marginBottom: 16,
  },
  kodGiris: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  buton: {
    backgroundColor: RENKLER.ikincil,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  butonPasif: { opacity: 0.5 },
  butonMetin: { color: '#fff', fontSize: 16, fontWeight: '700' },
  geriBtn: { marginTop: 16, alignItems: 'center' },
  geriBtnMetin: { color: RENKLER.metinIkincil, fontSize: 14 },
  dipNot: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 24 },
});
