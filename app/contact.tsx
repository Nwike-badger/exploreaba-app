import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft, Mail, Phone, MapPin, Clock, MessageCircle,
  Instagram, Facebook, Twitter, ArrowRight,
} from 'lucide-react-native';

const SUPPORT_EMAIL = 'support@exploreaba.ng';
const ENQUIRY_EMAIL = 'exploreabanow@gmail.com';
const PHONE = '09061355240';
const WHATSAPP = 'https://wa.me/2349061355240';
const ADDRESS = 'Ariaria International Market, Aba, Abia State, Nigeria';
const MAPS_LINK = 'https://maps.google.com/?q=Ariaria+International+Market+Aba+Nigeria';

const HOURS = [
  { days: 'Monday – Friday', time: '9:00 AM – 6:00 PM' },
  { days: 'Saturday', time: '10:00 AM – 4:00 PM' },
  { days: 'Sunday', time: 'Closed' },
];

// NOTE: 'to' values with a ?tab= query are read by app/legal.tsx via useLocalSearchParams
const FAQ_LINKS = [
  { label: 'How does a custom order work?', to: '/custom' },
  { label: 'What is your returns policy?', to: '/legal?tab=returns' },
  { label: 'How long does delivery take?', to: '/legal?tab=terms' },
  { label: 'When will I receive my refund?', to: '/legal?tab=refunds' },
  { label: 'How do I track my order?', to: '/orders' },
];

const SOCIALS = [
  { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { Icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { Icon: Twitter, label: 'Twitter/X', href: 'https://twitter.com' },
];

function ContactRow({ Icon, label, value, onPress, isLast }) {
  return (
    <View>
      <Pressable onPress={onPress} className="flex-row items-start gap-3 py-3">
        <View className="w-9 h-9 rounded-lg bg-blue-50 items-center justify-center">
          <Icon size={16} color="#2563eb" />
        </View>
        <View className="flex-1">
          <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</Text>
          <Text className="text-sm font-semibold text-gray-800">{value}</Text>
        </View>
      </Pressable>
      {!isLast && <View className="h-px bg-gray-100" />}
    </View>
  );
}

export default function ContactScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center px-2 h-14 border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center" accessibilityLabel="Back">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-base font-black text-gray-900 tracking-tight ml-1">Contact Us</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        <Text className="text-sm text-gray-500 leading-relaxed">
          Have a question, custom order enquiry, or need help with an existing order? Reach us directly
          below and we'll get back to you as quickly as we can.
        </Text>

        {/* Direct contacts */}
        <View className="bg-white rounded-2xl border border-gray-100 p-5">
          <Text className="font-black text-gray-900 mb-1">Contact Details</Text>
          <ContactRow
            Icon={Mail} label="Support Email" value={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
          <ContactRow
            Icon={Mail} label="General Enquiry" value={ENQUIRY_EMAIL}
            onPress={() => Linking.openURL(`mailto:${ENQUIRY_EMAIL}`)}
          />
          <ContactRow
            Icon={Phone} label="Phone" value={PHONE}
            onPress={() => Linking.openURL(`tel:${PHONE}`)}
          />
          <ContactRow
            Icon={MapPin} label="Address" value={ADDRESS}
            onPress={() => Linking.openURL(MAPS_LINK)}
            isLast
          />

          <Pressable
            onPress={() => Linking.openURL(WHATSAPP)}
            className="mt-3 flex-row items-center justify-center gap-2 bg-[#25D366] py-3.5 rounded-xl"
          >
            <MessageCircle size={16} color="#fff" />
            <Text className="text-white font-bold text-sm">Chat on WhatsApp</Text>
          </Pressable>
        </View>

        {/* Hours */}
        <View className="bg-white rounded-2xl border border-gray-100 p-5">
          <View className="flex-row items-center gap-2 mb-3">
            <Clock size={16} color="#2563eb" />
            <Text className="font-black text-gray-900">Business Hours</Text>
          </View>
          <View className="gap-2">
            {HOURS.map(({ days, time }) => (
              <View key={days} className="flex-row justify-between">
                <Text className="text-sm text-gray-600">{days}</Text>
                <Text className={`text-sm font-bold ${time === 'Closed' ? 'text-red-400' : 'text-gray-900'}`}>
                  {time}
                </Text>
              </View>
            ))}
          </View>
          <Text className="text-[11px] text-gray-400 mt-3 leading-relaxed">
            Response times may vary during weekends and public holidays. For urgent order issues,
            please WhatsApp us directly.
          </Text>
        </View>

        {/* Socials */}
        <View className="bg-white rounded-2xl border border-gray-100 p-5">
          <Text className="font-black text-gray-900 mb-3">Follow Us</Text>
          <View className="flex-row gap-3">
            {SOCIALS.map(({ Icon, label, href }) => (
              <Pressable
                key={label}
                onPress={() => Linking.openURL(href)}
                className="flex-1 items-center gap-1.5 p-3 border border-gray-100 rounded-xl"
              >
                <Icon size={18} color="#6b7280" />
                <Text className="text-xs font-bold text-gray-500">{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View className="bg-white rounded-2xl border border-gray-100 p-5">
          <Text className="font-black text-gray-900 text-base mb-1">Common Questions</Text>
          <Text className="text-gray-500 text-xs mb-3">You might find the answer you need right here.</Text>
          <View className="gap-2">
            {FAQ_LINKS.map(({ label, to }) => (
              <Pressable
                key={label}
                onPress={() => router.push(to)}
                className="flex-row items-center justify-between gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl"
              >
                <Text className="flex-1 text-sm font-medium text-gray-700">{label}</Text>
                <ArrowRight size={14} color="#9ca3af" />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}