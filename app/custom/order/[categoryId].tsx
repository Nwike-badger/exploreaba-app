import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator,
  Modal, LayoutAnimation, Platform, UIManager, Linking, KeyboardAvoidingView, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Path, Line, Ellipse } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';
import {
  ChevronLeft, ChevronRight, Check, Upload, X, Info, MessageCircle, Save,
  ShieldCheck, CheckCircle2, Bookmark, Ruler, Sparkles, Pencil,
  Copy, ArrowRight, AlertCircle, Zap,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { useCustomCategory } from '@/hooks/useCustomCategories';
import { toast } from '@/utils/toast';
import {
  getMeasurementsForCategory, SIZE_CHARTS, FITTING_PREFERENCES,
  FABRIC_GRADES, EMBROIDERY_LEVELS, LEAD_TIME_OPTIONS,
  STORAGE_KEYS, WHATSAPP_NUMBER, computeEstimate,
} from '@/lib/customDesignData';




if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const BG = '#faf7f2';
const EMERALD_900 = '#064e3b';
const EMERALD_800 = '#065f46';
const EMERALD_700 = '#047857';
const EMERALD_50  = '#ecfdf5';
const EMERALD_100 = '#d1fae5';
const EMERALD_200 = '#a7f3d0';
const STONE_900 = '#1c1917';
const STONE_700 = '#44403c';
const STONE_600 = '#57534e';
const STONE_500 = '#78716c';
const STONE_400 = '#a8a29e';
const STONE_300 = '#d6d3d1';
const STONE_200 = '#e7e5e4';
const STONE_100 = '#f5f5f4';
const STONE_50  = '#fafaf9';

const PAYLOAD_IMAGE_QUALITY = 0.6;  // keep image payload reasonable
const MAX_IMAGES = 4;

// ════════════════════════════════════════════════════════════════════════════
//  Main Wizard
// ════════════════════════════════════════════════════════════════════════════

export default function CustomDesignerWizard() {
  const { categoryId } = useLocalSearchParams();
  const id = Array.isArray(categoryId) ? categoryId[0] : categoryId;

  // Pull from the list hook, find this one. (No separate single-fetch hook on mobile
  // — the categories list is small and cached, so this is efficient enough.)
  const { category: rawCategory, loading: categoriesLoading, error: categoriesError } = useCustomCategory(id);

const category = useMemo(() => {
  if (!rawCategory) return null;
  return {
    ...rawCategory,
    id: rawCategory.id || rawCategory.slug,
    gender: rawCategory.gender || rawCategory.genderHint || 'unisex',
    basePrice: Number(rawCategory.basePrice ?? rawCategory.priceFrom ?? 0),
    maxPrice: Number(rawCategory.maxPrice ?? (rawCategory.priceFrom || 0) * 2.5),
    sampleStyles: rawCategory.sampleStyles || rawCategory.styles || [],
  };
}, [rawCategory]);

  // Initial order shape
  const initialOrder = useMemo(() => ({
    categoryId: id,
    gender: category?.gender !== 'unisex' ? category?.gender : null,
    style:   { selectedId: null, customImages: [], styleNotes: '' },
    size:    { mode: 'chart', chartSize: '', measurements: {}, profileName: '', useTailor: false },
    details: { fitting: 'regular', fabric: 'standard', embroidery: 'none', leadTime: 'standard',
               fabricText: '', color: '', occasion: '', needBy: '', notes: '' },
    contact: { name: '', phone: '', whatsapp: '', email: '', address: '', delivery: 'aba' },
  }), [id, category]);

  const [order, setOrder] = useState(initialOrder);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Hydrate gender once category resolves (for non-unisex)
  useEffect(() => {
    if (category && category.gender !== 'unisex' && !order.gender) {
      setOrder((o) => ({ ...o, gender: category.gender }));
    }
  }, [category]); // eslint-disable-line

  // Step config
  const steps = useMemo(() => {
    const base = [
      { id: 'style',   label: 'Style' },
      { id: 'size',    label: 'Size' },
      { id: 'details', label: 'Details' },
      { id: 'contact', label: 'Contact' },
      { id: 'review',  label: 'Review' },
    ];
    return category?.gender === 'unisex' ? [{ id: 'gender', label: 'Who for' }, ...base] : base;
  }, [category]);

  // Load draft
  useEffect(() => {
    if (!category) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.draft);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (d?.categoryId === id && d?.order) {
          setOrder((prev) => ({ ...prev, ...d.order }));
        }
      } catch {}
    })();
  }, [id, category]);

  // Autosave
  useEffect(() => {
    if (submitted || !category) return;
    AsyncStorage.setItem(
      STORAGE_KEYS.draft,
      JSON.stringify({ categoryId: id, order, savedAt: Date.now() })
    ).catch(() => {});
  }, [order, id, submitted, category]);

  const update = useCallback((section, patch) => {
    setOrder((o) => ({ ...o, [section]: { ...o[section], ...patch } }));
  }, []);
  const setGender = (g) => setOrder((o) => ({ ...o, gender: g }));

  const currentStep = steps[stepIndex];
  const isReview = currentStep?.id === 'review';

  // Live estimate
  const estimate = useMemo(() => computeEstimate(category, {
    fabric: order.details.fabric,
    embroidery: order.details.embroidery,
    leadTime: order.details.leadTime,
    fitting: order.details.fitting,
  }), [category, order.details]);

  // Validation
  const canContinue = useMemo(() => {
    if (!currentStep) return false;
    switch (currentStep.id) {
      case 'gender':  return !!order.gender;
      case 'style':   return !!order.style.selectedId || order.style.customImages.length > 0;
      case 'size':
        if (order.size.useTailor) return true;
        if (order.size.mode === 'chart') return !!order.size.chartSize;
        return Object.values(order.size.measurements).filter(Boolean).length >= 4;
      case 'details': return true;
      case 'contact': return order.contact.name.trim() && (order.contact.phone.trim() || order.contact.whatsapp.trim());
      case 'review':  return true;
      default:        return false;
    }
  }, [currentStep, order]);

  const onContinue = () => { if (canContinue && stepIndex < steps.length - 1) setStepIndex(stepIndex + 1); };
  const onBack = () => { stepIndex > 0 ? setStepIndex(stepIndex - 1) : router.push('/custom'); };

  // Submit
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const idempotencyKey = await Crypto.randomUUID();

    const payload = {
      categoryId: id,
      gender: order.gender?.toUpperCase() || (category.gender === 'women' ? 'WOMEN' : 'MEN'),

      selectedStyleId: order.style.selectedId,
      referenceImages: (order.style.customImages || []).map((img) => ({ dataUrl: img.dataUrl })),
      styleNotes: order.style.styleNotes,

      sizeMode: order.size.useTailor ? 'TAILOR_VISIT'
        : order.size.mode === 'chart' ? 'CHART' : 'MANUAL',
      chartSize: order.size.chartSize || null,
      measurements: order.size.measurements || {},
      profileName: order.size.profileName || null,

      fitting: order.details.fitting?.toUpperCase() || 'REGULAR',
      fabric: order.details.fabricText || order.details.fabric || null,
      fabricGrade: order.details.fabric?.toUpperCase() || 'STANDARD',
      embroidery: order.details.embroidery?.toUpperCase() || 'NONE',
      leadTime: order.details.leadTime?.toUpperCase() || 'STANDARD',
      color: order.details.color || null,
      occasion: order.details.occasion || null,
      needBy: order.details.needBy || null,
      notes: order.details.notes || null,

      estimatedPriceLow: estimate.low,
      estimatedPriceHigh: estimate.high,

      customerName: order.contact.name,
      whatsappNumber: order.contact.whatsapp || null,
      phoneNumber: order.contact.phone || null,
      customerEmail: order.contact.email || null,

      deliveryMode: order.contact.delivery === 'aba' ? 'ABA' : 'NIGERIA',
      deliveryAddress: order.contact.address?.trim() ? {
        streetAddress: order.contact.address,
        city: order.contact.delivery === 'aba' ? 'Aba' : '',
        state: order.contact.delivery === 'aba' ? 'Abia' : '',
        country: 'Nigeria',
        phoneNumber: order.contact.whatsapp || order.contact.phone || null,
      } : null,

      idempotencyKey,
    };

    try {
      const response = await api.post('/v1/custom-orders', payload);
      const submittedRecord = response.data;
      AsyncStorage.removeItem(STORAGE_KEYS.draft).catch(() => {});
      setSubmitted({
        ref: submittedRecord.referenceNumber,
        categoryName: submittedRecord.categoryName || category.name,
        contact: order.contact,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to submit your order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading / error / not-found gates
  if (categoriesLoading && !category) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: BG }}>
        <ActivityIndicator color={EMERALD_700} />
        <Text className="text-sm mt-3" style={{ color: STONE_500 }}>Loading…</Text>
      </View>
    );
  }
  if ((categoriesError && !category) || (!categoriesLoading && !category)) {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: BG }}>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: STONE_900, marginBottom: 12 }}>
          Category not found
        </Text>
        <Pressable onPress={() => router.replace('/custom')} className="flex-row items-center gap-2">
          <ChevronLeft size={16} color={EMERALD_800} />
          <Text className="text-sm font-medium" style={{ color: EMERALD_800 }}>Back to categories</Text>
        </Pressable>
      </View>
    );
  }

  if (submitted) return <SuccessScreen submitted={submitted} category={category} />;

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        <ProgressHeader steps={steps} stepIndex={stepIndex} setStepIndex={setStepIndex} category={category} />
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {currentStep.id === 'gender'  && <GenderStep  order={order} setGender={setGender} />}
          {currentStep.id === 'style'   && <StyleStep   order={order} update={update} category={category} />}
          {currentStep.id === 'size'    && <SizeStep    order={order} update={update} category={category} />}
          {currentStep.id === 'details' && <DetailsStep order={order} update={update} category={category} />}
          {currentStep.id === 'contact' && <ContactStep order={order} update={update} />}
          {currentStep.id === 'review'  && <ReviewStep  order={order} category={category} setStepIndex={setStepIndex} steps={steps} estimate={estimate} />}
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff', borderTopWidth: 1, borderColor: STONE_200 }}>
        <FlowFooter
          canContinue={canContinue}
          isReview={isReview}
          onBack={onBack}
          onContinue={onContinue}
          onSubmit={handleSubmit}
          submitting={submitting}
          backLabel={stepIndex === 0 ? 'Categories' : 'Back'}
          estimate={estimate}
          category={category}
          order={order}
        />
      </SafeAreaView>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Header & Footer
// ════════════════════════════════════════════════════════════════════════════

function ProgressHeader({ steps, stepIndex, setStepIndex, category }) {
  return (
    <View style={{ borderBottomWidth: 1, borderColor: STONE_200 }}>
      <View className="flex-row items-center px-3 h-14 gap-3">
        <Pressable onPress={() => router.push('/custom')} hitSlop={8}>
          <ChevronLeft size={22} color={STONE_500} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: STONE_500 }}>
            Custom order
          </Text>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: STONE_900 }} numberOfLines={1}>
            {category.name}
          </Text>
        </View>
      </View>

      {/* Mobile: progress bar instead of step pills */}
      <View style={{ height: 3, backgroundColor: STONE_200 }}>
        <View
          style={{
            height: '100%',
            width: `${((stepIndex + 1) / steps.length) * 100}%`,
            backgroundColor: EMERALD_700,
          }}
        />
      </View>

      {/* Step labels (tappable for completed steps) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 4 }}
      >
        {steps.map((s, i) => {
          const isCurrent = i === stepIndex;
          const isDone = i < stepIndex;
          const reachable = i <= stepIndex;
          return (
            <Pressable
              key={s.id}
              onPress={() => reachable && setStepIndex(i)}
              disabled={!reachable}
              className="px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: isCurrent ? STONE_900 : 'transparent',
              }}
            >
              <Text
                className="text-[10px] font-medium uppercase tracking-widest"
                style={{
                  color: isCurrent ? '#fff' : isDone ? EMERALD_800 : STONE_400,
                }}
              >
                {String(i + 1).padStart(2, '0')} {s.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function FlowFooter({ canContinue, isReview, onBack, onContinue, onSubmit, submitting, backLabel, estimate, category, order }) {
  // Smart rush suggestion — if needBy is too close to today
  const rushSuggestion = useMemo(() => {
    if (!order.details.needBy || order.details.leadTime === 'rush') return null;
    const need = new Date(order.details.needBy);
    if (isNaN(need.getTime())) return null;
    const daysAway = Math.ceil((need - Date.now()) / (1000 * 60 * 60 * 24));
    // Parse "5-7 days" or "14-21 days" — use the max
    const maxDays = parseInt(category?.leadTime?.match(/(\d+)\s*days?$/)?.[1] || '14', 10);
    return daysAway > 0 && daysAway < maxDays ? { daysAway, maxDays } : null;
  }, [order.details.needBy, order.details.leadTime, category]);

  return (
    <View className="px-4 pt-3 pb-2">
      {/* Smart rush suggestion */}
      {rushSuggestion && (
        <View
          className="flex-row items-center gap-2 px-3 py-2 mb-2 rounded-lg"
          style={{ backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' }}
        >
          <Zap size={14} color="#d97706" />
          <Text className="text-xs flex-1" style={{ color: '#92400e' }} numberOfLines={2}>
            Need it in {rushSuggestion.daysAway} days? Rush mode delivers in 5-7.
          </Text>
        </View>
      )}

      {/* Live estimate */}
      {estimate.low > 0 && (
        <View className="flex-row items-center justify-between mb-2 px-1">
          <Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: STONE_500 }}>
            Estimate
          </Text>
          <Text className="text-sm font-bold" style={{ color: STONE_900 }}>
            ₦{estimate.low.toLocaleString()} – ₦{estimate.high.toLocaleString()}
          </Text>
        </View>
      )}

      <View className="flex-row items-center gap-3">
        <Pressable onPress={onBack} disabled={submitting} hitSlop={8} className="flex-row items-center gap-1">
          <ChevronLeft size={16} color={STONE_600} />
          <Text className="text-sm" style={{ color: STONE_600 }}>{backLabel}</Text>
        </Pressable>

        {isReview ? (
          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            className="flex-1 rounded-full py-3 flex-row items-center justify-center gap-2"
            style={{ backgroundColor: submitting ? EMERALD_700 + 'AA' : EMERALD_700 }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Check size={16} color="#fff" />
                <Text className="text-sm font-medium text-white">Submit for quote</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={onContinue}
            disabled={!canContinue}
            className="flex-1 rounded-full py-3 flex-row items-center justify-center gap-2"
            style={{ backgroundColor: canContinue ? STONE_900 : STONE_200 }}
          >
            <Text className="text-sm font-medium" style={{ color: canContinue ? '#fff' : STONE_400 }}>
              Continue
            </Text>
            <ChevronRight size={16} color={canContinue ? '#fff' : STONE_400} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Step Shell
// ════════════════════════════════════════════════════════════════════════════

function StepShell({ eyebrow, titleStart, titleEm, subtitle, children }) {
  return (
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>
        {eyebrow}
      </Text>
      <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 30, lineHeight: 34, color: STONE_900 }}>
        {titleStart}
      </Text>
      {titleEm && (
        <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 30, lineHeight: 34, color: EMERALD_800, marginBottom: 10 }}>
          {titleEm}
        </Text>
      )}
      {subtitle && (
        <Text className="text-sm mb-7" style={{ color: STONE_600, lineHeight: 22 }}>
          {subtitle}
        </Text>
      )}
      {children}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP — GENDER (unisex only)
// ════════════════════════════════════════════════════════════════════════════

function GenderStep({ order, setGender }) {
  return (
    <StepShell
      eyebrow="Step 01"
      titleStart="Who is this"
      titleEm="for?"
      subtitle="We'll tailor the measurement fields and fit defaults accordingly."
    >
      <View style={{ gap: 12 }}>
        {[
          { id: 'men',   name: 'For Him', desc: "Men's cut, men's measurements" },
          { id: 'women', name: 'For Her', desc: "Women's cut, includes bust & hip" },
        ].map((g) => {
          const active = order.gender === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => setGender(g.id)}
              style={{
                backgroundColor: active ? `${EMERALD_50}80` : '#fff',
                borderWidth: 2, borderColor: active ? EMERALD_700 : STONE_200,
                padding: 24, position: 'relative',
              }}
            >
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: STONE_900, marginBottom: 4 }}>
                {g.name}
              </Text>
              <Text className="text-sm" style={{ color: STONE_600 }}>{g.desc}</Text>
              {active && (
                <View style={{
                  position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 12,
                  backgroundColor: EMERALD_700, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </StepShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP — STYLE
// ════════════════════════════════════════════════════════════════════════════

function StyleStep({ order, update, category }) {
  const customImages = order.style.customImages || [];
  const styles = category.sampleStyles || [];

  const pickImages = async () => {
    if (customImages.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} reference images.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permission to access photos was denied.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - customImages.length,
      quality: PAYLOAD_IMAGE_QUALITY,
      base64: true,
    });
    if (result.canceled || !result.assets) return;

    const newImages = result.assets.map((a, i) => ({
      name: a.fileName || `image-${Date.now()}-${i}.jpg`,
      dataUrl: `data:${a.mimeType || 'image/jpeg'};base64,${a.base64}`,
    }));
    update('style', { customImages: [...customImages, ...newImages] });
  };

  const removeImage = (idx) => {
    update('style', { customImages: customImages.filter((_, i) => i !== idx) });
  };

  return (
    <StepShell
      eyebrow="Step · Style"
      titleStart="Pick a style, or"
      titleEm="show us yours."
      subtitle="Choose from our gallery, upload reference images, or both. Sketches, screenshots, Pinterest pics — all welcome."
    >
      {/* Gallery */}
      {styles.length > 0 && (
        <View className="mb-8">
          <Text className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: STONE_500 }}>
            From our gallery
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {styles.map((s) => {
              const active = order.style.selectedId === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => update('style', { selectedId: active ? null : s.id })}
                  style={{
                    width: '48%', aspectRatio: 3 / 4,
                    borderWidth: 2, borderColor: active ? EMERALD_700 : STONE_200,
                    overflow: 'hidden', position: 'relative',
                    backgroundColor: `${category.accent || '#999'}15`,
                  }}
                >
                  {s.imageUrl ? (
                    <Image source={{ uri: s.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : category.silhouette ? (
                    <View className="absolute inset-0 items-center justify-center">
                      <Svg width={80} height={80} viewBox="0 0 100 100">
                        <Path d={category.silhouette} fill={category.accent || '#666'} />
                      </Svg>
                    </View>
                  ) : null}

                  <View
                    style={{
                      position: 'absolute', left: 0, right: 0, bottom: 0,
                      padding: 8, backgroundColor: 'rgba(255,255,255,0.95)',
                    }}
                  >
                    <Text className="text-xs font-medium" style={{ color: STONE_900 }} numberOfLines={1}>
                      {s.name}
                    </Text>
                    {s.tone && (
                      <Text className="text-[10px]" style={{ color: STONE_500 }} numberOfLines={1}>
                        {s.tone}
                      </Text>
                    )}
                  </View>

                  {active && (
                    <View style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 22, height: 22, borderRadius: 11,
                      backgroundColor: EMERALD_700, alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Upload */}
      <View className="mb-8">
        <View className="flex-row items-end justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: STONE_500 }}>
              Your inspiration
            </Text>
            <Text className="text-sm" style={{ color: STONE_700 }}>Upload up to {MAX_IMAGES} reference images.</Text>
          </View>
          <Text className="text-xs" style={{ color: STONE_400 }}>{customImages.length}/{MAX_IMAGES}</Text>
        </View>

        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {customImages.map((img, i) => (
            <View
              key={i}
              style={{
                width: '48%', aspectRatio: 3 / 4, position: 'relative',
                backgroundColor: STONE_100, borderWidth: 1, borderColor: STONE_200,
              }}
            >
              <Image source={{ uri: img.dataUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              <Pressable
                onPress={() => removeImage(i)}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 26, height: 26, borderRadius: 13,
                  backgroundColor: 'rgba(28, 25, 23, 0.85)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={13} color="#fff" />
              </Pressable>
            </View>
          ))}
          {customImages.length < MAX_IMAGES && (
            <Pressable
              onPress={pickImages}
              style={{
                width: '48%', aspectRatio: 3 / 4,
                borderWidth: 2, borderColor: STONE_300, borderStyle: 'dashed',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#fff',
              }}
            >
              <Upload size={22} color={STONE_500} strokeWidth={1.5} />
              <Text className="text-xs font-medium mt-2" style={{ color: STONE_500 }}>Add image</Text>
              <Text className="text-[10px] mt-0.5" style={{ color: STONE_400 }}>JPG · PNG</Text>
            </Pressable>
          )}
        </View>

        {customImages.length === 0 && (
          <View className="mt-3 flex-row items-start gap-2 p-3" style={{ backgroundColor: EMERALD_50, borderWidth: 1, borderColor: EMERALD_200 }}>
            <Info size={12} color={EMERALD_800} style={{ marginTop: 2 }} />
            <Text className="text-[11px] flex-1" style={{ color: EMERALD_900, lineHeight: 16 }}>
              <Text className="font-bold">Tip:</Text> clear photos of the front (and back, if you can) help us match the cut exactly.
            </Text>
          </View>
        )}
      </View>

      {/* Notes */}
      <View>
        <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>
          Style notes <Text className="lowercase tracking-normal" style={{ color: STONE_400 }}>(optional)</Text>
        </Text>
        <TextInput
          value={order.style.styleNotes}
          onChangeText={(v) => update('style', { styleNotes: v })}
          placeholder="Anything specific? Embroidery placement, collar style, button color…"
          placeholderTextColor={STONE_400}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{
            backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200,
            padding: 14, fontSize: 14, color: STONE_900, minHeight: 80,
          }}
        />
      </View>
    </StepShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP — SIZE
// ════════════════════════════════════════════════════════════════════════════

function SizeStep({ order, update, category }) {
  const measurementFields = useMemo(() => getMeasurementsForCategory(category), [category]);
  const sizeChart = order.gender === 'women' ? SIZE_CHARTS.women : SIZE_CHARTS.men;
  const [guideField, setGuideField] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.measurements);
        if (raw) setSavedProfiles(JSON.parse(raw) || []);
      } catch {}
    })();
  }, []);

  const setMode = (mode) => update('size', { mode, useTailor: false });
  const setMeasurement = (id, value) => update('size', { measurements: { ...order.size.measurements, [id]: value } });

  const useSavedProfile = (p) => {
    update('size', { mode: 'manual', measurements: p.values || {}, profileName: p.name, useTailor: false });
    setShowSaved(false);
    toast.success(`Loaded "${p.name}"`);
  };

  const saveProfile = async () => {
    let name = order.size.profileName?.trim();
    if (!name) {
      // Smart default name
      const dateStr = new Date().toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
      name = `${order.gender === 'women' ? 'Her' : 'His'} measurements (${dateStr})`;
      update('size', { profileName: name });
    }
    if (Object.values(order.size.measurements).filter(Boolean).length < 4) {
      toast.error('Fill in at least 4 measurements before saving.');
      return;
    }
    try {
      const existing = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.measurements)) || '[]');
      const filtered = existing.filter((p) => p.name !== name);
      filtered.push({ name, gender: order.gender, values: order.size.measurements, savedAt: Date.now() });
      await AsyncStorage.setItem(STORAGE_KEYS.measurements, JSON.stringify(filtered));
      setSavedProfiles(filtered);
      toast.success('Saved. Reuse on future orders.');
    } catch {
      toast.error('Could not save profile.');
    }
  };

  return (
    <StepShell
      eyebrow="Step · Size"
      titleStart="Tell us your"
      titleEm="size."
      subtitle="Use our size chart, type exact measurements, or have a tailor measure you in person."
    >
      {/* Mode selector */}
      <View className="flex-row gap-2 mb-6">
        <ModeButton
          active={order.size.mode === 'chart' && !order.size.useTailor}
          onPress={() => setMode('chart')}
          Icon={Ruler} label="Size chart" sub="S / M / L / XL"
        />
        <ModeButton
          active={order.size.mode === 'manual' && !order.size.useTailor}
          onPress={() => setMode('manual')}
          Icon={Pencil} label="Manual" sub="Most accurate"
        />
        <ModeButton
          active={order.size.useTailor}
          onPress={() => update('size', { useTailor: true })}
          Icon={MessageCircle} label="Tailor visit" sub="We measure"
        />
      </View>

      {/* Saved profiles */}
      {!order.size.useTailor && savedProfiles.length > 0 && (
        <View className="mb-5">
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowSaved((v) => !v);
            }}
            className="flex-row items-center justify-between p-3.5"
            style={{ backgroundColor: EMERALD_50, borderWidth: 1, borderColor: EMERALD_200 }}
          >
            <View className="flex-row items-center gap-2">
              <Bookmark size={14} color={EMERALD_800} strokeWidth={1.5} />
              <Text className="text-sm">
                You have <Text className="font-semibold">{savedProfiles.length}</Text> saved
              </Text>
            </View>
            <ChevronRight size={14} color={EMERALD_800} style={{ transform: [{ rotate: showSaved ? '90deg' : '0deg' }] }} />
          </Pressable>
          {showSaved && (
            <View style={{ gap: 6, marginTop: 6 }}>
              {savedProfiles.map((p, i) => (
                <Pressable
                  key={i}
                  onPress={() => useSavedProfile(p)}
                  className="p-3 bg-white"
                  style={{ borderWidth: 1, borderColor: STONE_200 }}
                >
                  <Text className="text-sm font-medium" style={{ color: STONE_900 }}>{p.name}</Text>
                  <Text className="text-[11px] mt-0.5" style={{ color: STONE_500 }}>
                    {p.gender} · {Object.keys(p.values || {}).length} measurements
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Mode content */}
      {order.size.useTailor ? (
        <TailorVisitCard />
      ) : order.size.mode === 'chart' ? (
        <SizeChartView
          chart={sizeChart}
          gender={order.gender}
          selected={order.size.chartSize}
          onSelect={(s) => update('size', { chartSize: s })}
        />
      ) : (
        <ManualMeasurements
          fields={measurementFields}
          values={order.size.measurements}
          onChange={setMeasurement}
          onShowGuide={setGuideField}
          profileName={order.size.profileName}
          setProfileName={(n) => update('size', { profileName: n })}
          onSaveProfile={saveProfile}
        />
      )}

      {/* Guide modal */}
      {guideField && <GuideModal field={guideField} onClose={() => setGuideField(null)} />}
    </StepShell>
  );
}

function ModeButton({ active, onPress, Icon, label, sub }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, padding: 12,
        borderWidth: 2, borderColor: active ? EMERALD_700 : STONE_200,
        backgroundColor: active ? `${EMERALD_50}80` : '#fff',
      }}
    >
      <Icon size={18} color={active ? EMERALD_800 : STONE_500} strokeWidth={1.5} />
      <Text className="text-sm font-medium mt-2" style={{ color: STONE_900 }}>{label}</Text>
      <Text className="text-[10px] mt-0.5" style={{ color: STONE_500 }}>{sub}</Text>
    </Pressable>
  );
}

function SizeChartView({ chart, gender, selected, onSelect }) {
  const cols = gender === 'women' ? ['size', 'bust', 'waist', 'hip'] : ['size', 'chest', 'waist', 'hip', 'neck'];

  return (
    <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200 }}>
      <View className="p-4 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderColor: STONE_200 }}>
        <View>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 16, color: STONE_900 }}>Standard size chart</Text>
          <Text className="text-[11px] mt-0.5" style={{ color: STONE_500 }}>All measurements in inches.</Text>
        </View>
        <Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: STONE_500 }}>
          {gender === 'women' ? 'Women' : 'Men'}
        </Text>
      </View>

      {chart.map((row) => {
        const active = selected === row.size;
        return (
          <Pressable
            key={row.size}
            onPress={() => onSelect(row.size)}
            className="px-4 py-3 flex-row items-center"
            style={{
              borderTopWidth: 1, borderColor: STONE_100,
              backgroundColor: active ? EMERALD_50 : '#fff',
            }}
          >
            <Text className="font-medium" style={{ color: STONE_900, width: 80 }}>{row.size}</Text>
            <View className="flex-1 flex-row" style={{ gap: 12 }}>
              {cols.slice(1).map((c) => (
                <View key={c} className="flex-1">
                  <Text className="text-[9px] uppercase tracking-widest" style={{ color: STONE_400 }}>{c}</Text>
                  <Text className="text-xs tabular-nums" style={{ color: STONE_700 }}>{row[c]}</Text>
                </View>
              ))}
            </View>
            {active ? (
              <CheckCircle2 size={18} color={EMERALD_700} strokeWidth={1.5} />
            ) : (
              <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: STONE_300 }} />
            )}
          </Pressable>
        );
      })}

      <View className="p-3 flex-row items-start gap-2" style={{ backgroundColor: STONE_50, borderTopWidth: 1, borderColor: STONE_200 }}>
        <Info size={12} color={STONE_500} style={{ marginTop: 2 }} />
        <Text className="text-[11px] flex-1" style={{ color: STONE_500, lineHeight: 16 }}>
          Between sizes? Pick the larger one — we always confirm before cutting fabric.
        </Text>
      </View>
    </View>
  );
}

function ManualMeasurements({ fields, values, onChange, onShowGuide, profileName, setProfileName, onSaveProfile }) {
  const groups = {
    upper:  { label: 'Upper Body',     fields: fields.filter((f) => f.group === 'upper') },
    lower:  { label: 'Lower Body',     fields: fields.filter((f) => f.group === 'lower') },
    length: { label: 'Garment Length', fields: fields.filter((f) => f.group === 'length') },
  };

  // Sanity check — flag values way outside typical range
  const isSane = (field, val) => {
    if (!val) return true;
    const n = parseFloat(val);
    if (isNaN(n)) return true;
    const [min, max] = (field.placeholder || '').split('-').map((s) => parseFloat(s));
    if (isNaN(min) || isNaN(max)) return true;
    // Allow 50% wider window before warning
    return n >= min * 0.5 && n <= max * 1.5;
  };

  return (
    <View style={{ gap: 24 }}>
      <View className="flex-row items-start gap-2 p-3" style={{ backgroundColor: `${EMERALD_50}80`, borderWidth: 1, borderColor: EMERALD_200 }}>
        <Info size={14} color={EMERALD_900} style={{ marginTop: 1 }} />
        <Text className="text-xs flex-1" style={{ color: EMERALD_900, lineHeight: 18 }}>
          <Text className="font-medium">All measurements in inches.</Text> Tap the ⓘ next to any field for a how-to-measure guide.
        </Text>
      </View>

      {Object.values(groups).map((g) =>
        g.fields.length > 0 ? (
          <View key={g.label}>
            <Text className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: STONE_500 }}>
              {g.label}
            </Text>
            <View style={{ gap: 10 }}>
              {g.fields.map((f) => {
                const val = values[f.id] || '';
                const sane = isSane(f, val);
                return (
                  <View key={f.id}>
                    <View
                      style={{
                        backgroundColor: '#fff', borderWidth: 1,
                        borderColor: !sane ? '#fbbf24' : STONE_200,
                        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                      }}
                    >
                      <View className="flex-1 py-2.5">
                        <Text className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: STONE_500, fontWeight: '600' }}>
                          {f.label}
                        </Text>
                        <TextInput
                          value={val}
                          onChangeText={(v) => onChange(f.id, v)}
                          placeholder={f.placeholder}
                          placeholderTextColor={STONE_400}
                          keyboardType="numeric"
                          style={{ fontSize: 16, color: STONE_900, padding: 0, height: 22 }}
                        />
                      </View>
                      <Text className="text-xs mr-2" style={{ color: STONE_400 }}>in</Text>
                      <Pressable
                        onPress={() => onShowGuide(f)}
                        hitSlop={6}
                        style={{
                          width: 22, height: 22, borderRadius: 11,
                          backgroundColor: STONE_100,
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Text className="text-[11px] font-medium" style={{ color: STONE_500 }}>?</Text>
                      </Pressable>
                    </View>
                    {!sane && (
                      <View className="flex-row items-center gap-1 mt-1">
                        <AlertCircle size={11} color="#d97706" />
                        <Text className="text-[10px]" style={{ color: '#d97706' }}>
                          Typical {f.label.toLowerCase()} is {f.placeholder} in — double-check?
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ) : null
      )}

      {/* Save profile */}
      <View className="p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200 }}>
        <View className="flex-row items-center gap-3 mb-3">
          <Save size={18} color={EMERALD_700} strokeWidth={1.5} />
          <View className="flex-1">
            <Text className="text-sm font-medium" style={{ color: STONE_900 }}>Save these measurements</Text>
            <Text className="text-[11px] mt-0.5" style={{ color: STONE_500 }}>Reuse on every future order.</Text>
          </View>
        </View>
        <TextInput
          value={profileName}
          onChangeText={setProfileName}
          placeholder="Name this profile (e.g., My measurements, Mom)"
          placeholderTextColor={STONE_400}
          style={{
            backgroundColor: STONE_50, borderWidth: 1, borderColor: STONE_200,
            paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: STONE_900,
            marginBottom: 8,
          }}
        />
        <Pressable
          onPress={onSaveProfile}
          style={{ backgroundColor: STONE_900, paddingVertical: 12, alignItems: 'center' }}
        >
          <Text className="text-sm font-medium text-white">Save profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TailorVisitCard() {
  return (
    <View className="p-6" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200 }}>
      <View className="flex-row items-start gap-3 mb-5">
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: EMERALD_100, alignItems: 'center', justifyContent: 'center' }}>
          <MessageCircle size={20} color={EMERALD_800} strokeWidth={1.5} />
        </View>
        <View className="flex-1">
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, lineHeight: 24, color: STONE_900, marginBottom: 4 }}>
            A tailor will measure you
          </Text>
          <Text className="text-xs" style={{ color: STONE_600 }}>
            Within Aba, this is free. Outside Aba, we coordinate via WhatsApp video call.
          </Text>
        </View>
      </View>

      {[
        'Free home or shop visit within Aba',
        'WhatsApp video appointment otherwise',
        'Scheduled around your availability',
        'Measurements saved to your profile',
      ].map((line) => (
        <View key={line} className="flex-row gap-2 mb-2">
          <CheckCircle2 size={14} color={EMERALD_700} strokeWidth={1.5} style={{ marginTop: 2 }} />
          <Text className="text-xs flex-1" style={{ color: STONE_600 }}>{line}</Text>
        </View>
      ))}

      <Text className="text-[11px] mt-4 pt-4" style={{ color: STONE_500, borderTopWidth: 1, borderColor: STONE_100 }}>
        Continue to the next step — we'll arrange the visit when we contact you with your quote.
      </Text>
    </View>
  );
}

function GuideModal({ field, onClose }) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(28,25,23,0.6)' }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#fff' }}>
          <SafeAreaView edges={['bottom']}>
            <View className="items-center pt-3 pb-1">
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: STONE_200 }} />
            </View>
            <View className="px-5 py-4 flex-row items-start justify-between" style={{ borderBottomWidth: 1, borderColor: STONE_200 }}>
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: EMERALD_800 }}>
                  How to measure
                </Text>
                <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: STONE_900 }}>
                  {field.label}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: STONE_100, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} color={STONE_700} />
              </Pressable>
            </View>

            <View className="p-5">
              <View style={{ aspectRatio: 200 / 140, backgroundColor: `${EMERALD_50}80`, marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                <MeasureDiagram field={field.id} />
              </View>
              <Text className="text-sm" style={{ color: STONE_700, lineHeight: 20 }}>{field.guide}</Text>
              <View className="mt-4 p-3" style={{ backgroundColor: STONE_50, borderWidth: 1, borderColor: STONE_100 }}>
                <Text className="text-[11px]" style={{ color: STONE_500 }}>
                  <Text className="font-medium" style={{ color: STONE_700 }}>Typical range:</Text> {field.placeholder} {field.unit}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MeasureDiagram({ field }) {
  const c = EMERALD_800;
  return (
    <Svg viewBox="0 0 200 140" width="100%" height="100%">
      {/* Body silhouette */}
      <Path
        d="M100 20 Q88 22 85 32 L78 50 L70 56 L70 110 L85 110 L86 70 L114 70 L115 110 L130 110 L130 56 L122 50 L115 32 Q112 22 100 20 Z"
        fill="none" stroke={c} strokeWidth="1.2" strokeLinejoin="round" opacity="0.35"
      />
      {/* Highlight based on field */}
      {field === 'neck' && <Ellipse cx="100" cy="28" rx="14" ry="4" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {(field === 'chest' || field === 'bust') && <Ellipse cx="100" cy="48" rx="26" ry="6" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'underBust' && <Ellipse cx="100" cy="56" rx="22" ry="5" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'waist' && <Ellipse cx="100" cy="68" rx="18" ry="4" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {(field === 'hip' || field === 'highHip') && <Ellipse cx="100" cy="82" rx="24" ry="5" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'shoulder' && <Line x1="78" y1="38" x2="122" y2="38" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'sleeve' && <Line x1="124" y1="40" x2="142" y2="92" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'bicep' && <Ellipse cx="128" cy="52" rx="6" ry="3" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'wrist' && <Ellipse cx="142" cy="92" rx="4" ry="2" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'inseam' && <Line x1="100" y1="74" x2="100" y2="124" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'outseam' && <Line x1="125" y1="68" x2="125" y2="124" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'thigh' && <Ellipse cx="92" cy="88" rx="7" ry="3" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'knee' && <Ellipse cx="92" cy="100" rx="5" ry="2.5" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'ankle' && <Ellipse cx="92" cy="118" rx="4" ry="2" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'trouserWaist' && <Ellipse cx="100" cy="72" rx="20" ry="4" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {(field === 'backLength' || field === 'frontLength') && <Line x1="100" y1="32" x2="100" y2="68" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'shoulderToBust' && <Line x1="92" y1="36" x2="92" y2="50" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'bustPointDistance' && <Line x1="88" y1="48" x2="112" y2="48" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'topLength' && <Line x1="125" y1="32" x2="125" y2="80" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {(field === 'dressLength' || field === 'fullLength') && <Line x1="125" y1="32" x2="125" y2="124" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
      {field === 'skirtLength' && <Line x1="125" y1="68" x2="125" y2="120" stroke={c} strokeWidth="2" strokeDasharray="3,2" />}
    </Svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP — DETAILS  (with smart occasion-aware fabric hint)
// ════════════════════════════════════════════════════════════════════════════

function DetailsStep({ order, update, category }) {
  // Smart: if occasion suggests formality, hint at premium fabric
  const occasionHint = useMemo(() => {
    const occ = order.details.occasion?.toLowerCase() || '';
    const formalKeywords = ['wedding', 'owambe', 'ceremony', 'engagement', 'naming', 'gala', 'formal'];
    const isFormalOccasion = formalKeywords.some((k) => occ.includes(k));
    if (isFormalOccasion && order.details.fabric === 'standard') {
      return 'For weddings and ceremonies, Premium or Luxury fabrics drape better in photos.';
    }
    return null;
  }, [order.details.occasion, order.details.fabric]);

  return (
    <StepShell
      eyebrow="Step · Details"
      titleStart="The little"
      titleEm="touches."
      subtitle="The more you tell us, the better the quote we can give you. The estimate below updates live."
    >
      <View style={{ gap: 24 }}>

        {/* Fabric grade */}
        <SegmentedChoice
          label="Fabric grade"
          options={FABRIC_GRADES}
          value={order.details.fabric}
          onChange={(v) => update('details', { fabric: v })}
        />

        {/* Occasion hint */}
        {occasionHint && (
          <View className="flex-row items-start gap-2 p-3 -mt-3" style={{ backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' }}>
            <Sparkles size={14} color="#d97706" style={{ marginTop: 1 }} />
            <Text className="text-xs flex-1" style={{ color: '#92400e', lineHeight: 18 }}>
              {occasionHint}
            </Text>
          </View>
        )}

        {/* Embroidery */}
        <SegmentedChoice
          label="Embroidery"
          options={EMBROIDERY_LEVELS}
          value={order.details.embroidery}
          onChange={(v) => update('details', { embroidery: v })}
        />

        {/* Lead time */}
        <SegmentedChoice
          label="Lead time"
          options={LEAD_TIME_OPTIONS}
          value={order.details.leadTime}
          onChange={(v) => update('details', { leadTime: v })}
        />

        {/* Fitting */}
        <SegmentedChoice
          label="Fitting"
          options={FITTING_PREFERENCES}
          value={order.details.fitting}
          onChange={(v) => update('details', { fitting: v })}
        />

        {/* Optional fields */}
        <FieldText
          label="Fabric preference (optional)"
          value={order.details.fabricText}
          onChange={(v) => update('details', { fabricText: v })}
          placeholder="e.g., Cashmere, Cotton, Aso-Oke, Lace"
          help="Leave blank — we'll suggest options in the quote."
        />
        <FieldText label="Color preference" value={order.details.color} onChange={(v) => update('details', { color: v })} placeholder="e.g., Navy, Cream, Burgundy" />
        <FieldText label="Occasion" value={order.details.occasion} onChange={(v) => update('details', { occasion: v })} placeholder="e.g., Wedding, Office, Owambe" />

        <View>
          <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>Need by</Text>
          <TextInput
            value={order.details.needBy}
            onChangeText={(v) => update('details', { needBy: v })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={STONE_400}
            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200, padding: 12, fontSize: 14, color: STONE_900 }}
          />
        </View>

        <View>
          <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>Anything else?</Text>
          <TextInput
            value={order.details.notes}
            onChangeText={(v) => update('details', { notes: v })}
            placeholder="Allergies, preferences, special requests…"
            placeholderTextColor={STONE_400}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200, padding: 12, fontSize: 14, color: STONE_900, minHeight: 100 }}
          />
        </View>
      </View>
    </StepShell>
  );
}

function SegmentedChoice({ label, options, value, onChange }) {
  return (
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>{label}</Text>
      <View className="flex-row" style={{ gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onChange(opt.id)}
              style={{
                flex: 1, padding: 10,
                borderWidth: 2, borderColor: active ? EMERALD_700 : STONE_200,
                backgroundColor: active ? `${EMERALD_50}80` : '#fff',
              }}
            >
              <Text className="text-xs font-medium" style={{ color: STONE_900 }} numberOfLines={1}>{opt.name}</Text>
              <Text className="text-[10px] mt-0.5" style={{ color: STONE_500, lineHeight: 14 }} numberOfLines={2}>{opt.desc}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FieldText({ label, value, onChange, placeholder, help }) {
  return (
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={STONE_400}
        style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200, padding: 12, fontSize: 14, color: STONE_900 }}
      />
      {help && <Text className="text-[11px] mt-1.5" style={{ color: STONE_500 }}>{help}</Text>}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP — CONTACT
// ════════════════════════════════════════════════════════════════════════════

function ContactStep({ order, update }) {
  return (
    <StepShell
      eyebrow="Step · Contact"
      titleStart="How do we"
      titleEm="reach you?"
      subtitle="We'll send your quote to your WhatsApp or phone within 24 hours."
    >
      <View style={{ gap: 16 }}>
        <FieldText label="Full name *" value={order.contact.name} onChange={(v) => update('contact', { name: v })} placeholder="Your name" />

        <FieldText
          label="WhatsApp number *"
          value={order.contact.whatsapp}
          onChange={(v) => update('contact', { whatsapp: v })}
          placeholder="+234..."
          help="We send quote and updates here."
        />

        <FieldText label="Phone number" value={order.contact.phone} onChange={(v) => update('contact', { phone: v })} placeholder="+234..." />
        <FieldText label="Email (optional)" value={order.contact.email} onChange={(v) => update('contact', { email: v })} placeholder="you@example.com" />

        <View>
          <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>Delivery</Text>
          <View className="flex-row" style={{ gap: 8 }}>
            {[
              { id: 'aba',     label: 'Within Aba',  sub: 'Free pickup or local delivery' },
              { id: 'nigeria', label: 'Outside Aba', sub: 'Nationwide shipping (cost in quote)' },
            ].map((d) => {
              const active = order.contact.delivery === d.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => update('contact', { delivery: d.id })}
                  style={{
                    flex: 1, padding: 12,
                    borderWidth: 2, borderColor: active ? EMERALD_700 : STONE_200,
                    backgroundColor: active ? `${EMERALD_50}80` : '#fff',
                  }}
                >
                  <Text className="text-sm font-medium" style={{ color: STONE_900 }}>{d.label}</Text>
                  <Text className="text-[10px] mt-0.5" style={{ color: STONE_500 }}>{d.sub}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>
            Delivery address {order.contact.delivery === 'nigeria' && <Text style={{ color: '#b91c1c' }}>*</Text>}
          </Text>
          <TextInput
            value={order.contact.address}
            onChangeText={(v) => update('contact', { address: v })}
            placeholder={order.contact.delivery === 'aba' ? 'Aba address (or leave blank for shop pickup)' : 'Full delivery address'}
            placeholderTextColor={STONE_400}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200, padding: 12, fontSize: 14, color: STONE_900, minHeight: 80 }}
          />
        </View>

        <View className="flex-row items-start gap-2 p-3" style={{ backgroundColor: STONE_50, borderWidth: 1, borderColor: STONE_200 }}>
          <ShieldCheck size={14} color={EMERALD_700} style={{ marginTop: 1 }} />
          <Text className="text-xs flex-1" style={{ color: STONE_600, lineHeight: 18 }}>
            Submitting this is <Text className="font-medium" style={{ color: STONE_900 }}>not a payment</Text>. We review and send a quote first. You only pay when you accept it (50% deposit to start, balance on delivery).
          </Text>
        </View>
      </View>
    </StepShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STEP — REVIEW
// ════════════════════════════════════════════════════════════════════════════

function ReviewStep({ order, category, setStepIndex, steps, estimate }) {
  const findStepIdx = (id) => steps.findIndex((s) => s.id === id);
  const selectedStyle = order.style.selectedId ? category.sampleStyles?.find((s) => s.id === order.style.selectedId) : null;

  return (
    <StepShell
      eyebrow="Step · Review"
      titleStart="One last"
      titleEm="look."
      subtitle="Check everything below. You can still change anything before submitting."
    >
      {/* Big estimate banner */}
      {estimate.low > 0 && (
        <View className="p-5 mb-4" style={{ backgroundColor: EMERALD_50, borderWidth: 1, borderColor: EMERALD_200 }}>
          <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: EMERALD_800 }}>
            Your estimate
          </Text>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: STONE_900, lineHeight: 32 }}>
            ₦{estimate.low.toLocaleString()} – ₦{estimate.high.toLocaleString()}
          </Text>
          <Text className="text-[11px] mt-2" style={{ color: STONE_600, lineHeight: 16 }}>
            Final quote within 24h via WhatsApp. Typically within 10% of estimate.
          </Text>
        </View>
      )}

      <View style={{ gap: 10 }}>
        <ReviewCard label="Garment" value={<Text style={{ color: STONE_900 }}>{category.name}</Text>} />

        {order.gender && (
          <ReviewCard
            label="For"
            onEdit={() => setStepIndex(findStepIdx('gender'))}
            value={<Text style={{ color: STONE_900 }}>{order.gender === 'men' ? 'Him' : 'Her'}</Text>}
          />
        )}

        <ReviewCard
          label="Style"
          onEdit={() => setStepIndex(findStepIdx('style'))}
          value={
            <View style={{ gap: 6 }}>
              {selectedStyle && (
                <View className="flex-row items-center gap-2">
                  {selectedStyle.imageUrl && (
                    <Image
                      source={{ uri: selectedStyle.imageUrl }}
                      style={{ width: 40, height: 40, backgroundColor: STONE_100 }}
                      contentFit="cover"
                    />
                  )}
                  <Text style={{ color: STONE_900 }}>{selectedStyle.name}</Text>
                </View>
              )}
              {order.style.customImages?.length > 0 && (
                <View className="flex-row" style={{ gap: 4 }}>
                  {order.style.customImages.map((img, i) => (
                    <Image
                      key={i}
                      source={{ uri: img.dataUrl }}
                      style={{ width: 40, height: 40, backgroundColor: STONE_100 }}
                      contentFit="cover"
                    />
                  ))}
                </View>
              )}
              {order.style.styleNotes && (
                <Text className="text-xs italic" style={{ color: STONE_500 }}>"{order.style.styleNotes}"</Text>
              )}
            </View>
          }
        />

        <ReviewCard
          label="Size"
          onEdit={() => setStepIndex(findStepIdx('size'))}
          value={
            order.size.useTailor ? (
              <Text style={{ color: STONE_900 }}>Tailor will measure in person</Text>
            ) : order.size.mode === 'chart' ? (
              <Text style={{ color: STONE_900 }}>Standard size: <Text className="font-medium">{order.size.chartSize}</Text></Text>
            ) : (
              <View style={{ gap: 3 }}>
                {Object.entries(order.size.measurements).filter(([, v]) => v).map(([k, v]) => (
                  <View key={k} className="flex-row justify-between">
                    <Text className="text-xs" style={{ color: STONE_500 }}>{k}</Text>
                    <Text className="text-xs font-medium tabular-nums" style={{ color: STONE_900 }}>{v}″</Text>
                  </View>
                ))}
              </View>
            )
          }
        />

        <ReviewCard
          label="Details"
          onEdit={() => setStepIndex(findStepIdx('details'))}
          value={
            <View style={{ gap: 3 }}>
              <Text className="text-xs" style={{ color: STONE_600 }}>
                Fabric: <Text className="font-medium" style={{ color: STONE_900 }}>{FABRIC_GRADES.find((f) => f.id === order.details.fabric)?.name}</Text>
              </Text>
              <Text className="text-xs" style={{ color: STONE_600 }}>
                Embroidery: <Text className="font-medium" style={{ color: STONE_900 }}>{EMBROIDERY_LEVELS.find((e) => e.id === order.details.embroidery)?.name}</Text>
              </Text>
              <Text className="text-xs" style={{ color: STONE_600 }}>
                Lead time: <Text className="font-medium" style={{ color: STONE_900 }}>{LEAD_TIME_OPTIONS.find((l) => l.id === order.details.leadTime)?.name}</Text>
              </Text>
              <Text className="text-xs" style={{ color: STONE_600 }}>
                Fitting: <Text className="font-medium" style={{ color: STONE_900 }}>{FITTING_PREFERENCES.find((f) => f.id === order.details.fitting)?.name}</Text>
              </Text>
              {order.details.fabricText && <Text className="text-xs" style={{ color: STONE_600 }}>Custom fabric: <Text style={{ color: STONE_900 }}>{order.details.fabricText}</Text></Text>}
              {order.details.color && <Text className="text-xs" style={{ color: STONE_600 }}>Color: <Text style={{ color: STONE_900 }}>{order.details.color}</Text></Text>}
              {order.details.occasion && <Text className="text-xs" style={{ color: STONE_600 }}>Occasion: <Text style={{ color: STONE_900 }}>{order.details.occasion}</Text></Text>}
              {order.details.needBy && <Text className="text-xs" style={{ color: STONE_600 }}>Need by: <Text style={{ color: STONE_900 }}>{order.details.needBy}</Text></Text>}
              {order.details.notes && <Text className="text-xs italic mt-1" style={{ color: STONE_500 }}>"{order.details.notes}"</Text>}
            </View>
          }
        />

        <ReviewCard
          label="Contact"
          onEdit={() => setStepIndex(findStepIdx('contact'))}
          value={
            <View style={{ gap: 3 }}>
              <Text className="text-sm font-medium" style={{ color: STONE_900 }}>{order.contact.name}</Text>
              {order.contact.whatsapp && <Text className="text-xs" style={{ color: STONE_600 }}>WhatsApp: <Text style={{ color: STONE_900 }}>{order.contact.whatsapp}</Text></Text>}
              {order.contact.phone && <Text className="text-xs" style={{ color: STONE_600 }}>Phone: <Text style={{ color: STONE_900 }}>{order.contact.phone}</Text></Text>}
              {order.contact.email && <Text className="text-xs" style={{ color: STONE_600 }}>Email: <Text style={{ color: STONE_900 }}>{order.contact.email}</Text></Text>}
              <Text className="text-xs" style={{ color: STONE_600 }}>Delivery: <Text style={{ color: STONE_900 }}>{order.contact.delivery === 'aba' ? 'Within Aba' : 'Outside Aba'}</Text></Text>
              {order.contact.address && <Text className="text-xs italic" style={{ color: STONE_500 }}>{order.contact.address}</Text>}
            </View>
          }
        />

        <View className="p-4 mt-2" style={{ backgroundColor: EMERALD_50, borderWidth: 1, borderColor: EMERALD_200 }}>
          <View className="flex-row items-start gap-3">
            <Sparkles size={16} color={EMERALD_800} style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text className="font-medium text-sm mb-1" style={{ color: EMERALD_900 }}>What happens next</Text>
              <Text className="text-xs" style={{ color: EMERALD_900, lineHeight: 18 }}>
                Submit → A tailor reviews → Quote on WhatsApp within 24h → Pay 50% deposit → Delivery in {category.leadTime} → Pay balance on receipt.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </StepShell>
  );
}

function ReviewCard({ label, value, onEdit }) {
  return (
    <View className="p-4 flex-row items-start justify-between gap-3" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200 }}>
      <View className="flex-1">
        <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>{label}</Text>
        {value}
      </View>
      {onEdit && (
        <Pressable onPress={onEdit}>
          <Text className="text-xs font-medium" style={{ color: EMERALD_800 }}>Edit</Text>
        </Pressable>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SUCCESS SCREEN
// ════════════════════════════════════════════════════════════════════════════

function SuccessScreen({ submitted, category }) {
  const [copied, setCopied] = useState(false);

  const copyRef = async () => {
    await Clipboard.setStringAsync(submitted.ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const waMessage = encodeURIComponent(
    `Hello! I just submitted a custom order on ExploreAba.\n\nReference: ${submitted.ref}\nGarment: ${submitted.categoryName || category.name}\nName: ${submitted.contact?.name || ''}`
  );

  return (
    <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: BG }}>
      <SafeAreaView>
        <View className="items-center">
          <View
            style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: EMERALD_100, alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Check size={36} color={EMERALD_800} strokeWidth={2.5} />
          </View>
          <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: EMERALD_800 }}>
            Order received
          </Text>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 40, lineHeight: 44, color: STONE_900, marginBottom: 16 }}>
            We're on it.
          </Text>
          <Text className="text-base text-center mb-8" style={{ color: STONE_600, lineHeight: 22, maxWidth: 320 }}>
            A tailor will review your <Text className="font-medium" style={{ color: STONE_900 }}>{submitted.categoryName || category.name}</Text> order and send a quote on WhatsApp within 24 hours.
          </Text>

          <View className="p-5 mb-6 w-full" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_200, maxWidth: 360 }}>
            <Text className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: STONE_500 }}>
              Reference number
            </Text>
            <View className="flex-row items-center justify-between">
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: STONE_900 }}>{submitted.ref}</Text>
              <Pressable
                onPress={copyRef}
                style={{ backgroundColor: STONE_100, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                {copied ? <Check size={12} color={EMERALD_700} /> : <Copy size={12} color={STONE_700} />}
                <Text className="text-xs font-medium" style={{ color: STONE_700 }}>{copied ? 'Copied' : 'Copy'}</Text>
              </Pressable>
            </View>
            <Text className="text-[11px] mt-3" style={{ color: STONE_500 }}>
              Save this — quote it when you reply on WhatsApp.
            </Text>
          </View>

          <View className="w-full" style={{ gap: 8, maxWidth: 360 }}>
            <Pressable
              onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`)}
              className="rounded-full py-3.5 flex-row items-center justify-center gap-2"
              style={{ backgroundColor: EMERALD_700 }}
            >
              <MessageCircle size={14} color="#fff" />
              <Text className="text-sm font-medium text-white">Open WhatsApp now</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/custom')}
              className="rounded-full py-3.5 flex-row items-center justify-center gap-2"
              style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: STONE_300 }}
            >
              <Text className="text-sm font-medium" style={{ color: STONE_900 }}>Back to categories</Text>
              <ArrowRight size={14} color={STONE_900} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}