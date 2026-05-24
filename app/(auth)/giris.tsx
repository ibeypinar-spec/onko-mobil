import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { RENKLER } from '../../constants/renkler';

const SUPABASE_CONFIGURED =
  !process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('YOUR_PROJECT');

type Mod = 'email' | 'telefon' | 'kod';

export default function GirisEkrani() {
  const [mod, setMod] = useState<Mod>('email');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [telefon, setTelefon] = useState('');
  const [kod, setKod] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  // ── Email + şifre girişi ──────────────────────────────────────────────────
  async function emailGiris() {
    if (!email.trim() || !sifre.trim()) {
      Alert.alert('Eksik bilgi', 'Email ve şifrenizi girin.');
      return;
    }
    setYukleniyor(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: sifre.trim(),
    });
    setYukleniyor(false);
    if (error) {
      Alert.alert('Giriş hatası', 'Email veya şifre hatalı.');
    }
    // Başarılıysa _layout.tsx yönlendirir
  }

  // ── Telefon OTP ───────────────────────────────────────────────────────────
  async function kodGonder() {
    const temiz = telefon.trim().replace(/\s/g, '');
    if (!temiz.startsWith('+')) {
      Alert.alert('Hata', 'Telefon numaranızı +90 ile başlayarak girin\nÖrnek: +905321234567');
      return;
    }
    setYukleniyor(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: temiz });
    setYukleniyor(false);
    if (error) {
      Alert.alert('Hata', 'Kod gönderilemedi: ' + error.message);
      return;
    }
    setMod('kod');
  }

  async function kodDogrula() {
    const temiz = telefon.trim().replace(/\s/g, '');
    setYukleniyor(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: temiz, token: kod.trim(), type: 'sms',
    });
    setYukleniyor(false);
    if (error) Alert.alert('Hata', 'Kod hatalı veya süresi dolmuş.');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoKutu}>
          <Text style={styles.logoEmoji}>🏥</Text>
          <Text style={styles.logoBaslik}>OnkoMobil</Text>
          <Text style={styles.logoAlt}>Tedavi Takip Uygulaması</Text>
        </View>

        {/* Supabase kurulmamış uyarısı */}
        {!SUPABASE_CONFIGURED && (
          <View style={styles.kurulumUyari}>
            <Text style={styles.kurulumUyariBaslik}>⚙️ Supabase Kurulumu Gerekli</Text>
            <Text style={styles.kurulumUyariMetin}>
              1. supabase.com → yeni proje oluşturun{'\n'}
              2. SQL Editor → 001_initial.sql çalıştırın{'\n'}
              3. .env.local dosyasını doldurun{'\n'}
              4. Uygulamayı yeniden başlatın
            </Text>
          </View>
        )}

        {/* Giriş modu seçici */}
        <View style={styles.modSecici}>
          <TouchableOpacity
            style={[styles.modBtn, mod === 'email' && styles.modBtnAktif]}
            onPress={() => setMod('email')}
          >
            <Text style={[styles.modBtnMetin, mod === 'email' && styles.modBtnMetinAktif]}>
              📧 Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modBtn, (mod === 'telefon' || mod === 'kod') && styles.modBtnAktif]}
            onPress={() => setMod('telefon')}
          >
            <Text style={[styles.modBtnMetin, (mod === 'telefon' || mod === 'kod') && styles.modBtnMetinAktif]}>
              📱 Telefon
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.kart}>

          {/* ── EMAIL MOD ── */}
          {mod === 'email' && (
            <>
              <Text style={styles.baslik}>Email ile Giriş</Text>
              <Text style={styles.aciklama}>
                Doktorunuzun sisteme kaydettiği email ve şifrenizle giriş yapın.
              </Text>

              <Text style={styles.etiket}>Email</Text>
              <TextInput
                style={styles.giris}
                placeholder="ornek@email.com"
                placeholderTextColor={RENKLER.metinAcik}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />

              <Text style={styles.etiket}>Şifre</Text>
              <TextInput
                style={styles.giris}
                placeholder="••••••••"
                placeholderTextColor={RENKLER.metinAcik}
                value={sifre}
                onChangeText={setSifre}
                secureTextEntry
                onSubmitEditing={emailGiris}
              />

              <TouchableOpacity
                style={[styles.buton, (yukleniyor || !email || !sifre) && styles.butonPasif]}
                onPress={emailGiris}
                disabled={yukleniyor || !email.trim() || !sifre.trim()}
              >
                {yukleniyor
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.butonMetin}>Giriş Yap →</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* ── TELEFON MOD ── */}
          {mod === 'telefon' && (
            <>
              <Text style={styles.baslik}>SMS ile Giriş</Text>
              <Text style={styles.aciklama}>
                Kayıtlı telefon numaranıza doğrulama kodu göndereceğiz.
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
                style={[styles.buton, (yukleniyor || !telefon) && styles.butonPasif]}
                onPress={kodGonder}
                disabled={yukleniyor || !telefon.trim()}
              >
                {yukleniyor
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.butonMetin}>Kod Gönder →</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* ── KOD DOĞRULAMA ── */}
          {mod === 'kod' && (
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

              <TouchableOpacity style={styles.geriBtn} onPress={() => { setMod('telefon'); setKod(''); }}>
                <Text style={styles.geriBtnMetin}>← Numarayı değiştir</Text>
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
  container:  { flex: 1, backgroundColor: RENKLER.birincil },
  icerik:     { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoKutu:   { alignItems: 'center', marginBottom: 24 },
  logoEmoji:  { fontSize: 56, marginBottom: 8 },
  logoBaslik: { fontSize: 28, fontWeight: '700', color: '#fff' },
  logoAlt:    { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  kurulumUyari: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  kurulumUyariBaslik: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 8 },
  kurulumUyariMetin:  { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20 },

  modSecici: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  modBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  modBtnAktif:      { backgroundColor: '#fff' },
  modBtnMetin:      { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 14 },
  modBtnMetinAktif: { color: RENKLER.birincil },

  kart: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  baslik:    { fontSize: 22, fontWeight: '700', color: RENKLER.metinBirincil, marginBottom: 8 },
  aciklama:  { fontSize: 14, color: RENKLER.metinIkincil, lineHeight: 20, marginBottom: 20 },
  etiket:    { fontSize: 13, fontWeight: '600', color: RENKLER.metinBirincil, marginBottom: 6 },
  giris: {
    borderWidth: 1.5, borderColor: RENKLER.kenarlık,
    borderRadius: 10, padding: 14,
    fontSize: 16, color: RENKLER.metinBirincil, marginBottom: 16,
  },
  kodGiris: { fontSize: 28, fontWeight: '700', letterSpacing: 8, textAlign: 'center' },
  buton:      { backgroundColor: RENKLER.ikincil, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  butonPasif: { opacity: 0.5 },
  butonMetin: { color: '#fff', fontSize: 16, fontWeight: '700' },
  geriBtn:    { marginTop: 16, alignItems: 'center' },
  geriBtnMetin: { color: RENKLER.metinIkincil, fontSize: 14 },
  dipNot:     { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 24 },
});
