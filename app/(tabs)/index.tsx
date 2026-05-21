import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeHeader from '@/components/HomeHeader';
import CategoryBar from '@/components/Categorybar';
import ProductGrid from '@/components/product/ProductGrid';
import ProductSection from '@/components/product/ProductSection';

const mockProducts = [
  {
    id: '1',
    name: 'Premium Cotton Shirt',
    brandName: 'Aba Tailors',
    price: 25000,
    compareAtPrice: 35000,
    discount: 28,
    averageRating: 4.5,
    stockQuantity: 10,
    images: [{ url: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=400', isPrimary: true }],
  },
  {
    id: '2',
    name: 'Ankara Headwrap',
    brandName: 'Lagos Style',
    price: 8500,
    averageRating: 4.8,
    stockQuantity: 0,
    images: [{ url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400', isPrimary: true }],
  },
  {
    id: '3',
    name: 'Agbada Set',
    brandName: 'Royal Wear',
    price: 95000,
    averageRating: 4.9,
    stockQuantity: 5,
    images: [{ url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400', isPrimary: true }],
  },
  {
    id: '4',
    name: 'Iro and Buba',
    brandName: 'Iya Aba',
    price: 18000,
    averageRating: 4.3,
    stockQuantity: 3,
    images: [{ url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', isPrimary: true }],
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      <HomeHeader />
      <ScrollView className="flex-1">
        <CategoryBar />
        <View className="px-3 pt-3">
          <ProductSection title="Trending Now">
            <ProductGrid products={mockProducts} />
          </ProductSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}