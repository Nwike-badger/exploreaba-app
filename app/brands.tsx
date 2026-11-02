import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, AlertCircle, RefreshCw, Tag } from 'lucide-react-native';
import api from '@/services/axiosConfig';

const BRAND_COLORS = ['#16a34a', '#0891b2', '#7c3aed', '#dc2626', '#ea580c', '#0284c7'];
const colorForBrand = (name) => {
  const code = name ? name.charCodeAt(0) : 0;
  return BRAND_COLORS[code % BRAND_COLORS.length];
};

const BrandCard = ({ brand, onPress }) => (
  <Pressable
    onPress={onPress}
    className="w-[30%] bg-white border border-gray-100 rounded-2xl p-4 items-center gap-2"
  >
    {brand.logoUrl ? (
      <View className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50">
        <Image source={{ uri: brand.logoUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
      </View>
    ) : (
      <View
        className="w-14 h-14 rounded-xl items-center justify-center"
        style={{ backgroundColor: colorForBrand(brand.name) }}
      >
        <Text className="text-white font-black text-xl">
          {brand.name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
    )}
    <Text className="text-sm font-bold text-gray-900 text-center" numberOfLines={1}>
      {brand.name}
    </Text>
  </Pressable>
);

export default function BrandsScreen() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBrands = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get('/brands');
      setBrands(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message || 'Failed to load brands');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between px-2 h-14 border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-base font-black text-gray-900 tracking-tight">Brands</Text>
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
          <Text className="text-lg font-black text-gray-900 mb-4">Couldn't load brands</Text>
          <Pressable
            onPress={() => fetchBrands()}
            className="bg-gray-900 px-5 py-2.5 rounded-xl flex-row items-center gap-2"
          >
            <RefreshCw size={14} color="#fff" />
            <Text className="text-white text-sm font-bold">Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={brands}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={{ gap: 10 }}
          contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <BrandCard brand={item} onPress={() => router.push(`/brand/${item.slug}`)} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchBrands('refresh')} tintColor="#16a34a" />
          }
          ListEmptyComponent={
            <View className="items-center py-20">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Tag size={28} color="#9CA3AF" />
              </View>
              <Text className="text-sm font-bold text-gray-500">No brands yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}