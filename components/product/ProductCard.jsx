import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { ShoppingCart, Star, Heart } from 'lucide-react-native';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { toast } from '@/utils/toast';
import api from '@/services/axiosConfig';
import { thumbUrl } from '@/utils/imageUtils';

const FALLBACK = 'https://placehold.co/400x533?text=No+Image';

const getDisplayImages = (product) => {
  if (!product.images || product.images.length === 0) {
    return { primary: FALLBACK };
  }
  const primaryImg = product.images.find((img) => img.isPrimary) || product.images[0];
  return { primary: thumbUrl(primaryImg.url) };
};

const ProductCard = ({ product, isFlashSale, priority = false }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [isAdding, setIsAdding] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isWishLoading, setIsWishLoading] = useState(false);

  const productId = product.id;
  const price = product.price || product.minPrice || product.basePrice || 0;
  const stock = product.stockQuantity !== undefined
    ? product.stockQuantity
    : (product.totalStock || 0);
  const isSoldOut = stock <= 0;
  const isWished = isInWishlist(productId);

  // Quick-add — no preventDefault needed; nested Pressables don't bubble in RN
  const handleCartAction = async () => {
    if (isSoldOut) {
      toast.error('This item is currently sold out.');
      return;
    }
    setIsAdding(true);
    try {
      const response = await api.get(`/products/${productId}`);
      const fullProduct = response.data.product || response.data;
      const hasOptions = fullProduct.variantOptions?.length > 0;
      const hasMulti = fullProduct.variants?.length > 1;

      if (hasOptions || hasMulti) {
        router.push(`/product/${productId}`);
        return;
      }

      const targetVariantId = fullProduct.variants?.length === 1
        ? fullProduct.variants[0].id
        : productId;

      await addToCart(targetVariantId, 1);
    } catch {
      router.push(`/product/${productId}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleWish = async () => {
    if (isWishLoading) return;
    setIsWishLoading(true);
    await toggleWishlist(productId);
    setIsWishLoading(false);
  };

  const { primary } = getDisplayImages(product);

  return (
    <Link href={`/product/${productId}`} asChild>
      <Pressable className="flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100">
        {/* IMAGE */}
        <View className="relative bg-gray-100 aspect-[3/4]">
          <Image
            source={{ uri: imgError ? FALLBACK : primary }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
            priority={priority ? 'high' : 'low'}
            onError={() => setImgError(true)}
          />

          {/* Sold-out wash */}
          {isSoldOut && (
            <View className="absolute inset-0 bg-white/50" pointerEvents="none" />
          )}

          {/* WISHLIST PILL */}
          <Pressable
            onPress={handleWish}
            disabled={isWishLoading}
            accessibilityLabel={isWished ? 'Remove from wishlist' : 'Save to wishlist'}
            className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-full items-center justify-center
              ${isWished ? 'bg-red-500' : 'bg-white/90 border border-white/50'}
              ${isWishLoading ? 'opacity-70' : ''}`}
          >
            {isWishLoading ? (
              <ActivityIndicator size="small" color={isWished ? '#fff' : '#9CA3AF'} />
            ) : (
              <Heart
                size={14}
                color={isWished ? '#fff' : '#6B7280'}
                fill={isWished ? '#fff' : 'transparent'}
              />
            )}
          </Pressable>

          {/* BADGES */}
          <View className="absolute top-2 left-2 z-20 gap-1">
            {isSoldOut ? (
              <View className="bg-gray-900 px-2 py-0.5 rounded">
                <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                  Sold Out
                </Text>
              </View>
            ) : (
              <>
                {product.discount > 0 && (
                  <View className="bg-red-500 px-2 py-0.5 rounded">
                    <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                      -{product.discount}%
                    </Text>
                  </View>
                )}
                {isFlashSale && (
                  <View className="bg-blue-600 px-2 py-0.5 rounded">
                    <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                      ⚡ Flash
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* QUICK-ADD FAB (always visible on mobile — no hover) */}
          {!isSoldOut && (
            <Pressable
              onPress={handleCartAction}
              disabled={isAdding}
              accessibilityLabel="Add to cart"
              className={`absolute bottom-2 right-2 z-20 w-9 h-9 bg-white rounded-full
                          border border-gray-100 items-center justify-center
                          ${isAdding ? 'opacity-60' : ''}`}
              style={({ pressed }) => pressed && { transform: [{ scale: 0.92 }] }}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <ShoppingCart size={15} color="#374151" />
              )}
            </Pressable>
          )}
        </View>

        {/* TEXT INFO */}
        <View className="flex-1 p-2">
          <Text
            className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5"
            numberOfLines={1}
          >
            {product.brandName || product.categoryName || 'Premium'}
          </Text>

          <Text
            className="text-gray-900 font-semibold text-xs leading-snug mb-1.5"
            numberOfLines={2}
          >
            {product.name}
          </Text>

          <View className="mt-auto flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <Text className="text-gray-900 font-black text-sm tracking-tight">
              ₦{price.toLocaleString()}
            </Text>
            {product.discount > 0 && product.compareAtPrice && (
              <Text className="text-[10px] font-medium text-gray-400 line-through">
                ₦{product.compareAtPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            )}
          </View>

          {product.averageRating > 0 && (
            <View className="flex-row items-center gap-0.5 mt-1">
              <Star size={10} color="#fb923c" fill="#fb923c" />
              <Text className="text-[10px] font-bold text-gray-500">
                {product.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Link>
  );
};

export default ProductCard;