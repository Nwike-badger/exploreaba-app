import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft, ArrowRight, MapPin, Star, Heart,
  Shield, Truck, Scissors, Package,
} from 'lucide-react-native';

const STATS = [
  { value: '500+', label: 'Products Listed' },
  { value: '36', label: 'States Delivered To' },
  { value: '100%', label: 'Made in Aba' },
  { value: '24/7', label: 'Customer Support' },
];

const CATEGORIES = [
  { emoji: '👞', label: 'Leather Shoes', desc: "Handcrafted men's and women's footwear from Aba's finest cobblers." },
  { emoji: '👜', label: 'Bags & Belts', desc: 'Genuine leather bags, wallets, and belts built to last for years.' },
  { emoji: '👗', label: 'Clothing & Natives', desc: 'Ready-to-wear Nigerian fashion, agbadas, and traditional attire.' },
  { emoji: '✂️', label: 'Custom Orders', desc: 'Bespoke clothing sewn to your exact measurements and personal style.' },
];

const VALUES = [
  { Icon: Star, title: 'Authentic Quality', desc: 'Every product is sourced directly from skilled Aba artisans and verified manufacturers — no counterfeits, no shortcuts.' },
  { Icon: Heart, title: 'Supporting Local', desc: 'When you shop with us, you invest directly in Nigerian craftsmanship and the families behind every piece.' },
  { Icon: Shield, title: 'Trusted & Secure', desc: 'Secure payments via Paystack, clear policies, and a team that stands fully behind every order placed.' },
  { Icon: Truck, title: 'Nationwide Reach', desc: 'From Lagos to Kano, Port Harcourt to Abuja — authentic Aba products delivered to every corner of Nigeria.' },
];

export default function AboutScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center px-2 h-14 border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center" accessibilityLabel="Back">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-base font-black text-gray-900 tracking-tight ml-1">About Us</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <View className="bg-gray-900 px-5 pt-8 pb-10">
          <View className="self-start flex-row items-center gap-1.5 bg-green-900 border border-green-700 px-3 py-1.5 rounded-full mb-4">
            <MapPin size={12} color="#4ade80" />
            <Text className="text-green-300 text-[11px] font-bold">Proudly Made in Aba, Nigeria</Text>
          </View>
          <Text className="text-white text-3xl font-black leading-tight mb-3">
            Nigeria's finest, delivered to you.
          </Text>
          <Text className="text-gray-300 text-sm leading-relaxed mb-6">
            ExploreAba connects you to the best of Aba's world-class craftsmanship — from handcrafted
            leather goods and fashion to fully custom-made clothing — delivered nationwide.
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            <Pressable
              onPress={() => router.push('/products')}
              className="flex-row items-center gap-2 bg-blue-600 px-5 py-3 rounded-xl"
            >
              <Text className="text-white font-bold text-sm">Shop Now</Text>
              <ArrowRight size={16} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/custom')}
              className="flex-row items-center gap-2 bg-gray-800 border border-gray-700 px-5 py-3 rounded-xl"
            >
              <Scissors size={15} color="#fff" />
              <Text className="text-white font-bold text-sm">Order Custom</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View className="bg-blue-600 flex-row flex-wrap px-5 py-6">
          {STATS.map(({ value, label }) => (
            <View key={label} className="w-1/2 items-center mb-3">
              <Text className="text-white text-2xl font-black">{value}</Text>
              <Text className="text-blue-100 text-xs font-medium mt-1">{label}</Text>
            </View>
          ))}
        </View>

        <View className="px-5 pt-8 gap-10">
          {/* Story */}
          <View>
            <Text className="text-[11px] font-black uppercase tracking-widest text-blue-600 mb-2">Our Story</Text>
            <Text className="text-2xl font-black text-gray-900 mb-4 leading-tight">
              Born from a belief in Nigerian excellence
            </Text>
            <View className="gap-3">
              <Text className="text-gray-600 text-[15px] leading-relaxed">
                Aba has been Nigeria's manufacturing heartbeat for decades. From the leather workshops of
                Ariaria International Market to the tailoring studios dotted across the city, Aba's artisans
                have long produced goods that rival international brands in quality — yet struggled to reach
                buyers across Nigeria.
              </Text>
              <Text className="text-gray-600 text-[15px] leading-relaxed">
                ExploreAba was created to change that. We built a platform where the best of Aba's
                craftsmanship — leather shoes, bags, clothing, and custom fashion — can reach anyone,
                anywhere in Nigeria, with trust, transparency, and convenience.
              </Text>
              <Text className="text-gray-600 text-[15px] leading-relaxed">
                We are more than a marketplace. We are a bridge between the skilled hands that make these
                goods and the customers who deserve to own them.
              </Text>
            </View>
          </View>

          {/* What we offer */}
          <View>
            <Text className="text-[11px] font-black uppercase tracking-widest text-blue-600 mb-2">What We Offer</Text>
            <Text className="text-2xl font-black text-gray-900 mb-4">Aba made, for you</Text>
            <View className="gap-3">
              {CATEGORIES.map(({ emoji, label, desc }) => (
                <View key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <Text className="text-2xl mb-2">{emoji}</Text>
                  <Text className="font-bold text-gray-900 mb-1">{label}</Text>
                  <Text className="text-sm text-gray-500 leading-relaxed">{desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Values */}
          <View>
            <Text className="text-[11px] font-black uppercase tracking-widest text-blue-600 mb-2">Our Values</Text>
            <Text className="text-2xl font-black text-gray-900 mb-4">What we stand for</Text>
            <View className="gap-3">
              {VALUES.map(({ Icon, title, desc }) => (
                <View key={title} className="bg-white rounded-2xl border border-gray-100 p-5 flex-row gap-3">
                  <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
                    <Icon size={18} color="#2563eb" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 mb-1">{title}</Text>
                    <Text className="text-sm text-gray-600 leading-relaxed">{desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Advantage */}
          <View className="bg-gray-900 rounded-3xl p-6">
            <Text className="text-[11px] font-black uppercase tracking-widest text-green-400 mb-2">
              The Aba Advantage
            </Text>
            <Text className="text-white text-2xl font-black mb-4 leading-tight">
              Why Aba is Nigeria's manufacturing capital
            </Text>
            <View className="gap-3">
              <Text className="text-gray-300 text-[15px] leading-relaxed">
                Aba, in Abia State, is home to Ariaria International Market — one of Africa's largest
                markets for locally manufactured goods. With over 100,000 artisans and manufacturers
                operating in the city, Aba produces an extraordinary range of products: leather shoes,
                bags, clothing, furniture, cosmetics, and more.
              </Text>
              <Text className="text-gray-300 text-[15px] leading-relaxed">
                Aba-made shoes and leather goods are known throughout West Africa for their durability
                and craftsmanship. The city's tailors have dressed generations of Nigerians in beautiful
                native wear and bespoke fashion. Yet for too long, Aba's products have been
                underrepresented online.
              </Text>
              <Text className="text-green-300 font-semibold text-[15px] leading-relaxed">
                ExploreAba exists to change that narrative — one delivery at a time.
              </Text>
            </View>
          </View>

          {/* CTA */}
          <View className="items-center py-2">
            <Text className="text-2xl font-black text-gray-900 mb-2 text-center">Ready to explore?</Text>
            <Text className="text-gray-500 text-sm mb-6 text-center leading-relaxed">
              Browse hundreds of authentic Aba-made products, or place a custom order — made exactly to
              your measurements and style.
            </Text>
            <View className="flex-row flex-wrap gap-2.5 justify-center">
              <Pressable
                onPress={() => router.push('/products')}
                className="flex-row items-center gap-2 bg-blue-600 px-5 py-3 rounded-xl"
              >
                <Package size={16} color="#fff" />
                <Text className="text-white font-bold text-sm">Browse Products</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/custom')}
                className="flex-row items-center gap-2 bg-white border-2 border-gray-200 px-5 py-3 rounded-xl"
              >
                <Scissors size={16} color="#374151" />
                <Text className="text-gray-900 font-bold text-sm">Order Custom</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/contact')}
                className="flex-row items-center gap-2 bg-white border-2 border-gray-200 px-5 py-3 rounded-xl"
              >
                <Text className="text-gray-900 font-bold text-sm">Contact Us</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}