import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { toast } from '@/utils/toast';

export const TOKEN_KEY = 'token';
const GUEST_ID_KEY = 'guest_cart_id';
const SESSION_ID_KEY = 'exab_session_id';

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
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

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

    // NEW: session ID for analytics/tracking — auto-attached to every request
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

let sessionExpiredToastShown = false;

const handleSessionExpired = async () => {
  if (sessionExpiredToastShown) return;
  sessionExpiredToastShown = true;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
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
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (status === 401) {
      if (token) handleSessionExpired();
    } else if (status === 403) {
      if (token && isTokenExpired(token)) {
        handleSessionExpired();
      } else {
        toast("You don't have access to do that. If you think this is a mistake, please contact support.", {
          icon: '🚫', duration: 5000,
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;