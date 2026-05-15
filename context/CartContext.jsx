import { createContext, useState, useEffect, useContext } from 'react';
import api from '@/services/axiosConfig';
import { toast } from '@/utils/toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    try {
      const res = await api.get('/v1/cart');
      setCart(res.data);
    } catch (err) {
      if (err.response && err.response.status !== 404) {
        console.error('Failed to load cart', err);
      }
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const addToCart = async (variantId, quantity, variantAttributes = {}) => {
    setLoading(true);
    try {
      const res = await api.post('/v1/cart/add', { variantId, quantity, variantAttributes });
      setCart(res.data);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not add item to cart';
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (variantId, newQuantity) => {
    if (newQuantity < 1) return removeFromCart(variantId);
    try {
      const res = await api.put('/v1/cart/update', { variantId, quantity: newQuantity });
      setCart(res.data);
    } catch (err) {
      console.error('Update quantity failed', err);
      toast.error('Could not update quantity. Please try again.');
    }
  };

  const removeFromCart = async (variantId) => {
    try {
      const res = await api.delete(`/v1/cart/remove/${variantId}`);
      setCart(res.data);
    } catch (err) {
      console.error('Remove from cart failed', err);
      toast.error('Could not remove item. Please try again.');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/v1/cart/clear');
      setCart(null);
    } catch (err) {
      console.error('Cart clear failed (non-fatal after payment):', err);
    }
  };

  const refreshCart = () => fetchCart();

  const cartItems = cart?.items || [];
  const cartTotal = cart?.totalAmount || 0;
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, updateQuantity, removeFromCart,
      clearCart, cartCount, cartTotal, loading, refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);