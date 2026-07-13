import { useState } from 'react';
import { router } from 'expo-router';
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from '@/utils/toast';
import { postLoginRoute } from '@/utils/adminUtils';

// Configure ONCE at module load (mirrors the old maybeCompleteAuthSession call).
//  - webClientId MUST be an OAuth client of type "Web". It is REQUIRED to get an
//    idToken back, and it becomes the token's audience — so your backend must
//    verify the idToken against THIS same web client ID.
//  - The Android OAuth client is matched automatically by package name + SHA-1,
//    so there is deliberately NO androidClientId here anymore.
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: false,
});

/**
 * Shared Google sign-in hook for login, signup, and checkout screens.
 *
 * Native account picker (no browser hop). After a successful sign-in the user
 * is routed by role (admins -> /admin, everyone else -> /(tabs)); `onSuccess`
 * still fires afterward for any caller-specific, non-routing logic.
 *
 * Public API is UNCHANGED from the old expo-auth-session version, so the
 * screens that consume it need no edits:
 *   const { signIn, loading, ready } = useGoogleAuth({ onSuccess, onError });
 */
export const useGoogleAuth = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { refreshCart } = useCart();

  const handleGoogleSuccess = async (idToken) => {
    if (!idToken) {
      // Almost always means webClientId is missing/wrong in configure().
      toast.error('No token received from Google.');
      setLoading(false);
      return;
    }
    try {
      const guestId = await AsyncStorage.getItem('guest_cart_id');
      const res = await api.post('/v1/auth/google', { token: idToken, guestId });
      const { accessToken, refreshToken } = res.data;

      await login(accessToken, refreshToken);

      await AsyncStorage.removeItem('guest_cart_id');
      refreshCart();

      const user = decodeJwtPayload(accessToken);
      router.replace(postLoginRoute(user));

      onSuccess?.(user);
    } catch (err) {
      console.error('Google auth backend error', err);
      toast.error(
        err.response?.data?.message || 'Google sign-in failed. Please try again.'
      );
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    setLoading(true);
    try {
      // Android-only check; always resolves true on iOS.
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Uncomment to force the account chooser on every sign-in:
      // await GoogleSignin.signOut();

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        await handleGoogleSuccess(response.data.idToken);
      } else {
        // response.type === 'cancelled' — user dismissed the picker, no error.
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            return; // a sign-in is already running; ignore
          case statusCodes.SIGN_IN_CANCELLED:
            return; // user cancelled; no toast
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            toast.error('Google Play Services is unavailable or out of date.');
            break;
          default:
            console.error('Google auth error', error);
            toast.error('Google sign-in failed. Please try again.');
        }
      } else {
        console.error('Google auth error', error);
        toast.error('Google sign-in failed. Please try again.');
      }
      onError?.(error);
    }
  };

  // Native configure() is synchronous, so the button is always "ready".
  // Kept in the return shape purely for API compatibility with the screens.
  return { signIn, loading, ready: true };
};

// ─── Local JWT payload decoder ──────────────────────────────────────────────
// Returns the decoded payload (sub, roles, exp, ...) or null if malformed.
// Hermes provides atob globally.
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}