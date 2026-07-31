import { ScrollView, View, Text, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, Zap, AlertCircle, RefreshCw, WifiOff } from 'lucide-react-native';
import HomeHeader from '@/components/HomeHeader';
import CategoryBar from '@/components/Categorybar';
import ProductGrid from '@/components/product/ProductGrid';
import ProductSection from '@/components/product/ProductSection';
import useProducts from '@/hooks/useProducts';
import { heroUrl, mediumUrl } from '@/utils/imageUtils';

// Hero image URLs
const BESPOKE_HERO_IMG =
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400&q=85&auto=format&fit=crop';
const CLOTHES_IMG =
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=85&auto=format&fit=crop';
const SHOES_IMG =
  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=85&auto=format&fit=crop';

const HeroCard = ({ uri, title, badge, ctaText, onPress, large }) => (
  <Pressable
    onPress={onPress}
    className={`relative overflow-hidden rounded-2xl bg-gray-900 ${
      large ? 'h-64' : 'flex-1 h-32'
    }`}
  >
    <Image
      source={{ uri }}
      style={{ width: '100%', height: '100%', opacity: 0.85 }}
      contentFit="cover"
      priority="high"
    />
    {/* Dark bottom gradient for text legibility */}
    <LinearGradient
      colors={['transparent', 'rgba(17,24,39,0.2)', 'rgba(17,24,39,0.9)']}
      style={{ position: 'absolute', inset: 0 }}
    />
    <View className={`absolute bottom-0 left-0 ${large ? 'p-5' : 'p-3'}`}>
      {badge && (
        <View className="flex-row items-center gap-1 bg-white px-2.5 py-1 rounded-full mb-2 self-start">
          <Zap size={10} color="#16a34a" />
          <Text className="text-[9px] font-black text-gray-900 uppercase tracking-widest">
            {badge}
          </Text>
        </View>
      )}
      <Text
        className={`font-black text-white tracking-tight leading-tight ${
          large ? 'text-3xl mb-3' : 'text-base mb-1'
        }`}
      >
        {title}
      </Text>
      <View className="flex-row items-center gap-1.5">
        <Text className="text-[10px] font-bold text-white uppercase tracking-widest">
          {ctaText}
        </Text>
        <ArrowRight size={12} color="#fff" />
      </View>
    </View>
  </Pressable>
);

export default function HomeScreen() {
  const {
    products, loading, error, refetch,
    isOffline, isStale, refreshing, onPullToRefresh,
  } = useProducts(0, 10);
  
  const safeProducts = Array.isArray(products) ? products : products?.content ?? [];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      <HomeHeader />

      {isOffline && (
        <View className="bg-gray-900 py-2 px-4 flex-row items-center justify-center gap-2">
          <WifiOff size={14} color="#fff" />
          <Text className="text-white text-xs font-bold">
            You're offline{isStale ? ' — showing saved products' : ''}
          </Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullToRefresh}
            tintColor="#16a34a"
            colors={['#16a34a']}
          />
        }
      >
        {/* HERO BENTO */}
        <View className="px-3 pt-3 gap-3">
          <HeroCard
            uri={heroUrl(BESPOKE_HERO_IMG)}
            badge="Custom Made"
            title={'Crafted in Aba,\nWorn Globally.'}
            ctaText="Custom"
            onPress={() => router.push('/custom')}
            large
          />
          <View className="flex-row gap-3">
            <HeroCard
              uri={mediumUrl(CLOTHES_IMG)}
              title="Clothes"
              ctaText="Explore"
              onPress={() => router.push('/category/clothes')}
            />
            <HeroCard
              uri={mediumUrl(SHOES_IMG)}
              title="Shoes"
              ctaText="Explore"
              onPress={() => router.push('/category/shoes')}
            />
          </View>
        </View>

        {/* CATEGORY BAR */}
        <View className="mt-4">
          <CategoryBar />
        </View>

        {/* TRENDING PRODUCTS */}
        <View className="px-3 mt-6">
          {loading ? (
            <View className="bg-white rounded-2xl border border-gray-100 py-12 items-center">
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          ) : error && safeProducts.length === 0 ? (
            <View className="bg-white rounded-2xl border border-gray-100 py-12 items-center">
              <View className="w-12 h-12 bg-red-50 rounded-full items-center justify-center mb-4">
                <AlertCircle size={24} color="#ef4444" />
              </View>
              <Text className="text-base font-black text-gray-900 mb-3">
                {isOffline ? "You're offline" : 'Something went wrong'}
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="bg-gray-900 px-5 py-2.5 rounded-xl flex-row items-center gap-2"
              >
                <RefreshCw size={14} color="#fff" />
                <Text className="text-white font-bold text-xs">Try Again</Text>
              </Pressable>
            </View>
          ) : safeProducts.length > 0 ? (
            <View className="bg-white p-3 rounded-2xl border border-gray-100">
              <ProductSection title="Trending Now">
                <ProductGrid products={safeProducts} priorityCount={4} />
              </ProductSection>
              <Pressable
                onPress={() => router.push('/products')}
                className="mt-4 mx-auto border-2 border-gray-900 px-6 py-3 rounded-xl flex-row items-center gap-2 self-center"
              >
                <Text className="text-gray-900 font-black uppercase tracking-widest text-xs">
                  View All
                </Text>
                <ArrowRight size={14} color="#111" />
              </Pressable>
            </View>
          ) : (
            <View className="bg-white rounded-2xl border border-gray-100 py-12 items-center">
              <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                No products found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}