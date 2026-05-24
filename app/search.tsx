import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, SearchX, Search, AlertCircle, RefreshCw } from 'lucide-react-native';
import api from '@/services/axiosConfig';
import ProductCard from '@/components/product/ProductCard';

const PAGE_SIZE = 20;

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  // `q` may come in as a string or array; normalize
  const query = Array.isArray(params.q) ? params.q[0] : params.q || '';

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(
    async (pageNum, mode = 'initial') => {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }

      if (mode === 'append') setLoadingMore(true);
      else if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        // Smart search endpoint — adjust path if your backend uses something different.
        // Web's useSmartSearch likely hits this or a similar endpoint.
        // Replace this line in fetchPage:
const res = await api.get(
  `/v1/search?q=${encodeURIComponent(query)}&page=${pageNum}&size=${PAGE_SIZE}`
);
        const d = res.data;
        const items = d.content || d.products || d.results || [];
        const last = d.last ?? (items.length < PAGE_SIZE);
        const total = d.totalElements ?? d.total ?? items.length;

        setProducts((prev) => (mode === 'append' ? [...prev, ...items] : items));
        setHasMore(!last);
        setTotalElements(total);
        setPage(pageNum);
      } catch (e) {
        setError(e.message || 'Search failed');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [query]
  );

  // Refetch whenever the query changes
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
          <View className="items-center flex-1">
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Search Results
            </Text>
            <Text className="text-base font-black text-gray-900 tracking-tight" numberOfLines={1}>
              "{query}"
            </Text>
          </View>
          <View className="w-10" />
        </View>
        {!loading && !error && products.length > 0 && (
          <View className="px-4 py-2 border-b border-gray-100">
            <Text className="text-xs text-gray-500">
              <Text className="font-bold text-gray-900">{totalElements.toLocaleString()}</Text>
              {' '}{totalElements === 1 ? 'result' : 'results'}
            </Text>
          </View>
        )}
      </SafeAreaView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-3">
            Searching...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
            <AlertCircle size={28} color="#ef4444" />
          </View>
          <Text className="text-lg font-black text-gray-900 mb-4">Search failed</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center"><ActivityIndicator color="#2563eb" /></View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 px-4">
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-5 border border-gray-100">
                <SearchX size={36} color="#9CA3AF" />
              </View>
              <Text className="text-xl font-black text-gray-900 mb-2">No results</Text>
              <Text className="text-sm text-gray-500 text-center mb-6">
                We couldn't find anything matching{' '}
                <Text className="font-bold text-gray-900">"{query}"</Text>.
                {'\n'}Try a more general keyword.
              </Text>
              <Pressable
                onPress={() => router.replace('/products')}
                className="bg-gray-900 px-6 py-3 rounded-xl flex-row items-center gap-2"
              >
                <Search size={16} color="#fff" />
                <Text className="text-white text-sm font-bold">Browse all products</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}