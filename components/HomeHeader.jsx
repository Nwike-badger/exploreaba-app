import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Link, router } from 'expo-router';
import { Search, X, ShoppingCart } from 'lucide-react-native';
import { useCart } from '@/context/CartContext';

const HomeHeader = () => {
  const { cartCount, cartTotal } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  };

  return (
    <View className="bg-white border-b border-gray-100">
      {/* Main bar */}
      <View className="flex-row items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link href="/" asChild>
          <Pressable className="flex-row items-center gap-2">
            <View className="w-9 h-9 rounded-xl bg-green-600 items-center justify-center">
              <Text className="text-white font-black text-base">E</Text>
            </View>
            <Text className="text-xl font-black tracking-tight">
              <Text className="text-green-700">Explore</Text>
              <Text className="text-gray-900">Aba</Text>
              <Text className="text-emerald-500">.</Text>
            </Text>
          </Pressable>
        </Link>

        {/* Right icons */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setSearchOpen((v) => !v)}
            accessibilityLabel="Search"
            className="p-2"
          >
            {searchOpen ? (
              <X size={22} color="#374151" />
            ) : (
              <Search size={22} color="#374151" />
            )}
          </Pressable>

          <Link href="/cart" asChild>
            <Pressable className="flex-row items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-full">
              <View>
                <ShoppingCart size={18} color="#374151" />
                {cartCount > 0 && (
                  <View className="absolute -top-2 -right-2 bg-green-600 w-4 h-4 rounded-full border-2 border-white items-center justify-center">
                    <Text className="text-white text-[8px] font-black">
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-xs font-bold text-gray-700">
                ₦{cartTotal ? cartTotal.toLocaleString() : '0'}
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* Search drawer */}
      {searchOpen && (
        <View className="px-3 pb-3 bg-gray-50 border-t border-gray-100">
          <View className="relative mt-3">
            <Search
              size={16}
              color="#9CA3AF"
              style={{ position: 'absolute', left: 12, top: 14, zIndex: 1 }}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search products, categories..."
              placeholderTextColor="#9CA3AF"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              className="bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900"
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default HomeHeader;