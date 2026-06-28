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
import { Eye, EyeOff, MailCheck } from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { toast } from '@/utils/toast';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function SignupScreen() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false); // ← verification-sent state
  const [resending, setResending] = useState(false);

  const handleField = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const {
    signIn: googleSignIn,
    loading: googleLoading,
    ready: googleReady,
  } = useGoogleAuth({
    onSuccess: () => {
      toast.success('Account created with Google!');
    },
  });

  const handleSignup = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/v1/auth/register', form);
      setSubmitted(true); // show the "check your inbox" screen
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.message || data?.error || data?.password || 'Registration failed. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api.post('/v1/auth/resend-verification', { email: form.email });
      toast.success('Verification email sent again.');
    } catch {
      toast.error('Could not resend right now. Try again shortly.');
    } finally {
      setResending(false);
    }
  };

  const anyLoading = loading || googleLoading;

  // ── Verification-sent screen ──
  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <View className="flex-1 justify-center items-center">
            <View className="w-16 h-16 bg-green-50 rounded-full items-center justify-center mb-5">
              <MailCheck size={32} color="#16a34a" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Check your inbox
            </Text>
            <Text className="text-sm text-gray-500 mb-1 text-center">
              We sent a verification link to
            </Text>
            <Text className="text-sm font-bold text-gray-900 mb-6 text-center">
              {form.email}
            </Text>
            <Text className="text-sm text-gray-500 leading-relaxed mb-6 text-center">
              Tap the link in that email to activate your account. The link expires in 24 hours. Don't forget to check your spam folder.
            </Text>

            <Pressable
              onPress={resend}
              disabled={resending}
              className={`w-full bg-gray-900 rounded-xl py-3.5 items-center mb-3 ${resending ? 'opacity-50' : ''}`}
            >
              <Text className="text-white font-bold uppercase tracking-widest text-xs">
                {resending ? 'Sending…' : 'Resend email'}
              </Text>
            </Pressable>

            <Pressable onPress={() => router.replace('/login')}>
              <Text className="text-sm font-bold text-blue-600">Back to login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
              Create Account
            </Text>
            <Text className="text-sm text-gray-500 mb-8">
              Join us to track orders and checkout faster
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
                  <Text className="text-sm font-bold text-gray-800">
                    Sign up with Google
                  </Text>
                </>
              )}
            </Pressable>

            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Or register with email
              </Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* First + Last name */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-700 mb-1.5">
                  First Name
                </Text>
                <TextInput
                  value={form.firstName}
                  onChangeText={(v) => handleField('firstName', v)}
                  editable={!anyLoading}
                  autoCapitalize="words"
                  className="border border-gray-300 rounded-xl p-3.5 text-sm font-medium text-gray-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-700 mb-1.5">
                  Last Name
                </Text>
                <TextInput
                  value={form.lastName}
                  onChangeText={(v) => handleField('lastName', v)}
                  editable={!anyLoading}
                  autoCapitalize="words"
                  className="border border-gray-300 rounded-xl p-3.5 text-sm font-medium text-gray-900"
                />
              </View>
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-sm font-bold text-gray-700 mb-1.5">
                Email Address
              </Text>
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

            {/* Password */}
            <View className="mb-6">
              <Text className="text-sm font-bold text-gray-700 mb-1.5">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  value={form.password}
                  onChangeText={(v) => handleField('password', v)}
                  editable={!anyLoading}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  autoComplete="password-new"
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
              <Text className="text-xs text-gray-400 mt-2">
                Must be at least 8 characters
              </Text>
            </View>

            <Pressable
              onPress={handleSignup}
              disabled={anyLoading}
              className={`bg-blue-600 rounded-xl py-4 items-center
                ${anyLoading ? 'opacity-50' : ''}`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold uppercase tracking-widest text-xs">
                  Sign Up
                </Text>
              )}
            </Pressable>

            <View className="flex-row justify-center mt-8">
              <Text className="text-sm text-gray-500">Already have an account? </Text>
              <Pressable onPress={() => router.push('/login')}>
                <Text className="text-sm font-bold text-blue-600">Log In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}