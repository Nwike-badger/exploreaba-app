import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Minus, Plus, ShoppingBag, CheckCircle } from 'lucide-react-native';

const StickyAddToCart = ({
  price,
  quantity,
  setQuantity,
  currentStock,
  isOutOfStock,
  canAddToCart,
  cartState,
  onAddToCart,
}) => {
  const insets = useSafeAreaInsets();

  const bg =
    isOutOfStock ? '#e5e7eb' :
    cartState === 'success' ? '#16a34a' :
    cartState === 'error' ? '#dc2626' :
    '#0b0b0b';

  const textColor = isOutOfStock ? '#9ca3af' : '#fff';

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200"
      style={{
        paddingTop: 10,
        paddingHorizontal: 14,
        paddingBottom: 10 + insets.bottom,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View className="flex-row items-center gap-2.5">
        {/* Qty stepper */}
        <View
          className={`flex-row items-center border-2 border-gray-200 rounded-xl overflow-hidden h-12
            ${!canAddToCart ? 'opacity-40' : ''}`}
        >
          <Pressable
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={!canAddToCart || quantity <= 1}
            className="w-10 h-full items-center justify-center"
          >
            <Minus size={14} color="#374151" />
          </Pressable>
          <View className="w-7 items-center">
            <Text className="font-black text-sm tabular-nums">{quantity}</Text>
          </View>
          <Pressable
            onPress={() => setQuantity((q) => Math.min(currentStock, q + 1))}
            disabled={!canAddToCart || quantity >= currentStock}
            className="w-10 h-full items-center justify-center"
          >
            <Plus size={14} color="#374151" />
          </Pressable>
        </View>

        {/* CTA */}
        <Pressable
          onPress={onAddToCart}
          disabled={!canAddToCart || cartState === 'loading'}
          className="flex-1 h-12 rounded-xl items-center justify-center flex-row gap-2"
          style={{ backgroundColor: bg }}
        >
          {cartState === 'loading' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : isOutOfStock ? (
            <Text className="font-bold uppercase tracking-widest text-xs" style={{ color: textColor }}>
              Out of Stock
            </Text>
          ) : cartState === 'success' ? (
            <>
              <CheckCircle size={16} color="#fff" />
              <Text className="font-bold uppercase tracking-widest text-xs text-white">
                Added!
              </Text>
            </>
          ) : cartState === 'error' ? (
            <Text className="font-bold uppercase tracking-widest text-xs text-white">
              Failed — retry
            </Text>
          ) : (
            <>
              <ShoppingBag size={16} color="#fff" />
              <Text className="font-bold uppercase tracking-widest text-xs text-white">
                Add · ₦{Number(price || 0).toLocaleString()}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default StickyAddToCart;