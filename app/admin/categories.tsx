import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Modal,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import {
  FolderTree, Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  X, Search, AlertTriangle, ShieldAlert, CheckCircle2, Layers,
  Folder, FolderOpen, Hash, Image as ImageIcon, CornerDownRight,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { getErr, slugify } from '@/utils/adminUtils';
import { toast } from '@/utils/toast';
import PickerField from '@/components/ui/PickerField';
import { C } from '@/components/admin/editor/tokens';
 import CategoryBarSettings from '@/components/admin/editor/CategoryBarSettings'; // TODO: port next (parentSlug-only)
 

const fieldInput = { backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.slate800 };
const fieldLabel = { fontSize: 11, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };
const DEPTH_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];
const dColor = (d) => DEPTH_COLORS[d % DEPTH_COLORS.length];

const flattenForSelect = (nodes, depth = 0, excludeSlug = null) => {
  const out = [];
  for (const n of nodes) {
    if (n.slug === excludeSlug) continue;
    out.push({ slug: n.slug, name: n.name, depth });
    if (n.children?.length) out.push(...flattenForSelect(n.children, depth + 1, excludeSlug));
  }
  return out;
};
const countDescendants = (node) => (node.children || []).reduce((s, c) => s + 1 + countDescendants(c), 0);
const filterTree = (nodes, q) => {
  if (!q) return nodes;
  const lower = q.toLowerCase();
  return nodes.reduce((acc, node) => {
    const children = filterTree(node.children || [], q);
    if (node.name.toLowerCase().includes(lower) || node.slug.toLowerCase().includes(lower) || children.length) acc.push({ ...node, children });
    return acc;
  }, []);
};
const computeStats = (nodes, depth = 0) => {
  let total = nodes.length, subs = 0, maxDepth = depth;
  for (const n of nodes) {
    if (depth > 0) subs++;
    const c = computeStats(n.children || [], depth + 1);
    total += c.total; subs += c.subs; maxDepth = Math.max(maxDepth, c.maxDepth);
  }
  return { total, subs, maxDepth };
};
const findParentNode = (nodes, slug, parent = null) => {
  for (const n of nodes) {
    if (n.slug === slug) return parent;
    const found = findParentNode(n.children || [], slug, n);
    if (found !== undefined) return found;
  }
  return undefined;
};

export default function CategoryManagerScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(new Set());
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/categories/tree');
      const data = res.data || [];
      setCategories(data);
      setExpanded(new Set(data.map((c) => c.id)));
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggleExpand = useCallback((id) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }), []);
  const expandAll = () => {
    const ids = new Set();
    const collect = (nodes) => nodes.forEach((n) => { ids.add(n.id); collect(n.children || []); });
    collect(categories);
    setExpanded(ids);
  };
  const collapseAll = () => setExpanded(new Set());

  const openCreate = (parentNode = null) => setModal({ mode: 'create', initialData: { parentSlug: parentNode?.slug || '', parentName: parentNode?.name || '' } });
  const openEdit = (node) => {
    const parent = findParentNode(categories, node.slug);
    setModal({ mode: 'edit', initialData: { id: node.id, name: node.name, slug: node.slug, imageUrl: node.imageUrl || '', description: node.description || '', parentSlug: parent?.slug || '', parentName: parent?.name || '' } });
  };

  const handleSave = async (form) => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), slug: form.slug.trim(), parentSlug: form.parentSlug || null, description: form.description.trim() || null, imageUrl: form.imageUrl.trim() || null };
      if (modal.mode === 'create') {
        await api.post('/categories', payload);
        toast.success(`"${form.name}" created!`);
      } else {
        await api.put(`/categories/${modal.initialData.slug}`, { ...payload, parentSlug: form.parentSlug === '' ? null : form.parentSlug });
        toast.success(`"${form.name}" updated!`);
      }
      setModal(null);
      await fetchCategories();
    } catch (err) {
      toast.error(getErr(err) || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget.slug}`);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await fetchCategories();
    } catch (err) {
      toast.error(getErr(err) || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const displayTree = useMemo(() => filterTree(categories, search), [categories, search]);
  const { total, subs, maxDepth } = useMemo(() => computeStats(categories), [categories]);
  const stats = [
    { label: 'Total', val: total, color: C.slate800, bg: '#fff', border: C.slate200 },
    { label: 'Root', val: categories.length, color: C.blue700, bg: C.blue50, border: C.blue200 },
    { label: 'Sub', val: subs, color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
    { label: 'Depth', val: maxDepth, color: C.emerald700, bg: '#ecfdf5', border: '#a7f3d0' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.slate50 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCategories('refresh')} tintColor={C.blue600} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.slate900 }}>Categories</Text>
            <Text style={{ fontSize: 12, color: C.slate400, marginTop: 2 }}>Product taxonomy</Text>
          </View>
          <Pressable onPress={() => openCreate()} style={{ backgroundColor: C.slate900, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Plus size={15} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add root</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {stats.map((s) => (
            <View key={s.label} style={{ flex: 1, borderRadius: 14, borderWidth: 1, borderColor: s.border, backgroundColor: s.bg, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: s.color }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: C.slate500, marginTop: 2, fontWeight: '600' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          <View style={{ position: 'relative', flex: 1 }}>
            <Search size={15} color={C.slate400} style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search…" placeholderTextColor={C.slate300} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingLeft: 36, paddingRight: 12, paddingVertical: 10, fontSize: 14, color: C.slate900 }} />
          </View>
          <Pressable onPress={expandAll} style={{ paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12 }}><Text style={{ fontSize: 11, fontWeight: '700', color: C.slate500 }}>Expand</Text></Pressable>
          <Pressable onPress={collapseAll} style={{ paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12 }}><Text style={{ fontSize: 11, fontWeight: '700', color: C.slate500 }}>Collapse</Text></Pressable>
        </View>

        <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 16, padding: 8 }}>
          {loading ? (
            <View style={{ paddingVertical: 50, alignItems: 'center' }}><ActivityIndicator color={C.blue600} /></View>
          ) : displayTree.length === 0 ? (
            <View style={{ paddingVertical: 50, alignItems: 'center' }}>
              <Layers size={30} color={C.slate200} />
              <Text style={{ color: C.slate400, fontWeight: '600', fontSize: 13, marginTop: 10 }}>{search ? `No matches for "${search}"` : 'No categories yet'}</Text>
            </View>
          ) : (
            displayTree.map((node) => (
              <TreeNode key={node.id} node={node} depth={0} expanded={expanded} toggleExpand={toggleExpand} onEdit={openEdit} onAddChild={openCreate} onDelete={setDeleteTarget} />
            ))
          )}
        </View>

       <View style={{ marginTop: 16 }}>
          <CategoryBarSettings allCategories={categories} />
        </View>
      </ScrollView>

      {modal && <CategoryFormModal mode={modal.mode} initialData={modal.initialData} allCategories={categories} saving={saving} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <DeleteDialog category={deleteTarget} deleting={deleting} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
    </View>
  );
}

function TreeNode({ node, depth, expanded, toggleExpand, onEdit, onAddChild, onDelete }) {
  const hasChildren = (node.children || []).length > 0;
  const isExpanded = expanded.has(node.id);
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingRight: 4, paddingLeft: depth * 14 }}>
        <Pressable onPress={() => hasChildren && toggleExpand(node.id)} hitSlop={6} style={{ width: 20, alignItems: 'center' }}>
          {hasChildren ? (isExpanded ? <ChevronDown size={14} color={C.slate500} /> : <ChevronRight size={14} color={C.slate400} />) : <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.slate200 }} />}
        </Pressable>
        {hasChildren && isExpanded ? <FolderOpen size={15} color={dColor(depth)} /> : <Folder size={15} color={dColor(depth)} />}
        {node.imageUrl ? <Image source={{ uri: node.imageUrl }} style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: C.slate200 }} contentFit="cover" /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: C.slate800 }}>{node.name}</Text>
          <Text numberOfLines={1} style={{ fontSize: 9, color: C.slate400, fontFamily: 'monospace' }}>/{node.slug}</Text>
        </View>
        {hasChildren ? (
          <View style={{ backgroundColor: C.slate100, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}><Text style={{ fontSize: 9, fontWeight: '800', color: C.slate500 }}>{node.children.length}</Text></View>
        ) : null}
        <Pressable onPress={() => onAddChild(node)} hitSlop={4} style={{ padding: 5 }}><Plus size={13} color={C.blue600} /></Pressable>
        <Pressable onPress={() => onEdit(node)} hitSlop={4} style={{ padding: 5 }}><Pencil size={13} color={C.slate500} /></Pressable>
        <Pressable onPress={() => onDelete(node)} hitSlop={4} style={{ padding: 5 }}><Trash2 size={13} color={hasChildren ? C.slate300 : C.red500} /></Pressable>
      </View>
      {hasChildren && isExpanded && (
        <View style={{ borderLeftWidth: 1, borderLeftColor: C.slate100, marginLeft: depth * 14 + 9 }}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} expanded={expanded} toggleExpand={toggleExpand} onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete} />
          ))}
        </View>
      )}
    </View>
  );
}

function CategoryFormModal({ mode, initialData, allCategories, saving, onSave, onClose }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    name: initialData?.name || '', slug: initialData?.slug || '',
    parentSlug: initialData?.parentSlug || '', imageUrl: initialData?.imageUrl || '', description: initialData?.description || '',
  });
  const [slugManual, setSlugManual] = useState(isEdit);
  const setF = (patch) => setForm((f) => ({ ...f, ...patch }));
  const canSubmit = form.name.trim() && form.slug.trim();

  const parentOptions = useMemo(() => {
    const flat = flattenForSelect(allCategories, 0, isEdit ? initialData?.slug : null);
    return [{ label: '— None (Root / Top-level)', value: '' }, ...flat.map((c) => ({ label: `${'   '.repeat(c.depth)}${c.depth > 0 ? '↳ ' : ''}${c.name}`, value: c.slug }))];
  }, [allCategories, isEdit, initialData]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', maxHeight: '88%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.blue600, alignItems: 'center', justifyContent: 'center' }}><FolderTree size={16} color="#fff" /></View>
              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: C.slate900, flex: 1 }}>
                {isEdit ? `Edit ${initialData?.name}` : initialData?.parentName ? `New under ${initialData.parentName}` : 'New root category'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}><X size={18} color={C.slate400} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            {(form.parentSlug || initialData?.parentName) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                <CornerDownRight size={11} color={C.slate400} />
                <Text style={{ fontSize: 11, color: C.slate500 }}>Nested under </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate600 }}>{parentOptions.find((o) => o.value === form.parentSlug)?.label?.trim() || initialData?.parentName || '—'}</Text>
              </View>
            ) : null}
            <View>
              <Text style={fieldLabel}>Category name *</Text>
              <TextInput value={form.name} onChangeText={(t) => setF({ name: t, ...(slugManual ? {} : { slug: slugify(t) }) })} style={fieldInput} placeholder="e.g. Men's Outerwear" placeholderTextColor={C.slate300} />
            </View>
            <View>
              <Text style={fieldLabel}>URL slug *</Text>
              <View style={{ position: 'relative' }}>
                <Hash size={13} color={C.slate400} style={{ position: 'absolute', left: 12, top: 13, zIndex: 1 }} />
                <TextInput value={form.slug} onChangeText={(t) => { setSlugManual(true); setF({ slug: slugify(t) }); }} style={[fieldInput, { paddingLeft: 32, fontFamily: 'monospace' }]} placeholder="mens-outerwear" placeholderTextColor={C.slate300} autoCapitalize="none" />
              </View>
              {isEdit ? <Text style={{ fontSize: 10, color: C.amber700, marginTop: 4 }}>⚠ Changing the slug may break existing links.</Text> : null}
            </View>
            <View>
              <Text style={fieldLabel}>Parent category</Text>
              <PickerField value={form.parentSlug} onChange={(v) => setF({ parentSlug: v })} options={parentOptions} placeholder="— None (Root)" />
            </View>
            <View>
              <Text style={fieldLabel}>Image URL</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <TextInput value={form.imageUrl} onChangeText={(t) => setF({ imageUrl: t })} style={[fieldInput, { flex: 1 }]} placeholder="https://…" placeholderTextColor={C.slate300} autoCapitalize="none" />
                {form.imageUrl ? <Image source={{ uri: form.imageUrl }} style={{ width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.slate200 }} contentFit="cover" /> : null}
              </View>
            </View>
            <View>
              <Text style={fieldLabel}>Description</Text>
              <TextInput value={form.description} onChangeText={(t) => setF({ description: t })} style={[fieldInput, { height: 72, textAlignVertical: 'top' }]} placeholder="Short description…" placeholderTextColor={C.slate300} multiline />
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

function DeleteDialog({ category, deleting, onConfirm, onClose }) {
  const hasChildren = (category.children || []).length > 0;
  const childCount = category.children?.length || 0;
  const descendants = countDescendants(category);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', gap: 12, padding: 20, backgroundColor: hasChildren ? C.amber50 : C.red50, borderBottomWidth: 1, borderBottomColor: hasChildren ? C.amber200 : C.red200 }}>
            {hasChildren ? <ShieldAlert size={22} color={C.amber500} /> : <AlertTriangle size={22} color={C.red500} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.slate900 }}>{hasChildren ? 'Cannot delete this category' : 'Delete this category?'}</Text>
              <Text style={{ fontSize: 13, color: C.slate600, marginTop: 4, lineHeight: 18 }}>
                {hasChildren
                  ? `"${category.name}" has ${childCount} direct child${childCount > 1 ? 'ren' : ''}${descendants > childCount ? ` (${descendants} total sub-categories)` : ''}. Delete or reassign those first.`
                  : `"${category.name}" will be permanently removed. This cannot be undone.`}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 16 }}>
            <Pressable onPress={onClose} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}><Text style={{ fontSize: 13, fontWeight: '700', color: C.slate600 }}>{hasChildren ? 'Got it' : 'Cancel'}</Text></Pressable>
            {!hasChildren && (
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