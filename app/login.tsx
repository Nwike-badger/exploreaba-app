import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from '@/utils/toast';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { decodeJwtPayload, isAdminUser, postLoginRoute } from '@/utils/adminUtils';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Email verification state ──
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const { login } = useAuth();
  const { refreshCart } = useCart();

  // Google flow — the hook handles routing itself. We just show a role-aware toast.
  const {
    signIn: googleSignIn,
    loading: googleLoading,
    ready: googleReady,
  } = useGoogleAuth({
    onSuccess: (user) => {
      toast.success(isAdminUser(user) ? 'Welcome back, Admin! 🛡️' : 'Welcome back!');
    },
  });

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in both fields');
      return;
    }
    setLoading(true);
    setError('');
    setNeedsVerification(false);
    try {
      const guestId = await AsyncStorage.getItem('guest_cart_id');
      const response = await api.post('/v1/auth/login', {
        username: email.trim(),
        password,
        guestId,
      });
      const { accessToken, refreshToken } = response.data;
      await login(accessToken, refreshToken);
      await AsyncStorage.removeItem('guest_cart_id');
      refreshCart();

      const user = decodeJwtPayload(accessToken);
      toast.success(isAdminUser(user) ? 'Welcome back, Admin! 🛡️' : 'Welcome back!');
      router.replace(postLoginRoute(user) as any);
    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 403 && data?.error === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
        setUnverifiedEmail(data.email || email.trim());
        setError('');
      } else {
        setError('Invalid email or password');
      }
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post('/v1/auth/resend-verification', { email: unverifiedEmail });
      toast.success('Verification email sent. Check your inbox.');
    } catch {
      toast.error('Could not resend right now. Try again shortly.');
    } finally {
      setResending(false);
    }
  };

  const anyLoading = loading || googleLoading;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center">
            <Text className="text-3xl font-black text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-sm text-gray-500 mb-8">
              Log in to continue shopping
            </Text>

            {/* Google sign-in button */}
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
                  <Text className="text-sm font-bold text-gray-800">
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Or continue with email
              </Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* ── Email verification banner ── */}
            {needsVerification ? (
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <Text className="text-sm font-bold text-amber-800">
                  Verify your email to continue
                </Text>
                <Text className="text-xs text-amber-700 mt-1 leading-relaxed">
                  We sent a link to <Text className="font-semibold">{unverifiedEmail}</Text>. Tap it to activate your account, then log in.
                </Text>
                <Pressable
                  onPress={resendVerification}
                  disabled={resending}
                  className={`mt-3 self-start bg-amber-100 px-4 py-2 rounded-lg ${resending ? 'opacity-50' : ''}`}
                >
                  <Text className="text-xs font-bold text-amber-900">
                    {resending ? 'Sending…' : 'Resend verification email'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Error */}
            {error ? (
              <View className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                <Text className="text-red-600 text-sm font-medium">{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View className="mb-4">
              <Text className="text-sm font-bold text-gray-700 mb-1.5">
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                editable={!anyLoading}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-300 rounded-xl p-3.5 text-sm font-medium text-gray-900"
              />
            </View>

            {/* Password */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-sm font-bold text-gray-700">Password</Text>
                <Pressable onPress={() => router.push('/forgot-password')}>
                  <Text className="text-sm font-bold text-blue-600">Forgot?</Text>
                </Pressable>
              </View>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  editable={!anyLoading}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  autoComplete="password"
                  className="border border-gray-300 rounded-xl p-3.5 pr-12 text-sm font-medium text-gray-900"
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-2 p-2"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleLogin}
              disabled={anyLoading}
              className={`bg-gray-900 rounded-xl py-4 items-center
                ${anyLoading ? 'opacity-50' : ''}`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold uppercase tracking-widest text-xs">
                  Sign In
                </Text>
              )}
            </Pressable>

            {/* Footer */}
            <View className="flex-row justify-center mt-8">
              <Text className="text-sm text-gray-500">Don't have an account? </Text>
              <Pressable onPress={() => router.push('/signup')}>
                <Text className="text-sm font-bold text-blue-600">Create one</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}