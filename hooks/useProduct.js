import { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';

const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/products/${id}`);
        const { product: productData, variants } = response.data;
        if (!cancelled) {
          setProduct({ ...productData, variants: variants || [] });
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();
    return () => { cancelled = true; };
  }, [id]);

  return { product, loading, error };
};

export default useProduct;