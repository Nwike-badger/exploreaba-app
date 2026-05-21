import { useCallback } from 'react';
import api from '@/services/axiosConfig';

export const useBehaviorTracking = () => {
  // Session ID is auto-attached by axios interceptor — no need to read it here.

  const trackView = useCallback((productId) => {
    if (!productId) return;
    api.post('/v1/track/view', { productId }).catch(() => {});
  }, []);

  const trackCartAdd = useCallback((productId, variantId) => {
    if (!productId) return;
    api.post('/v1/track/cart', { productId, variantId }).catch(() => {});
  }, []);

  const trackWishlist = useCallback((productId) => {
    if (!productId) return;
    api.post('/v1/track/wishlist', { productId }).catch(() => {});
  }, []);

  return { trackView, trackCartAdd, trackWishlist };
};