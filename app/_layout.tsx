import { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { bildirimIzniAl } from '../lib/bildirim';
import { RENKLER } from '../constants/renkler';

const SUPABASE_CONFIGURED =
  !process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('YOUR_PROJECT');

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [hazir, setHazir] = useState(false);
  const baslangicRef = useRef(true);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setHazir(true); return; }

    // İlk session kontrolü
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setHazir(true);
      baslangicRef.current = false;
    });

    // Sonraki auth değişikliklerini izle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (baslangicRef.current) return; // Başlangıç olayını atla
        setSession(session);
      }
    );

    bildirimIzniAl().catch(() => {});

    return () => subscription.unsubscribe();
  }, []);

  // Session değişince yönlendir (hazır olduktan sonra)
  useEffect(() => {
    if (!hazir) return;

    if (!SUPABASE_CONFIGURED) {
      router.replace('/(auth)/giris'); // Kurulum ekranı göster
      return;
    }

    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/giris');
    }
  }, [session, hazir]);

  // Yüklenirken splash
  if (!hazir) {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <Text style={styles.splashEmoji}>🏥</Text>
        <Text style={styles.splashBaslik}>OnkoMobil</Text>
        <ActivityIndicator color="rgba(255,255,255,0.7)" style={{ marginTop: 32 }} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: RENKLER.birincil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashEmoji:  { fontSize: 64 },
  splashBaslik: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 16 },
});
