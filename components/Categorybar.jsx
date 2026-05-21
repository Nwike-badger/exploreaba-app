import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Layers } from 'lucide-react-native';
import { useCategories } from '@/hooks/useCategories';

const CategoryItem = ({ category, priority }) => {
  const [imgError, setImgError] = useState(false);
  const showImage = category.imageUrl && !imgError;

  return (
    <Link href={`/category/${category.slug}`} asChild>
      <Pressable className="items-center w-16">
        <View className="w-14 h-14 rounded-full bg-gray-100 p-[2px]">
          <View className="w-full h-full rounded-full overflow-hidden bg-gray-50 border-2 border-white items-center justify-center">
            {showImage ? (
              <Image
                source={{ uri: category.imageUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                priority={priority ? 'high' : 'low'}
                onError={() => setImgError(true)}
              />
            ) : (
              <Layers size={18} color="#34d399" strokeWidth={1.5} />
            )}
          </View>
        </View>
        <Text
          className="mt-1.5 text-[10px] font-bold text-gray-500 text-center"
          numberOfLines={2}
        >
          {category.name}
        </Text>
      </Pressable>
    </Link>
  );
};

const CategoryBar = () => {
  const { categories, loading } = useCategories();

  if (loading) {
    return (
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 12 }}
        >
          {[...Array(7)].map((_, i) => (
            <View key={i} className="items-center w-16">
              <View className="w-14 h-14 rounded-full bg-gray-100" />
              <View className="w-10 h-2 mt-2 bg-gray-100 rounded-full" />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  const rootCategories = (categories || []).filter(
    (c) => !c.parent && !c.parentId && !c.parentSlug
  );

  if (!rootCategories.length) return null;

  return (
    <View className="bg-white border-b border-gray-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 12 }}
      >
        {rootCategories.map((cat, i) => (
          <CategoryItem
            key={cat.slug || cat.id}
            category={cat}
            priority={i < 4}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default CategoryBar;