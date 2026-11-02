import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl, Modal, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, SlidersHorizontal, ArrowUpDown, X, Check, Package, AlertCircle, RefreshCw,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import ProductCard from '@/components/product/ProductCard';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Most Relevant' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',    label: 'Best Selling' },
];
const SORT_MAP = {
  price_asc: 'price,asc',
  price_desc: 'price,desc',
  newest: 'createdAt,desc',
  popular: 'soldCount,desc',
};

export default function BrandScreen() {
  const { slug } = useLocalSearchParams();

  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [sort, setSort] = useState('relevance');
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', keyword: '' });
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const hasActiveFilters = !!(filters.minPrice || filters.maxPrice || filters.keyword);

  // Brand metadata (name/logo/description) — fetched once on mount and on
  // manual pull-to-refresh only. Deliberately NOT tied to sort/filter changes,
  // since the brand itself doesn't change when the user re-sorts its products.
  const fetchBrandMeta = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(`/brands/${slug}`);
      setBrand(res.data);
    } catch (e) {
      console.error(e);
      // Silent on purpose — a metadata hiccup shouldn't block the product grid,
      // which is the actual content of this screen.
    }
  }, [slug]);

  useEffect(() => { fetchBrandMeta(); }, [fetchBrandMeta]);

  const fetchPage = useCallback(
    async (pageNum, mode = 'initial') => {
      if (!slug) return;
      if (mode === 'append') setLoadingMore(true);
      else if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ page: String(pageNum), size: String(PAGE_SIZE) });
        if (SORT_MAP[sort]) params.set('sort', SORT_MAP[sort]);

        let res;
        if (hasActiveFilters) {
          res = await api.post(`/products/filter?${params.toString()}`, {
            brandSlug: slug,
            keyword: filters.keyword || undefined,
            minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
            maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
          });
        } else {
          res = await api.get(`/products/brand/${slug}?${params.toString()}`);
        }

        const d = res.data;
        const items = d.content || d.products || [];
        const last = d.last ?? (items.length < PAGE_SIZE);
        const total = d.totalElements ?? items.length;

        setProducts((prev) => (mode === 'append' ? [...prev, ...items] : items));
        setHasMore(!last);
        setTotalElements(total);
        setPage(pageNum);
      } catch (e) {
        setError(e.message || 'Failed to load products');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [slug, sort, filters, hasActiveFilters]
  );

  // Refetch when slug, sort, or filters change
  useEffect(() => { if (slug) fetchPage(0); }, [fetchPage, slug]);

  const onLoadMore = () => {
    if (!loadingMore && hasMore && !loading) fetchPage(page + 1, 'append');
  };
  const onRefresh = () => {
    fetchBrandMeta();
    fetchPage(0, 'refresh');
  };
  const clearFilters = () => setFilters({ minPrice: '', maxPrice: '', keyword: '' });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between px-2 h-14 border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <View className="items-center flex-1">
            <Text className="text-base font-black text-gray-900 tracking-tight" numberOfLines={1}>
              {brand?.name || 'Brand'}
            </Text>
            {totalElements > 0 && (
              <Text className="text-[10px] text-gray-400 font-medium">
                {totalElements.toLocaleString()} {totalElements === 1 ? 'product' : 'products'}
              </Text>
            )}
          </View>
          <View className="w-10" />
        </View>

        {/* Brand identity strip — logo + description, once metadata has loaded */}
        {brand && (
          <View className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-100">
            {brand.logoUrl ? (
              <View className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50">
                <Image source={{ uri: brand.logoUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
              </View>
            ) : (
              <View className="w-12 h-12 rounded-xl bg-green-600 items-center justify-center">
                <Text className="text-white font-black text-lg">
                  {brand.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-base font-black text-gray-900" numberOfLines={1}>{brand.name}</Text>
              {brand.description ? (
                <Text className="text-xs text-gray-500" numberOfLines={2}>{brand.description}</Text>
              ) : null}
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Toolbar */}
      <View className="bg-white border-b border-gray-100 flex-row items-center justify-between px-3 py-2.5">
        <Pressable
          onPress={() => setFilterModalOpen(true)}
          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border
            ${hasActiveFilters ? 'bg-green-600 border-green-600' : 'bg-white border-gray-200'}`}
        >
          <SlidersHorizontal size={13} color={hasActiveFilters ? '#fff' : '#374151'} />
          <Text className={`text-xs font-bold ${hasActiveFilters ? 'text-white' : 'text-gray-700'}`}>
            Filters
          </Text>
          {hasActiveFilters && (
            <View className="bg-white/25 w-4 h-4 rounded-full items-center justify-center ml-1">
              <Text className="text-[9px] font-black text-white">
                {[filters.minPrice, filters.maxPrice, filters.keyword].filter(Boolean).length}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => setSortModalOpen(true)}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white"
        >
          <ArrowUpDown size={13} color="#374151" />
          <Text className="text-xs font-bold text-gray-700">
            {SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Sort'}
          </Text>
        </Pressable>
      </View>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <View className="bg-gray-50 px-3 py-2 flex-row flex-wrap gap-1.5">
          {filters.keyword && (
            <View className="flex-row items-center gap-1 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <Text className="text-[11px] font-bold text-green-700">"{filters.keyword}"</Text>
              <Pressable onPress={() => setFilters((f) => ({ ...f, keyword: '' }))}>
                <X size={11} color="#16a34a" />
              </Pressable>
            </View>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <View className="flex-row items-center gap-1 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <Text className="text-[11px] font-bold text-green-700">
                ₦{filters.minPrice || '0'} – {filters.maxPrice ? `₦${filters.maxPrice}` : 'Any'}
              </Text>
              <Pressable onPress={() => setFilters((f) => ({ ...f, minPrice: '', maxPrice: '' }))}>
                <X size={11} color="#16a34a" />
              </Pressable>
            </View>
          )}
          <Pressable onPress={clearFilters} className="px-2 py-1">
            <Text className="text-[11px] font-bold text-red-500">Clear all</Text>
          </Pressable>
        </View>
      )}

      {/* Products */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
            <AlertCircle size={28} color="#ef4444" />
          </View>
          <Text className="text-lg font-black text-gray-900 mb-4">Couldn't load products</Text>
          <Pressable
            onPress={() => fetchPage(0)}
            className="bg-gray-900 px-5 py-2.5 rounded-xl flex-row items-center gap-2"
          >
            <RefreshCw size={14} color="#fff" />
            <Text className="text-white text-sm font-bold">Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 32, flexGrow: 1 }}
          renderItem={({ item, index }) => (
            <View style={{ flex: 1 }}>
              <ProductCard product={item} priority={index < 4} />
            </View>
          )}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center"><ActivityIndicator color="#16a34a" /></View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 px-4">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Package size={28} color="#9CA3AF" />
              </View>
              <Text className="text-lg font-black text-gray-900 mb-2">No products found</Text>
              <Text className="text-sm text-gray-500 text-center mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search term.'
                  : 'No products have been added to this brand yet.'}
              </Text>
              {hasActiveFilters && (
                <Pressable onPress={clearFilters} className="bg-green-600 px-6 py-2.5 rounded-xl">
                  <Text className="text-white text-sm font-bold">Clear Filters</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      {/* Sort Modal */}
      <Modal
        visible={sortModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalOpen(false)}
      >
        <Pressable className="flex-1 bg-black/55 justify-end" onPress={() => setSortModalOpen(false)}>
          <Pressable className="bg-white rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
            <SafeAreaView edges={['bottom']}>
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 rounded-full bg-gray-200" />
              </View>
              <View className="px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-black text-gray-900">Sort By</Text>
              </View>
              <View className="py-2">
                {SORT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => { setSort(opt.value); setSortModalOpen(false); }}
                    className="flex-row items-center justify-between px-5 py-3.5"
                  >
                    <Text
                      className={`text-base ${
                        sort === opt.value ? 'font-black text-green-700' : 'font-medium text-gray-900'
                      }`}
                    >
                      {opt.label}
                    </Text>
                    {sort === opt.value && <Check size={18} color="#16a34a" />}
                  </Pressable>
                ))}
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <Pressable className="flex-1 bg-black/55 justify-end" onPress={() => setFilterModalOpen(false)}>
          <Pressable className="bg-white rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
            <SafeAreaView edges={['bottom']}>
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 rounded-full bg-gray-200" />
              </View>
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-black text-gray-900">Filters</Text>
                <Pressable
                  onPress={() => setFilterModalOpen(false)}
                  className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
                >
                  <X size={16} color="#374151" />
                </Pressable>
              </View>

              <View className="p-5 gap-5">
                <View>
                  <Text className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">
                    Price Range
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-1 relative">
                      <Text className="absolute left-3 top-3 text-sm font-bold text-gray-400 z-10">₦</Text>
                      <TextInput
                        value={filters.minPrice}
                        onChangeText={(v) => setFilters((f) => ({ ...f, minPrice: v.replace(/\D/g, '') }))}
                        keyboardType="numeric"
                        placeholder="Min"
                        placeholderTextColor="#9CA3AF"
                        className="border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-medium text-gray-900"
                      />
                    </View>
                    <Text className="text-gray-400 font-bold">to</Text>
                    <View className="flex-1 relative">
                      <Text className="absolute left-3 top-3 text-sm font-bold text-gray-400 z-10">₦</Text>
                      <TextInput
                        value={filters.maxPrice}
                        onChangeText={(v) => setFilters((f) => ({ ...f, maxPrice: v.replace(/\D/g, '') }))}
                        keyboardType="numeric"
                        placeholder="Max"
                        placeholderTextColor="#9CA3AF"
                        className="border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-medium text-gray-900"
                      />
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">
                    Search This Brand
                  </Text>
                  <TextInput
                    value={filters.keyword}
                    onChangeText={(v) => setFilters((f) => ({ ...f, keyword: v }))}
                    placeholder="Search products..."
                    placeholderTextColor="#9CA3AF"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900"
                  />
                </View>

                <View className="flex-row gap-2 mt-2">
                  <Pressable
                    onPress={() => { clearFilters(); setFilterModalOpen(false); }}
                    className="flex-1 border border-gray-200 rounded-xl py-3.5 items-center"
                  >
                    <Text className="text-sm font-bold text-gray-700">Reset</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setFilterModalOpen(false)}
                    className="flex-1 bg-green-600 rounded-xl py-3.5 items-center"
                  >
                    <Text className="text-sm font-bold text-white">Apply</Text>
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}