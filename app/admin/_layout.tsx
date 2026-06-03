import { useState, useEffect } from 'react';
import {
  View, Text, Pressable, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, Redirect, useRouter, usePathname } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  Menu, X, Package, FolderTree, Tag, ShoppingBag, Scissors,
  Layers, Activity, Store, LayoutDashboard,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { TOKEN_KEY } from '@/services/axiosConfig';
import { isAdminUser, decodeJwtPayload } from '@/utils/adminUtils';

const SLATE_900 = '#0f172a';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_100 = '#f1f5f9';
const SLATE_50  = '#f8fafc';
const BLUE_50   = '#eff6ff';
const BLUE_600  = '#2563eb';

const NAV_ITEMS = [
  { path: '/admin',                label: 'Dashboard',      Icon: LayoutDashboard },
  { path: '/admin/products',       label: 'Inventory',      Icon: Package },
  { path: '/admin/categories',     label: 'Categories',     Icon: FolderTree },
  { path: '/admin/brands',         label: 'Brands',         Icon: Tag },
  { path: '/admin/orders',         label: 'Orders',         Icon: ShoppingBag },
  { path: '/admin/custom-orders',  label: 'Custom Orders',  Icon: Scissors },
  { path: '/admin/custom-catalog', label: 'Custom Catalog', Icon: Layers },
  { path: '/admin/campaigns',      label: 'Promotions',     Icon: Activity },
];

function getCurrentNav(pathname) {
  // Longest-prefix match so /admin/products/[id] still highlights "Inventory"
  let best = NAV_ITEMS[0];
  for (const item of NAV_ITEMS) {
    if (pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path + '/'))) {
      if (item.path.length > best.path.length) best = item;
    }
    if (pathname === item.path) best = item;
  }
  return best;
}

export default function AdminLayout() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // /v1/users/me does NOT return roles, so we read the JWT from SecureStore
  // (the token has authorities) and gate on the decoded payload instead.
  const [adminState, setAdminState] = useState('checking'); // 'checking' | 'yes' | 'no'

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const payload = decodeJwtPayload(token);
        if (active) setAdminState(isAdminUser(payload) ? 'yes' : 'no');
      } catch {
        if (active) setAdminState('no');
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading || adminState === 'checking') {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: SLATE_50 }}>
        <ActivityIndicator color={BLUE_600} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (adminState === 'no') return <Redirect href="/" />;

  const currentNav = getCurrentNav(pathname);

  return (
    <View className="flex-1" style={{ backgroundColor: SLATE_50 }}>
      {/* Sticky top bar */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: SLATE_900 }}>
        <View className="px-3 h-14 flex-row items-center gap-3">
          <Pressable
            onPress={() => setDrawerOpen(true)}
            hitSlop={8}
            className="w-10 h-10 items-center justify-center"
          >
            <Menu size={22} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-[9px] font-bold uppercase tracking-widest" style={{ color: SLATE_400 }}>
              Admin Portal
            </Text>
            <Text className="text-white text-sm font-bold mt-0.5">{currentNav.label}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Child route content */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: SLATE_50 },
        }}
      />

      {/* Drawer */}
      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentPath={pathname}
        onNavigate={(path) => {
          setDrawerOpen(false);
          router.push(path as any);
        }}
        onBackToStore={() => {
          setDrawerOpen(false);
          router.replace('/');
        }}
      />
    </View>
  );
}

function DrawerMenu({ visible, onClose, currentPath, onNavigate, onBackToStore }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 flex-row">
        {/* Drawer panel */}
        <View style={{ width: '82%', maxWidth: 320, backgroundColor: '#fff' }}>
          <SafeAreaView edges={['top']} style={{ backgroundColor: SLATE_900 }}>
            <View className="px-5 py-4 flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-[9px] font-bold uppercase tracking-widest" style={{ color: SLATE_400 }}>
                  Admin Portal
                </Text>
                <Text className="text-white text-base font-bold mt-1">ExploreAba</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} className="w-8 h-8 items-center justify-center">
                <X size={20} color="#fff" />
              </Pressable>
            </View>
          </SafeAreaView>

          <ScrollView style={{ flex: 1, padding: 10 }} contentContainerStyle={{ paddingBottom: 24 }}>
            {NAV_ITEMS.map(({ path, label, Icon }) => {
              const active = path === '/admin'
                ? currentPath === '/admin'
                : currentPath === path || currentPath.startsWith(path + '/');
              return (
                <Pressable
                  key={path}
                  onPress={() => onNavigate(path)}
                  className="flex-row items-center gap-3 px-4 py-3 rounded-xl mb-1"
                  style={{ backgroundColor: active ? BLUE_50 : 'transparent' }}
                >
                  <Icon size={18} color={active ? BLUE_600 : SLATE_600} />
                  <Text className="text-sm font-bold" style={{ color: active ? BLUE_600 : SLATE_600 }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}

            <View style={{ height: 1, backgroundColor: SLATE_100, marginVertical: 14, marginHorizontal: 4 }} />

            <Pressable
              onPress={onBackToStore}
              className="flex-row items-center gap-3 px-4 py-3 rounded-xl"
            >
              <Store size={18} color={SLATE_600} />
              <Text className="text-sm font-bold" style={{ color: SLATE_600 }}>
                Back to Store
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Backdrop */}
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}