import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { RENKLER } from '../../constants/renkler';

const SUPABASE_CONFIGURED =
  !process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('YOUR_PROJECT');

// Telefon numarasını Supabase arka-e-postasına çevirir (SMS altyapısı gerekmez)
function telefonToEmail(tel: string): string {
  const t = tel.trim().replace(/[\s\-().]/g, '');
  const norm = t.startsWith('+')  ? t :
               t.startsWith('00') ? '+' + t.slice(2) :
               t.startsWith('0')  ? '+90' + t.slice(1) : '+90' + t;
  return norm.replace('+', '') + '@m.onkomobil';
}

type Mod = 'email' | 'telefon';

export default function GirisEkrani() {
  const [mod, setMod] = useState<Mod>('email');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [telefon, setTelefon] = useState('');
  const [pin, setPin] = useState('');
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

  // ── Telefon + Erişim Kodu girişi (SMS gerekmez) ──────────────────────────
  async function telefonGiris() {
    const tel = telefon.trim();
    if (!tel) {
      Alert.alert('Eksik bilgi', 'Telefon numaranızı girin.');
      return;
    }
    if (!pin.trim()) {
      Alert.alert('Eksik bilgi', 'Erişim kodunuzu girin.');
      return;
    }
    setYukleniyor(true);
    const { error } = await supabase.auth.signInWithPassword({
      email:    telefonToEmail(tel),
      password: pin.trim(),
    });
    setYukleniyor(false);
    if (error) {
      Alert.alert('Giriş hatası', 'Telefon numarası veya erişim kodu hatalı.\nDoktorunuzdan aldığınız kodu kontrol edin.');
    }
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
            style={[styles.modBtn, mod === 'telefon' && styles.modBtnAktif]}
            onPress={() => setMod('telefon')}
          >
            <Text style={[styles.modBtnMetin, mod === 'telefon' && styles.modBtnMetinAktif]}>
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

          {/* ── TELEFON + ERİŞİM KODU MOD ── */}
          {mod === 'telefon' && (
            <>
              <Text style={styles.baslik}>Telefon ile Giriş</Text>
              <Text style={styles.aciklama}>
                Doktorunuzun verdiği telefon numarası ve erişim kodunu girin.
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

              <Text style={styles.etiket}>Erişim Kodu</Text>
              <TextInput
                style={[styles.giris, styles.kodGiris]}
                placeholder="• • • • • •"
                placeholderTextColor={RENKLER.metinAcik}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.buton, (yukleniyor || !telefon || !pin) && styles.butonPasif]}
                onPress={telefonGiris}
                disabled={yukleniyor || !telefon.trim() || !pin.trim()}
              >
                {yukleniyor
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.butonMetin}>Giriş Yap →</Text>
                }
              </TouchableOpacity>

              <Text style={styles.dipNotKucuk}>
                Erişim kodunuzu doktorunuzdan aldığınız kılavuzda bulabilirsiniz.
              </Text>
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
  dipNot:       { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 24 },
  dipNotKucuk:  { color: RENKLER.metinAcik, fontSize: 11, textAlign: 'center', marginTop: 12 },
});
