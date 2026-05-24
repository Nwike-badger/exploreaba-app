import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, AlertCircle, RefreshCw, Package } from 'lucide-react-native';
import api from '@/services/axiosConfig';
import ProductCard from '@/components/product/ProductCard';

const PAGE_SIZE = 20;

export default function CatalogScreen() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (pageNum, mode = 'initial') => {
    if (mode === 'append') setLoadingMore(true);
    else if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/products?page=${pageNum}&size=${PAGE_SIZE}`);
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
  }, []);

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
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <View className="items-center">
            <Text className="text-base font-black text-gray-900 tracking-tight">
              All Products
            </Text>
            {totalElements > 0 && (
              <Text className="text-[10px] text-gray-400 font-medium">
                {totalElements.toLocaleString()} items
              </Text>
            )}
          </View>
          <View className="w-10" />
        </View>
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
          <Text className="text-lg font-black text-gray-900 mb-4">
            Couldn't load catalog
          </Text>
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
                No products in the catalog yet
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}