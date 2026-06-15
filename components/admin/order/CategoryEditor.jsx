import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft, Save, Loader2, Upload, Link as LinkIcon, X, Plus, Trash2, Power,
  Image as ImageIcon, AlertCircle, Check,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { toast } from '@/utils/toast';
import { C } from '@/components/admin/editor/tokens';
import PickerField from '@/components/ui/PickerField';

const inputStyle = { backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.slate800 };
const labelStyle = { fontSize: 10, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 };
const hintStyle = { fontSize: 11, color: C.slate400, marginTop: 4, lineHeight: 15 };

const GENDER_OPTIONS = [
  { label: 'For men', value: 'men' },
  { label: 'For women', value: 'women' },
  { label: 'Unisex (customer picks at submit)', value: 'unisex' },
];
const MEASUREMENT_OPTIONS = [
  { label: 'Men · Full body', value: 'menFull' },
  { label: 'Women · Full body', value: 'womenFull' },
  { label: 'Women · Upper + lower', value: 'womenUpperLower' },
  { label: 'Unisex · Long top', value: 'unisexUpperLong' },
  { label: 'Unisex · Short top', value: 'unisexUpperShort' },
  { label: 'Unisex · Lower only', value: 'unisexLower' },
];
const ACCENT_PRESETS = ['#0d4d2a', '#1e3a8a', '#7c2d12', '#831843', '#374151', '#b45309'];

const blankCategory = () => ({
  slug: '', name: '', tagline: '', description: '', genderHint: 'unisex',
  priceFrom: '', leadTime: '', accent: '#0d4d2a', coverImageUrl: '', coverImagePublicId: '',
  measurementSet: 'menFull', sortOrder: 100, active: true,
});

// ─── ImageInput ─────────────────────────────────────────────────────────────
function ImageInput({ url, onChange, label }) {
  const [mode, setMode] = useState(url ? 'url' : 'upload');
  const [uploading, setUploading] = useState(false);

  const pickAndUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: asset.fileName || 'upload.jpg', type: asset.mimeType || 'image/jpeg' });
      const res = await api.post('/v1/custom-uploads/style-reference', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(res.data.url, res.data.publicId);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      {label ? <Text style={labelStyle}>{label}</Text> : null}
      {/* Mode toggle */}
      <View style={{ flexDirection: 'row', gap: 4, backgroundColor: C.slate100, padding: 3, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 10 }}>
        {[{ k: 'upload', icon: Upload, t: 'Upload' }, { k: 'url', icon: LinkIcon, t: 'Paste URL' }].map(({ k, icon: Icon, t }) => {
          const active = mode === k;
          return (
            <Pressable key={k} onPress={() => setMode(k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: active ? '#fff' : 'transparent' }}>
              <Icon size={12} color={active ? C.slate900 : C.slate500} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: active ? C.slate900 : C.slate500 }}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Preview */}
      {url ? (
        <View style={{ position: 'relative', alignSelf: 'flex-start', marginBottom: 10 }}>
          <Image source={{ uri: url }} style={{ width: 160, height: 120, borderRadius: 10, borderWidth: 1, borderColor: C.slate200 }} contentFit="cover" />
          <Pressable onPress={() => onChange('', '')} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.8)', alignItems: 'center', justifyContent: 'center' }}>
            <X size={12} color="#fff" />
          </Pressable>
        </View>
      ) : null}

      {mode === 'upload' ? (
        <View>
          <Pressable onPress={pickAndUpload} disabled={uploading} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: C.slate900, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, opacity: uploading ? 0.6 : 1 }}>
            {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Upload size={14} color="#fff" />}
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{uploading ? 'Uploading…' : (url ? 'Replace image' : 'Choose photo')}</Text>
          </Pressable>
          <Text style={hintStyle}>JPG / PNG · uploads to Cloudinary</Text>
        </View>
      ) : (
        <View>
          <TextInput value={url} onChangeText={(t) => onChange(t, '')} placeholder="https://images.unsplash.com/…" placeholderTextColor={C.slate300} autoCapitalize="none" style={inputStyle} />
          <Text style={hintStyle}>External URL (Unsplash, Cloudinary, etc.)</Text>
        </View>
      )}
    </View>
  );
}

// ─── Section / Field primitives ──────────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 14, padding: 16 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: C.slate900 }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 11, color: C.slate400, marginTop: 2 }}>{subtitle}</Text> : null}
      <View style={{ gap: 14, marginTop: 14 }}>{children}</View>
    </View>
  );
}
function Field({ label, hint, children }) {
  return (
    <View>
      <Text style={labelStyle}>{label}</Text>
      {children}
      {hint ? <Text style={hintStyle}>{hint}</Text> : null}
    </View>
  );
}

// ─── StyleForm (Modal — create/edit a gallery style) ──────────────────────────
function StyleForm({ categorySlug, existing, onClose, onSaved }) {
  const isEdit = !!existing;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: existing?.slug || '', name: existing?.name || '', tone: existing?.tone || '',
    imageUrl: existing?.imageUrl || '', imagePublicId: existing?.imagePublicId || '',
    description: existing?.description || '', sortOrder: existing?.sortOrder ?? 100, active: existing?.active !== false,
  });
  const setF = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error('Name is required'); return; }
    if (!isEdit && !form.slug?.trim()) { toast.error('Slug is required'); return; }
    if (!isEdit && !/^[a-z0-9-]+$/.test(form.slug)) { toast.error('Slug: lowercase letters, numbers, hyphens only'); return; }
    const payload = { ...form, slug: isEdit ? undefined : form.slug.trim().toLowerCase(), sortOrder: Number(form.sortOrder) || 100 };
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/v1/admin/custom-catalog/styles/${existing.slug}`, payload);
        toast.success(`${form.name} updated`);
      } else {
        await api.post(`/v1/admin/custom-catalog/categories/${categorySlug}/styles`, payload);
        toast.success(`${form.name} added`);
      }
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save style');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', maxHeight: '90%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate900 }}>{isEdit ? `Edit · ${existing.slug}` : 'New style'}</Text>
            <Pressable onPress={onClose} hitSlop={8}><X size={18} color={C.slate400} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }} keyboardShouldPersistTaps="handled">
            {!isEdit ? (
              <Field label="Slug *">
                <TextInput value={form.slug} onChangeText={(t) => setF({ slug: t.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="agbada-classic-royal" placeholderTextColor={C.slate300} autoCapitalize="none" style={[inputStyle, { fontFamily: 'monospace' }]} />
              </Field>
            ) : null}
            <Field label="Name *">
              <TextInput value={form.name} onChangeText={(t) => setF({ name: t })} placeholder="Classic Royal" placeholderTextColor={C.slate300} style={inputStyle} />
            </Field>
            <Field label="Tone">
              <TextInput value={form.tone} onChangeText={(t) => setF({ tone: t })} placeholder="Cream / Gold embroidery" placeholderTextColor={C.slate300} style={inputStyle} />
            </Field>
            <ImageInput label="Image" url={form.imageUrl} onChange={(u, pid) => setF({ imageUrl: u, imagePublicId: pid || '' })} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Sort order">
                  <TextInput value={String(form.sortOrder)} onChangeText={(t) => setF({ sortOrder: t.replace(/\D/g, '') })} keyboardType="number-pad" style={inputStyle} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Active">
                  <Pressable onPress={() => setF({ active: !form.active })} style={{ paddingVertical: 10, borderWidth: 2, borderColor: form.active ? '#047857' : C.slate300, backgroundColor: form.active ? '#ecfdf5' : C.slate50, borderRadius: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: form.active ? '#065f46' : C.slate600 }}>{form.active ? 'Visible' : 'Hidden'}</Text>
                  </Pressable>
                </Field>
              </View>
            </View>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: C.slate100, backgroundColor: C.slate50 }}>
            <Pressable onPress={onClose} style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 }}><Text style={{ fontSize: 13, fontWeight: '700', color: C.slate600 }}>Cancel</Text></Pressable>
            <Pressable onPress={handleSave} disabled={saving} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, backgroundColor: '#047857', borderRadius: 10, opacity: saving ? 0.6 : 1 }}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={14} color="#fff" />}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{isEdit ? 'Save changes' : 'Add style'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── StylesManager (embedded) ─────────────────────────────────────────────────
function StylesManager({ categorySlug, styles, onChange }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);

  const refetch = useCallback(async () => {
    try {
      const res = await api.get(`/v1/admin/custom-catalog/categories/${categorySlug}/styles`);
      onChange(res.data || []);
    } catch { /* keep current */ }
  }, [categorySlug, onChange]);

  const confirmDelete = (style) => {
    Alert.alert('Delete style', `Delete "${style.name}"? Existing orders that reference it keep their data.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/v1/admin/custom-catalog/styles/${style.slug}`); toast.success(`${style.name} deleted`); refetch(); }
        catch (err) { toast.error(err.response?.data?.message || 'Could not delete style'); }
      } },
    ]);
  };

  const toggleActive = async (style) => {
    try { await api.put(`/v1/admin/custom-catalog/styles/${style.slug}`, { ...style, active: !style.active }); refetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not toggle style'); }
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {styles.map((style) => (
          <View key={style.slug} style={{ width: '47%', backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12, overflow: 'hidden', opacity: style.active ? 1 : 0.6 }}>
            <View style={{ aspectRatio: 4 / 3, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center' }}>
              {style.imageUrl ? <Image source={{ uri: style.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <ImageIcon size={22} color={C.slate300} />}
            </View>
            <View style={{ padding: 10 }}>
              <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: C.slate900 }}>{style.name}</Text>
              {style.tone ? <Text numberOfLines={1} style={{ fontSize: 11, color: C.slate500, marginTop: 1 }}>{style.tone}</Text> : null}
              {!style.active ? <Text style={{ fontSize: 9, color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Hidden</Text> : null}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                <Pressable onPress={() => setEditing(style)} style={{ flex: 1, paddingVertical: 7, backgroundColor: C.slate100, borderRadius: 8, alignItems: 'center' }}><Text style={{ fontSize: 11, fontWeight: '700', color: C.slate700 }}>Edit</Text></Pressable>
                <Pressable onPress={() => toggleActive(style)} style={{ paddingHorizontal: 9, paddingVertical: 7, backgroundColor: C.slate100, borderRadius: 8 }}><Power size={13} color={C.slate600} /></Pressable>
                <Pressable onPress={() => confirmDelete(style)} style={{ paddingHorizontal: 9, paddingVertical: 7, backgroundColor: C.slate100, borderRadius: 8 }}><Trash2 size={13} color={C.red500} /></Pressable>
              </View>
            </View>
          </View>
        ))}

        <Pressable onPress={() => setAdding(true)} style={{ width: '47%', aspectRatio: 0.85, borderWidth: 2, borderColor: C.slate300, borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={22} color={C.slate400} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.slate500, marginTop: 4 }}>Add style</Text>
        </Pressable>
      </View>

      {adding ? <StyleForm categorySlug={categorySlug} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); refetch(); }} /> : null}
      {editing ? <StyleForm categorySlug={categorySlug} existing={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} /> : null}
    </View>
  );
}

// ─── CategoryEditor (main) ────────────────────────────────────────────────────
export default function CategoryEditor({ slug, onClose, onSaved }) {
  const isNew = !slug;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blankCategory());
  const [styles, setStyles] = useState([]);
  const [orderCount, setOrderCount] = useState(0);

  const fetchCategory = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const res = await api.get(`/v1/admin/custom-catalog/categories/${slug}`);
      const d = res.data;
      setForm({
        slug: d.slug || '', name: d.name || '', tagline: d.tagline || '', description: d.description || '',
        genderHint: d.genderHint || 'unisex', priceFrom: d.priceFrom != null ? String(d.priceFrom) : '',
        leadTime: d.leadTime || '', accent: d.accent || '#0d4d2a', coverImageUrl: d.coverImageUrl || '',
        coverImagePublicId: d.coverImagePublicId || '', measurementSet: d.measurementSet || 'menFull',
        sortOrder: d.sortOrder ?? 100, active: d.active !== false,
      });
      setStyles(d.sampleStyles || []);
      setOrderCount(d.orderCount || 0);
    } catch {
      toast.error('Could not load category');
    } finally {
      setLoading(false);
    }
  }, [slug, isNew]);

  useEffect(() => { fetchCategory(); }, [fetchCategory]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error('Name is required'); return; }
    if (isNew && !form.slug?.trim()) { toast.error('Slug is required for new categories'); return; }
    if (isNew && !/^[a-z0-9-]+$/.test(form.slug)) { toast.error('Slug: lowercase letters, numbers, hyphens only'); return; }

    const payload = {
      ...form,
      slug: isNew ? form.slug.trim().toLowerCase() : undefined,
      priceFrom: form.priceFrom ? Number(form.priceFrom) : null,
      sortOrder: form.sortOrder != null ? Number(form.sortOrder) : 100,
    };
    setSaving(true);
    try {
      if (isNew) { await api.post('/v1/admin/custom-catalog/categories', payload); toast.success(`${form.name} created`); }
      else { await api.put(`/v1/admin/custom-catalog/categories/${slug}`, payload); toast.success(`${form.name} updated`); }
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.slate50 }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.slate200, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={onClose} hitSlop={8}><ChevronLeft size={22} color={C.slate600} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.8 }}>{isNew ? 'New category' : `Editing · ${form.slug}`}</Text>
          <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: '800', color: C.slate900 }}>{form.name || 'Untitled category'}</Text>
        </View>
        <Pressable onPress={handleSave} disabled={saving} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#047857', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, opacity: saving ? 0.6 : 1 }}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Save size={14} color="#fff" />}
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.slate300} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          {!isNew && orderCount > 0 ? (
            <View style={{ flexDirection: 'row', gap: 10, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 12, padding: 14 }}>
              <AlertCircle size={16} color="#047857" style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 12, color: '#065f46', lineHeight: 17 }}>
                <Text style={{ fontWeight: '700' }}>{orderCount} order{orderCount === 1 ? '' : 's'}</Text> reference this category. You can edit anything, but the slug is locked and it can't be deleted (only deactivated).
              </Text>
            </View>
          ) : null}

          <Section title="Identity">
            {isNew ? (
              <Field label="Slug *" hint="Lowercase, hyphens only. Cannot change later. Used in URLs.">
                <TextInput value={form.slug} onChangeText={(t) => setField('slug', t.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="agbada" placeholderTextColor={C.slate300} autoCapitalize="none" style={[inputStyle, { fontFamily: 'monospace' }]} />
              </Field>
            ) : null}
            <Field label="Name *" hint="Shown on the customer-facing card.">
              <TextInput value={form.name} onChangeText={(t) => setField('name', t)} placeholder="Agbada" placeholderTextColor={C.slate300} style={inputStyle} />
            </Field>
            <Field label="Tagline" hint="Short evocative line under the name.">
              <TextInput value={form.tagline} onChangeText={(t) => setField('tagline', t)} placeholder="Flowing grandeur, ceremonial weight" placeholderTextColor={C.slate300} style={inputStyle} />
            </Field>
            <Field label="Description" hint="Longer paragraph for the category page.">
              <TextInput value={form.description} onChangeText={(t) => setField('description', t)} multiline placeholderTextColor={C.slate300} style={[inputStyle, { minHeight: 72, textAlignVertical: 'top' }]} />
            </Field>
          </Section>

          <Section title="Pricing & Lead Time">
            <Field label="Price from (₦)" hint="Hint shown on the card. Real quote comes from admin.">
              <TextInput value={form.priceFrom} onChangeText={(t) => setField('priceFrom', t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="22000" placeholderTextColor={C.slate300} style={inputStyle} />
            </Field>
            <Field label="Lead time" hint="Free text — '7-14 days', '14-21 days'.">
              <TextInput value={form.leadTime} onChangeText={(t) => setField('leadTime', t)} placeholder="7-14 days" placeholderTextColor={C.slate300} style={inputStyle} />
            </Field>
          </Section>

          <Section title="Targeting & Measurements">
            <Field label="Gender">
              <PickerField value={form.genderHint} onChange={(v) => setField('genderHint', v)} options={GENDER_OPTIONS} />
            </Field>
            <Field label="Measurement set" hint="Must match a key in the frontend MEASUREMENT_SETS.">
              <PickerField value={form.measurementSet} onChange={(v) => setField('measurementSet', v)} options={MEASUREMENT_OPTIONS} />
            </Field>
          </Section>

          <Section title="Cover Image">
            <ImageInput url={form.coverImageUrl} onChange={(u, pid) => { setField('coverImageUrl', u); setField('coverImagePublicId', pid || ''); }} />
          </Section>

          <Section title="Display">
            <Field label="Accent colour" hint="Card gradient & silhouette tint.">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.slate200, backgroundColor: form.accent || '#0d4d2a' }} />
                <TextInput value={form.accent} onChangeText={(t) => setField('accent', t)} placeholder="#0d4d2a" placeholderTextColor={C.slate300} autoCapitalize="none" style={[inputStyle, { flex: 1 }]} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {ACCENT_PRESETS.map((hex) => (
                  <Pressable key={hex} onPress={() => setField('accent', hex)} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: hex, borderWidth: form.accent === hex ? 2 : 1, borderColor: form.accent === hex ? C.slate900 : C.slate200 }} />
                ))}
              </View>
            </Field>
            <Field label="Sort order" hint="Lower = earlier in grid.">
              <TextInput value={String(form.sortOrder)} onChangeText={(t) => setField('sortOrder', t.replace(/\D/g, ''))} keyboardType="number-pad" style={inputStyle} />
            </Field>
            <Field label="Status">
              <Pressable onPress={() => setField('active', !form.active)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, borderWidth: 2, borderColor: form.active ? '#047857' : C.slate300, backgroundColor: form.active ? '#ecfdf5' : C.slate50, borderRadius: 10 }}>
                <Power size={14} color={form.active ? '#065f46' : C.slate600} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: form.active ? '#065f46' : C.slate600 }}>{form.active ? 'Active' : 'Inactive'}</Text>
              </Pressable>
            </Field>
          </Section>

          {!isNew ? (
            <Section title="Gallery Styles" subtitle="Items the customer picks from in the wizard.">
              <StylesManager categorySlug={slug} styles={styles} onChange={setStyles} />
            </Section>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, padding: 14 }}>
              <AlertCircle size={16} color={C.slate400} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 12, color: C.slate600, lineHeight: 17 }}>Save the category first. You can add gallery styles after.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}