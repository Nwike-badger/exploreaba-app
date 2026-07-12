import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  User, MapPin, Package, Settings, AlertCircle, CheckCircle,
  LogOut, ShieldCheck, ChevronRight, LogIn,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import AddressForm from '@/components/AddressForm';
import { toast } from '@/utils/toast';

export default function AccountScreen() {
  const { updateUser, logout, isAuthenticated, loading: authLoading } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressForm, setAddressForm] = useState({
    streetAddress: '', city: '', state: '', phoneNumber: '', country: 'Nigeria',
  });

  const fetchUser = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setFetchFailed(false);

    try {
      const res = await api.get('/v1/users/me');
      setUser(res.data);
      if (res.data.defaultAddress) {
        setAddressForm(res.data.defaultAddress);
        setIsEditingAddress(false);
      } else {
        setIsEditingAddress(true);
      }
    } catch {
      // Token invalid/expired — show the sign-in prompt in place instead of
      // navigating from inside a data callback (axiosConfig's interceptor
      // already handles genuine session-expiry redirects on its own).
      setFetchFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetch whenever the tab comes into focus. No auto-redirect — an
  // unauthenticated user sees the in-screen sign-in prompt below. Navigating
  // synchronously during a focus-triggered mount is what caused the Fabric
  // "addViewAt" crash in the release build.
  useFocusEffect(
    useCallback(() => {
      if (authLoading || !isAuthenticated) return;
      fetchUser();
    }, [authLoading, isAuthenticated, fetchUser])
  );

  const handleAddressUpdate = async () => {
    if (!addressForm.streetAddress?.trim() || !addressForm.city?.trim() ||
        !addressForm.state?.trim() || !addressForm.phoneNumber?.trim()) {
      toast.error('Please fill in all address fields');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/v1/users/me/address', { address: addressForm });
      setUser(res.data);
      updateUser?.(res.data);
      setIsEditingAddress(false);
      toast.success('Address saved!');
    } catch {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || fetchFailed) {
    return (
      <View className="flex-1 bg-gray-50">
        <SafeAreaView edges={['top']} className="bg-white">
          <View className="px-5 h-14 justify-center border-b border-gray-100">
            <Text className="text-lg font-black text-gray-900 tracking-tight">My Account</Text>
          </View>
        </SafeAreaView>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-5 border border-gray-100">
            <LogIn size={32} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-black text-gray-900 mb-2 text-center">
            Sign in to your account
          </Text>
          <Text className="text-sm text-gray-500 mb-6 text-center">
            Log in to manage your profile, address, and orders.
          </Text>
          <Pressable
            onPress={() => router.push('/login')}
            className="bg-gray-900 px-6 py-3 rounded-xl"
          >
            <Text className="text-white text-sm font-bold">Log In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-3">
          Loading Profile...
        </Text>
      </SafeAreaView>
    );
  }

  const isAddressComplete = !!(
    user?.defaultAddress?.streetAddress &&
    user?.defaultAddress?.city &&
    user?.defaultAddress?.phoneNumber
  );

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.role === 'ROLE_ADMIN';

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="px-5 h-14 justify-center border-b border-gray-100">
          <Text className="text-lg font-black text-gray-900 tracking-tight">My Account</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchUser('refresh')}
            tintColor="#2563eb"
          />
        }
      >
        {!isAddressComplete && (
          <View className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex-row items-start gap-3">
            <View className="bg-white p-2 rounded-xl">
              <AlertCircle size={20} color="#f97316" />
            </View>
            <View className="flex-1">
              <Text className="text-orange-900 font-black text-base">
                Complete your profile
              </Text>
              <Text className="text-orange-800 text-xs mt-1">
                Add your shipping address to check out faster next time.
              </Text>
            </View>
          </View>
        )}

        <View className="bg-white rounded-2xl border border-gray-100 p-5 flex-row items-center gap-4">
          <View className="w-16 h-16 bg-gray-900 rounded-full items-center justify-center">
            <Text className="text-white text-2xl font-black">
              {user?.firstName?.charAt(0) || '?'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-black text-gray-900 tracking-tight" numberOfLines={1}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text className="text-sm text-gray-500" numberOfLines={1}>{user?.email}</Text>
            <View className="flex-row items-center gap-1.5 mt-2">
              <View className="flex-row items-center gap-1 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <CheckCircle size={10} color="#16a34a" />
                <Text className="text-[10px] font-bold text-green-700">Verified</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-2xl border border-gray-100 p-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <MapPin size={18} color="#2563eb" />
              <Text className="text-base font-black text-gray-900 tracking-tight">
                Shipping Address
              </Text>
            </View>
            {!isEditingAddress && isAddressComplete && (
              <Pressable
                onPress={() => setIsEditingAddress(true)}
                className="bg-gray-100 px-3 py-1.5 rounded-lg"
              >
                <Text className="text-xs font-bold text-gray-900">Edit</Text>
              </Pressable>
            )}
          </View>

          {isEditingAddress ? (
            <View>
              <AddressForm
                address={addressForm}
                setAddress={setAddressForm}
                loading={saving}
              />
              <View className="flex-row gap-2 mt-5">
                <Pressable
                  onPress={handleAddressUpdate}
                  disabled={saving}
                  className={`flex-1 bg-blue-600 rounded-xl py-3.5 items-center
                    ${saving ? 'opacity-50' : ''}`}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-black text-xs uppercase tracking-widest">
                      Save Address
                    </Text>
                  )}
                </Pressable>
                {isAddressComplete && (
                  <Pressable
                    onPress={() => {
                      setAddressForm(user.defaultAddress);
                      setIsEditingAddress(false);
                    }}
                    disabled={saving}
                    className="px-5 rounded-xl border border-gray-200 items-center justify-center"
                  >
                    <Text className="text-xs font-bold text-gray-700">Cancel</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : isAddressComplete ? (
            <View className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <Text className="font-black text-gray-900 mb-1">
                {user.firstName} {user.lastName}
              </Text>
              <Text className="text-sm font-bold text-gray-900">
                {user.defaultAddress.phoneNumber}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {user.defaultAddress.streetAddress}
              </Text>
              <Text className="text-sm text-gray-600">
                {user.defaultAddress.city}, {user.defaultAddress.state}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                {user.defaultAddress.country}
              </Text>
            </View>
          ) : (
            <View className="items-center py-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
              <MapPin size={28} color="#9CA3AF" />
              <Text className="text-base font-bold text-gray-900 mt-3">
                No Address Found
              </Text>
              <Text className="text-xs text-gray-500 mt-1 mb-4 text-center px-4">
                Add a delivery address to speed up checkout.
              </Text>
              <Pressable
                onPress={() => setIsEditingAddress(true)}
                className="bg-gray-900 px-5 py-2.5 rounded-xl"
              >
                <Text className="text-white text-sm font-bold">Add Address</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <MenuRow
            icon={<Package size={18} color="#374151" />}
            label="My Orders"
            onPress={() => router.push('/orders')}
          />
          <View className="h-px bg-gray-100 mx-5" />
          <MenuRow
            icon={<Settings size={18} color="#374151" />}
            label="Settings"
            onPress={() => toast('Settings coming soon')}
          />
          {isAdmin && (
            <>
              <View className="h-px bg-gray-100 mx-5" />
              <MenuRow
                icon={<ShieldCheck size={18} color="#1d4ed8" />}
                label="Admin Portal"
                labelClassName="text-blue-700 font-bold"
                onPress={() => toast('Admin portal not yet available on mobile')}
              />
            </>
          )}
        </View>

        <Pressable
          onPress={handleLogout}
          className="bg-white rounded-2xl border border-gray-100 flex-row items-center gap-3 px-5 py-4"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-base font-bold text-red-500">Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MenuRow({ icon, label, labelClassName, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-5 py-4"
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className={labelClassName || 'text-base font-medium text-gray-900'}>
          {label}
        </Text>
      </View>
      <ChevronRight size={16} color="#D1D5DB" />
    </Pressable>
  );
}