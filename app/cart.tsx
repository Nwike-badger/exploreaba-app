import { View, Text, Pressable, ScrollView, Image as RNImage, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Trash2, Minus, Plus, ShoppingBag, ArrowRight, ShieldCheck, ChevronLeft,
} from 'lucide-react-native';
import { useCart } from '@/context/CartContext';

const getAttributes = (item) => item.attributes || item.variantAttributes || {};

export default function CartScreen() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const hasItems = cartItems && cartItems.length > 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between px-2 h-14 border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-base font-black text-gray-900 tracking-tight">
            Shopping Bag {hasItems && (
              <Text className="text-gray-400 font-medium">({cartItems.length})</Text>
            )}
          </Text>
          {hasItems ? (
            <Pressable onPress={clearCart} className="px-3 h-10 items-center justify-center">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Empty
              </Text>
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
        </View>
      </SafeAreaView>

      {!hasItems ? (
        /* EMPTY STATE */
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 bg-white border border-gray-100 rounded-full items-center justify-center mb-6">
            <ShoppingBag size={40} color="#D1D5DB" />
          </View>
          <Text className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
            Your bag is empty
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-8 max-w-[280px]">
            Looks like you haven't added anything to your cart yet. Discover our latest arrivals.
          </Text>
          <Pressable
            onPress={() => router.replace('/')}
            className="bg-gray-900 px-8 py-4 rounded-xl flex-row items-center gap-2"
          >
            <Text className="text-white font-bold uppercase tracking-widest text-xs">
              Start Shopping
            </Text>
            <ArrowRight size={16} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <>
          {/* ITEM LIST */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 12, paddingBottom: 24, gap: 12 }}
          >
            {cartItems.map((item, index) => {
              const attrs = getAttributes(item);
              const attrEntries = Object.entries(attrs);

              return (
                <View
                  key={`${item.variantId}-${index}`}
                  className="bg-white rounded-2xl border border-gray-100 p-3 flex-row gap-3"
                >
                  {/* Image */}
                  <Pressable
                    onPress={() => router.push(`/product/${item.productId}`)}
                    className="w-24 h-28 bg-gray-50 rounded-xl overflow-hidden"
                  >
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <ShoppingBag size={24} color="#D1D5DB" />
                      </View>
                    )}
                  </Pressable>

                  {/* Details */}
                  <View className="flex-1 justify-between">
                    {/* Top: brand, name, attrs, delete */}
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <Text
                          className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1"
                          numberOfLines={1}
                        >
                          {item.brandName || 'Exclusive'}
                        </Text>
                        <Pressable
                          onPress={() => router.push(`/product/${item.productId}`)}
                        >
                          <Text
                            className="text-sm font-bold text-gray-900 leading-tight"
                            numberOfLines={2}
                          >
                            {item.productName}
                          </Text>
                        </Pressable>
                        {attrEntries.length > 0 && (
                          <View className="flex-row flex-wrap gap-1 mt-1.5">
                            {attrEntries.map(([key, value]) => (
                              <View
                                key={key}
                                className="bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded"
                              >
                                <Text className="text-[10px] font-medium text-gray-600">
                                  <Text className="text-gray-400">{key}: </Text>
                                  {value}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>

                      <Pressable
                        onPress={() => removeFromCart(item.variantId)}
                        accessibilityLabel="Remove item"
                        className="w-8 h-8 items-center justify-center rounded-lg"
                      >
                        <Trash2 size={16} color="#D1D5DB" />
                      </Pressable>
                    </View>

                    {/* Bottom: qty + price */}
                    <View className="flex-row items-end justify-between mt-2">
                      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                        <Pressable
                          onPress={() =>
                            updateQuantity?.(item.variantId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 items-center justify-center bg-white rounded-md"
                        >
                          <Minus size={12} color={item.quantity <= 1 ? '#D1D5DB' : '#374151'} />
                        </Pressable>
                        <Text className="w-8 text-center text-sm font-bold text-gray-900 tabular-nums">
                          {item.quantity}
                        </Text>
                        <Pressable
                          onPress={() =>
                            updateQuantity?.(item.variantId, item.quantity + 1)
                          }
                          className="w-7 h-7 items-center justify-center bg-white rounded-md"
                        >
                          <Plus size={12} color="#374151" />
                        </Pressable>
                      </View>

                      <View className="items-end">
                        {item.quantity > 1 && (
                          <Text className="text-[10px] text-gray-400 mb-0.5">
                            ₦{(item.unitPrice || 0).toLocaleString()} each
                          </Text>
                        )}
                        <Text className="text-base font-black text-gray-900">
                          ₦
                          {(
                            item.subTotal ||
                            (item.unitPrice * item.quantity) ||
                            0
                          ).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* STICKY BOTTOM SUMMARY */}
          <SafeAreaView edges={['bottom']} className="bg-white border-t border-gray-200">
            <View className="px-4 pt-4 pb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-gray-500">
                  Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </Text>
                <Text className="text-sm font-bold text-gray-700">
                  ₦{cartTotal.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs text-gray-500">Shipping</Text>
                <Text className="text-[10px] font-medium text-gray-400">
                  Calculated at checkout
                </Text>
              </View>

              <View className="flex-row items-end justify-between mb-3 border-t border-gray-100 pt-3">
                <Text className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                  Total
                </Text>
                <Text className="text-2xl font-black text-gray-900 tracking-tight">
                  ₦{cartTotal.toLocaleString()}
                </Text>
              </View>

              <Pressable
                onPress={() => router.push('/checkout')}
                className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center gap-2"
              >
                <Text className="text-white font-black text-xs uppercase tracking-widest">
                  Checkout Securely
                </Text>
                <ArrowRight size={14} color="#fff" />
              </Pressable>

              <View className="flex-row items-center justify-center gap-1.5 mt-2">
                <ShieldCheck size={12} color="#16a34a" />
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  100% Secure Checkout
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}