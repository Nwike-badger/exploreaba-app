import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from '@/utils/toast';

// Required for the browser-based auth flow to complete properly.
// Safe to call once at module load; it's a no-op if already called.
WebBrowser.maybeCompleteAuthSession();

/**
 * Shared Google sign-in hook for login and signup screens.
 *
 * Usage:
 *   const { signIn, loading, ready } = useGoogleAuth({
 *     onSuccess: (accessToken) => router.replace('/'),
 *     onError: () => { /* optional *\/ },
 *   });
 *   <Button onPress={signIn} disabled={!ready || loading} />
 *
 * Returns:
 *   signIn  — call to open the Google auth screen
 *   loading — true while the flow is in progress
 *   ready   — true once the auth request is constructed (must wait for this)
 */
export const useGoogleAuth = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { refreshCart } = useCart();

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken =
        response.authentication?.idToken || response.params?.id_token;
      handleGoogleSuccess(idToken);
    } else if (response.type === 'error') {
      console.error('Google auth error', response.error);
      toast.error('Google sign-in failed. Please try again.');
      setLoading(false);
      onError?.(response.error);
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      // User closed the picker — no error toast, just reset state
      setLoading(false);
    }
  }, [response]);

  const handleGoogleSuccess = async (idToken) => {
    if (!idToken) {
      toast.error('No token received from Google.');
      setLoading(false);
      return;
    }

    try {
      const guestId = await AsyncStorage.getItem('guest_cart_id');

      const res = await api.post('/v1/auth/google', {
        token: idToken,
        guestId,
      });

      const { accessToken } = res.data;
      await login(accessToken);
      await AsyncStorage.removeItem('guest_cart_id');
      refreshCart();

      onSuccess?.(accessToken);
    } catch (err) {
      console.error('Google auth backend error', err);
      toast.error(
        err.response?.data?.message ||
          'Google sign-in failed. Please try again.'
      );
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    if (!request) return; // not ready yet
    setLoading(true);
    await promptAsync();
  };

  return { signIn, loading, ready: !!request };
};