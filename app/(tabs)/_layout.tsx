import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Grid3X3, Package, Scissors, User } from 'lucide-react-native';
import MobileCategorySheet from '@/components/MobileCategorySheet';
import { useCategories } from '@/hooks/useCategories';

// Raised "hero" center button for the Custom tab.
function CustomTabButton() {
  return (
    <Pressable
      onPress={() => router.push('/custom')}
      android_ripple={{ color: 'transparent' }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 }}
    >
      <View
        style={{
          marginTop: -22,                 // floats above the bar
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: '#16a34a',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: '#0f172a',         // ring matches the dark bar so it "cuts" into it
          shadowColor: '#16a34a',
          shadowOpacity: 0.4,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Scissors size={22} color="#fff" strokeWidth={2.2} />
      </View>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#22c55e', marginTop: 3 }}>Custom</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { categories } = useCategories();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#0f172a',                 // your dark bar (kept)
            borderTopColor: 'rgba(255,255,255,0.08)',   // subtle hairline on dark
            height: 52 + insets.bottom,                 // your height (kept)
            paddingBottom: 8 + insets.bottom,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }}
        />
        <Tabs.Screen
          name="categories"
          options={{ title: 'Categories', tabBarIcon: ({ color, size }) => <Grid3X3 size={size} color={color} /> }}
          listeners={{ tabPress: (e) => { e.preventDefault(); setSheetOpen(true); } }}
        />
        <Tabs.Screen
          name="custom"
          options={{
            title: 'Custom',
            tabBarButton: () => <CustomTabButton />,   // raised center FAB
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Package size={size} color={color} /> }}
        />
        <Tabs.Screen
          name="account"
          options={{ title: 'Account', tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }}
        />

        {/* Saved: removed from the bar, route kept so the header heart can open it */}
        <Tabs.Screen name="wishlist" options={{ href: null }} />
      </Tabs>

      <MobileCategorySheet categories={categories} isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}