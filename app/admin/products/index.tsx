import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Package, Plus, Search, RefreshCw, X, Image as ImageIcon,
  CheckCircle, Trash2, TrendingUp, AlertTriangle,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { fmt, isActive, getErr } from '@/utils/adminUtils';
import { toast } from '@/utils/toast';

const SLATE_900 = '#0f172a';
const SLATE_600 = '#475569';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_300 = '#cbd5e1';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const SLATE_50  = '#f8fafc';
const BLUE_600  = '#2563eb';

export default function AdminProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState({});

  const fetchProducts = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get('/products?page=0&size=100');
      setProducts(res.data.content ?? res.data ?? []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const confirmDelete = (product) => {
    Alert.alert(
      'Delete product',
      `Permanently delete "${product.name}" and all its variants? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting((d) => ({ ...d, [product.id]: true }));
            try {
              await api.delete('/products/' + product.id);
              toast.success('Product deleted');
              fetchProducts();
            } catch (err) {
              toast.error(getErr(err));
              setDeleting((d) => ({ ...d, [product.id]: false }));
            }
          },
        },
      ]
    );
  };

  const q = search.trim().toLowerCase();
  const filtered = products.filter((p) =>
    !q ||
    p.name?.toLowerCase().includes(q) ||
    p.categoryName?.toLowerCase().includes(q) ||
    p.brandName?.toLowerCase().includes(q) ||
    p.slug?.toLowerCase().includes(q)
  );

  const stats = [
    { label: 'Total products', val: products.length, Icon: Package, color: SLATE_600, bg: '#f8fafc', border: SLATE_200 },
    { label: 'Active', val: products.filter(isActive).length, Icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Low stock', val: products.filter((p) => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) <= 10).length, Icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { label: 'Out of stock', val: products.filter((p) => (p.stockQuantity || 0) === 0).length, Icon: TrendingUp, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchProducts('refresh')} tintColor={BLUE_600} />
      }
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: SLATE_900 }}>Products</Text>
          <Text style={{ fontSize: 12, color: SLATE_400, marginTop: 2 }}>
            {products.length} item{products.length !== 1 ? 's' : ''} in catalog
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/admin/products/new' as any)}
          style={{
            backgroundColor: SLATE_900, paddingHorizontal: 16, paddingVertical: 10,
            borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={15} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add</Text>
        </Pressable>
      </View>

      {/* Stats — 2×2 grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
        {stats.map((s) => (
          <View
            key={s.label}
            style={{
              width: '48%', marginBottom: 10, borderRadius: 16, borderWidth: 1,
              borderColor: s.border, backgroundColor: s.bg, padding: 14,
              flexDirection: 'row', alignItems: 'flex-start', gap: 10,
            }}
          >
            <s.Icon size={16} color={s.color} style={{ marginTop: 2 }} />
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: s.color, lineHeight: 24 }}>{s.val}</Text>
              <Text style={{ fontSize: 11, color: SLATE_500, marginTop: 2 }}>{s.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={15} color={SLATE_400} style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, slug, category, brand…"
          placeholderTextColor={SLATE_300}
          style={{
            backgroundColor: '#fff', borderWidth: 1, borderColor: SLATE_200, borderRadius: 12,
            paddingLeft: 36, paddingRight: 36, paddingVertical: 10, fontSize: 14, color: SLATE_900,
          }}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={{ position: 'absolute', right: 10, top: 10, padding: 2 }}>
            <X size={16} color={SLATE_400} />
          </Pressable>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator color={BLUE_600} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <Package size={30} color={SLATE_200} />
          <Text style={{ color: SLATE_400, fontWeight: '600', fontSize: 13, marginTop: 10 }}>
            {search ? `No results for "${search}"` : 'No products yet — add your first!'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {filtered.map((p) => {
            const stock = p.stockQuantity || 0;
            const stockStyle = stock === 0
              ? { bg: '#fef2f2', text: '#dc2626' }
              : stock <= 10
              ? { bg: '#fffbeb', text: '#a16207' }
              : { bg: SLATE_100, text: SLATE_600 };
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/admin/products/${p.id}` as any)}
                style={{
                  backgroundColor: '#fff', borderWidth: 1, borderColor: SLATE_200, borderRadius: 14,
                  padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
                }}
              >
                {/* Thumbnail */}
                <View style={{
                  width: 48, height: 48, borderRadius: 12, backgroundColor: SLATE_100,
                  borderWidth: 1, borderColor: SLATE_200, overflow: 'hidden',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {p.images?.[0]?.url ? (
                    <Image source={{ uri: p.images[0].url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <ImageIcon size={16} color={SLATE_300} />
                  )}
                </View>

                {/* Info */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: SLATE_900 }}>
                    {p.name}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 11, color: SLATE_400 }}>
                    {p.categoryName || '—'}{p.brandName ? ` · ${p.brandName}` : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: SLATE_900 }}>₦{fmt(p.price)}</Text>
                    <View style={{ backgroundColor: stockStyle.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: stockStyle.text }}>
                        {stock === 0 ? 'Out of stock' : `${stock} units`}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isActive(p) ? '#22c55e' : SLATE_300 }} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isActive(p) ? '#16a34a' : SLATE_400 }}>
                        {isActive(p) ? 'Active' : 'Draft'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Delete */}
                <Pressable
                  onPress={() => confirmDelete(p)}
                  disabled={deleting[p.id]}
                  hitSlop={8}
                  style={{ padding: 6 }}
                >
                  {deleting[p.id]
                    ? <ActivityIndicator size="small" color="#dc2626" />
                    : <Trash2 size={16} color={SLATE_300} />}
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      )}

      {filtered.length > 0 && !loading && (
        <Text style={{ textAlign: 'center', fontSize: 11, color: SLATE_400, marginTop: 14 }}>
          Showing {filtered.length} of {products.length}
        </Text>
      )}
    </ScrollView>
  );
}