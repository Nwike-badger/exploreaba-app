import { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import useProduct from '@/hooks/useProduct';
import { useCart } from '@/context/CartContext';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import TrustInfo from '@/components/product/TrustInfo';
import StickyAddToCart from '@/components/product/StickyAddToCart';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, loading, error } = useProduct(id);
  const { addToCart } = useCart();

  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [cartState, setCartState] = useState('idle');

  // ─── Derived variant data (same logic as web) ─────────────────────────
  const activeVariants = useMemo(
    () => (product?.variants || []).filter((v) => v.active !== false),
    [product]
  );

  const hasRealVariants = useMemo(
    () =>
      activeVariants.some(
        (v) => v.attributes && Object.keys(v.attributes).length > 0
      ),
    [activeVariants]
  );

  const availableAttributes = useMemo(() => {
    if (!hasRealVariants) return {};
    const attrs = {};
    activeVariants.forEach((v) => {
      if (!v.attributes) return;
      Object.entries(v.attributes).forEach(([k, val]) => {
        if (!attrs[k]) attrs[k] = new Set();
        attrs[k].add(val);
      });
    });
    return Object.fromEntries(
      Object.entries(attrs).map(([k, s]) => [k, Array.from(s)])
    );
  }, [activeVariants, hasRealVariants]);

  const activeVariant = useMemo(() => {
    if (!hasRealVariants) return activeVariants[0] || null;
    if (!Object.keys(selectedOptions).length) return null;
    return (
      activeVariants.find((v) =>
        Object.entries(selectedOptions).every(
          ([k, val]) => v.attributes?.[k] === val
        )
      ) || null
    );
  }, [selectedOptions, activeVariants, hasRealVariants]);

  const getOptionMeta = useCallback(
    (attrName) => {
      const others = Object.fromEntries(
        Object.entries(selectedOptions).filter(([k]) => k !== attrName)
      );
      const hasOthers = !!Object.keys(others).length;
      return (availableAttributes[attrName] || []).reduce((acc, opt) => {
        const test = { ...others, [attrName]: opt };
        const match = activeVariants.find((v) =>
          Object.entries(test).every(([k, val]) => v.attributes?.[k] === val)
        );
        acc[opt] = { available: !hasOthers || !!match };
        return acc;
      }, {});
    },
    [selectedOptions, availableAttributes, activeVariants]
  );

  // Auto-select first in-stock variant when product loads
  useEffect(() => {
    if (hasRealVariants && !Object.keys(selectedOptions).length) {
      const best =
        activeVariants.find((v) => v.stockQuantity > 0) || activeVariants[0];
      if (best?.attributes) setSelectedOptions(best.attributes);
    }
  }, [hasRealVariants, activeVariants]);

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedOptions]);

  // ─── Display values ──────────────────────────────────────────────────
  const displayPrice =
    activeVariant?.price ??
    (product?.minPrice || product?.price || product?.basePrice || 0);
  const displayComparePrice =
    activeVariant?.compareAtPrice ?? product?.compareAtPrice;
  const currentStock = activeVariant
    ? activeVariant.stockQuantity || 0
    : product?.totalStock || product?.stockQuantity || 0;
  const onSale = !!(
    activeVariant?.activeCampaignId || product?.activeCampaignId
  );
  const discountPct =
    displayComparePrice > displayPrice
      ? Math.round(
          ((displayComparePrice - displayPrice) / displayComparePrice) * 100
        )
      : 0;

  const isOutOfStock = currentStock === 0;
  const canAddToCart =
    !isOutOfStock && (hasRealVariants ? activeVariant !== null : true);

  // ─── Add to cart handler ─────────────────────────────────────────────
  const handleAddToCart = useCallback(async () => {
    const variantId = activeVariant?.id || product?.id;
    if (!variantId) return;
    setCartState('loading');
    const ok = await addToCart(
      variantId,
      quantity,
      activeVariant?.attributes || {}
    );
    if (ok) {
      setCartState('success');
      setTimeout(() => setCartState('idle'), 2500);
    } else {
      setCartState('error');
      setTimeout(() => setCartState('idle'), 2000);
    }
  }, [activeVariant, product, quantity, addToCart]);

  // ─── Loading / error states ─────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-5">
        <Text className="text-4xl mb-4">📦</Text>
        <Text className="text-xl font-black text-gray-900 mb-2">
          Product not found
        </Text>
        <Text className="text-sm text-gray-500 mb-6 text-center">
          This product may have been removed or doesn't exist.
        </Text>
        <Pressable
          onPress={() => router.replace('/')}
          className="bg-gray-900 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Back to Store</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ─── Prepared data ──────────────────────────────────────────────────
  const galleryImages = (product.images || [])
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean);

  const seller = {
    name: product.brandName || 'Official Store',
    rating: product.averageRating?.toFixed(1) || '4.8',
    years: 3,
    successRate: '98%',
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="bg-white">
        {/* Header */}
        <View className="flex-row items-center px-3 h-12 border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="flex-1 text-sm font-bold text-gray-700" numberOfLines={1}>
            {product.name}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <ProductGallery images={galleryImages} />

        <ProductInfo
          product={product}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          activeVariant={activeVariant}
          availableAttributes={availableAttributes}
          hasRealVariants={hasRealVariants}
          getOptionMeta={getOptionMeta}
          currentStock={currentStock}
          displayPrice={displayPrice}
          displayComparePrice={displayComparePrice}
          discountPct={discountPct}
          onSale={onSale}
        />

        <TrustInfo seller={seller} />
      </ScrollView>

      <StickyAddToCart
        price={displayPrice}
        quantity={quantity}
        setQuantity={setQuantity}
        currentStock={currentStock}
        isOutOfStock={isOutOfStock}
        canAddToCart={canAddToCart}
        cartState={cartState}
        onAddToCart={handleAddToCart}
      />
    </View>
  );
}