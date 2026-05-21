import { useEffect } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/context/AuthContext';
import { TOKEN_KEY } from '@/services/axiosConfig';

/**
 * Reads ROLE_ADMIN directly from the JWT payload (backend's UserResponse
 * may not include roles). Async because SecureStore is async.
 */
const checkAdminFromToken = async () => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return false;

    const payload = token.split('.')[1];
    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');

    const decoded = JSON.parse(atob(base64));
    const roles = decoded.roles || decoded.authorities || decoded.role || [];

    if (Array.isArray(roles)) {
      return roles.some(
        (r) =>
          r === 'ROLE_ADMIN' ||
          r.name === 'ROLE_ADMIN' ||
          r.authority === 'ROLE_ADMIN'
      );
    }
    return roles === 'ROLE_ADMIN';
  } catch (error) {
    console.error('Token decoding failed:', error);
    return false;
  }
};

/**
 * useRequireAuth
 *
 * Call this at the top of any screen or layout that requires authentication.
 * Redirects to /login if not authenticated. If requireAdmin is true, also
 * redirects to / if the user isn't an admin.
 *
 * Usage:
 *   export default function CheckoutScreen() {
 *     const { loading } = useRequireAuth();
 *     if (loading) return <Loading />;
 *     return <ActualContent />;
 *   }
 *
 *   // For admin routes, in a layout file:
 *   export default function AdminLayout() {
 *     const { loading } = useRequireAuth({ requireAdmin: true });
 *     if (loading) return <Loading />;
 *     return <Stack />;
 *   }
 */
export const useRequireAuth = ({ requireAdmin = false } = {}) => {
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    // Still hydrating from SecureStore — don't redirect yet
    if (loading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (requireAdmin) {
      (async () => {
        const tokenSaysAdmin = await checkAdminFromToken();
        const userSaysAdmin =
          user?.roles?.includes('ROLE_ADMIN') || user?.role === 'ROLE_ADMIN';

        if (!tokenSaysAdmin && !userSaysAdmin) {
          console.warn('useRequireAuth: Admin role not found — redirecting.');
          router.replace('/');
        }
      })();
    }
  }, [loading, isAuthenticated, requireAdmin, user]);

  return { loading, isAuthenticated };
};