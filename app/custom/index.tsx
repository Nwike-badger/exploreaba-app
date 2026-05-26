import { useEffect, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, LayoutAnimation, Platform, UIManager, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Sparkles, ArrowRight, MessageCircle, ChevronRight, Clock,
  Pencil, Ruler, ShieldCheck, CheckCircle2, Phone, Bookmark,
  Plus, Minus,
} from 'lucide-react-native';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { STORAGE_KEYS, WHATSAPP_NUMBER } from '@/lib/customDesignData';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const BG = '#faf7f2';
const EMERALD_900 = '#064e3b';
const EMERALD_800 = '#065f46';
const STONE_900 = '#1c1917';
const STONE_600 = '#57534e';
const STONE_500 = '#78716c';
const STONE_400 = '#a8a29e';
const STONE_300 = '#d6d3d1';
const STONE_200 = '#e7e5e4';
const STONE_100 = '#f5f5f4';

export default function CustomDesignScreen() {
  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        <ResumeDraftBanner />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Hero />
        <CategorySection />
        <HowItWorks />
        <TrustBar />
        <SavedMeasurements />
        <FAQ />
        <FinalCTA />
      </ScrollView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  Resume draft banner
// ────────────────────────────────────────────────────────────────────────────

function ResumeDraftBanner() {
  const [draft, setDraft] = useState(null);
  const { categories } = useCustomCategories();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.draft);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (d?.savedAt && Date.now() - d.savedAt < 14 * 24 * 60 * 60 * 1000) {
          setDraft(d);
        }
      } catch {}
    })();
  }, []);

  if (!draft || !categories?.length) return null;
  const cat = categories.find((c) => (c.slug || c.id) === draft.categoryId);
  if (!cat) return null;

  return (
    <View style={{ backgroundColor: EMERALD_800 }}>
      <View className="px-4 py-3 flex-row items-center gap-2">
        <Bookmark size={14} color="#d1fae5" />
        <Text className="text-emerald-50 text-xs flex-1" numberOfLines={1}>
          Resume your <Text className="font-bold">{cat.name}</Text> draft
        </Text>
        <Pressable
          onPress={() => router.push(`/custom/order/${cat.slug || cat.id}`)}
          className="bg-white px-3 py-1.5 rounded-full"
        >
          <Text className="text-emerald-900 text-[11px] font-bold">Resume</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  Hero
// ────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <View className="px-5 pt-10 pb-12">
      <View
        className="self-start flex-row items-center gap-1.5 px-3 py-1 rounded-full mb-6"
        style={{ backgroundColor: 'rgba(6,78,59,0.06)', borderWidth: 1, borderColor: 'rgba(6,78,59,0.1)' }}
      >
        <Sparkles size={10} color={EMERALD_900} />
        <Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: EMERALD_900 }}>
          Made-to-Measure
        </Text>
      </View>

      <Text
        style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 44, lineHeight: 46, color: STONE_900, letterSpacing: -1 }}
      >
        Tailored in Aba.
      </Text>
      <Text
        style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 44, lineHeight: 50, color: EMERALD_800, letterSpacing: -1, marginBottom: 16 }}
      >
        Made for you.
      </Text>

      <Text style={{ fontSize: 16, lineHeight: 24, color: STONE_600, marginBottom: 24 }}>
        Pick a category, share your measurements (or use our size guide), choose a style — or send us your own inspiration. Live estimate as you build it.
      </Text>

      <View className="flex-row gap-2 mb-10">
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: STONE_900 }}
          className="flex-1 rounded-full py-3.5 flex-row items-center justify-center gap-2"
        >
          <Text className="text-white text-sm font-medium">Browse Categories</Text>
          <ArrowRight size={14} color="#fff" />
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`)}
          style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_300 }}
          className="rounded-full px-4 py-3.5 flex-row items-center justify-center gap-2"
        >
          <MessageCircle size={14} color={EMERALD_800} />
          <Text className="text-sm font-medium" style={{ color: STONE_900 }}>WhatsApp</Text>
        </Pressable>
      </View>

      <View className="flex-row">
        <Stat n="11" label="Categories" />
        <Stat n="24h" label="Quote response" />
        <Stat n="5-21d" label="Turnaround" />
      </View>
    </View>
  );
}

function Stat({ n, label }) {
  return (
    <View className="flex-1">
      <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: STONE_900, marginBottom: 4 }}>
        {n}
      </Text>
      <Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: STONE_500 }}>
        {label}
      </Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  Categories
// ────────────────────────────────────────────────────────────────────────────

function CategorySection() {
  const [filter, setFilter] = useState('all');
  const { categories, loading, error } = useCustomCategories();

  if (loading && (!categories || categories.length === 0)) {
    return (
      <View className="px-5 py-16 items-center">
        <Text className="text-sm" style={{ color: STONE_500 }}>Loading the atelier…</Text>
      </View>
    );
  }

  if (error && (!categories || categories.length === 0)) {
    return (
      <View className="px-5 py-16 items-center">
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: STONE_900, marginBottom: 6 }}>
          Couldn't load categories
        </Text>
        <Text className="text-xs text-center" style={{ color: STONE_600 }}>
          Pull to refresh, or message us on WhatsApp.
        </Text>
      </View>
    );
  }

  const normalized = (categories || []).map((c) => ({
    ...c,
    id: c.id || c.slug,
    gender: c.gender || c.genderHint || 'unisex',
    basePrice: c.basePrice ?? c.priceFrom ?? 0,
  }));

  const filtered = normalized.filter((c) =>
    filter === 'all' ? true : c.gender === filter || c.gender === 'unisex'
  );

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'men', label: 'Men' },
    { id: 'women', label: 'Women' },
    { id: 'unisex', label: 'Unisex' },
  ];

  return (
    <View className="px-5 pt-4 pb-12">
      <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>01 — Choose</Text>
      <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 32, lineHeight: 36, color: STONE_900, marginBottom: 4 }}>
        What would you like
      </Text>
      <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 32, lineHeight: 36, color: EMERALD_800, marginBottom: 20 }}>
        made?
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ marginBottom: 12 }}>
        {filters.map((f) => (
          <Pressable key={f.id} onPress={() => setFilter(f.id)} className="px-4 py-2 rounded-full"
            style={{ backgroundColor: filter === f.id ? STONE_900 : STONE_100 }}>
            <Text className="text-xs font-medium" style={{ color: filter === f.id ? '#fff' : STONE_600 }}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="flex-row flex-wrap justify-between" style={{ rowGap: 12 }}>
          {filtered.map((c) => (
            <View key={c.id} style={{ width: '48%' }}>
              <CategoryCard category={c} />
            </View>
          ))}
     </View>
    </View>
  );
}

function CategoryCard({ category }) {
  return (
    <Pressable
      onPress={() => router.push(`/custom/order/${category.slug || category.id}`)}
      style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200, borderRadius: 2, overflow: 'hidden' }}
    >
      <View style={{ aspectRatio: 3 / 4, alignItems: 'center', justifyContent: 'center', backgroundColor: `${category.accent || '#999'}15`, position: 'relative' }}>
        {category.coverImageUrl ? (
          <Image
            source={{ uri: category.coverImageUrl }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="cover"
          />
        ) : category.silhouette ? (
          <Svg width={100} height={100} viewBox="0 0 100 100">
            <Path d={category.silhouette} fill={category.accent || '#666'} />
          </Svg>
        ) : null}

        <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 6, paddingVertical: 3 }}>
          <Text className="text-[9px] font-bold uppercase tracking-widest" style={{ color: STONE_600 }}>{category.gender}</Text>
        </View>
        <View style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: STONE_900, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowRight size={13} color="#fff" />
        </View>
      </View>

      <View className="p-3.5">
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 18, lineHeight: 22, color: STONE_900, marginBottom: 4 }}>{category.name}</Text>
        <Text className="text-[10px] mb-3" style={{ color: STONE_500 }} numberOfLines={2}>{category.tagline}</Text>
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[10px]" style={{ color: STONE_400 }}>From</Text>
          <Text className="text-xs font-bold" style={{ color: STONE_900 }}>₦{Number(category.basePrice).toLocaleString()}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={10} color={STONE_400} />
          <Text className="text-[10px]" style={{ color: STONE_400 }}>{category.leadTime}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  How it works
// ────────────────────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: '01', Icon: Pencil,         title: 'Pick your category',        body: 'Agbada, suit, dress, jumpsuit — find your garment from our 11 categories.' },
    { n: '02', Icon: Ruler,          title: 'Share your size',           body: "Use our size chart, type measurements, or have a tailor measure you. Each field has a how-to-measure guide." },
    { n: '03', Icon: Sparkles,       title: 'Choose or upload a style',  body: 'Pick from our gallery or upload up to 4 reference images.' },
    { n: '04', Icon: MessageCircle,  title: "Quote within 24h",          body: 'Live estimate as you build it. Final quote within 24h — typically within 10%. Pay 50% deposit to start.' },
  ];

  return (
    <View className="px-5 pt-8 pb-12" style={{ backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: STONE_200 }}>
      <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>
        How it works
      </Text>
      <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, lineHeight: 32, color: STONE_900, marginBottom: 4 }}>
        Four small steps.
      </Text>
      <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 28, lineHeight: 32, color: EMERALD_800, marginBottom: 28 }}>
        One perfect fit.
      </Text>

      <View style={{ gap: 1, backgroundColor: STONE_200 }}>
        {steps.map((s) => {
          const Icon = s.Icon;
          return (
            <View key={s.n} className="bg-white p-5">
              <View className="flex-row items-start justify-between mb-4">
                <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 36, color: STONE_200 }}>
                  {s.n}
                </Text>
                <Icon size={22} color={EMERALD_800} strokeWidth={1.5} />
              </View>
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 18, lineHeight: 22, color: STONE_900, marginBottom: 4 }}>
                {s.title}
              </Text>
              <Text className="text-xs" style={{ color: STONE_600, lineHeight: 18 }}>
                {s.body}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  Trust bar
// ────────────────────────────────────────────────────────────────────────────

function TrustBar() {
  const items = [
    { Icon: ShieldCheck,  label: "Money-back if it doesn't fit" },
    { Icon: CheckCircle2, label: 'Free adjustments after delivery' },
    { Icon: Clock,        label: 'Live order updates on WhatsApp' },
    { Icon: Phone,        label: 'Talk to your tailor anytime' },
  ];

  return (
    <View className="px-5 py-8" style={{ backgroundColor: BG }}>
      <View className="flex-row flex-wrap" style={{ gap: 12 }}>
        {items.map((it, i) => {
          const Icon = it.Icon;
          return (
            <View key={i} className="flex-row items-center gap-2" style={{ width: '48%' }}>
              <Icon size={16} color={EMERALD_800} strokeWidth={1.5} />
              <Text className="text-xs flex-1" style={{ color: STONE_600 }} numberOfLines={2}>
                {it.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  Saved measurements
// ────────────────────────────────────────────────────────────────────────────

function SavedMeasurements() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.measurements);
        if (raw) setProfiles(JSON.parse(raw) || []);
      } catch {}
    })();
  }, []);

  return (
    <View className="px-5 pt-10 pb-12" style={{ borderTopWidth: 1, borderColor: STONE_200 }}>
      <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>
        Your measurements
      </Text>
      <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, lineHeight: 32, color: STONE_900 }}>
        Measure once.
      </Text>
      <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 28, lineHeight: 32, color: EMERALD_800, marginBottom: 16 }}>
        Order forever.
      </Text>
      <Text className="text-sm mb-6" style={{ color: STONE_600, lineHeight: 22 }}>
        Save your measurements with a name (Work, Wedding, Mom, Dad…) and reuse them on every future order. No more re-typing, no more re-measuring.
      </Text>

      {profiles.length > 0 ? (
        <View style={{ gap: 8 }}>
          {profiles.slice(0, 3).map((p, i) => (
            <View
              key={i}
              className="bg-white p-4 flex-row items-center justify-between"
              style={{ borderWidth: 1, borderColor: STONE_200 }}
            >
              <View className="flex-1">
                <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: STONE_900 }}>
                  {p.name}
                </Text>
                <Text className="text-[11px] mt-0.5" style={{ color: STONE_500 }}>
                  {p.gender} · {Object.keys(p.values || {}).length} measurements
                </Text>
              </View>
              <Bookmark size={18} color={EMERALD_800} strokeWidth={1.5} />
            </View>
          ))}
        </View>
      ) : (
        <View
          className="items-center p-8"
          style={{ backgroundColor: STONE_100, borderWidth: 1, borderStyle: 'dashed', borderColor: STONE_300 }}
        >
          <Ruler size={28} color={STONE_400} strokeWidth={1.5} />
          <Text className="text-xs mt-3" style={{ color: STONE_500 }}>
            No saved profiles yet
          </Text>
        </View>
      )}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  FAQ
// ────────────────────────────────────────────────────────────────────────────

function FAQ() {
  const items = [
    { q: 'How does pricing work?', a: 'Each category shows a range, and the wizard builds you a live estimate as you make choices. Final quote arrives via WhatsApp within 24h — typically within 10% of the estimate. To start production, you pay 50% deposit; the balance is paid on delivery.' },
    { q: "What if I don't know how to take my own measurements?", a: 'Two options: use our size chart (S, M, L, XL with corresponding chest/waist/hip ranges), or book a free home/shop visit by selecting "Have a tailor measure me" during checkout — we\'ll come to you within Aba.' },
    { q: 'Can I send a picture of a style I want?', a: "Absolutely — that's the recommended way. You can upload up to 4 reference images (Pinterest, Instagram, magazine cuts, anything). You can also pick from our pre-loaded style gallery if you don't have a reference." },
    { q: 'How long does it take?', a: 'Lead times vary by category — typically 5-7 days for a shirt, 7-14 days for a senator or dress, and 14-21 days for an agbada or full suit. Rush option available for +25%. Exact date is confirmed in your quote.' },
    { q: "What if it doesn't fit?", a: "Free adjustments. If a fix isn't enough, we'll remake it at no charge — that's the bespoke promise." },
    { q: 'Do you deliver outside Aba?', a: 'Yes — anywhere in Nigeria. Delivery cost is added to your final quote based on your address.' },
  ];
  const [open, setOpen] = useState(0);

  const toggle = (i) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(open === i ? -1 : i);
  };

  return (
    <View className="px-5 pt-10 pb-12" style={{ backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: STONE_200 }}>
      <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>
        Questions
      </Text>
      <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, lineHeight: 32, color: STONE_900 }}>
        Things people
      </Text>
      <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 28, lineHeight: 32, color: EMERALD_800, marginBottom: 24 }}>
        often ask.
      </Text>

      <View style={{ borderTopWidth: 1, borderColor: STONE_200 }}>
        {items.map((it, i) => (
          <View key={i} style={{ borderBottomWidth: 1, borderColor: STONE_200 }}>
            <Pressable onPress={() => toggle(i)} className="py-5 flex-row items-start justify-between gap-4">
              <Text
                style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, lineHeight: 22, color: STONE_900, flex: 1 }}
              >
                {it.q}
              </Text>
              {open === i ? (
                <Minus size={18} color={EMERALD_800} strokeWidth={1.5} />
              ) : (
                <Plus size={18} color={STONE_400} strokeWidth={1.5} />
              )}
            </Pressable>
            {open === i && (
              <Text className="text-sm pb-5" style={{ color: STONE_600, lineHeight: 22 }}>
                {it.a}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  Final CTA
// ────────────────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <View className="px-5 py-14" style={{ backgroundColor: STONE_900 }}>
      <View className="items-center">
        <Text
          style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 40, lineHeight: 42, color: '#fff', textAlign: 'center' }}
        >
          Ready to be
        </Text>
        <Text
          style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 40, lineHeight: 50, color: '#6ee7b7', textAlign: 'center', marginBottom: 16 }}
        >
          measured?
        </Text>
        <Text className="text-base text-center mb-8" style={{ color: '#d6d3d1', lineHeight: 24 }}>
          Pick a category, share a few details, and we'll do the rest. No commitment until you accept the quote.
        </Text>

        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: '#10b981' }}
          className="w-full rounded-full py-4 flex-row items-center justify-center gap-2 mb-3"
        >
          <Text className="text-sm font-bold" style={{ color: STONE_900 }}>Start an order</Text>
          <ChevronRight size={16} color={STONE_900} />
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`)}
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          className="w-full rounded-full py-4 flex-row items-center justify-center gap-2"
        >
          <MessageCircle size={14} color="#fff" />
          <Text className="text-sm text-white font-medium">WhatsApp us instead</Text>
        </Pressable>
      </View>
    </View>
  );
}