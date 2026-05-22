import { View, Text, Pressable } from 'react-native';
import { Truck, ShieldCheck, RotateCcw, Store } from 'lucide-react-native';

const getDeliveryWindow = () => {
  const addBusinessDays = (date, days) => {
    const d = new Date(date);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    return d;
  };
  const fmt = (d) => d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  return `${fmt(addBusinessDays(new Date(), 3))} – ${fmt(addBusinessDays(new Date(), 7))}`;
};

const TrustInfo = ({ seller }) => {
  const deliveryWindow = getDeliveryWindow();

  return (
    <View className="px-5 pb-6 gap-4">
      {/* Seller card */}
      <View className="bg-white border border-gray-100 rounded-2xl p-5">
        <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">
          Sold By
        </Text>

        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-11 h-11 bg-gray-900 rounded-full items-center justify-center">
            <Text className="text-white font-black text-base uppercase">
              {seller.name.charAt(0)}
            </Text>
          </View>
          <View>
            <Text className="font-black text-gray-900 text-sm">{seller.name}</Text>
            <Text className="text-[11px] text-green-600 font-bold">
              {seller.years}+ years selling
            </Text>
          </View>
        </View>

        <View className="flex-row bg-gray-50 rounded-xl p-3 mb-4">
          <View className="flex-1 items-center">
            <Text className="text-base font-black text-gray-900">{seller.rating}</Text>
            <Text className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">
              Rating
            </Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="flex-1 items-center">
            <Text className="text-base font-black text-gray-900">{seller.successRate}</Text>
            <Text className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">
              Delivery
            </Text>
          </View>
        </View>

        <Pressable className="flex-row items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5">
          <Store size={13} color="#374151" />
          <Text className="text-xs font-black text-gray-700">Visit Store</Text>
        </Pressable>
      </View>

      {/* Delivery & returns */}
      <View className="bg-white border border-gray-100 rounded-2xl p-5">
        <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">
          Delivery & Returns
        </Text>

        <View className="gap-4">
          <View className="flex-row gap-3">
            <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center">
              <Truck size={15} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-black text-gray-900">Fast Delivery</Text>
              <Text className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                Free on orders over ₦50,000. Est. arrival:{' '}
                <Text className="font-bold text-gray-700">{deliveryWindow}</Text>
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="w-8 h-8 bg-green-50 rounded-lg items-center justify-center">
              <RotateCcw size={15} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-black text-gray-900">7-Day Returns</Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">
                Not satisfied? Return for a full refund.
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="w-8 h-8 bg-amber-50 rounded-lg items-center justify-center">
              <ShieldCheck size={15} color="#d97706" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-black text-gray-900">Buyer Protection</Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">
                Full refund if item is late or misrepresented.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TrustInfo;