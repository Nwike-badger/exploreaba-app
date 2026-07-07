import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MailCheck, XCircle } from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/utils/toast';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token;
  const { login } = useAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    api.post('/v1/auth/verify-email', { token })
      .then(async (res) => {
        const accessToken = res.data?.accessToken;
        const refreshToken = res.data?.refreshToken;
        setStatus('success');
        if (accessToken) {
          await login(accessToken, refreshToken);
          setTimeout(() => router.replace('/'), 1600);
        } else {
          setTimeout(() => router.replace('/login'), 1600);
        }
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err?.response?.data?.error || 'This verification link is invalid or has expired.');
      });
  }, [token]);

  const resend = async () => {
    if (!resendEmail.trim()) { toast.error('Enter your email first.'); return; }
    setResending(true);
    try {
      await api.post('/v1/auth/resend-verification', { email: resendEmail.trim() });
      toast.success('If that account needs verifying, a new link is on its way.');
    } catch {
      toast.error('Could not send right now. Try again shortly.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <View className="flex-1 justify-center items-center">

          {status === 'verifying' ? (
            <>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-xl font-bold text-gray-900 mt-5">Verifying your email…</Text>
              <Text className="text-sm text-gray-500 mt-2">Just a moment.</Text>
            </>
          ) : null}

          {status === 'success' ? (
            <>
              <View className="w-16 h-16 bg-green-50 rounded-full items-center justify-center mb-5">
                <MailCheck size={32} color="#16a34a" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Email verified!</Text>
              <Text className="text-sm text-gray-500 mb-5 text-center">
                Your account is active. Signing you in…
              </Text>
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#2563eb" />
                <Text className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Redirecting
                </Text>
              </View>
              <Pressable onPress={() => router.replace('/')} className="mt-5">
                <Text className="text-sm font-bold text-blue-600">Continue now</Text>
              </Pressable>
            </>
          ) : null}

          {status === 'error' ? (
            <>
              <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-5">
                <XCircle size={32} color="#ef4444" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Verification failed</Text>
              <Text className="text-sm text-gray-500 mb-6 text-center">{message}</Text>

              <View className="w-full">
                <Text className="text-xs font-bold text-gray-700 mb-1.5">Request a new link</Text>
                <TextInput
                  value={resendEmail}
                  onChangeText={setResendEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  className="border border-gray-300 rounded-xl p-3 text-sm font-medium text-gray-900 mb-3"
                />
                <Pressable
                  onPress={resend}
                  disabled={resending}
                  className={`w-full bg-gray-900 rounded-xl py-3 items-center ${resending ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white font-bold uppercase tracking-widest text-xs">
                    {resending ? 'Sending…' : 'Send new link'}
                  </Text>
                </Pressable>
              </View>

              <Pressable onPress={() => router.replace('/login')} className="mt-5">
                <Text className="text-sm font-bold text-blue-600">Back to login</Text>
              </Pressable>
            </>
          ) : null}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}