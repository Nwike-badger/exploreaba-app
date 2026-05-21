import { useEffect, useState, useCallback } from 'react';
import api from '@/services/axiosConfig';

const useProducts = (page = 0, size = 20) => {
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    number: 0, totalPages: 1, totalElements: 0, first: true, last: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?page=${page}&size=${size}`);
      if (res.data && res.data.content) {
        setProducts(res.data.content);
        setPageInfo({
          number: res.data.number,
          totalPages: res.data.totalPages,
          totalElements: res.data.totalElements,
          first: res.data.first,
          last: res.data.last,
        });
      } else {
        setProducts(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load products');
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, pageInfo, loading, error, refetch: fetchProducts };
};

export default useProducts;