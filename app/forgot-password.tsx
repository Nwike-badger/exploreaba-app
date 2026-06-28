import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MailCheck, ArrowLeft } from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { toast } from '@/utils/toast';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async () => {
    try {
      await api.post('/v1/auth/forgot-password', { email: email.trim() });
      return true;
    } catch {
      toast.error('Something went wrong. Please try again.');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error('Enter your email first.');
      return;
    }
    setLoading(true);
    const ok = await submit();
    if (ok) setSubmitted(true);
    setLoading(false);
  };

  const resend = async () => {
    setResending(true);
    const ok = await submit();
    if (ok) toast.success('Reset link sent again.');
    setResending(false);
  };

  // ── Submitted screen ──
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
            <Text className="text-sm text-gray-500 mb-1 text-center">If an account exists for</Text>
            <Text className="text-sm font-bold text-gray-900 mb-4 text-center">{email.trim()}</Text>
            <Text className="text-sm text-gray-500 leading-relaxed mb-6 text-center">
              we've sent a link to reset your password. It expires in 15 minutes. Don't forget to check spam.
            </Text>

            <Pressable
              onPress={resend}
              disabled={resending}
              className={`w-full bg-gray-900 rounded-xl py-3.5 items-center mb-3 ${resending ? 'opacity-50' : ''}`}
            >
              <Text className="text-white font-bold uppercase tracking-widest text-xs">
                {resending ? 'Sending…' : 'Resend link'}
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
            <Pressable
              onPress={() => router.replace('/login')}
              className="flex-row items-center gap-1.5 mb-6 self-start"
            >
              <ArrowLeft size={15} color="#9CA3AF" />
              <Text className="text-sm font-bold text-gray-400">Back to login</Text>
            </Pressable>

            <Text className="text-2xl font-bold text-gray-900 mb-2">Forgot password?</Text>
            <Text className="text-sm text-gray-500 mb-8">
              Enter your email and we'll send you a link to reset it.
            </Text>

            <View className="mb-6">
              <Text className="text-sm font-bold text-gray-700 mb-1.5">Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="you@example.com"
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
                  Send reset link
                </Text>
              )}
            </Pressable>

            <View className="flex-row justify-center mt-8">
              <Text className="text-sm text-gray-500">Remembered it? </Text>
              <Pressable onPress={() => router.replace('/login')}>
                <Text className="text-sm font-bold text-blue-600">Log In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}