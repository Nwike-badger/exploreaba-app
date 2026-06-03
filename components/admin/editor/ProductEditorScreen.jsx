import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Trash2, Check } from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { slugify, getErr, flattenTree } from '@/utils/adminUtils';
import { toast } from '@/utils/toast';
import { C } from './tokens';

import BasicInfoCard from './BasicInfoCard';
import MediaGalleryCard from './MediaGalleryCard';
import PricingCard from './PricingCard';
import OrganizationCard from './OrganizationCard';
import VariantsCard from './VariantsCard';
import InventoryCard from './InventoryCard';
import SpecsCard from './SpecsCard';
import StatusCard from './StatusCard';
import SummaryCard from './SummaryCard';

const EMPTY_FORM = {
  name: '', slug: '', description: '',
  basePrice: '', compareAtPrice: '', discount: '',
  categorySlug: '', brandSlug: '', tags: '', isActive: true,
};

export default function ProductEditorScreen({ productId }) {
  const isEdit = !!productId;

  const [form, setForm] = useState(EMPTY_FORM);
  const setF = (patch) => setForm((f) => ({ ...f, ...patch }));
  const slugEdited = useRef(false);
  const handleNameChange = (val) =>
    setForm((f) => (slugEdited.current ? { ...f, name: val } : { ...f, name: val, slug: slugify(val) }));

  const [media, setMedia] = useState([]);
  const [mediaInput, setMediaInput] = useState('');
  const [options, setOptions] = useState([]);
  const [variants, setVariants] = useState([]);
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [directInventory, setDirectInventory] = useState({ variantId: null, sku: '', stock: '0' });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [initializing, setInitializing] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const flatCats = useMemo(() => flattenTree(categories), [categories]);
  const hasVariants = variants.length > 0;
  const imageOptions = useMemo(() => media.filter((m) => m.type === 'IMAGE'), [media]);
  const totalUnits = variants.reduce((s, v) => s + (parseInt(v.stockQuantity) || 0), 0);

  // ── Load categories + brands (and product on edit) ──
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories/tree').catch(() => ({ data: [] })),
          api.get('/brands').catch(() => ({ data: [] })),
        ]);
        const cats = catRes.data || [];
        const brandData = Array.isArray(brandRes.data) ? brandRes.data : (brandRes.data?.content ?? []);
        if (!active) return;
        setCategories(cats);
        setBrands(brandData);

        if (isEdit) {
          const res = await api.get(`/products/${productId}`);
          if (active) hydrateForm(res.data, brandData);
        }
      } catch {
        if (active) { toast.error('Failed to load product'); router.back(); }
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => { active = false; };
  }, [productId]);

  // ── Map GET /products/{id} → editor state (mirrors your web load) ──
  const hydrateForm = (data, brandData) => {
    const p = data.product ?? data;
    const v = data.variants ?? [];
    slugEdited.current = true;

    setForm({
      name: p.name || '',
      slug: p.slug || '',
      description: p.description || '',
      basePrice: p.basePrice ?? '',
      compareAtPrice: p.compareAtPrice ?? '',
      discount: p.discount > 0 ? String(p.discount) : '',
      categorySlug: p.categorySlug || '',
      brandSlug: p.brand?.slug || brandData.find((b) => b.name === p.brandName)?.slug || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      isActive: p.active !== false,
    });

    setMedia((p.images || []).map((img) => ({
      url: img.url,
      isPrimary: !!(img.isPrimary ?? img.primary),
      type: img.type ?? img.mediaType ?? 'IMAGE',
    })));

    const loadedOptions = (p.variantOptions || []).map((o) => ({ name: o.name, values: o.values }));
    setOptions(loadedOptions);

    if (loadedOptions.length > 0) {
      setVariants(v.map((vt) => ({
        id: vt.id,
        sku: vt.sku || '',
        price: vt.price ?? '',
        compareAtPrice: vt.compareAtPrice ?? '',
        stockQuantity: vt.stockQuantity ?? 0,
        attributes: vt.attributes || {},
        isActive: vt.active !== false,
        imageUrl: (vt.images || []).find((i) => i.isPrimary ?? i.primary)?.url || '',
      })));
    } else {
      const def = v.find((vt) => Object.keys(vt.attributes || {}).length === 0) || v[0];
      if (def) setDirectInventory({ variantId: def.id, sku: def.sku || '', stock: String(def.stockQuantity ?? 0) });
      setVariants([]);
    }

    if (p.specifications && Object.keys(p.specifications).length) {
      setSpecs(Object.entries(p.specifications).map(([k, val]) => ({ key: k, value: val })));
    }
  };

  // ── Media ──
  const addMedia = () => {
    const url = mediaInput.trim();
    if (!url) return;
    const isVideo = /youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|mov)$/i.test(url);
    setMedia((prev) => [...prev, { url, isPrimary: prev.length === 0, type: isVideo ? 'VIDEO' : 'IMAGE' }]);
    setMediaInput('');
  };
  const removeMedia = (i) =>
    setMedia((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (next.length > 0 && !next.some((m) => m.isPrimary)) next[0] = { ...next[0], isPrimary: true };
      return next;
    });
  const setPrimary = (i) => setMedia((prev) => prev.map((m, idx) => ({ ...m, isPrimary: idx === i })));

  // ── Specs ──
  const updateSpec = (i, field, val) => setSpecs((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));

  // ── Options ──
  const addOption = () => setOptions((prev) => [...prev, { name: '', values: [] }]);
  const updateOptionName = (i, name) => setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, name } : o)));
  const addOptionValue = (i, val) => {
    const clean = val.trim();
    if (!clean) return;
    setOptions((prev) => prev.map((o, idx) => (idx === i && !o.values.includes(clean) ? { ...o, values: [...o.values, clean] } : o)));
  };
  const removeOptionValue = (i, valIdx) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, values: o.values.filter((_, k) => k !== valIdx) } : o)));
  const removeOption = (i) => setOptions((prev) => prev.filter((_, idx) => idx !== i));

  // ── Sync variants (cartesian + SKU generation), mirrors web ──
  const syncVariants = () => {
    const valid = options.filter((o) => o.name.trim() && o.values.length > 0);
    if (valid.length === 0) {
      Alert.alert('Clear variants?', 'This will clear your variant table. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setVariants([]) },
      ]);
      return;
    }
    const keys = valid.map((o) => o.name.trim());
    const valArrays = valid.map((o) => o.values);
    const cartesian = (arrs) => arrs.reduce((acc, arr) => acc.flatMap((c) => arr.map((vv) => [...c, vv])), [[]]);
    const combos = cartesian(valArrays).map((vals) => {
      const attrs = {};
      keys.forEach((k, i) => { attrs[k] = vals[i]; });
      return attrs;
    });
    setVariants((prev) =>
      combos.map((combo) => {
        const existing = prev.find((pv) => JSON.stringify(pv.attributes) === JSON.stringify(combo));
        if (existing) return existing;
        const namePart = (form.name || 'SKU').split(/\s+/)[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
        const attrPart = Object.values(combo).join('-').toUpperCase().replace(/[^A-Z0-9-]/g, '');
        return { sku: `${namePart}-${attrPart}`, price: form.basePrice || '', compareAtPrice: '', stockQuantity: 0, attributes: combo, isActive: true, imageUrl: '' };
      })
    );
    toast.success('Variants synchronised!');
  };
  const updateVariant = (i, patch) => setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const removeVariant = (i) => setVariants((prev) => prev.filter((_, idx) => idx !== i));
  const applyBulk = () => {
    if (!bulkPrice && !bulkStock) return;
    setVariants((prev) => prev.map((v) => ({
      ...v,
      ...(bulkPrice !== '' ? { price: bulkPrice } : {}),
      ...(bulkStock !== '' ? { stockQuantity: bulkStock } : {}),
    })));
    setBulkPrice('');
    setBulkStock('');
    toast.success('Bulk values applied');
  };

  // ── Save (mirrors web: POST /products upsert, then variant loop) ──
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    if (!form.basePrice) { toast.error('Base price is required'); return; }
    if (options.length > 0 && variants.some((v) => !v.sku.trim())) { toast.error('All variants need a SKU'); return; }

    setSaving(true);
    try {
      const variantOptions = {};
      options.forEach((o) => { if (o.name.trim() && o.values.length > 0) variantOptions[o.name.trim()] = o.values; });

      const specifications = {};
      specs.forEach((s) => { if (s.key.trim()) specifications[s.key.trim()] = s.value.trim(); });

      const images = media.map((m) => ({ url: m.url, isPrimary: !!m.isPrimary, type: m.type || 'IMAGE', altText: form.name }));

      const productPayload = {
        id: productId || null,
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim(),
        basePrice: parseFloat(form.basePrice) || 0,
        compareAtPrice: (!form.discount && form.compareAtPrice) ? parseFloat(form.compareAtPrice) || null : null,
        discount: form.discount ? parseFloat(form.discount) : null,
        categorySlug: form.categorySlug || null,
        brandSlug: form.brandSlug || null,
        isActive: form.isActive,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images,
        specifications: Object.keys(specifications).length ? specifications : {},
        variantOptions: Object.keys(variantOptions).length ? variantOptions : {},
      };

      const res = await api.post('/products', productPayload);
      const savedProductId = res.data.id;
      if (!savedProductId) throw new Error('Product saved but no ID returned from server');

      if (options.length > 0 && variants.length > 0) {
        const errors = [];
        for (const v of variants) {
          const variantImages = v.imageUrl
            ? [{ url: v.imageUrl, isPrimary: true, type: 'IMAGE', altText: v.sku }]
            : images;
          try {
            await api.post('/products/variants', {
              id: v.id || null,
              productId: savedProductId,
              sku: v.sku.trim(),
              price: parseFloat(v.price) || 0,
              compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) || null : null,
              stockQuantity: parseInt(v.stockQuantity) || 0,
              attributes: v.attributes,
              isActive: v.isActive,
              images: variantImages,
            });
          } catch (err) {
            const label = Object.values(v.attributes).join('/') || v.sku;
            errors.push(`[${label}]: ${getErr(err)}`);
          }
        }
        if (errors.length > 0) {
          toast.error(`Product saved but ${errors.length} variant(s) had errors`);
          errors.forEach((e) => toast.error(e));
        } else {
          toast.success(`Product saved with ${variants.length} variants!`);
        }
      } else {
        const autoSku = directInventory.sku.trim() || `${slugify(form.name)}-default`.toUpperCase().replace(/-+/g, '-');
        await api.post('/products/variants', {
          id: directInventory.variantId || null,
          productId: savedProductId,
          sku: autoSku,
          price: parseFloat(form.basePrice) || 0,
          compareAtPrice: (!form.discount && form.compareAtPrice) ? parseFloat(form.compareAtPrice) || null : null,
          stockQuantity: parseInt(directInventory.stock) || 0,
          attributes: {},
          isActive: form.isActive,
          images,
        });
        toast.success(isEdit ? 'Product updated!' : 'Product created!');
      }

      router.back();
    } catch (err) {
      toast.error(getErr(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete product', `Permanently delete "${form.name}" and ALL its variants? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/products/${productId}`);
            toast.success('Product deleted');
            router.back();
          } catch (err) {
            toast.error(getErr(err));
          }
        },
      },
    ]);
  };

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate50 }}>
        <ActivityIndicator color={C.blue600} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.slate50 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <ArrowLeft size={18} color={C.slate600} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '800', color: C.slate900 }}>
                {isEdit ? (form.name || 'Edit product') : 'New product'}
              </Text>
              {form.slug ? <Text style={{ fontSize: 10, color: C.slate400, fontFamily: 'monospace' }}>/{form.slug}</Text> : null}
            </View>
          </Pressable>
          {isEdit && (
            <Pressable onPress={handleDelete} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: C.red50, borderWidth: 1, borderColor: C.red200 }}>
              <Trash2 size={13} color={C.red500} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.red500 }}>Delete</Text>
            </Pressable>
          )}
        </View>

        <BasicInfoCard form={form} setF={setF} handleNameChange={handleNameChange} slugEdited={slugEdited} />
        <PricingCard form={form} setF={setF} hasVariants={hasVariants} />
        <OrganizationCard form={form} setF={setF} flatCats={flatCats} brands={brands} />
        <MediaGalleryCard media={media} mediaInput={mediaInput} setMediaInput={setMediaInput} addMedia={addMedia} removeMedia={removeMedia} setPrimary={setPrimary} />
        <VariantsCard
          options={options} variants={variants} form={form}
          bulkPrice={bulkPrice} bulkStock={bulkStock} setBulkPrice={setBulkPrice} setBulkStock={setBulkStock}
          imageOptions={imageOptions} hasVariants={hasVariants} totalUnits={totalUnits}
          addOption={addOption} updateOptionName={updateOptionName}
          addOptionValue={addOptionValue} removeOptionValue={removeOptionValue} removeOption={removeOption}
          syncVariants={syncVariants} updateVariant={updateVariant} removeVariant={removeVariant} applyBulk={applyBulk}
        />
        <InventoryCard options={options} variants={variants} directInventory={directInventory} setDirectInventory={setDirectInventory} form={form} />
        <SpecsCard specs={specs} setSpecs={setSpecs} updateSpec={updateSpec} />
        <StatusCard form={form} setF={setF} />
        {isEdit && <SummaryCard variants={variants} totalUnits={totalUnits} media={media} specs={specs} form={form} />}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.slate200 }}>
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Pressable onPress={() => router.back()} disabled={saving} style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.slate200, justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.slate600 }}>Cancel</Text>
          </Pressable>
          <Pressable onPress={handleSave} disabled={saving} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.slate900, paddingVertical: 12, borderRadius: 12, opacity: saving ? 0.6 : 1 }}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#fff" />}
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{isEdit ? 'Update product' : 'Save product'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}