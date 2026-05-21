import { useState } from 'react';
import { Tabs } from 'expo-router';
import { Home, Grid3X3, Package, Heart, User } from 'lucide-react-native';
import MobileCategorySheet from '@/components/MobileCategorySheet';
import { useCategories } from '@/hooks/useCategories';

export default function TabsLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { categories } = useCategories();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#16a34a',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#F3F4F6',
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            tabBarIcon: ({ color, size }) => <Grid3X3 size={size} color={color} />,
          }}
          listeners={{
            // Intercept tap — open sheet instead of navigating
            tabPress: (e) => {
              e.preventDefault();
              setSheetOpen(true);
            },
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            title: 'Saved',
            tabBarIcon: ({ color, size, focused }) => (
              <Heart
                size={size}
                color={focused ? '#ef4444' : color}
                fill={focused ? '#ef4444' : 'transparent'}
              />
            ),
            tabBarActiveTintColor: '#ef4444', // override active color for this tab
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>

      {/* Category sheet rendered at the layout level so it overlays the tab bar */}
      <MobileCategorySheet
        categories={categories}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}