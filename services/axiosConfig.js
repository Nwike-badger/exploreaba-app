import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { toast } from '@/utils/toast';

export const TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refreshToken';
const GUEST_ID_KEY = 'guest_cart_id';
const SESSION_ID_KEY = 'exab_session_id';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// ─── Token persistence (SecureStore — encrypted) ─────────────────────────────
export const setAuthTokens = async (accessToken, refreshToken) => {
  if (accessToken) await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearAuthTokens = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;

    let guestId = await AsyncStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = Crypto.randomUUID();
      await AsyncStorage.setItem(GUEST_ID_KEY, guestId);
    }
    config.headers['X-Guest-ID'] = guestId;

    let sessionId = await AsyncStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = Crypto.randomUUID();
      await AsyncStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    config.headers['X-Session-Id'] = sessionId;

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: silent refresh on 401 (and 403-on-expiry) ────────
let sessionExpiredToastShown = false;
let isRefreshing = false;
let refreshQueue = [];

const flushQueue = (newToken) => {
  refreshQueue.forEach(({ resolve, reject, originalRequest }) => {
    if (newToken) {
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      resolve(api(originalRequest));
    } else {
      reject(originalRequest.__error);
    }
  });
  refreshQueue = [];
};

const handleSessionExpired = async () => {
  if (sessionExpiredToastShown) return;
  sessionExpiredToastShown = true;
  await clearAuthTokens();
  toast("For your security, you've been signed out. Please log in again.", {
    icon: '🔐', duration: 4000,
  });
  setTimeout(() => router.replace('/login'), 800);
};

api.interceptors.response.use(
  (response) => { sessionExpiredToastShown = false; return response; },
  async (error) => {
    if (!error.response) return Promise.reject(error);

    const { status } = error.response;
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const isAuthFlow = url.includes('/v1/auth/');

    // Spring returns 403 (not 401) on a role-gated or authenticated() route once
    // the JWT filter clears an expired token's context — no custom entry point
    // is configured, so it falls back to Http403ForbiddenEntryPoint. A 403 on a
    // token that's actually expired is an auth problem in disguise — treat it
    // exactly like a 401.
    const isAuthFailure =
      status === 401 || (status === 403 && token && isTokenExpired(token));

    // ── Looks like an expired/invalid token → one silent refresh, then replay ──
    if (isAuthFailure && token && !isAuthFlow && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          originalRequest.__error = error;
          refreshQueue.push({ resolve, reject, originalRequest });
        });
      }

      isRefreshing = true;
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        isRefreshing = false;
        await handleSessionExpired();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/v1/auth/refresh`, { refreshToken });
        await setAuthTokens(data.accessToken, data.refreshToken);
        isRefreshing = false;
        flushQueue(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        flushQueue(null);
        await handleSessionExpired();
        return Promise.reject(refreshError);
      }
    }

    // ── Already retried and still failing → refresh couldn't fix it, sign out ──
    if (isAuthFailure && token && !isAuthFlow) {
      await handleSessionExpired();
      return Promise.reject(error);
    }

    // ── Genuine access-denied: valid token, just lacking the required role ──
    if (status === 403 && !isAuthFlow && !(token && isTokenExpired(token))) {
      toast("You don't have access to do that. If you think this is a mistake, please contact support.", {
        icon: '🚫', duration: 5000,
      });
    }

    return Promise.reject(error);
  }
);

export default api;