import { useState, useEffect, useMemo } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Layers } from 'lucide-react-native';
import { useCategories } from '@/hooks/useCategories';
import api from '@/services/axiosConfig';

// ─── Tree helpers ─────────────────────────────────────────────────────────────
const findNodeBySlug = (nodes, slug) => {
  for (const n of nodes || []) {
    if (n.slug === slug) return n;
    if (n.children?.length) {
      const found = findNodeBySlug(n.children, slug);
      if (found) return found;
    }
  }
  return null;
};

const collectLeaves = (nodes, out = []) => {
  for (const n of nodes || []) {
    if (n.children?.length) collectLeaves(n.children, out);
    else out.push(n);
  }
  return out;
};

const collectAtDepth = (nodes, targetDepth, currentDepth = 0, out = []) => {
  for (const n of nodes || []) {
    if (currentDepth === targetDepth) out.push(n);
    else if (n.children?.length) collectAtDepth(n.children, targetDepth, currentDepth + 1, out);
  }
  return out;
};

const CategoryItem = ({ category, priority, imageOverride }) => {
  const [imgError, setImgError] = useState(false);
  const uri = imageOverride || category.imageUrl;
  const showImage = uri && !imgError;
  return (
    <Pressable onPress={() => router.push(`/category/${category.slug}`)} className="items-center w-16">
      <View className="w-14 h-14 rounded-full bg-gray-100 p-[2px]">
        <View className="w-full h-full rounded-full overflow-hidden bg-gray-50 border-2 border-white items-center justify-center">
          {showImage ? (
            <Image
              source={{ uri }}
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
      <Text className="mt-1.5 text-[10px] font-bold text-gray-500 text-center" numberOfLines={2}>
        {category.name}
      </Text>
    </Pressable>
  );
};

const CategoryBar = () => {
  const { categories: allCategories, loading } = useCategories();

  // Full server config. undefined = not yet loaded.
  const [config, setConfig] = useState(undefined);

  useEffect(() => {
    let active = true;
    api.get('/v1/config/cat-bar')
      .then((res) => {
        if (!active) return;
        setConfig({
          parentSlug:     res.data?.catBarParentSlug ?? null,
          mode:           res.data?.catBarMode ?? 'PARENT',
          depth:          res.data?.catBarDepth ?? null,
          order:          res.data?.catBarOrder ?? [],
          hidden:         res.data?.catBarHidden ?? [],
          imageOverrides: res.data?.catBarImageOverrides ?? {},
        });
      })
      .catch(() => {
        if (active) setConfig({ parentSlug: null, mode: 'PARENT', depth: null, order: [], hidden: [], imageOverrides: {} });
      });
    return () => { active = false; };
  }, []);

  const items = useMemo(() => {
    if (!Array.isArray(allCategories) || config === undefined) return [];

    const { parentSlug, mode, depth, order, hidden } = config;
    let pool;

    if (mode === 'LEAVES') {
      pool = collectLeaves(allCategories);
    } else if (mode === 'DEPTH') {
      pool = collectAtDepth(allCategories, depth ?? 1);
    } else {
      if (!parentSlug) pool = allCategories.filter((c) => !c.parent && !c.parentId && !c.parentSlug);
      else pool = findNodeBySlug(allCategories, parentSlug)?.children ?? [];
    }

    const hiddenSet = new Set(hidden ?? []);
    pool = pool.filter((c) => !hiddenSet.has(c.slug));

    if ((order ?? []).length > 0) {
      const orderMap = new Map(order.map((slug, i) => [slug, i]));
      pool = [...pool].sort((a, b) => (orderMap.get(a.slug) ?? 9999) - (orderMap.get(b.slug) ?? 9999));
    }
    return pool;
  }, [allCategories, config]);

  if (loading || config === undefined) {
    return (
      <View className="bg-white border-b border-gray-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 12 }}>
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

  if (!items.length) return null;

  return (
    <View className="bg-white border-b border-gray-100">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 12 }}>
        {items.map((cat, i) => (
          <CategoryItem
            key={cat.slug || cat.id}
            category={cat}
            priority={i < 4}
            imageOverride={config.imageOverrides?.[cat.slug] ?? null}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default CategoryBar;