import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AccountScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white px-5 pt-8">
      <Text className="text-2xl font-black text-gray-900 mb-2">Account</Text>
      {isAuthenticated ? (
        <>
          <Text className="text-base text-gray-700 mb-1">
            Hi, {user?.firstName || 'there'}
          </Text>
          <Text className="text-sm text-gray-500 mb-6">{user?.email}</Text>
          <Pressable
            onPress={() => logout()}
            className="bg-red-50 px-4 py-3 rounded-xl items-center"
          >
            <Text className="text-red-600 font-bold">Log Out</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text className="text-sm text-gray-500 mb-6">
            Sign in to access your orders, wishlist and more.
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/login')}
              className="flex-1 bg-green-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold">Log In</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/signup')}
              className="flex-1 bg-white border border-gray-200 py-3 rounded-xl items-center"
            >
              <Text className="text-gray-900 font-bold">Sign Up</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}