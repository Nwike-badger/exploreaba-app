import { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { CheckCircle, ShieldAlert, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { useCart } from '@/context/CartContext';

const MAX_ATTEMPTS = 8;
const POLL_INTERVAL = 3000;
const INITIAL_DELAY = 2500;

export default function PaymentCallbackScreen() {
  const params = useLocalSearchParams();
  const { clearCart, refreshCart } = useCart();

  // Same param names as the web flow — paymentReference == orderId in Monnify's convention
  const orderId = params.paymentReference;
  const monnifyStatus = params.paymentStatus;
  const transactionRef = params.transactionReference;

  const [status, setStatus] = useState('verifying');
  const [attemptCount, setAttemptCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!orderId || (monnifyStatus && monnifyStatus !== 'PAID')) {
      // User cancelled in the browser, OR Monnify reported a non-PAID status
      setStatus('failed');
      return;
    }

    let attempts = 0;

    const poll = async () => {
      attempts++;
      setAttemptCount(attempts);

      try {
        const res = await api.get(`/v1/orders/verify/${orderId}`);
        const orderStatus = res.data.status;

        if (['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(orderStatus)) {
          await clearCart();
          refreshCart();
          setStatus('success');
          return;
        }

        if (attempts < MAX_ATTEMPTS) {
          timerRef.current = setTimeout(poll, POLL_INTERVAL);
        } else {
          setStatus('failed');
        }
      } catch {
        if (attempts < MAX_ATTEMPTS) {
          timerRef.current = setTimeout(poll, POLL_INTERVAL);
        } else {
          setStatus('failed');
        }
      }
    };

    timerRef.current = setTimeout(poll, INITIAL_DELAY);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [orderId, monnifyStatus, clearCart, refreshCart]);

  const handleRetry = async () => {
    if (!orderId) {
      router.replace('/checkout');
      return;
    }
    try {
      const returnUrl = Linking.createURL('payment-callback');
      const res = await api.post(`/v1/payments/retry/${orderId}`, { returnUrl });
      const retryUrl = res.data?.checkoutUrl;

      if (retryUrl) {
        // Open the retry URL in the in-app browser; same pattern as initial pay
        await WebBrowser.openAuthSessionAsync(retryUrl, returnUrl);

        // Restart verification flow with same orderId
        setStatus('verifying');
        setAttemptCount(0);
        let attempts = 0;
        const poll = async () => {
          attempts++;
          setAttemptCount(attempts);
          try {
            const r = await api.get(`/v1/orders/verify/${orderId}`);
            if (['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(r.data.status)) {
              await clearCart();
              refreshCart();
              setStatus('success');
              return;
            }
            if (attempts < MAX_ATTEMPTS) setTimeout(poll, POLL_INTERVAL);
            else setStatus('failed');
          } catch {
            if (attempts < MAX_ATTEMPTS) setTimeout(poll, POLL_INTERVAL);
            else setStatus('failed');
          }
        };
        setTimeout(poll, INITIAL_DELAY);
      }
    } catch {
      router.replace('/checkout');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">

      {status === 'verifying' && (
        <View className="bg-white rounded-3xl border border-gray-100 p-8 w-full max-w-md items-center">
          <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6 border border-blue-100">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
          <Text className="text-xl font-black text-gray-900 mb-2 tracking-tight">
            Securing Your Order
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Please don't close this screen. We're confirming your payment with the bank.
          </Text>

          {attemptCount > 1 && (
            <View className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <View className="flex-row justify-between mb-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Verification
                </Text>
                <Text className="text-[10px] text-blue-600 font-black">
                  {Math.round((attemptCount / MAX_ATTEMPTS) * 100)}%
                </Text>
              </View>
              <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(attemptCount / MAX_ATTEMPTS) * 100}%` }}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {status === 'success' && (
        <View className="bg-white rounded-3xl border border-gray-100 p-8 w-full max-w-md items-center">
          <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6 border border-green-100">
            <CheckCircle size={44} color="#22c55e" />
          </View>
          <Text className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
            Payment Successful!
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Thank you for your purchase. We're preparing your items for delivery.
          </Text>

          {transactionRef && (
            <View className="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-6 w-full items-center">
              <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
                Transaction ID
              </Text>
              <Text className="text-xs font-mono font-black text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200">
                {transactionRef}
              </Text>
            </View>
          )}

          <View className="flex-row gap-3 w-full">
            <Pressable
              onPress={() => router.replace('/orders')}
              className="flex-1 bg-gray-900 py-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-sm">Track Order</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/')}
              className="flex-1 bg-blue-50 border border-blue-100 py-4 rounded-xl flex-row items-center justify-center gap-2"
            >
              <Sparkles size={14} color="#1d4ed8" />
              <Text className="text-blue-700 font-bold text-sm">Keep Shopping</Text>
            </Pressable>
          </View>
        </View>
      )}

      {status === 'failed' && (
        <View className="bg-white rounded-3xl border border-gray-100 p-8 w-full max-w-md items-center">
          <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6 border border-red-100">
            <ShieldAlert size={44} color="#ef4444" />
          </View>
          <Text className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
            Payment Failed
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
            We couldn't authorize your payment. Your items are still in your cart. If you were debited, the charge will be reversed.
          </Text>

          <View className="w-full gap-3 mb-4">
            <Pressable
              onPress={handleRetry}
              className="bg-gray-900 py-4 rounded-xl flex-row items-center justify-center gap-2"
            >
              <Text className="text-white font-bold text-sm">Try Another Method</Text>
              <ArrowRight size={14} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => router.replace('/orders')}
              className="bg-gray-50 border border-gray-200 py-4 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-bold text-sm">Check Order Status</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.replace('/')}
            className="flex-row items-center gap-1"
          >
            <ArrowLeft size={12} color="#9CA3AF" />
            <Text className="text-xs font-bold text-gray-400">Return to storefront</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}