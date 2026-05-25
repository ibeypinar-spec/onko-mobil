// Expo Router'ın başlangıç rotası.
// _layout.tsx'deki useEffect session kontrolü yapıp
// /(auth)/giris veya /(tabs)'e yönlendirir.
// Bu ekran sadece kısa süre (splash overlay varken) görünür.
import { View } from 'react-native';
import { RENKLER } from '../constants/renkler';

export default function Index() {
  return <View style={{ flex: 1, backgroundColor: RENKLER.birincil }} />;
}
