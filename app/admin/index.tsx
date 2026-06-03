import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
  Package, FolderTree, Tag, ShoppingBag, Scissors,
  Layers, Activity, ChevronRight,
} from 'lucide-react-native';

const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';

const QUICK_LINKS = [
  { path: '/admin/products',       label: 'Inventory',      desc: 'Products, variants, stock',     Icon: Package,     tint: '#dbeafe', iconColor: '#2563eb' },
  { path: '/admin/orders',         label: 'Orders',         desc: 'Fulfillment & status',          Icon: ShoppingBag, tint: '#fef3c7', iconColor: '#d97706' },
  { path: '/admin/custom-orders',  label: 'Custom Orders',  desc: 'Made-to-measure quotes',        Icon: Scissors,    tint: '#fce7f3', iconColor: '#db2777' },
  { path: '/admin/custom-catalog', label: 'Custom Catalog', desc: 'Categories & style galleries',  Icon: Layers,      tint: '#dcfce7', iconColor: '#16a34a' },
  { path: '/admin/campaigns',      label: 'Promotions',     desc: 'Flash sales & discounts',       Icon: Activity,    tint: '#fee2e2', iconColor: '#dc2626' },
  { path: '/admin/categories',     label: 'Categories',     desc: 'Taxonomy tree',                 Icon: FolderTree,  tint: '#e0e7ff', iconColor: '#4f46e5' },
  { path: '/admin/brands',         label: 'Brands',         desc: 'Brand directory',               Icon: Tag,         tint: '#f3e8ff', iconColor: '#9333ea' },
];

export default function AdminDashboard() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: SLATE_900, marginBottom: 4 }}>
        Welcome back
      </Text>
      <Text style={{ fontSize: 13, color: SLATE_500, marginBottom: 20 }}>
        Choose a section to manage.
      </Text>

      <View style={{ gap: 10 }}>
        {QUICK_LINKS.map(({ path, label, desc, Icon, tint, iconColor }) => (
          <Pressable
            key={path}
            onPress={() => router.push(path as any)}
            style={{
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: SLATE_200,
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View
              style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: tint,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon size={20} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: SLATE_900 }}>{label}</Text>
              <Text style={{ fontSize: 11, color: SLATE_500, marginTop: 2 }}>{desc}</Text>
            </View>
            <ChevronRight size={16} color={SLATE_400} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}