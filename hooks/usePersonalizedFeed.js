import { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';

export const usePersonalizedFeed = ({ categorySlug, limit = 10 } = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ limit });
    if (categorySlug) params.set('categorySlug', categorySlug);

    setLoading(true);
    api.get(`/v1/recommendations/for-you?${params}`)
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categorySlug, limit]);

  return { products, loading };
};