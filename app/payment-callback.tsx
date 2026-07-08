import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { CheckCircle, ShieldAlert, Sparkles, ArrowRight, ArrowLeft, Clock, PackageSearch } from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { useCart } from '@/context/CartContext';

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL = 3000;
const INITIAL_DELAY = 2500;

// What our SERVER reports (the only source of truth for a confirmed order).
const SUCCESS_STATUSES = ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
const DEAD_STATUSES = ['CANCELLED', 'FAILED'];

// Redirect hints from the gateway. NEVER trusted as proof of payment —
// used ONLY to choose the right message if our own polling times out.
// Flutterwave sends "successful"/"cancelled"; Monnify sends "PAID".
const POSITIVE_HINTS = ['completed', 'successful', 'success', 'paid'];
const CANCEL_HINTS = ['cancelled', 'canceled'];

export default function PaymentCallbackScreen() {
  const params = useLocalSearchParams();
  const { clearCart, refreshCart } = useCart();

  // Checkout always forwards paymentReference=orderId, so this is robust across
  // gateways. tx_ref covers Flutterwave; reference covers Paystack/Monnify.
  const orderId =
    params.paymentReference ||
    params.reference ||
    params.tx_ref;

  // Flutterwave: transaction_id · Monnify: transactionReference
  const transactionRef =
    params.transactionReference ||
    params.transaction_id;

  // Flutterwave: ?status= · Monnify: ?paymentStatus=
  const redirectHint = (params.status || params.paymentStatus || '')
    .toString()
    .toLowerCase();

  const [status, setStatus] = useState('verifying');   // verifying | success | pending | failed
  const [wasCancelled, setWasCancelled] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');

  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  // Starts (or restarts) the polling loop. Hints only affect the timeout outcome.
  const startVerification = useCallback((positiveHint, cancelHint) => {
    if (!orderId) { setStatus('failed'); return; }
    let attempts = 0;

    // Polling ran out with no definite server answer — order is still
    // PENDING_PAYMENT. Decide the message from the gateway hint.
    const settleOnTimeout = () => {
      if (!mountedRef.current) return;
      if (positiveHint) {
        // Gateway said the charge went through — our webhook is just late.
        clearCart().finally(() => { if (mountedRef.current) refreshCart(); });
        setStatus('pending');
      } else if (cancelHint) {
        setWasCancelled(true);
        setStatus('failed');
      } else {
        setStatus('failed');
      }
    };

    const poll = async () => {
      if (!mountedRef.current) return;
      attempts++;
      setAttemptCount(attempts);

      try {
        // Smart verify: fast path reads our DB, slow path asks the gateway of record.
        // _t cache-busts so we never get served a stale 304.
        const res = await api.get(`/v1/payments/verify/${orderId}`, {
          params: { _t: Date.now() },
        });
        const orderStatus = res.data?.status;

        if (SUCCESS_STATUSES.includes(orderStatus)) {
          await clearCart();
          if (mountedRef.current) refreshCart();
          if (mountedRef.current) setStatus('success');
          return;
        }

        if (DEAD_STATUSES.includes(orderStatus)) {
          if (mountedRef.current) {
            setWasCancelled(cancelHint || orderStatus === 'CANCELLED');
            setStatus('failed');
          }
          return;
        }

        // Still PENDING_PAYMENT — keep polling until we run out.
        if (attempts < MAX_ATTEMPTS) {
          timerRef.current = setTimeout(poll, POLL_INTERVAL);
        } else {
          settleOnTimeout();
        }
      } catch {
        if (attempts < MAX_ATTEMPTS) {
          timerRef.current = setTimeout(poll, POLL_INTERVAL);
        } else {
          settleOnTimeout();
        }
      }
    };

    timerRef.current = setTimeout(poll, INITIAL_DELAY);
  }, [orderId, clearCart, refreshCart]);

  useEffect(() => {
    mountedRef.current = true;

    if (!orderId) {
      setStatus('failed');
      return;
    }

    startVerification(
      POSITIVE_HINTS.includes(redirectHint),
      CANCEL_HINTS.includes(redirectHint),
    );

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Only orderId matters; hint params are stable for a given orderId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Retry reuses the SAME order on the backend — no new stock hold, no double charge.
  const handleRetry = async () => {
    if (!orderId) { router.replace('/checkout'); return; }
    setRetrying(true);
    setRetryError('');
    try {
      const returnUrl = Linking.createURL('payment-callback');
      const res = await api.post(`/v1/payments/retry/${orderId}`, { returnUrl });
      const retryUrl = res.data?.checkoutUrl;

      if (!retryUrl) {
        setRetrying(false);
        router.replace('/checkout');
        return;
      }

      // Reopen the gateway in the in-app browser; same pattern as initial pay.
      const result = await WebBrowser.openAuthSessionAsync(retryUrl, returnUrl);

      // Pull any fresh hint from the retry redirect.
      let hint = '';
      if (result.type === 'success' && result.url) {
        const qp = Linking.parse(result.url).queryParams || {};
        hint = (qp.status || qp.paymentStatus || '').toString().toLowerCase();
      }

      if (!mountedRef.current) return;
      setRetrying(false);
      setWasCancelled(false);
      setStatus('verifying');
      setAttemptCount(0);
      if (timerRef.current) clearTimeout(timerRef.current);
      startVerification(
        POSITIVE_HINTS.includes(hint),
        CANCEL_HINTS.includes(hint),
      );
    } catch (e) {
      if (!mountedRef.current) return;
      setRetrying(false);
      setRetryError(
        e?.response?.data?.error ||
        'Could not restart payment. Please try again from your cart.'
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">

      {/* ── VERIFYING ─────────────────────────────────────────────── */}
      {status === 'verifying' && (
        <View className="bg-white rounded-3xl border border-gray-100 p-8 w-full max-w-md items-center">
          <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6 border border-blue-100">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
          <Text className="text-xl font-black text-gray-900 mb-2 tracking-tight">
            Confirming Your Payment
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Please don't close this screen. We're confirming your payment with the bank.
          </Text>

          {attemptCount > 1 && (
            <View className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <View className="flex-row justify-between mb-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Verifying
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

      {/* ── SUCCESS ───────────────────────────────────────────────── */}
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

      {/* ── PENDING (payment received, still finalizing) ──────────── */}
      {status === 'pending' && (
        <View className="bg-white rounded-3xl border border-gray-100 p-8 w-full max-w-md items-center">
          <View className="w-20 h-20 bg-amber-50 rounded-full items-center justify-center mb-6 border border-amber-100">
            <Clock size={42} color="#f59e0b" />
          </View>
          <Text className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
            Payment Processing
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-2 leading-relaxed">
            We've received your payment and are finalizing your order. This can take a few minutes for bank transfers.
          </Text>
          <Text className="text-xs text-gray-400 text-center mb-6">
            You'll get a confirmation email the moment it's complete — you can safely close this screen.
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
              className="flex-1 bg-gray-900 py-4 rounded-xl flex-row items-center justify-center gap-2"
            >
              <PackageSearch size={15} color="#fff" />
              <Text className="text-white font-bold text-sm">Check Order</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/')}
              className="flex-1 bg-blue-50 border border-blue-100 py-4 rounded-xl items-center justify-center"
            >
              <Text className="text-blue-700 font-bold text-sm">Keep Shopping</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── FAILED / CANCELLED ────────────────────────────────────── */}
      {status === 'failed' && (
        <View className="bg-white rounded-3xl border border-gray-100 p-8 w-full max-w-md items-center">
          <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6 border border-red-100">
            <ShieldAlert size={44} color="#ef4444" />
          </View>
          <Text className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
            {wasCancelled ? 'Payment Cancelled' : 'Payment Not Completed'}
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
            {wasCancelled
              ? 'No charge was made. Your order is saved — you can complete payment whenever you\'re ready.'
              : 'We couldn\'t complete your payment. Your items are still saved. If you were charged, it will be reversed automatically.'}
          </Text>

          {retryError ? (
            <View className="w-full bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <Text className="text-xs font-semibold text-red-600 text-center">{retryError}</Text>
            </View>
          ) : null}

          <View className="w-full gap-3 mb-4">
            <Pressable
              onPress={handleRetry}
              disabled={retrying}
              className={`bg-gray-900 py-4 rounded-xl flex-row items-center justify-center gap-2 ${retrying ? 'opacity-60' : ''}`}
            >
              {retrying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white font-bold text-sm">
                    {wasCancelled ? 'Complete Payment' : 'Try Again'}
                  </Text>
                  <ArrowRight size={14} color="#fff" />
                </>
              )}
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