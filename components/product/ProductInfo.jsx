import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Share,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Star,
  Heart,
  Share2,
  ChevronDown,
  Truck,
  RotateCcw,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { useWishlist } from '@/context/WishlistContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── Color resolution (simplified — no DOM lookup like the web version) ────
const COLOR_MAP = {
  black: '#0a0a0a', white: '#ffffff', red: '#ef4444', blue: '#3b82f6',
  green: '#22c55e', yellow: '#facc15', orange: '#f97316', purple: '#a855f7',
  pink: '#ec4899', brown: '#92400e', grey: '#9ca3af', gray: '#9ca3af',
  beige: '#d4b896', cream: '#fffdd0', ivory: '#fffff0', tan: '#d2b48c',
  navy: '#1e3a5f', maroon: '#800000', burgundy: '#800020', wine: '#722f37',
  coral: '#ff6b6b', teal: '#14b8a6', cyan: '#06b6d4', indigo: '#6366f1',
  gold: '#fbbf24', silver: '#94a3b8', 'off-white': '#faf9f6',
  charcoal: '#36454f', slate: '#708090', khaki: '#c3b091',
  emerald: '#50c878', turquoise: '#40e0d0', mocha: '#967969',
};

const resolveColor = (v) => COLOR_MAP[v?.toLowerCase().trim()] || '#e5e7eb';
const isColorAttr = (n) => /colou?r|shade|hue|tint|finish/i.test(n);

const isLight = (hex) => {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  return (
    (parseInt(c.slice(0, 2), 16) * 299 +
      parseInt(c.slice(2, 4), 16) * 587 +
      parseInt(c.slice(4, 6), 16) * 114) /
      1000 >
    180
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────

const Stars = ({ rating = 0, count = 0 }) => {
  const full = Math.floor(rating);
  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-row gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            color={i < full ? '#f59e0b' : '#ddd'}
            fill={i < full ? '#f59e0b' : 'transparent'}
          />
        ))}
      </View>
      {count > 0 && (
        <Text className="text-[11px] text-gray-500 font-medium">
          {rating.toFixed(1)} · {count.toLocaleString()} reviews
        </Text>
      )}
    </View>
  );
};

const ColorSwatch = ({ value, isSelected, isUnavailable, onPress }) => {
  const color = resolveColor(value);
  const lightBg = isLight(color);
  return (
    <Pressable
      onPress={onPress}
      disabled={isUnavailable}
      className={`w-10 h-10 rounded-full items-center justify-center
        ${lightBg ? 'border border-gray-300' : ''}
        ${isUnavailable ? 'opacity-30' : ''}
      `}
      style={{
        backgroundColor: color,
        transform: isSelected ? [{ scale: 1.15 }] : undefined,
        ...(isSelected && {
          borderWidth: 2.5,
          borderColor: '#0b0b0b',
        }),
      }}
    >
      {isSelected && !isUnavailable && (
        <CheckCircle size={14} color={lightBg ? '#111' : '#fff'} strokeWidth={2.5} />
      )}
    </Pressable>
  );
};

const VariantPill = ({ value, isSelected, isUnavailable, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={isUnavailable}
    className={`px-4 py-2 rounded-lg border
      ${isSelected
        ? 'bg-gray-900 border-gray-900'
        : isUnavailable
          ? 'bg-gray-50 border-gray-200 opacity-40'
          : 'bg-white border-gray-300'}`}
  >
    <Text
      className={`text-xs font-semibold tracking-wide
        ${isSelected ? 'text-white' : 'text-gray-700'}
        ${isUnavailable ? 'line-through' : ''}`}
    >
      {value}
    </Text>
  </Pressable>
);

const Accordion = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };
  return (
    <View className="border-t border-gray-200">
      <Pressable
        onPress={toggle}
        className="flex-row items-center justify-between py-4"
      >
        <Text className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
          {title}
        </Text>
        <ChevronDown
          size={14}
          color="#9CA3AF"
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open && <View className="pb-4">{children}</View>}
    </View>
  );
};

// ─── Main ────────────────────────────────────────────────────────────────

const ProductInfo = ({
  product,
  selectedOptions,
  setSelectedOptions,
  activeVariant,
  availableAttributes,
  hasRealVariants,
  getOptionMeta,
  currentStock,
  displayPrice,
  displayComparePrice,
  discountPct,
  onSale,
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWished = isInWishlist(product.id);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product.name} on ExploreAba`,
        title: product.name,
      });
    } catch {}
  };

  const stockStatus = useMemo(() => {
    if (currentStock === 0) return { label: 'Out of stock', color: '#dc2626', width: '0%', show: true };
    if (currentStock <= 3)  return { label: `Only ${currentStock} left`, color: '#dc2626', width: '8%', show: true };
    if (currentStock <= 10) return { label: `${currentStock} left`, color: '#d97706', width: `${(currentStock / 20) * 100}%`, show: true };
    if (currentStock <= 20) return { label: `${currentStock} available`, color: '#16a34a', width: `${(currentStock / 30) * 100}%`, show: true };
    return { label: 'In Stock', color: '#16a34a', width: '100%', show: false };
  }, [currentStock]);

  const handleOptionSelect = useCallback(
    (attrName, value) => {
      const next = { ...selectedOptions, [attrName]: value };
      // Same logic as web: try exact match first, fall back to nearest valid combo
      const variants = product.variants || [];
      const exact = variants.some((v) =>
        Object.entries(next).every(([k, val]) => v.attributes?.[k] === val)
      );
      if (exact) {
        setSelectedOptions(next);
      } else {
        const fb = variants.find((v) => v.attributes?.[attrName] === value);
        if (fb?.attributes) setSelectedOptions(fb.attributes);
      }
    },
    [selectedOptions, product.variants, setSelectedOptions]
  );

  return (
    <View className="px-5 pt-4">
      {/* ─── HEADER ─── */}
      <View className="mb-5">
        {product.brandName && (
          <Text className="text-[10px] font-black text-green-700 tracking-widest uppercase mb-2">
            {product.brandName}
          </Text>
        )}

        <View className="flex-row items-start gap-2">
          <Text className="font-serif text-2xl flex-1 text-gray-900 leading-tight">
            {product.name}
          </Text>

          <View className="flex-row gap-1.5 pt-1">
            <Pressable
              onPress={() => toggleWishlist(product.id)}
              accessibilityLabel="Save to wishlist"
              className={`w-9 h-9 rounded-full items-center justify-center border
                ${isWished ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
            >
              <Heart
                size={15}
                color={isWished ? '#ef4444' : '#aaa'}
                fill={isWished ? '#ef4444' : 'transparent'}
              />
            </Pressable>
            <Pressable
              onPress={handleShare}
              accessibilityLabel="Share"
              className="w-9 h-9 rounded-full items-center justify-center bg-gray-50 border border-gray-200"
            >
              <Share2 size={15} color="#aaa" />
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center gap-2.5 mt-3 flex-wrap">
          <Stars rating={product.averageRating || 0} count={product.reviewCount || 0} />
          {onSale && (
            <View className="bg-red-100 px-2.5 py-0.5 rounded-full">
              <Text className="text-[9px] font-black text-red-600 uppercase tracking-widest">
                Sale
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ─── PRICE ─── */}
      <View className="border-y border-gray-200 py-4 mb-5 flex-row items-end flex-wrap gap-2.5">
        <Text className="font-serif text-3xl text-gray-900 leading-none">
          ₦{Number(displayPrice || 0).toLocaleString()}
        </Text>
        {displayComparePrice > displayPrice && (
          <>
            <Text className="text-[15px] text-gray-400 line-through pb-0.5">
              ₦{Number(displayComparePrice).toLocaleString()}
            </Text>
            <View className="bg-gray-900 px-2.5 py-1 rounded-full pb-0.5">
              <Text className="text-white text-[10px] font-bold tracking-wide">
                {discountPct}% OFF
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ─── STOCK ─── */}
      {stockStatus.show && (
        <View className="mb-5">
          <View className="flex-row items-center gap-1.5 mb-1.5">
            {currentStock > 0 ? (
              <Zap size={11} color={stockStatus.color} fill={stockStatus.color} />
            ) : (
              <AlertTriangle size={11} color={stockStatus.color} />
            )}
            <Text
              className="text-[10px] font-black tracking-widest uppercase"
              style={{ color: stockStatus.color }}
            >
              {stockStatus.label}
            </Text>
          </View>
          {currentStock > 0 && (
            <View className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: stockStatus.width, backgroundColor: stockStatus.color }}
              />
            </View>
          )}
        </View>
      )}

      {/* ─── VARIANTS ─── */}
      {hasRealVariants && Object.keys(availableAttributes).length > 0 && (
        <View className="mb-6">
          {Object.entries(availableAttributes).map(([attrName, opts]) => {
            const isColor = isColorAttr(attrName);
            const optMeta = getOptionMeta(attrName);
            const selVal = selectedOptions[attrName];

            return (
              <View key={attrName} className="mb-5">
                <View className="flex-row items-center gap-2 mb-3">
                  <Text className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                    {attrName}:
                  </Text>
                  {selVal && (
                    <Text className="text-sm font-semibold text-gray-900">
                      {selVal}
                    </Text>
                  )}
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {opts.map((opt) => {
                    const isSel = selectedOptions[attrName] === opt;
                    const isOff = !optMeta[opt]?.available;
                    return isColor ? (
                      <ColorSwatch
                        key={opt}
                        value={opt}
                        isSelected={isSel}
                        isUnavailable={isOff}
                        onPress={() => !isOff && handleOptionSelect(attrName, opt)}
                      />
                    ) : (
                      <VariantPill
                        key={opt}
                        value={opt}
                        isSelected={isSel}
                        isUnavailable={isOff}
                        onPress={() => !isOff && handleOptionSelect(attrName, opt)}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ─── TRUST PILLS ─── */}
      <View className="flex-row flex-wrap gap-2 mb-6">
        {[
          { icon: Truck, text: 'Nationwide Delivery' },
          { icon: RotateCcw, text: 'Easy Returns' },
        ].map(({ icon: Icon, text }) => (
          <View
            key={text}
            className="flex-row items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl flex-1 min-w-[45%]"
          >
            <Icon size={13} color="#16a34a" />
            <Text className="text-[11px] font-semibold text-gray-700">{text}</Text>
          </View>
        ))}
        <View className="flex-row items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl w-full">
          <Shield size={13} color="#16a34a" />
          <Text className="text-[11px] font-semibold text-gray-700">Secure Checkout</Text>
        </View>
      </View>

      {/* ─── ACCORDIONS ─── */}
      {product.description && (
        <Accordion title="Description" defaultOpen>
          <Text className="text-[13px] text-gray-700 leading-6">
            {product.description}
          </Text>
        </Accordion>
      )}

      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <Accordion title="Specifications">
          <View className="gap-2">
            {Object.entries(product.specifications).map(([k, v]) => (
              <View key={k} className="flex-row justify-between border-b border-gray-100 pb-2">
                <Text className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  {k}
                </Text>
                <Text className="text-sm font-bold text-gray-900">{v}</Text>
              </View>
            ))}
          </View>
        </Accordion>
      )}
    </View>
  );
};

export default ProductInfo;