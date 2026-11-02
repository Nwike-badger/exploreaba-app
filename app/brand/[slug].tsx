import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, AlertCircle, RefreshCw, Package } from 'lucide-react-native';
import api from '@/services/axiosConfig';
import ProductCard from '@/components/product/ProductCard';

const PAGE_SIZE = 20;

export default function BrandScreen() {
  const { slug } = useLocalSearchParams();

  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (pageNum, mode = 'initial') => {
    if (!slug) return;
    if (mode === 'append') setLoadingMore(true);
    else if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);

    const fetchBrandMeta = mode === 'initial' || mode === 'refresh';

    const [brandResult, productsResult] = await Promise.allSettled([
      fetchBrandMeta ? api.get(`/brands/${slug}`) : Promise.resolve(null),
      api.get(`/products/brand/${slug}?page=${pageNum}&size=${PAGE_SIZE}`),
    ]);

    // A metadata hiccup shouldn't block the product grid below — if products
    // loaded fine, we just fall back to a generic "Brand" header instead of
    // failing the whole screen over something secondary.
    if (fetchBrandMeta && brandResult.status === 'fulfilled' && brandResult.value) {
      setBrand(brandResult.value.data);
    }

    if (productsResult.status === 'fulfilled') {
      const d = productsResult.value.data;
      const items = d.content || [];
      const last = d.last ?? (items.length < PAGE_SIZE);
      setProducts((prev) => (mode === 'append' ? [...prev, ...items] : items));
      setHasMore(!last);
      setPage(pageNum);
    } else {
      console.error(productsResult.reason);
      setError(productsResult.reason?.message || "Failed to load this brand's products");
    }

    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, [slug]);

  useEffect(() => { fetchPage(0); }, [fetchPage]);

  const onLoadMore = () => {
    if (!loadingMore && hasMore && !loading) fetchPage(page + 1, 'append');
  };
  const onRefresh = () => fetchPage(0, 'refresh');

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between px-2 h-14 border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-base font-black text-gray-900 tracking-tight" numberOfLines={1}>
            {brand?.name || 'Brand'}
          </Text>
          <View className="w-10" />
        </View>

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

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
            <AlertCircle size={28} color="#ef4444" />
          </View>
          <Text className="text-lg font-black text-gray-900 mb-4">Couldn't load this brand</Text>
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
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 32 }}
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
              <View className="py-6 items-center">
                <ActivityIndicator color="#16a34a" />
              </View>
            ) : !hasMore && products.length > 0 ? (
              <View className="py-6 items-center">
                <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  You've reached the end
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center py-20">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Package size={28} color="#9CA3AF" />
              </View>
              <Text className="text-sm font-bold text-gray-500">
                No products from this brand yet
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}