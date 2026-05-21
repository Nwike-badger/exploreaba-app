import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import api from '@/services/axiosConfig';

export const useSmartSearch = ({ query, categorySlug, minPrice, maxPrice, page = 0, size = 10 }) => {
  const queryClient = useQueryClient();

  const fetchSearchResults = async (currentPage) => {
    if (!query || !query.trim()) return null;

    const params = new URLSearchParams({ q: query.trim(), page: currentPage, size });
    if (categorySlug) params.set('category', categorySlug);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    const res = await api.get(`/v1/search?${params}`);
    // Fire-and-forget search tracking
    api.post('/v1/track/search', { query: query.trim() }).catch(() => {});
    return res.data;
  };

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['search', query, categorySlug, minPrice, maxPrice, page, size],
    queryFn: () => fetchSearchResults(page),
    enabled: !!query,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev, // RN-query v5 equivalent of keepPreviousData
  });

  useEffect(() => {
    if (data && !data.last) {
      queryClient.prefetchQuery({
        queryKey: ['search', query, categorySlug, minPrice, maxPrice, page + 1, size],
        queryFn: () => fetchSearchResults(page + 1),
      });
    }
  }, [data, page, query, categorySlug, minPrice, maxPrice, size, queryClient]);

  const trackResultClick = useCallback((productId) => {
    api.post('/v1/track/search', { query, productId }).catch(() => {});
  }, [query]);

  const content = data?.content || [];
  return {
    results: content,
    pageInfo: data ? {
      number: data.number || page,
      totalPages: data.totalPages || 1,
      totalElements: data.totalElements || 0,
      first: data.first ?? page === 0,
      last: data.last ?? content.length < size,
    } : null,
    loading: isLoading,
    isFetching,
    error: isError,
    total: data?.totalElements || 0,
    trackResultClick,
  };
};