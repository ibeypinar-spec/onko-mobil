import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { bildirimIzniAl } from '../lib/bildirim';

export default function RootLayout() {
  useEffect(() => {
    // Auth durumunu izle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/giris');
        }
      }
    );

    // Bildirim izni iste
    bildirimIzniAl().catch(() => {});

    return () => subscription.unsubscribe();
  }, []);

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
