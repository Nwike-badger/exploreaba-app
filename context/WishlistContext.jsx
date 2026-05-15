import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '@/services/axiosConfig';
import { toast } from '@/utils/toast';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/v1/wishlist');
      setWishlist(res.data);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    }
  };

  useEffect(() => { fetchWishlist(); }, []);

  const addToWishlist = async (productId) => {
    setLoading(true);
    try {
      const res = await api.post(`/v1/wishlist/add/${productId}`);
      setWishlist(res.data);
      toast.success('Saved to your wishlist');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not save item';
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const res = await api.delete(`/v1/wishlist/remove/${productId}`);
      setWishlist(res.data);
      toast.success('Removed from wishlist');
    } catch (err) {
      console.error('Remove from wishlist failed', err);
      toast.error('Could not remove item.');
    }
  };

  const clearWishlist = async () => {
    try {
      await api.delete('/v1/wishlist/clear');
      setWishlist(null);
      toast.success('Wishlist cleared');
    } catch (err) {
      console.error('Wishlist clear failed:', err);
    }
  };

  const wishlistItems = wishlist?.items || [];
  const wishlistCount = wishlistItems.length;

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.productId === productId);
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount,
      loading,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      isInWishlist,
      toggleWishlist,
      fetchWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);