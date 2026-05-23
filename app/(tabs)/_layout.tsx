import { Tabs } from 'expo-router';
import { RENKLER } from '../../constants/renkler';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: RENKLER.tabAktif,
        tabBarInactiveTintColor: RENKLER.tabPasif,
        tabBarStyle: {
          backgroundColor: RENKLER.tabArkaplan,
          borderTopColor: RENKLER.kenarlık,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: RENKLER.birincil },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Bugün', tabBarIcon: ({ focused }) => <TabIkon emoji="🏠" focused={focused} /> }}
      />
      <Tabs.Screen
        name="semptom"
        options={{ title: 'Yan Etkiler', tabBarIcon: ({ focused }) => <TabIkon emoji="⚠️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="ilac"
        options={{ title: 'İlaçlar', tabBarIcon: ({ focused }) => <TabIkon emoji="💊" focused={focused} /> }}
      />
      <Tabs.Screen
        name="rapor"
        options={{ title: 'Rapor', tabBarIcon: ({ focused }) => <TabIkon emoji="📊" focused={focused} /> }}
      />
    </Tabs>
  );
}

// Emoji tabBar ikonu
function TabIkon({ emoji, focused }: { emoji: string; focused: boolean }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}
