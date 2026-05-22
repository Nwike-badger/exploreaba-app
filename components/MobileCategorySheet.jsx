import { useState, useMemo } from 'react';
import { Modal, View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { X, Search, Layers, ChevronRight } from 'lucide-react-native';

const MobileCategorySheet = ({ categories = [], isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Flat list for searching: top-level + children
  const allCategories = useMemo(() => {
    const flat = [];
    categories.forEach((cat) => {
      flat.push(cat);
      if (cat.children?.length) {
        cat.children.forEach((child) =>
          flat.push({ ...child, _isChild: true, _parentName: cat.name })
        );
      }
    });
    return flat;
  }, [categories]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return allCategories.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c._parentName?.toLowerCase().includes(q)
    );
  }, [searchQuery, categories, allCategories]);

  const isSearching = searchQuery.trim().length > 0;

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Pressable
          className="absolute inset-0 bg-black/55"
          onPress={handleClose}
        />

        {/* Sheet */}
        <View
          className="bg-white rounded-t-3xl"
          style={{ maxHeight: '92%', minHeight: '60%' }}
        >
          <SafeAreaView className="flex-1">
            {/* Drag handle */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-gray-200" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
              <View>
                <Text className="text-xl font-black text-gray-900 tracking-tight">
                  Browse Categories
                </Text>
                <Text className="text-xs text-gray-400 font-medium mt-0.5">
                  {filtered.length} {isSearching ? 'results' : 'categories'}
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
                accessibilityLabel="Close categories"
                className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
              >
                <X size={18} color="#4B5563" />
              </Pressable>
            </View>

            {/* Search */}
            <View className="px-5 pb-4">
              <View className="relative">
                <Search
                  size={16}
                  color="#9CA3AF"
                  style={{ position: 'absolute', left: 14, top: 13, zIndex: 1 }}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search categories..."
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-10 text-sm text-gray-900"
                />
                {searchQuery && (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 12, top: 12 }}
                  >
                    <X size={14} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            </View>

            <View className="h-px bg-gray-100 mx-5" />

            {/* Content */}
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
            >
              {filtered.length === 0 ? (
                <View className="items-center py-16">
                  <View className="w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center mb-4">
                    <Search size={24} color="#D1D5DB" />
                  </View>
                  <Text className="font-bold text-gray-500 text-sm">
                    No categories found
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">
                    Try a different search term
                  </Text>
                </View>
              ) : isSearching ? (
                // List style for search results
                <View className="gap-1">
                  {filtered.map((cat) => (
                    <Link
                      key={cat.id || cat.slug}
                      href={`/category/${cat.slug}`}
                      asChild
                    >
                      <Pressable
                        onPress={handleClose}
                        className="flex-row items-center gap-3 p-3 rounded-xl"
                      >
                        <View className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 items-center justify-center">
                          {cat.imageUrl ? (
                            <Image
                              source={{ uri: cat.imageUrl }}
                              style={{ width: '100%', height: '100%' }}
                              contentFit="cover"
                            />
                          ) : (
                            <Layers size={16} color="#34d399" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text
                            className="font-bold text-sm text-gray-900"
                            numberOfLines={1}
                          >
                            {cat.name}
                          </Text>
                          {cat._parentName && (
                            <Text className="text-[10px] text-gray-400 font-medium">
                              in {cat._parentName}
                            </Text>
                          )}
                        </View>
                        <ChevronRight size={16} color="#D1D5DB" />
                      </Pressable>
                    </Link>
                  ))}
                </View>
              ) : (
                // 3-column grid for top-level browsing
                <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                  {filtered.map((cat) => (
                    <View key={cat.id || cat.slug} style={{ width: '31%' }}>
                      <Link href={`/category/${cat.slug}`} asChild>
                        <Pressable
                          onPress={handleClose}
                          className="items-center gap-2"
                        >
                          <View className="relative w-20 h-20 rounded-full bg-gray-100 p-[2.5px]">
                            <View className="w-full h-full rounded-full overflow-hidden bg-gray-50 border-2 border-white items-center justify-center">
                              {cat.imageUrl ? (
                                <Image
                                  source={{ uri: cat.imageUrl }}
                                  style={{ width: '100%', height: '100%' }}
                                  contentFit="cover"
                                />
                              ) : (
                                <Layers size={22} color="#34d399" strokeWidth={1.5} />
                              )}
                            </View>
                            {cat.children?.length > 0 && (
                              <View className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-600 rounded-full border-2 border-white items-center justify-center">
                                <Text className="text-white text-[9px] font-black">
                                  {cat.children.length}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            className="text-[11px] font-bold text-gray-600 text-center"
                            numberOfLines={2}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      </Link>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

export default MobileCategorySheet;