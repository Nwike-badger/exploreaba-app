import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/axiosConfig';

const LIST_CACHE_KEY = 'exploreaba_custom_catalog_v1';
const LIST_TTL_MS = 60 * 60 * 1000; // 1 hour

const readListCache = async () => {
  try {
    const raw = await AsyncStorage.getItem(LIST_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.data || !cached.savedAt) return null;
    if (Date.now() - cached.savedAt > LIST_TTL_MS) return null;
    return cached.data;
  } catch {
    return null;
  }
};

const writeListCache = async (data) => {
  try {
    await AsyncStorage.setItem(
      LIST_CACHE_KEY,
      JSON.stringify({ data, savedAt: Date.now() })
    );
  } catch {}
};

const mapStyle = (s) => ({
  id: s.slug,
  slug: s.slug,
  name: s.name,
  tone: s.tone,
  imageUrl: s.imageUrl,
  description: s.description,
});

const mapCategory = (c) => ({
  id: c.slug,
  slug: c.slug,
  name: c.name,
  tagline: c.tagline,
  description: c.description,
  gender: c.genderHint,
  priceFrom: c.priceFrom != null ? Number(c.priceFrom) : 0,
  // basePrice mirrors priceFrom if backend hasn't been migrated yet
  basePrice: c.basePrice != null
    ? Number(c.basePrice)
    : (c.priceFrom != null ? Number(c.priceFrom) : 0),
  // maxPrice is null if admin hasn't set it — wizard derives basePrice * 2.5 as fallback
  maxPrice: c.maxPrice != null ? Number(c.maxPrice) : null,
  leadTime: c.leadTime,
  accent: c.accent || '#0d4d2a',
  coverImageUrl: c.coverImageUrl,
  silhouette: c.silhouettePath,
  measurementSet: c.measurementSet || 'menFull',
  sampleStyles: (c.sampleStyles || []).map(mapStyle),
});

export const useCustomCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/v1/custom-catalog/categories');
      const mapped = (res.data || []).map(mapCategory);
      setCategories(mapped);
      await writeListCache(mapped);
    } catch (err) {
      console.error('Failed to load custom categories', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await readListCache();
      if (cached && !cancelled) {
        setCategories(cached);
        setLoading(false);
      }
      fetch();
    })();
    return () => { cancelled = true; };
  }, [fetch]);

  return { categories, loading, error, refetch: fetch };
};

export const useCustomCategory = (slug) => {
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/v1/custom-catalog/categories/${slug}`);
        if (!cancelled) setCategory(mapCategory(res.data));
      } catch (err) {
        if (!cancelled) { console.error('Failed to load category', err); setError(err); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCategory();
    return () => { cancelled = true; };
  }, [slug]);

  return { category, loading, error };
};

export const getCategoryById = (categories, id) => categories?.find((c) => c.id === id);