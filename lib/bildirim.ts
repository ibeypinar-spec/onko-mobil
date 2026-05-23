import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Bildirim geldiğinde uygulama önde olsa da göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

export async function bildirimIzniAl(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: mevcut } = await Notifications.getPermissionsAsync();
  let sonDurum = mevcut;

  if (mevcut !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    sonDurum = status;
  }

  if (sonDurum !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('onko-default', {
      name: 'OnkoMobil Bildirimleri',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync('onko-acil', {
      name: 'Acil Bildirimler',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });
  return token.data;
}

// ─── Günlük check-in hatırlatması ─────────────────────────────────────────────

export async function gunlukCheckInKur(saat: { hour: number; minute: number }) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Günlük Kontrol',
      body: 'Bugün nasıl hissediyorsunuz? İlaçlarınızı aldınız mı?',
      sound: true,
      data: { tip: 'gunluk_checkin' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: saat.hour,
      minute: saat.minute,
      repeats: true,
    },
  });
}

// ─── İlaç hatırlatması ────────────────────────────────────────────────────────

export async function ilacHatirlatmaKur(ilacAdi: string, saat: string, ilacId: string) {
  const [hour, minute] = saat.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `💊 İlaç Zamanı`,
      body: `${ilacAdi} — almayı unutmayın`,
      sound: true,
      data: { tip: 'ilac_hatirlatma', ilacId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

// ─── IV infüzyon hatırlatması ──────────────────────────────────────────────────

export async function ivHatirlatmaKur(tarih: string, protokol: string) {
  // Bir gün önce sabah 8'de
  const ivTarih = new Date(tarih);
  ivTarih.setDate(ivTarih.getDate() - 1);
  ivTarih.setHours(8, 0, 0, 0);

  if (ivTarih > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏥 Yarın Kemoterapi',
        body: `${protokol} — yarın hastaneye gelmeyi unutmayın`,
        sound: true,
        data: { tip: 'iv_oncesi', tarih },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: ivTarih,
      },
    });
  }

  // IV günü akşam 6'da semptom sorusu
  const ivGunAksam = new Date(tarih);
  ivGunAksam.setHours(18, 0, 0, 0);
  if (ivGunAksam > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '❓ Kemoterapiden sonra nasılsınız?',
        body: 'Bugün nasıl hissettiniz? Birkaç dakikanızı ayırın.',
        sound: true,
        data: { tip: 'post_iv', tarih },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: ivGunAksam,
      },
    });
  }
}

// ─── Acil bildirim (lokal) ────────────────────────────────────────────────────

export async function acilBildirimGoster(semptom: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 Şiddetli Semptom Bildirildi',
      body: `${semptom} için Grade 3+ bildiriminiz doktorunuza iletildi. Gerekirse kliniği arayın.`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { tip: 'acil' },
    },
    trigger: null, // Hemen göster
  });
}
