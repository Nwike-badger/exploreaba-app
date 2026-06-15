import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Modal,
  ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Tag, Plus, Pencil, Trash2, X, Search, Globe, Hash,
  Image as ImageIcon, ShieldAlert, AlertTriangle, CheckCircle2, Package, ExternalLink,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { getErr, slugify } from '@/utils/adminUtils';
import { toast } from '@/utils/toast';
import { C } from '@/components/admin/editor/tokens';

const fieldInput = { backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.slate800 };
const fieldLabel = { fontSize: 11, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };

export default function BrandManagerScreen() {
  const [brands, setBrands] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);        // { mode, initialData }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/brands');
      const list = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
      setBrands(list);
      const counts = {};
      await Promise.allSettled(
        list.map(async (b) => {
          try {
            const c = await api.get(`/brands/${b.slug}/product-count`);
            counts[b.slug] = c.data.count ?? 0;
          } catch { counts[b.slug] = 0; }
        })
      );
      setProductCounts(counts);
    } catch {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const handleSave = async (form) => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        website: form.website.trim() || null,
      };
      if (modal.mode === 'create') {
        await api.post('/brands', payload);
        toast.success(`"${form.name}" created!`);
      } else {
        await api.put(`/brands/${modal.initialData.slug}`, payload);
        toast.success(`"${form.name}" updated!`);
      }
      setModal(null);
      await fetchBrands();
    } catch (err) {
      toast.error(getErr(err) || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/brands/${deleteTarget.slug}`);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await fetchBrands();
    } catch (err) {
      toast.error(getErr(err) || 'Failed to delete brand');
    } finally {
      setDeleting(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = brands.filter((b) => !q || b.name?.toLowerCase().includes(q) || b.slug?.toLowerCase().includes(q));
  const totalProducts = Object.values(productCounts).reduce((s, c) => s + c, 0);
  const withProducts = brands.filter((b) => (productCounts[b.slug] || 0) > 0).length;

  const stats = [
    { label: 'Total brands', val: brands.length, color: C.slate800, bg: '#fff', border: C.slate200 },
    { label: 'With products', val: withProducts, color: C.blue700, bg: C.blue50, border: C.blue200 },
    { label: 'Products branded', val: totalProducts, color: C.emerald700, bg: '#ecfdf5', border: '#a7f3d0' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.slate50 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBrands('refresh')} tintColor={C.blue600} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.slate900 }}>Brands</Text>
            <Text style={{ fontSize: 12, color: C.slate400, marginTop: 2 }}>{brands.length} brand{brands.length !== 1 ? 's' : ''}</Text>
          </View>
          <Pressable onPress={() => setModal({ mode: 'create', initialData: null })} style={{ backgroundColor: C.slate900, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Plus size={15} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {stats.map((s) => (
            <View key={s.label} style={{ flex: 1, borderRadius: 16, borderWidth: 1, borderColor: s.border, backgroundColor: s.bg, padding: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: s.color }}>{s.val}</Text>
              <Text style={{ fontSize: 10, color: C.slate500, marginTop: 2, fontWeight: '600' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={15} color={C.slate400} style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }} />
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search brands…" placeholderTextColor={C.slate300}
            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingLeft: 36, paddingRight: 36, paddingVertical: 10, fontSize: 14, color: C.slate900 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={{ position: 'absolute', right: 10, top: 10, padding: 2 }}><X size={16} color={C.slate400} /></Pressable>
          )}
        </View>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={C.blue600} /></View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Tag size={30} color={C.slate200} />
            <Text style={{ color: C.slate400, fontWeight: '600', fontSize: 13, marginTop: 10 }}>{search ? `No brands match "${search}"` : 'No brands yet'}</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {filtered.map((brand) => (
              <BrandRow key={brand.id || brand.slug} brand={brand} productCount={productCounts[brand.slug] ?? 0} onEdit={() => setModal({ mode: 'edit', initialData: brand })} onDelete={() => setDeleteTarget(brand)} />
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: C.blue200, backgroundColor: C.blue50, padding: 12 }}>
          <Hash size={14} color={C.blue600} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 11, color: C.blue700, lineHeight: 16 }}>
            Brand slugs are permanent — products link to brands by slug. Editing changes only the display name.
          </Text>
        </View>
      </ScrollView>

      {modal && <BrandFormModal mode={modal.mode} initialData={modal.initialData} saving={saving} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <DeleteDialog brand={deleteTarget} productCount={productCounts[deleteTarget.slug] ?? 0} deleting={deleting} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
    </View>
  );
}

function BrandRow({ brand, productCount, onEdit, onDelete }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 14, padding: 12 }}>
      <View style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.slate200, backgroundColor: C.slate50, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {brand.logoUrl ? <Image source={{ uri: brand.logoUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" /> : <Tag size={16} color={C.slate300} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: C.slate900, flexShrink: 1 }}>{brand.name}</Text>
          {brand.website ? (
            <Pressable onPress={() => Linking.openURL(brand.website).catch(() => {})} hitSlop={6}><ExternalLink size={11} color={C.slate400} /></Pressable>
          ) : null}
        </View>
        <Text style={{ fontSize: 10, color: C.slate400, fontFamily: 'monospace' }}>/{brand.slug}</Text>
        {brand.description ? <Text numberOfLines={1} style={{ fontSize: 11, color: C.slate500, marginTop: 2 }}>{brand.description}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-start', backgroundColor: C.slate100, borderWidth: 1, borderColor: C.slate200, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
          <Package size={10} color={C.slate400} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.slate500 }}>{productCount} products</Text>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Pressable onPress={onEdit} hitSlop={6} style={{ padding: 7, borderRadius: 8, backgroundColor: C.slate100 }}><Pencil size={13} color={C.slate600} /></Pressable>
        <Pressable onPress={onDelete} hitSlop={6} style={{ padding: 7, borderRadius: 8, backgroundColor: productCount > 0 ? C.slate50 : C.red50 }}>
          <Trash2 size={13} color={productCount > 0 ? C.slate300 : C.red500} />
        </Pressable>
      </View>
    </View>
  );
}

function BrandFormModal({ mode, initialData, saving, onSave, onClose }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    name: initialData?.name || '', slug: initialData?.slug || '',
    description: initialData?.description || '', logoUrl: initialData?.logoUrl || '', website: initialData?.website || '',
  });
  const [slugManual, setSlugManual] = useState(isEdit);
  const setF = (patch) => setForm((f) => ({ ...f, ...patch }));
  const canSubmit = form.name.trim() && form.slug.trim();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', maxHeight: '88%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.slate900, alignItems: 'center', justifyContent: 'center' }}><Tag size={16} color="#fff" /></View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate900 }}>{isEdit ? `Edit ${initialData?.name}` : 'New brand'}</Text>
                {isEdit ? <Text style={{ fontSize: 10, color: C.slate400, fontFamily: 'monospace' }}>/{initialData?.slug}</Text> : null}
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}><X size={18} color={C.slate400} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            <View>
              <Text style={fieldLabel}>Brand name *</Text>
              <TextInput value={form.name} onChangeText={(t) => setF({ name: t, ...(slugManual ? {} : { slug: slugify(t) }) })} style={fieldInput} placeholder="e.g. Nike" placeholderTextColor={C.slate300} />
            </View>
            <View>
              <Text style={fieldLabel}>URL slug *</Text>
              <View style={{ position: 'relative' }}>
                <Hash size={13} color={C.slate400} style={{ position: 'absolute', left: 12, top: 13, zIndex: 1 }} />
                <TextInput value={form.slug} editable={!isEdit} onChangeText={(t) => { setSlugManual(true); setF({ slug: slugify(t) }); }} style={[fieldInput, { paddingLeft: 32, fontFamily: 'monospace', backgroundColor: isEdit ? C.slate100 : C.slate50, color: isEdit ? C.slate400 : C.slate800 }]} placeholder="nike" placeholderTextColor={C.slate300} autoCapitalize="none" />
              </View>
              <Text style={{ fontSize: 10, color: C.slate400, marginTop: 4 }}>{isEdit ? 'Slug is locked after creation.' : 'Auto-generated; used in URLs.'}</Text>
            </View>
            <View>
              <Text style={fieldLabel}>Logo URL</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <TextInput value={form.logoUrl} onChangeText={(t) => setF({ logoUrl: t })} style={[fieldInput, { flex: 1 }]} placeholder="https://…" placeholderTextColor={C.slate300} autoCapitalize="none" />
                {form.logoUrl ? <Image source={{ uri: form.logoUrl }} style={{ width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.slate200 }} contentFit="contain" /> : null}
              </View>
            </View>
            <View>
              <Text style={fieldLabel}>Website</Text>
              <View style={{ position: 'relative' }}>
                <Globe size={13} color={C.slate400} style={{ position: 'absolute', left: 12, top: 13, zIndex: 1 }} />
                <TextInput value={form.website} onChangeText={(t) => setF({ website: t })} style={[fieldInput, { paddingLeft: 32 }]} placeholder="https://nike.com" placeholderTextColor={C.slate300} autoCapitalize="none" keyboardType="url" />
              </View>
            </View>
            <View>
              <Text style={fieldLabel}>Description</Text>
              <TextInput value={form.description} onChangeText={(t) => setF({ description: t })} style={[fieldInput, { height: 72, textAlignVertical: 'top' }]} placeholder="Short brand bio…" placeholderTextColor={C.slate300} multiline />
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: C.slate100, backgroundColor: C.slate50 }}>
            <Pressable onPress={onClose} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}><Text style={{ fontSize: 13, fontWeight: '700', color: C.slate600 }}>Cancel</Text></Pressable>
            <Pressable onPress={() => onSave(form)} disabled={saving || !canSubmit} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: C.slate900, opacity: (saving || !canSubmit) ? 0.5 : 1 }}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <CheckCircle2 size={14} color="#fff" />}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{isEdit ? 'Save' : 'Create'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeleteDialog({ brand, productCount, deleting, onConfirm, onClose }) {
  const blocked = productCount > 0;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', gap: 12, padding: 20, backgroundColor: blocked ? C.amber50 : C.red50, borderBottomWidth: 1, borderBottomColor: blocked ? C.amber200 : C.red200 }}>
            {blocked ? <ShieldAlert size={22} color={C.amber500} /> : <AlertTriangle size={22} color={C.red500} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.slate900 }}>{blocked ? 'Cannot delete this brand' : 'Delete this brand?'}</Text>
              <Text style={{ fontSize: 13, color: C.slate600, marginTop: 4, lineHeight: 18 }}>
                {blocked ? `"${brand.name}" is assigned to ${productCount} product${productCount > 1 ? 's' : ''}. Reassign or remove those first.` : `"${brand.name}" will be permanently deleted. This cannot be undone.`}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 16 }}>
            <Pressable onPress={onClose} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}><Text style={{ fontSize: 13, fontWeight: '700', color: C.slate600 }}>{blocked ? 'Got it' : 'Cancel'}</Text></Pressable>
            {!blocked && (
              <Pressable onPress={onConfirm} disabled={deleting} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: C.red500, opacity: deleting ? 0.5 : 1 }}>
                {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Trash2 size={14} color="#fff" />}
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Delete</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}