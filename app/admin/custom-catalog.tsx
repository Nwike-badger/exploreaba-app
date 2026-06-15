import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Plus, Pencil, Trash2, Power, AlertCircle, Image as ImageIcon, Scissors,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { fmt } from '@/utils/adminUtils';
import { toast } from '@/utils/toast';
import { C } from '@/components/admin/editor/tokens';
import CategoryEditor from '@/components/admin/order/CategoryEditor';

export default function AdminCustomCatalogScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null); // null = list, 'new' = create, slug = edit
  const [deleting, setDeleting] = useState(null);

  const fetchCategories = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/v1/admin/custom-catalog/categories');
      setCategories(res.data || []);
    } catch {
      toast.error('Could not load custom categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggleActive = async (cat) => {
    try {
      await api.put(`/v1/admin/custom-catalog/categories/${cat.slug}`, { ...cat, active: !cat.active });
      toast.success(`${cat.name} is now ${!cat.active ? 'active' : 'inactive'}`);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not toggle status');
    }
  };

  const confirmDelete = (cat) => {
    if (cat.orderCount > 0) {
      toast.error(`Cannot delete — ${cat.orderCount} order(s) reference this. Deactivate instead.`);
      return;
    }
    Alert.alert('Delete category', `Delete "${cat.name}"? This also removes all its styles. Cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(cat.slug);
        try { await api.delete(`/v1/admin/custom-catalog/categories/${cat.slug}`); toast.success(`${cat.name} deleted`); fetchCategories(); }
        catch (err) { toast.error(err.response?.data?.message || 'Could not delete'); }
        finally { setDeleting(null); }
      } },
    ]);
  };

  // ── Editor mode ──
  if (editingSlug !== null) {
    return (
      <CategoryEditor
        slug={editingSlug === 'new' ? null : editingSlug}
        onClose={() => setEditingSlug(null)}
        onSaved={() => { setEditingSlug(null); fetchCategories(); }}
      />
    );
  }

  const activeCount = categories.filter((c) => c.active).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.slate50 }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.slate200, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 10, color: C.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>Custom Catalog</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.slate900 }}>Categories & Styles</Text>
          {!loading ? <Text style={{ fontSize: 12, color: C.slate400, marginTop: 2 }}>{categories.length} categor{categories.length === 1 ? 'y' : 'ies'} · {activeCount} active</Text> : null}
        </View>
        <Pressable onPress={() => setEditingSlug('new')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.slate900, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}>
          <Plus size={15} color="#fff" /><Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Add</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCategories('refresh')} tintColor={C.blue600} />}
      >
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={C.slate300} /></View>
        ) : categories.length === 0 ? (
          <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 16, padding: 32, alignItems: 'center' }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <ImageIcon size={24} color={C.slate400} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.slate900, marginBottom: 6 }}>No custom categories yet</Text>
            <Text style={{ fontSize: 13, color: C.slate500, textAlign: 'center', lineHeight: 19, marginBottom: 18 }}>The seeder populates categories on first boot. If you cleared them, restart the backend or add one below.</Text>
            <Pressable onPress={() => setEditingSlug('new')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.slate900, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 }}>
              <Plus size={15} color="#fff" /><Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Add category</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {categories.map((cat) => (
              <View key={cat.slug} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 16, overflow: 'hidden', opacity: cat.active ? 1 : 0.6 }}>
                {/* Cover */}
                <View style={{ aspectRatio: 16 / 9, backgroundColor: cat.accent ? `${cat.accent}18` : C.slate100, alignItems: 'center', justifyContent: 'center' }}>
                  {cat.coverImageUrl ? <Image source={{ uri: cat.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <ImageIcon size={28} color={C.slate300} />}
                  {!cat.active ? (
                    <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(15,23,42,0.85)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>Inactive</Text>
                    </View>
                  ) : null}
                  {cat.orderCount > 0 ? (
                    <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#047857', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>{cat.orderCount} order{cat.orderCount === 1 ? '' : 's'}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Body */}
                <View style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '800', color: C.slate900, flex: 1 }}>{cat.name}</Text>
                    <Text style={{ fontSize: 9, color: C.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>{cat.genderHint}</Text>
                  </View>
                  {cat.tagline ? <Text numberOfLines={1} style={{ fontSize: 13, color: C.slate500, marginTop: 2 }}>{cat.tagline}</Text> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 }}>
                    <Text style={{ fontSize: 12, color: C.slate500 }}>From <Text style={{ fontWeight: '700', color: C.slate700 }}>₦{fmt(cat.priceFrom || 0)}</Text></Text>
                    <Text style={{ fontSize: 12, color: C.slate400 }}>{cat.leadTime || '—'}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                    <Pressable onPress={() => setEditingSlug(cat.slug)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.slate900, paddingVertical: 9, borderRadius: 8 }}>
                      <Pencil size={13} color="#fff" /><Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => toggleActive(cat)} style={{ paddingHorizontal: 12, paddingVertical: 9, backgroundColor: C.slate100, borderRadius: 8 }}><Power size={14} color={C.slate700} /></Pressable>
                    <Pressable onPress={() => confirmDelete(cat)} disabled={deleting === cat.slug || cat.orderCount > 0} style={{ paddingHorizontal: 12, paddingVertical: 9, backgroundColor: C.slate100, borderRadius: 8, opacity: (deleting === cat.slug || cat.orderCount > 0) ? 0.3 : 1 }}>
                      {deleting === cat.slug ? <ActivityIndicator size="small" color={C.red500} /> : <Trash2 size={14} color={C.red500} />}
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            {/* Help text */}
            <View style={{ flexDirection: 'row', gap: 10, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, padding: 14 }}>
              <AlertCircle size={15} color={C.slate400} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 11, color: C.slate600, lineHeight: 16 }}>Categories with orders can't be deleted — deactivate to hide from /custom while keeping order history. Edit a category to manage its gallery styles.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}