import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  ChevronLeft, Lock, MapPin, ShieldCheck, CreditCard,
  ShoppingBag, UserCheck,
} from 'lucide-react-native';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/axiosConfig';
import { toast } from '@/utils/toast';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import AddressForm from '@/components/AddressForm';

WebBrowser.maybeCompleteAuthSession();

// ── Inline auth widget (compact version of login/signup just for checkout) ──
function InlineAuth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { refreshCart } = useCart();

  const handleField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const { signIn: googleSignIn, loading: googleLoading, ready: googleReady } = useGoogleAuth({
    onSuccess: () => {
      toast.success("Logged in! Let's complete your order.");
      onAuthenticated?.();
    },
  });

  const submit = async () => {
    setLoading(true);
    try {
      const guestId = await AsyncStorage.getItem('guest_cart_id');

      if (mode === 'login') {
        const res = await api.post('/v1/auth/login', {
          username: form.email,
          password: form.password,
          guestId,
        });
        await login(res.data.accessToken);
        toast.success("Welcome back!");
      } else {
        await api.post('/v1/auth/register', form);
        const res = await api.post('/v1/auth/login', {
          username: form.email,
          password: form.password,
          guestId,
        });
        await login(res.data.accessToken);
        toast.success("Account created!");
      }
      await AsyncStorage.removeItem('guest_cart_id');
      refreshCart();
      onAuthenticated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const anyLoading = loading || googleLoading;

  return (
    <View>
      <Text className="text-xl font-black text-gray-900 mb-1 tracking-tight">
        Account Details
      </Text>
      <Text className="text-sm text-gray-500 mb-6">
        Sign in or create an account to secure your order.
      </Text>

      <Pressable
        onPress={googleSignIn}
        disabled={!googleReady || anyLoading}
        className={`flex-row items-center justify-center gap-3 border border-gray-300 rounded-xl py-3.5 mb-6
          ${(!googleReady || anyLoading) ? 'opacity-50' : ''}`}
      >
        {googleLoading ? (
          <ActivityIndicator color="#374151" />
        ) : (
          <>
            <Text className="text-lg font-bold" style={{ color: '#4285F4' }}>G</Text>
            <Text className="text-sm font-bold text-gray-800">Continue with Google</Text>
          </>
        )}
      </Pressable>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="mx-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Or continue with email
        </Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      {/* Mode toggle */}
      <View className="flex-row bg-gray-100 p-1 rounded-xl mb-5">
        <Pressable
          onPress={() => setMode('login')}
          className={`flex-1 py-2.5 rounded-lg ${mode === 'login' ? 'bg-white' : ''}`}
        >
          <Text className={`text-center text-sm font-bold ${mode === 'login' ? 'text-gray-900' : 'text-gray-500'}`}>
            Log In
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('signup')}
          className={`flex-1 py-2.5 rounded-lg ${mode === 'signup' ? 'bg-white' : ''}`}
        >
          <Text className={`text-center text-sm font-bold ${mode === 'signup' ? 'text-gray-900' : 'text-gray-500'}`}>
            Create Account
          </Text>
        </Pressable>
      </View>

      {mode === 'signup' && (
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900 mb-1.5">First Name</Text>
            <TextInput
              value={form.firstName}
              onChangeText={(v) => handleField('firstName', v)}
              editable={!anyLoading}
              autoCapitalize="words"
              className="border border-gray-300 rounded-xl p-3.5 text-sm font-medium text-gray-900"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900 mb-1.5">Last Name</Text>
            <TextInput
              value={form.lastName}
              onChangeText={(v) => handleField('lastName', v)}
              editable={!anyLoading}
              autoCapitalize="words"
              className="border border-gray-300 rounded-xl p-3.5 text-sm font-medium text-gray-900"
            />
          </View>
        </View>
      )}

      <View className="mb-4">
        <Text className="text-sm font-bold text-gray-900 mb-1.5">Email</Text>
        <TextInput
          value={form.email}
          onChangeText={(v) => handleField('email', v)}
          editable={!anyLoading}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          className="border border-gray-300 rounded-xl p-3.5 text-sm font-medium text-gray-900"
        />
      </View>

      <View className="mb-5">
        <Text className="text-sm font-bold text-gray-900 mb-1.5">Password</Text>
        <TextInput
          value={form.password}
          onChangeText={(v) => handleField('password', v)}
          editable={!anyLoading}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          className="border border-gray-300 rounded-xl p-3.5 text-sm font-medium text-gray-900"
        />
      </View>

      <Pressable
        onPress={submit}
        disabled={anyLoading || !form.email || !form.password ||
                  (mode === 'signup' && (!form.firstName || !form.lastName))}
        className={`bg-gray-900 rounded-xl py-4 items-center
          ${(anyLoading || !form.email || !form.password) ? 'opacity-50' : ''}`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-black text-xs uppercase tracking-widest">
            {mode === 'login' ? 'Log In to Continue' : 'Create Account & Continue'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

// ── Main Checkout Screen ───────────────────────────────────────────────────
export default function CheckoutScreen() {
  const { cartItems, cartTotal } = useCart();
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    streetAddress: '', city: '', state: '', phoneNumber: '', country: 'Nigeria',
  });
  const [hasSavedAddress, setHasSavedAddress] = useState(false);

  // Hydrate saved address from user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.defaultAddress) {
      setAddress(user.defaultAddress);
      setHasSavedAddress(true);
    }
  }, [isAuthenticated, user]);

  const isAddressValid = hasSavedAddress || !!(
    address.streetAddress?.trim() &&
    address.city?.trim() &&
    address.state?.trim() &&
    address.phoneNumber?.trim()
  );

  // Empty cart fallback
  if (cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <View className="w-24 h-24 bg-gray-50 rounded-full items-center justify-center mb-6">
          <ShoppingBag size={40} color="#D1D5DB" />
        </View>
        <Text className="text-2xl font-black text-gray-900 mb-3">Your cart is empty</Text>
        <Text className="text-sm text-gray-500 text-center mb-8">
          You need items in your cart to proceed to checkout.
        </Text>
        <Pressable
          onPress={() => router.replace('/')}
          className="bg-gray-900 px-8 py-4 rounded-xl"
        >
          <Text className="text-white font-bold uppercase tracking-widest text-xs">
            Return to Store
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-4">
          Securing Checkout...
        </Text>
      </SafeAreaView>
    );
  }

  const trySaveCheckoutAddress = async () => {
    try {
      const res = await api.put('/v1/users/me/address', { address });
      updateUser?.(res.data);
    } catch (err) {
      console.warn('Could not auto-save checkout address:', err);
    }
  };

  const handlePay = async () => {
    setLoading(true);

    const invalidItems = cartItems.filter((item) => !item.variantId);
    if (invalidItems.length > 0) {
      toast.error(
        'Some items in your cart are no longer available. Please remove them and re-add the products.',
        { duration: 6000 }
      );
      setLoading(false);
      return;
    }

    if (!hasSavedAddress) {
      await trySaveCheckoutAddress();
    }

    try {
      // 1. Create order
      const orderRes = await api.post('/v1/orders', {
        items: cartItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        shippingAddress: address,
        billingAddress: address,
      });
      const order = orderRes.data;
      if (!order?.orderId) throw new Error('Order created but no orderId returned.');

      // 2. Init payment with mobile-specific returnUrl
      const returnUrl = Linking.createURL('payment-callback');
      const paymentRes = await api.post(`/v1/payments/init/${order.orderId}`, {
        returnUrl,
      });
      const checkoutUrl = paymentRes.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('No checkout URL returned.');

      // 3. Open Monnify in in-app browser; resolves when redirect matches returnUrl
      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);

      // 4. Navigate to payment-callback regardless of outcome — the screen
      //    will poll the backend as the source of truth. Pass any params we
      //    got from the redirect so the UI can show them immediately.
      let extraParams = {};
      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        extraParams = parsed.queryParams || {};
      }

      router.replace({
        pathname: '/payment-callback',
        params: {
          paymentReference: order.orderId,
          ...extraParams,
        },
      });
    } catch (error) {
      if (error.response?.status === 409) {
        const msg = error.response?.data?.message || '';
        if (msg.includes('variant') || msg.includes('not found')) {
          toast.error('Some items are outdated. Remove them and re-add.', { duration: 8000 });
        } else {
          toast.error(msg || 'Could not place order.');
        }
      } else {
        toast.error(
          error.response?.data?.message || error.message || 'Failed to initialize checkout.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const payButtonLabel =
    loading      ? 'Processing...' :
    !isAuthenticated ? 'Sign In to Proceed' :
    !isAddressValid  ? 'Complete Address' :
    `Pay ₦${cartTotal.toLocaleString()}`;
  const payDisabled = loading || !isAuthenticated || !isAddressValid;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between px-2 h-14 border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-black text-gray-900 tracking-tight">
              Secure Checkout
            </Text>
            <Lock size={16} color="#D1D5DB" />
          </View>
          <View className="w-10" />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Auth OR Address */}
          <View className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            {!isAuthenticated ? (
              <InlineAuth onAuthenticated={() => {}} />
            ) : (
              <View>
                <Text className="text-xl font-black text-gray-900 mb-1 tracking-tight">
                  Delivery Address
                </Text>
                <View className="flex-row items-center gap-1.5 mb-5">
                  <UserCheck size={14} color="#22c55e" />
                  <Text className="text-xs text-gray-500">
                    Logged in as <Text className="font-bold text-gray-900">{user?.email}</Text>
                  </Text>
                </View>

                {hasSavedAddress ? (
                  <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <View className="flex-row items-start gap-3 mb-3">
                      <View className="w-9 h-9 bg-white rounded-full items-center justify-center">
                        <MapPin size={16} color="#2563eb" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-black text-gray-900 mb-1">Delivery Destination</Text>
                        <Text className="text-sm font-bold text-gray-900">{address.phoneNumber}</Text>
                        <Text className="text-sm text-gray-600 mt-1">{address.streetAddress}</Text>
                        <Text className="text-sm text-gray-600">{address.city}, {address.state}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => setHasSavedAddress(false)}
                      className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 self-start"
                    >
                      <Text className="text-xs font-bold text-gray-900">
                        Use a different address
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <AddressForm address={address} setAddress={setAddress} loading={loading} />
                )}
              </View>
            )}
          </View>

          {/* Order Summary */}
          <View className="bg-white rounded-2xl border border-gray-100 p-5">
            <Text className="text-base font-black text-gray-900 mb-4 tracking-tight">
              Order Summary
            </Text>

            <View className="gap-3 mb-4">
              {cartItems.map((item, idx) => (
                <View key={`${item.variantId}-${idx}`} className="flex-row justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900" numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</Text>
                  </View>
                  <Text className="font-black text-gray-900">
                    ₦{Number(item.subTotal ?? 0).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>

            <View className="border-t border-gray-100 pt-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Subtotal</Text>
                <Text className="text-sm font-bold text-gray-900">
                  ₦{cartTotal.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-gray-500">Delivery</Text>
                <View className="bg-green-50 px-2 py-0.5 rounded">
                  <Text className="text-[10px] font-black text-green-700 uppercase tracking-widest">
                    Free
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky bottom Pay bar */}
      <SafeAreaView edges={['bottom']} className="bg-white border-t border-gray-200">
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-gray-900 uppercase tracking-widest">
              Total
            </Text>
            <Text className="text-2xl font-black text-gray-900">
              ₦{cartTotal.toLocaleString()}
            </Text>
          </View>
          <Pressable
            onPress={handlePay}
            disabled={payDisabled}
            className={`rounded-xl py-4 flex-row items-center justify-center gap-2
              ${payDisabled ? 'bg-gray-200' : 'bg-blue-600'}`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                {!payDisabled && <CreditCard size={16} color="#fff" />}
                <Text
                  className={`font-black text-xs uppercase tracking-widest
                    ${payDisabled ? 'text-gray-400' : 'text-white'}`}
                >
                  {payButtonLabel}
                </Text>
              </>
            )}
          </Pressable>
          <View className="flex-row items-center justify-center gap-1.5 mt-2">
            <ShieldCheck size={12} color="#16a34a" />
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Powered by Flutterwave · Paystack
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}