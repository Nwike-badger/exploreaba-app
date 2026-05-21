import { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';

export const useProductRecommendations = (productId) => {
  const [data, setData] = useState({ similar: [], alsoBought: [], alsoViewed: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    api.get(`/v1/products/${productId}/recommendations`)
      .then((res) => setData({
        similar: res.data.similarProducts || [],
        alsoBought: res.data.customersAlsoBought || [],
        alsoViewed: res.data.customersAlsoViewed || [],
      }))
      .catch(() => setData({ similar: [], alsoBought: [], alsoViewed: [] }))
      .finally(() => setLoading(false));
  }, [productId]);

  return { ...data, loading };
};