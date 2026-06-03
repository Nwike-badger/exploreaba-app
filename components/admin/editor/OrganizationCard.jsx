import { useState } from 'react';
import { View, Text, Pressable, TextInput, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Tag, Plus, X, Image as ImageIcon } from 'lucide-react-native';
import { Card, CardHeader, CardBody, Field, adminInputStyle, ADMIN_PLACEHOLDER_COLOR } from '../SharedUI';
import PickerField from '@/components/ui/PickerField';
import { slugify, getErr } from '@/utils/adminUtils';
import api from '@/services/axiosConfig';
import { toast } from '@/utils/toast';
import { C } from './tokens';

export default function OrganizationCard({ form, setF, flatCats, brands }) {
  const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const [localCats, setLocalCats] = useState(flatCats || []);
  const [localBrands, setLocalBrands] = useState(brands || []);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCat, setNewCat] = useState({ name: '', slug: '', parentSlug: '', imageUrl: '' });
  const [newBrand, setNewBrand] = useState({ name: '', slug: '' });

  const brandOptions = localBrands.map((b) => ({ label: b.name, value: b.slug }));

  const handleCreateCategory = async () => {
    if (!newCat.name.trim()) return toast.error('Category name is required');
    setIsSubmitting(true);
    try {
      const res = await api.post('/categories', {
        name: newCat.name.trim(),
        slug: newCat.slug.trim(),
        parentSlug: newCat.parentSlug || null,
        imageUrl: newCat.imageUrl.trim() || null,
      });
      const created = res.data;
      setLocalCats([...localCats, { value: created.slug, label: newCat.parentSlug ? `— ${created.name}` : created.name }]);
      setF({ categorySlug: created.slug });
      toast.success('Category created!');
      setShowCatModal(false);
      setNewCat({ name: '', slug: '', parentSlug: '', imageUrl: '' });
    } catch (err) {
      toast.error(getErr(err) || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrand.name.trim()) return toast.error('Brand name is required');
    setIsSubmitting(true);
    try {
      const res = await api.post('/brands', { name: newBrand.name.trim(), slug: newBrand.slug.trim() });
      const created = res.data;
      setLocalBrands([...localBrands, created]);
      setF({ brandSlug: created.slug });
      toast.success('Brand created!');
      setShowBrandModal(false);
      setNewBrand({ name: '', slug: '' });
    } catch (err) {
      toast.error(getErr(err) || 'Failed to create brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const LabelRow = ({ label, onCreate }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Pressable onPress={onCreate} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }} hitSlop={6}>
        <Plus size={12} color={C.blue600} />
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.blue600 }}>Create new</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <Card>
        <CardHeader>Organisation</CardHeader>
        <CardBody style={{ gap: 18 }}>
          <View>
            <LabelRow label="Category" onCreate={() => setShowCatModal(true)} />
            <PickerField
              value={form.categorySlug}
              onChange={(v) => setF({ categorySlug: v })}
              options={localCats}
              placeholder="No category selected"
            />
          </View>

          <View>
            <LabelRow label="Brand" onCreate={() => setShowBrandModal(true)} />
            <PickerField
              value={form.brandSlug}
              onChange={(v) => setF({ brandSlug: v })}
              options={brandOptions}
              placeholder="No brand selected"
            />
          </View>

          <Field label="Campaign Tags" hint="Comma-separated. Used by the campaign engine for promotions.">
            <TextInput
              value={form.tags}
              onChangeText={(t) => setF({ tags: t })}
              style={adminInputStyle}
              placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
              placeholder="flash-sale, electronics, new-arrival"
              autoCapitalize="none"
            />
            {tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {tags.map((t, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.blue50, borderWidth: 1, borderColor: C.blue200, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Tag size={9} color={C.blue600} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: C.blue700 }}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </Field>
        </CardBody>
      </Card>

      <CreateModal visible={showCatModal} title="Create New Category" onClose={() => setShowCatModal(false)} onSubmit={handleCreateCategory} submitLabel="Create Category" isSubmitting={isSubmitting}>
        <Field label="Category Name" required>
          <TextInput value={newCat.name} onChangeText={(t) => setNewCat({ ...newCat, name: t, slug: slugify(t) })} style={adminInputStyle} placeholderTextColor={ADMIN_PLACEHOLDER_COLOR} placeholder="e.g. Outerwear" />
        </Field>
        <Field label="Parent Category" hint="Leave blank to create a root category">
          <PickerField value={newCat.parentSlug} onChange={(v) => setNewCat({ ...newCat, parentSlug: v })} options={localCats} placeholder="None (Root Category)" />
        </Field>
        <Field label="Image URL">
          <View style={{ position: 'relative' }}>
            <ImageIcon size={14} color={C.slate400} style={{ position: 'absolute', left: 12, top: 13, zIndex: 1 }} />
            <TextInput value={newCat.imageUrl} onChangeText={(t) => setNewCat({ ...newCat, imageUrl: t })} style={[adminInputStyle, { paddingLeft: 34 }]} placeholderTextColor={ADMIN_PLACEHOLDER_COLOR} placeholder="https://..." autoCapitalize="none" />
          </View>
        </Field>
      </CreateModal>

      <CreateModal visible={showBrandModal} title="Create New Brand" onClose={() => setShowBrandModal(false)} onSubmit={handleCreateBrand} submitLabel="Create Brand" isSubmitting={isSubmitting}>
        <Field label="Brand Name" required>
          <TextInput value={newBrand.name} onChangeText={(t) => setNewBrand({ ...newBrand, name: t, slug: slugify(t) })} style={adminInputStyle} placeholderTextColor={ADMIN_PLACEHOLDER_COLOR} placeholder="e.g. Nike" />
        </Field>
      </CreateModal>
    </>
  );
}

function CreateModal({ visible, title, onClose, onSubmit, submitLabel, isSubmitting, children }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', maxHeight: '85%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.slate100, backgroundColor: C.slate50 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.slate900 }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}><X size={18} color={C.slate400} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: C.slate100 }}>
            <Pressable onPress={onClose} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.slate600 }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onSubmit} disabled={isSubmitting} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: C.slate900, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: isSubmitting ? 0.6 : 1 }}>
              {isSubmitting && <ActivityIndicator size="small" color="#fff" />}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{submitLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}