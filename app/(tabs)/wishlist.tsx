import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistScreen() {
  const { wishlistCount } = useWishlist();
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Text className="text-lg font-bold text-gray-700">Wishlist</Text>
      <Text className="text-sm text-gray-400 mt-2">{wishlistCount} items saved</Text>
    </SafeAreaView>
  );
}