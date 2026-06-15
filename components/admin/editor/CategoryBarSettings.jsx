import { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import {
  Settings2, Save, Layers, ChevronUp, ChevronDown, ArrowUpToLine,
  Eye, EyeOff, Image as ImageIcon, X, CheckCircle2, RotateCcw,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { toast } from '@/utils/toast';
import { Card, CardHeader, CardBody } from '@/components/admin/SharedUI';
import PickerField from '@/components/ui/PickerField';
import { C } from './tokens';

// ─── Tree helpers ─────────────────────────────────────────────────────────────
const flattenAll = (nodes, depth = 0, out = []) => {
  for (const n of nodes || []) {
    out.push({ label: `${'   '.repeat(depth)}${depth > 0 ? '↳ ' : ''}${n.name}`, value: n.slug });
    if (n.children?.length) flattenAll(n.children, depth + 1, out);
  }
  return out;
};
const findNode = (nodes, slug) => {
  for (const n of nodes || []) {
    if (n.slug === slug) return n;
    if (n.children?.length) { const f = findNode(n.children, slug); if (f) return f; }
  }
  return null;
};
const collectLeaves = (nodes, out = []) => {
  for (const n of nodes || []) {
    if (n.children?.length) collectLeaves(n.children, out);
    else out.push(n);
  }
  return out;
};
const collectAtDepth = (nodes, targetDepth, currentDepth = 0, out = []) => {
  for (const n of nodes || []) {
    if (currentDepth === targetDepth) out.push(n);
    else if (n.children?.length) collectAtDepth(n.children, targetDepth, currentDepth + 1, out);
  }
  return out;
};

const MODES = [
  { key: 'PARENT', label: 'Parent',        sub: 'Children of one' },
  { key: 'LEAVES', label: 'Product-level', sub: 'All bottom cats' },
  { key: 'DEPTH',  label: 'By depth',      sub: 'Exact level' },
];

// ─── Image picker modal ───────────────────────────────────────────────────────
function ImagePickerModal({ slug, currentUrl, onPick, onClose }) {
  const [url, setUrl] = useState(currentUrl || '');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get(`/products?categorySlug=${slug}&page=0&size=12`)
      .then((res) => { if (active) setProducts(res.data?.content ?? res.data ?? []); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const productImages = useMemo(() => {
    const seen = new Set(); const imgs = [];
    for (const p of products) {
      for (const img of (p.images || [])) {
        if (img?.url && !seen.has(img.url)) { seen.add(img.url); imgs.push(img.url); }
      }
    }
    return imgs.slice(0, 12);
  }, [products]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', maxHeight: '85%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate900 }}>Override image</Text>
              <Text style={{ fontSize: 10, color: C.slate400, fontFamily: 'monospace', marginTop: 2 }}>/{slug}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}><X size={18} color={C.slate400} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Image URL</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput value={url} onChangeText={setUrl} placeholder="https://…" placeholderTextColor={C.slate300} autoCapitalize="none"
                  style={{ flex: 1, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: C.slate800 }} />
                {url ? <Image source={{ uri: url }} style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.slate200 }} contentFit="cover" /> : null}
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Pick from products</Text>
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={C.blue600} /><Text style={{ fontSize: 12, color: C.slate400 }}>Loading…</Text>
                </View>
              ) : productImages.length === 0 ? (
                <Text style={{ fontSize: 12, color: C.slate400 }}>No products found in this category.</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {productImages.map((u, i) => (
                    <Pressable key={i} onPress={() => setUrl(u)} style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: url === u ? C.blue600 : C.slate200 }}>
                      <Image source={{ uri: u }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: C.slate100, backgroundColor: C.slate50 }}>
            <Pressable onPress={() => { setUrl(''); onPick(''); onClose(); }}><Text style={{ fontSize: 12, fontWeight: '700', color: C.red500 }}>Remove</Text></Pressable>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={onClose} style={{ paddingHorizontal: 16, paddingVertical: 10 }}><Text style={{ fontSize: 13, fontWeight: '700', color: C.slate600 }}>Cancel</Text></Pressable>
              <Pressable onPress={() => { onPick(url); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: C.slate900 }}>
                <CheckCircle2 size={14} color="#fff" /><Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CategoryBarSettings({ allCategories }) {
  const [mode, setMode]         = useState('PARENT');
  const [parentSlug, setParentSlug] = useState('');
  const [depth, setDepth]       = useState(1);
  const [order, setOrder]       = useState([]);
  const [hiddenSlugs, setHiddenSlugs] = useState([]);
  const [imageOverrides, setImageOverrides] = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [pickerFor, setPickerFor] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/v1/config/cat-bar')
      .then((res) => {
        if (!active) return;
        setParentSlug(res.data?.catBarParentSlug ?? '');
        setMode(res.data?.catBarMode ?? 'PARENT');
        setDepth(res.data?.catBarDepth ?? 1);
        setOrder(res.data?.catBarOrder ?? []);
        setHiddenSlugs(res.data?.catBarHidden ?? []);
        setImageOverrides(res.data?.catBarImageOverrides ?? {});
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const parentOptions = useMemo(
    () => [{ label: '— Root categories (top-level only)', value: '' }, ...flattenAll(allCategories || [])],
    [allCategories]
  );

  const poolFromTree = useMemo(() => {
    if (!Array.isArray(allCategories)) return [];
    if (mode === 'LEAVES') return collectLeaves(allCategories);
    if (mode === 'DEPTH')  return collectAtDepth(allCategories, depth ?? 1);
    if (!parentSlug) return allCategories.filter((c) => !c.parent && !c.parentId && !c.parentSlug);
    return findNode(allCategories, parentSlug)?.children ?? [];
  }, [allCategories, mode, depth, parentSlug]);

  const items = useMemo(() => {
    const hidden = new Set(hiddenSlugs ?? []);
    const orderMap = new Map((order ?? []).map((s, i) => [s, i]));
    return poolFromTree
      .map((cat) => ({ ...cat, hidden: hidden.has(cat.slug), orderIdx: orderMap.has(cat.slug) ? orderMap.get(cat.slug) : 9999 }))
      .sort((a, b) => a.orderIdx - b.orderIdx);
  }, [poolFromTree, order, hiddenSlugs]);

  const extractOrder = (arr) => arr.map((it) => it.slug);

  const move = (idx, dir) => {
    const next = [...items];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    setOrder(extractOrder(next));
  };
  const pinFirst = (idx) => {
    const next = [...items];
    const [it] = next.splice(idx, 1);
    next.unshift(it);
    setOrder(extractOrder(next));
  };
  const toggleHidden = (slug) => {
    setHiddenSlugs((prev) => {
      const set = new Set(prev ?? []);
      set.has(slug) ? set.delete(slug) : set.add(slug);
      return [...set];
    });
  };
  const applyImageOverride = (slug, url) => {
    setImageOverrides((prev) => {
      const next = { ...prev };
      if (url) next[slug] = url; else delete next[slug];
      return next;
    });
  };

  const handleModeChange = (m) => { if (m === mode) return; setMode(m); setOrder([]); setHiddenSlugs([]); };
  const handleDepthChange = (t) => { setDepth(Math.max(0, parseInt(t, 10) || 0)); setOrder([]); setHiddenSlugs([]); };
  const handleParentChange = (s) => { setParentSlug(s || ''); setOrder([]); setHiddenSlugs([]); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/v1/config/cat-bar', {
        catBarMode:           mode,
        catBarParentSlug:     mode === 'PARENT' ? (parentSlug || null) : null,
        catBarDepth:          mode === 'DEPTH'  ? depth : null,
        catBarOrder:          order,
        catBarHidden:         hiddenSlugs,
        catBarImageOverrides: imageOverrides,
      });
      toast.success('Category bar saved!');
    } catch {
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const visibleCount = items.filter((it) => !it.hidden).length;
  const emptyMsg = mode === 'DEPTH' ? `No categories at depth ${depth}.`
    : mode === 'PARENT' && parentSlug ? 'This parent has no children.'
    : mode === 'LEAVES' ? 'No product-level categories found.'
    : 'No root categories found.';

  return (
    <Card>
      <CardHeader subtitle={`${visibleCount} of ${items.length} visible in the bar`}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Settings2 size={14} color={C.blue500} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate800 }}>Category Bar</Text>
        </View>
      </CardHeader>

      <CardBody style={{ gap: 16 }}>
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
            <ActivityIndicator size="small" color={C.blue600} /><Text style={{ fontSize: 12, color: C.slate400 }}>Loading…</Text>
          </View>
        ) : (
          <>
            {/* Mode selector */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>How to populate the bar</Text>
              <View style={{ flexDirection: 'row', gap: 6, backgroundColor: C.slate100, padding: 4, borderRadius: 12 }}>
                {MODES.map((opt) => {
                  const active = mode === opt.key;
                  return (
                    <Pressable key={opt.key} onPress={() => handleModeChange(opt.key)}
                      style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, alignItems: 'center', backgroundColor: active ? '#fff' : 'transparent', shadowColor: active ? '#000' : 'transparent', shadowOpacity: active ? 0.08 : 0, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: active ? 1 : 0 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? C.slate900 : C.slate500 }}>{opt.label}</Text>
                      <Text style={{ fontSize: 9, color: C.slate400, marginTop: 2 }}>{opt.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* PARENT picker */}
            {mode === 'PARENT' && (
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Show children of</Text>
                <PickerField value={parentSlug} onChange={handleParentChange} options={parentOptions} placeholder="— Root categories" />
              </View>
            )}

            {/* LEAVES info */}
            {mode === 'LEAVES' && (
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 12, padding: 10 }}>
                <Layers size={14} color={C.emerald700} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 11, color: C.emerald700, lineHeight: 16 }}>Bottom-level categories from across the whole tree. Pin favourites first and hide the rest below.</Text>
              </View>
            )}

            {/* DEPTH input */}
            {mode === 'DEPTH' && (
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Tree depth</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TextInput value={String(depth)} onChangeText={handleDepthChange} keyboardType="number-pad"
                    style={{ width: 80, backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: '700', color: C.slate800, textAlign: 'center' }} />
                  <Text style={{ fontSize: 11, color: C.slate400 }}>0 = roots · 1 = children · 2 = grandchildren</Text>
                </View>
              </View>
            )}

            {/* Order & visibility list */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Order & Visibility</Text>
              {items.length === 0 ? (
                <Text style={{ fontSize: 11, color: C.slate400 }}>{emptyMsg}</Text>
              ) : (
                <View style={{ gap: 6 }}>
                  {items.map((item, idx) => {
                    const override = imageOverrides?.[item.slug];
                    const img = override || item.imageUrl;
                    const isHidden = item.hidden;
                    return (
                      <View key={item.slug} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: isHidden ? C.slate100 : C.slate200, backgroundColor: isHidden ? C.slate50 : '#fff', opacity: isHidden ? 0.6 : 1 }}>
                        <Pressable onPress={() => setPickerFor(item.slug)} style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.slate200, alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate100 }}>
                          {img ? <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <ImageIcon size={13} color={C.slate400} />}
                          {override ? <View style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue600, borderWidth: 1, borderColor: '#fff' }} /> : null}
                        </Pressable>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: isHidden ? C.slate400 : C.slate800 }}>{item.name}</Text>
                          <Text numberOfLines={1} style={{ fontSize: 9, color: C.slate400, fontFamily: 'monospace' }}>/{item.slug}</Text>
                        </View>
                        {!isHidden && idx > 0 && (
                          <Pressable onPress={() => pinFirst(idx)} hitSlop={4} style={{ padding: 4 }}><ArrowUpToLine size={14} color={C.blue600} /></Pressable>
                        )}
                        <Pressable onPress={() => move(idx, -1)} disabled={idx === 0} hitSlop={4} style={{ padding: 4, opacity: idx === 0 ? 0.25 : 1 }}><ChevronUp size={14} color={C.slate500} /></Pressable>
                        <Pressable onPress={() => move(idx, 1)} disabled={idx === items.length - 1} hitSlop={4} style={{ padding: 4, opacity: idx === items.length - 1 ? 0.25 : 1 }}><ChevronDown size={14} color={C.slate500} /></Pressable>
                        <Pressable onPress={() => toggleHidden(item.slug)} hitSlop={4} style={{ padding: 4 }}>
                          {isHidden ? <Eye size={14} color={C.emerald700} /> : <EyeOff size={14} color={C.amber700} />}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Save */}
            <Pressable onPress={handleSave} disabled={saving} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.slate900, paddingVertical: 12, borderRadius: 12, opacity: saving ? 0.6 : 1 }}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Save size={15} color="#fff" />}
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Save setting</Text>
            </Pressable>

            <Text style={{ fontSize: 10, color: C.slate400, textAlign: 'center' }}>All settings synced across web &amp; mobile.</Text>
          </>
        )}
      </CardBody>

      {pickerFor && (
        <ImagePickerModal
          slug={pickerFor}
          currentUrl={imageOverrides?.[pickerFor] ?? ''}
          onPick={(url) => applyImageOverride(pickerFor, url)}
          onClose={() => setPickerFor(null)}
        />
      )}
    </Card>
  );
}