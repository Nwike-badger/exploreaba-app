import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Package, Clock, CheckCircle, Truck, XCircle, RefreshCw, ShoppingBag, AlertCircle, LogIn,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';

const parseSpringDate = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, min = 0, sec = 0] = value;
    return new Date(year, month - 1, day, hour, min, sec);
  }
  return new Date(value);
};

const formatOrderDate = (createdAt) => {
  const date = parseSpringDate(createdAt);
  if (!date || isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
};

const STATUS_CONFIG = {
  PENDING_PAYMENT: { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa', label: 'Pending Payment',  Icon: Clock },
  PROCESSING:      { bg: '#dbeafe', fg: '#1d4ed8', border: '#bfdbfe', label: 'Processing',        Icon: Package },
  CONFIRMED:       { bg: '#e0e7ff', fg: '#4338ca', border: '#c7d2fe', label: 'Confirmed',         Icon: CheckCircle },
  SHIPPED:         { bg: '#f3e8ff', fg: '#6d28d9', border: '#e9d5ff', label: 'Shipped',           Icon: Truck },
  DELIVERED:       { bg: '#dcfce7', fg: '#15803d', border: '#bbf7d0', label: 'Delivered',         Icon: CheckCircle },
  RETURNED:        { bg: '#fef9c3', fg: '#a16207', border: '#fef08a', label: 'Returned',          Icon: RefreshCw },
  CANCELLED:       { bg: '#fee2e2', fg: '#b91c1c', border: '#fecaca', label: 'Cancelled',         Icon: XCircle },
};

export default function OrdersScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.get('/v1/orders/my-orders?page=0&size=100');
      const content = res.data.content || [];
      const sorted = [...content].sort((a, b) => {
        const da = parseSpringDate(a.createdAt);
        const db = parseSpringDate(b.createdAt);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db - da;
      });
      setOrders(sorted);
    } catch (e) {
      setError(e.message || 'Could not load your orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // No auto-redirect here — an unauthenticated user just sees the in-screen
  // sign-in prompt below. Calling router.replace() synchronously from a focus
  // effect races Fabric's view-mounting on the tab transition and crashes
  // release builds; rendering in place avoids that entirely.
  useFocusEffect(
    useCallback(() => {
      if (authLoading || !isAuthenticated) return;
      fetchOrders();
    }, [authLoading, isAuthenticated, fetchOrders])
  );

  // Show paid orders first, pending at the bottom (matches web logic)
  const sortedDisplay = [
    ...orders.filter((o) => o.orderStatus !== 'PENDING_PAYMENT'),
    ...orders.filter((o) => o.orderStatus === 'PENDING_PAYMENT'),
  ];

  if (authLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <OrdersHeader />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-gray-50">
        <OrdersHeader />
        <SignInPrompt
          title="Sign in to view your orders"
          subtitle="Log in to see your order history and track deliveries."
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <OrdersHeader />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-3">
            Loading orders...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
            <AlertCircle size={28} color="#ef4444" />
          </View>
          <Text className="text-lg font-black text-gray-900 mb-2 text-center">{error}</Text>
          <Pressable
            onPress={() => fetchOrders()}
            className="mt-3 bg-gray-900 px-5 py-2.5 rounded-xl flex-row items-center gap-2"
          >
            <RefreshCw size={14} color="#fff" />
            <Text className="text-white text-sm font-bold">Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={sortedDisplay}
          keyExtractor={(item) => item.orderId ?? item.orderNumber}
          contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders('refresh')}
              tintColor="#2563eb"
            />
          }
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.orderStatus] || STATUS_CONFIG.PROCESSING;
            const dateStr = formatOrderDate(item.createdAt);
            const isPending = item.orderStatus === 'PENDING_PAYMENT';
            const StatusIcon = cfg.Icon;

            return (
              <Pressable
                onPress={() => router.push(`/orders/${item.orderNumber}`)}
                disabled={isPending}
                className={`bg-white rounded-2xl border overflow-hidden
                  ${isPending ? 'border-orange-100 opacity-70' : 'border-gray-100'}`}
              >
                <View className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex-row justify-between">
                  <View>
                    <Text className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                      Placed
                    </Text>
                    <Text className="text-xs font-bold text-gray-900">{dateStr ?? '—'}</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                      Total
                    </Text>
                    <Text className="text-sm font-black text-blue-600">
                      ₦{Number(item.totalAmount ?? 0).toLocaleString()}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                      #
                    </Text>
                    <Text className="text-xs font-mono font-bold text-gray-900" numberOfLines={1}>
                      {item.orderNumber}
                    </Text>
                  </View>
                </View>

                <View className="px-4 py-3">
                  <View
                    className="flex-row items-center gap-1.5 self-start px-2.5 py-1 rounded-md border mb-2"
                    style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                  >
                    <StatusIcon size={12} color={cfg.fg} />
                    <Text className="text-[11px] font-bold" style={{ color: cfg.fg }}>
                      {cfg.label}
                    </Text>
                  </View>

                  {isPending && (
                    <Text className="text-[11px] text-orange-600 mb-1.5">
                      Payment not completed — order was not finalised.
                    </Text>
                  )}

                  {item.itemNames?.length > 0 && (
                    <Text className="text-xs text-gray-600" numberOfLines={2}>
                      {item.itemNames.join(', ')}
                    </Text>
                  )}

                  {!isPending && (
                    <View className="mt-3 flex-row justify-end">
                      <Text className="text-xs font-bold text-blue-600">
                        View details →
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16 px-4">
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-5 border border-gray-100">
                <ShoppingBag size={36} color="#9CA3AF" />
              </View>
              <Text className="text-xl font-black text-gray-900 mb-2">No orders yet</Text>
              <Text className="text-sm text-gray-500 mb-6 text-center">
                When you place an order, it will appear here.
              </Text>
              <Pressable
                onPress={() => router.replace('/')}
                className="bg-blue-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white text-sm font-bold">Start Shopping</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

function OrdersHeader() {
  return (
    <SafeAreaView edges={['top']} className="bg-white">
      <View className="px-5 h-14 justify-center border-b border-gray-100">
        <Text className="text-lg font-black text-gray-900 tracking-tight">My Orders</Text>
      </View>
    </SafeAreaView>
  );
}

function SignInPrompt({ title, subtitle }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-5 border border-gray-100">
        <LogIn size={32} color="#9CA3AF" />
      </View>
      <Text className="text-xl font-black text-gray-900 mb-2 text-center">{title}</Text>
      <Text className="text-sm text-gray-500 mb-6 text-center">{subtitle}</Text>
      <Pressable
        onPress={() => router.push('/login')}
        className="bg-gray-900 px-6 py-3 rounded-xl"
      >
        <Text className="text-white text-sm font-bold">Log In</Text>
      </Pressable>
    </View>
  );
}