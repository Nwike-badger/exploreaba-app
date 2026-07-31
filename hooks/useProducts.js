import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '@/services/axiosConfig';

const cacheKey = (page, size) => `products_cache_${page}_${size}`;
const emptyPageInfo = { number: 0, totalPages: 1, totalElements: 0, first: true, last: true };

const useProducts = (page = 0, size = 20) => {
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState(emptyPageInfo);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // lets fetchProducts check "do we already have something on screen" without
  // needing `products` in its own dependency array (which would recreate it
  // on every fetch and re-subscribe the NetInfo listener constantly)
  const productsRef = useRef(products);
  useEffect(() => { productsRef.current = products; }, [products]);

  const loadFromCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey(page, size));
      if (cached) {
        const parsed = JSON.parse(cached);
        setProducts(parsed.products || []);
        setPageInfo(parsed.pageInfo || emptyPageInfo);
        setIsStale(true);
        return true;
      }
    } catch {
      // corrupt cache entry, ignore
    }
    return false;
  }, [page, size]);

  const fetchProducts = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null); // <-- the actual fix: clear any previous error before trying again

    try {
      const res = await api.get(`/products?page=${page}&size=${size}`);
      let nextProducts, nextPageInfo;

      if (res.data && res.data.content) {
        nextProducts = res.data.content;
        nextPageInfo = {
          number: res.data.number,
          totalPages: res.data.totalPages,
          totalElements: res.data.totalElements,
          first: res.data.first,
          last: res.data.last,
        };
      } else {
        nextProducts = res.data || [];
        nextPageInfo = { ...emptyPageInfo, totalElements: nextProducts.length };
      }

      setProducts(nextProducts);
      setPageInfo(nextPageInfo);
      setIsStale(false);
      AsyncStorage.setItem(
        cacheKey(page, size),
        JSON.stringify({ products: nextProducts, pageInfo: nextPageInfo, cachedAt: Date.now() })
      ).catch(() => {});
    } catch (err) {
      console.error(err);
      // Only show a hard error screen if there's nothing to fall back on.
      // If we already have products (or find a cache), fail quietly —
      // the offline banner tells the user what's going on instead.
      if (productsRef.current.length === 0) {
        const hadCache = await loadFromCache();
        if (!hadCache) setError('Could not load products');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, size, loadFromCache]);

  // initial load
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  // connectivity tracking + auto-refresh on reconnect
  useEffect(() => {
    let wasOffline = false;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
      if (wasOffline && !offline) {
        fetchProducts({ silent: true }); // auto-refresh, no full-screen spinner
      }
      wasOffline = offline;
    });
    return () => unsubscribe();
  }, [fetchProducts]);

  const onPullToRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts({ silent: true });
  }, [fetchProducts]);

  return {
    products, pageInfo, loading, error, isOffline, isStale, refreshing,
    refetch: fetchProducts, onPullToRefresh,
  };
};

export default useProducts;