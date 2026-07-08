import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ShoppingCart, Heart } from 'lucide-react-native';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

const Badge = ({ count, color }) => {
  if (!count) return null;
  return (
    <View
      className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white items-center justify-center"
      style={{ backgroundColor: color }}
    >
      <Text className="text-white text-[8px] font-black">{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

// showCartTotal → the pill with the ₦ total (used in the Home header).
// Omit it for compact screens (product, category, search) where space is tight.
const HeaderActions = ({ showCartTotal = false }) => {
  const { cartCount, cartTotal } = useCart();
  const { wishlistCount } = useWishlist();

  return (
    <View className="flex-row items-center gap-2">
      {/* Saved */}
      <Pressable onPress={() => router.push('/wishlist')} accessibilityLabel="Saved" className="p-2">
        <View>
          <Heart size={22} color="#374151" />
          <Badge count={wishlistCount} color="#ef4444" />
        </View>
      </Pressable>

      {/* Cart */}
      {showCartTotal ? (
        <Pressable
          onPress={() => router.push('/cart')}
          className="flex-row items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-full"
        >
          <View>
            <ShoppingCart size={18} color="#374151" />
            <Badge count={cartCount} color="#16a34a" />
          </View>
          <Text className="text-xs font-bold text-gray-700">
            ₦{cartTotal ? cartTotal.toLocaleString() : '0'}
          </Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push('/cart')} accessibilityLabel="Cart" className="p-2">
          <View>
            <ShoppingCart size={22} color="#374151" />
            <Badge count={cartCount} color="#16a34a" />
          </View>
        </Pressable>
      )}
    </View>
  );
};

export default HeaderActions;