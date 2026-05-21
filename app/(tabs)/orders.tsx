import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Text className="text-lg font-bold text-gray-700">Orders</Text>
      <Text className="text-sm text-gray-400 mt-2">Coming when we port the orders page</Text>
    </SafeAreaView>
  );
}