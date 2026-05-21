import { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';

export const useTrending = ({ categorySlug, limit = 10 } = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = categorySlug
      ? `/v1/recommendations/trending/category/${categorySlug}?limit=${limit}`
      : `/v1/recommendations/trending?limit=${limit}`;
    setLoading(true);
    api.get(url)
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categorySlug, limit]);

  return { products, loading };
};