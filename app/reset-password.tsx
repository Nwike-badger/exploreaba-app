import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react-native';
import api from '@/services/axiosConfig';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // ── Missing token ──
  if (!token) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <View className="flex-1 justify-center items-center">
            <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-5">
              <XCircle size={32} color="#ef4444" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Invalid link</Text>
            <Text className="text-sm text-gray-500 mb-6 text-center">
              This password reset link is missing its token. Request a fresh one.
            </Text>
            <Pressable
              onPress={() => router.replace('/forgot-password')}
              className="w-full bg-gray-900 rounded-xl py-3.5 items-center"
            >
              <Text className="text-white font-bold uppercase tracking-widest text-xs">
                Request new link
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/v1/auth/reset-password', { token, newPassword: password });
      setDone(true);
    } catch (err: any) {
      const data = err?.response?.data;
      const fieldMsg = data && typeof data === 'object'
        ? data.error || data.newPassword || data.token || Object.values(data)[0]
        : null;
      setError((fieldMsg as string) || 'Could not reset your password. Please check the form and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success ──
  if (done) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <View className="flex-1 justify-center items-center">
            <View className="w-16 h-16 bg-green-50 rounded-full items-center justify-center mb-5">
              <CheckCircle size={32} color="#16a34a" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Password reset!</Text>
            <Text className="text-sm text-gray-500 mb-6 text-center">
              Your password has been updated. Any active sessions were signed out for security.
            </Text>
            <Pressable
              onPress={() => router.replace('/login')}
              className="w-full bg-gray-900 rounded-xl py-3.5 items-center"
            >
              <Text className="text-white font-bold uppercase tracking-widest text-xs">
                Go to login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const linkExpiredish =
    error.includes('expired') || error.includes('invalid') || error.includes('used');

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
            <Text className="text-2xl font-bold text-gray-900 mb-2">Set a new password</Text>
            <Text className="text-sm text-gray-500 mb-8">
              Choose a strong password you haven't used before.
            </Text>

            {error ? (
              <View className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                <Text className="text-red-600 text-sm font-medium">{error}</Text>
                {linkExpiredish ? (
                  <Pressable onPress={() => router.replace('/forgot-password')}>
                    <Text className="text-red-700 font-bold underline text-sm mt-1.5">
                      Request a new link
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* New password */}
            <View className="mb-4">
              <Text className="text-sm font-bold text-gray-700 mb-1.5">New Password</Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  className="border border-gray-300 rounded-xl p-3.5 pr-12 text-sm font-medium text-gray-900"
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-2 p-2"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                </Pressable>
              </View>
              <Text className="text-xs text-gray-400 mt-2">Must be at least 8 characters</Text>
            </View>

            {/* Confirm password */}
            <View className="mb-6">
              <Text className="text-sm font-bold text-gray-700 mb-1.5">Confirm Password</Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                editable={!loading}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-300 rounded-xl p-3.5 text-sm font-medium text-gray-900"
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className={`bg-gray-900 rounded-xl py-4 items-center ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold uppercase tracking-widest text-xs">
                  Reset password
                </Text>
              )}
            </Pressable>

            <View className="flex-row justify-center mt-8">
              <Pressable onPress={() => router.replace('/login')}>
                <Text className="text-sm font-bold text-blue-600">Back to login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}