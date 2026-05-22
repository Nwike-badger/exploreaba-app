import { ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeHeader from '@/components/HomeHeader';
import CategoryBar from '@/components/Categorybar';
import ProductGrid from '@/components/product/ProductGrid';
import ProductSection from '@/components/product/ProductSection';
import useProducts from '@/hooks/useProducts';
import { useTrending } from '@/hooks/useTrending';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';

const SectionPlaceholder = () => (
  <View className="py-8 items-center">
    <ActivityIndicator color="#16a34a" />
  </View>
);

export default function HomeScreen() {
  const { products: trending, loading: trendingLoading } = useTrending({ limit: 8 });
  const { products: forYou,    loading: forYouLoading   } = usePersonalizedFeed({ limit: 8 });
  const { products: latest,    loading: latestLoading   } = useProducts(0, 12);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      <HomeHeader />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <CategoryBar />

        {/* Trending */}
        <View className="px-3 pt-4">
          <ProductSection title="Trending Now">
            {trendingLoading
              ? <SectionPlaceholder />
              : trending.length > 0
                ? <ProductGrid products={trending} />
                : null}
          </ProductSection>
        </View>

        {/* Personalized */}
        {(forYouLoading || forYou.length > 0) && (
          <View className="px-3 pt-6">
            <ProductSection title="For You">
              {forYouLoading ? <SectionPlaceholder /> : <ProductGrid products={forYou} />}
            </ProductSection>
          </View>
        )}

        {/* Latest */}
        <View className="px-3 pt-6">
          <ProductSection title="Latest Arrivals">
            {latestLoading
              ? <SectionPlaceholder />
              : latest.length > 0
                ? <ProductGrid products={latest} />
                : null}
          </ProductSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}