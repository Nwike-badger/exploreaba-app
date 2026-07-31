import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import HeaderActions from '@/components/HeaderActions';

const LOGO = require('@/assets/images/exploreaba-cart-logo.png');

const HomeHeader = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  };

  return (
    <View className="bg-white border-b border-gray-100">
      <View className="flex-row items-center justify-between px-4 h-14">
        <Pressable onPress={() => router.push('/')} className="flex-row items-center gap-1.5">
          <View className="h-10 w-10">
            <Image source={LOGO} style={{ width: '100%', height: '100%' }} contentFit="contain" />
          </View>
          <Text className="text-xl font-black tracking-tight">
            <Text className="text-green-700">Explore</Text>
            <Text className="text-gray-900">Aba</Text>
            <Text className="text-emerald-500">.</Text>
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => setSearchOpen((v) => !v)} accessibilityLabel="Search" className="p-2">
            {searchOpen ? <X size={22} color="#374151" /> : <Search size={22} color="#374151" />}
          </Pressable>
          <HeaderActions showCartTotal />
        </View>
      </View>

      {searchOpen && (
        <View className="px-3 pb-3 bg-gray-50 border-t border-gray-100">
          <View className="relative mt-3">
            <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: 14, zIndex: 1 }} />
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