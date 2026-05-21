import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/axiosConfig';
import { toast } from '@/utils/toast';

const POLL_INTERVAL_MS = 30_000;
const BACKOFF_CAP_MS = 5 * 60_000;
const STORAGE_KEY = 'admin_last_seen_order_ts';

export function useOrderNotifications({ onNewOrders } = {}) {
  const [unreadCount, setUnreadCount] = useState(0);

  const lastSeenRef = useRef(new Date(0).toISOString());
  const timerRef = useRef(null);
  const errorCountRef = useRef(0);
  const isPollingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  // In-app toast instead of system Notification
  const fireNotification = useCallback((order) => {
    const items = order.items || [];
    const body = items.length
      ? items.slice(0, 2).map((i) => `${i.productName} ×${i.quantity}`).join(', ') +
        (items.length > 2 ? ` +${items.length - 2} more` : '')
      : 'New order received';

    toast.success(
      `🛒 ${order.orderNumber} — ₦${Number(order.grandTotal || 0).toLocaleString('en-NG')} · ${body}`,
      { duration: 5000 }
    );
  }, []);

  const poll = useCallback(async () => {
    if (isPollingRef.current) return;
    if (appStateRef.current !== 'active') return; // skip when backgrounded

    isPollingRef.current = true;
    try {
      const res = await api.get('/admin/orders', {
        params: { page: 0, size: 20, sort: 'createdAt,desc' },
      });
      const orders = res.data?.content ?? res.data ?? [];
      errorCountRef.current = 0;

      if (!orders.length) return;

      const newOrders = orders.filter(
        (o) => o.createdAt && o.createdAt > lastSeenRef.current
      );

      if (newOrders.length > 0) {
        const newest = newOrders.reduce(
          (max, o) => (o.createdAt > max ? o.createdAt : max),
          newOrders[0].createdAt
        );
        lastSeenRef.current = newest;
        await AsyncStorage.setItem(STORAGE_KEY, newest);

        newOrders.slice(0, 5).forEach(fireNotification);
        setUnreadCount((n) => n + newOrders.length);
        onNewOrders?.(newOrders);
      }
    } catch {
      errorCountRef.current += 1;
      const delay = Math.min(
        POLL_INTERVAL_MS * 2 ** errorCountRef.current,
        BACKOFF_CAP_MS
      );
      clearInterval(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
        poll();
      }, delay);
    } finally {
      isPollingRef.current = false;
    }
  }, [fireNotification, onNewOrders]);

  useEffect(() => {
    // Hydrate last-seen timestamp from storage
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) lastSeenRef.current = stored;
      poll();
      timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    })();

    // AppState replaces document.visibilityState on mobile
    const sub = AppState.addEventListener('change', (next) => {
      appStateRef.current = next;
      if (next === 'active') {
        poll();
        if (!timerRef.current) {
          timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
        }
      } else {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    });

    return () => {
      clearInterval(timerRef.current);
      sub.remove();
    };
  }, [poll]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  // permissionState is gone — no native permission needed for in-app toasts.
  // If you later add expo-notifications, we'll bring permission state back.
  return { unreadCount, clearUnread };
}