import { useState } from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react-native';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistScreen() {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const [removingId, setRemovingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearWishlist();
    } finally {
      setClearing(false);
    }
  };

  const hasItems = wishlistItems?.length > 0;

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between px-5 h-14 border-b border-gray-100">
          <Text className="text-lg font-black text-gray-900 tracking-tight">
            Saved Items
            {hasItems && (
              <Text className="text-gray-400 font-medium"> ({wishlistItems.length})</Text>
            )}
          </Text>
          {hasItems && (
            <Pressable
              onPress={handleClearAll}
              disabled={clearing}
              className="flex-row items-center gap-1.5 px-2 py-1"
            >
              {clearing ? (
                <ActivityIndicator size="small" color="#9CA3AF" />
              ) : (
                <>
                  <Trash2 size={12} color="#9CA3AF" />
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Clear All
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {!hasItems ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6 border border-red-100">
            <Heart size={36} color="#fca5a5" fill="#fecaca" />
          </View>
          <Text className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
            Nothing saved yet
          </Text>
          <Text className="text-sm text-gray-500 text-center max-w-[280px] mb-8">
            Tap the heart icon on any product to save it for later.
          </Text>
          <Pressable
            onPress={() => router.push('/products')}
            className="bg-gray-900 px-8 py-4 rounded-xl flex-row items-center gap-2"
          >
            <Text className="text-white font-bold text-xs uppercase tracking-widest">
              Explore Products
            </Text>
            <ArrowRight size={14} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={(item) => item.productId}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
          contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <WishlistCard
                item={item}
                onRemove={() => handleRemove(item.productId)}
                isRemoving={removingId === item.productId}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

function WishlistCard({ item, onRemove, isRemoving }) {
  return (
    <Pressable
      onPress={() => router.push(`/product/${item.productId}`)}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
    >
      {/* Image */}
      <View className="aspect-[4/5] bg-gray-50 relative">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <ShoppingBag size={24} color="#D1D5DB" />
          </View>
        )}

        {/* Remove button */}
        <Pressable
          onPress={onRemove}
          disabled={isRemoving}
          accessibilityLabel="Remove from wishlist"
          hitSlop={8}
          className="absolute top-2 right-2 w-8 h-8 bg-white/95 rounded-full items-center justify-center"
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color="#9CA3AF" />
          ) : (
            <Trash2 size={14} color="#9CA3AF" />
          )}
        </Pressable>
      </View>

      {/* Details */}
      <View className="p-3">
        <Text
          className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1"
          numberOfLines={1}
        >
          {item.brandName || 'Exclusive'}
        </Text>
        <Text
          className="text-xs font-bold text-gray-900 leading-snug mb-2"
          numberOfLines={2}
        >
          {item.productName}
        </Text>

        <View className="flex-row items-baseline gap-1.5 flex-wrap mb-3">
          <Text className="text-sm font-black text-gray-900">
            ₦{(item.currentPrice || 0).toLocaleString()}
          </Text>
          {item.compareAtPrice && item.compareAtPrice > item.currentPrice && (
            <Text className="text-[10px] text-gray-400 line-through font-medium">
              ₦{item.compareAtPrice.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Visual CTA — whole card is already pressable, this is just a hint */}
        <View className="border border-gray-200 rounded-xl py-2 flex-row items-center justify-center gap-1.5">
          <ShoppingBag size={12} color="#374151" />
          <Text className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
            View Options
          </Text>
        </View>
      </View>
    </Pressable>
  );
}