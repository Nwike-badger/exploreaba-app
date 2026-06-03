import { View, Text, Pressable, TextInput } from 'react-native';
import { Tag } from 'lucide-react-native';
import { Card, CardHeader, CardBody, Field, adminInputStyle, ADMIN_PLACEHOLDER_COLOR } from '../SharedUI';
import { fmt } from '@/utils/adminUtils';
import { C } from './tokens';

export default function PricingCard({ form, setF, hasVariants }) {
  const discountedPrice =
    form.discount && form.basePrice
      ? Math.round(parseFloat(form.basePrice) * (1 - parseFloat(form.discount) / 100))
      : null;

  const aUsable = !form.discount;        // Method A usable when no discount set
  const bUsable = !form.compareAtPrice;  // Method B usable when no compareAt set

  return (
    <Card>
      <CardHeader>Pricing</CardHeader>
      <CardBody style={{ gap: 16 }}>
        <Field
          label="Base Price"
          required
          hint={hasVariants ? 'Reference price — each variant can override this' : 'Displayed price on the storefront'}
        >
          <View style={{ position: 'relative' }}>
            <Text style={{ position: 'absolute', left: 14, top: 11, color: C.slate400, fontSize: 14, fontWeight: '700', zIndex: 1 }}>₦</Text>
            <TextInput
              value={String(form.basePrice ?? '')}
              onChangeText={(t) => setF({ basePrice: t })}
              keyboardType="numeric"
              style={[adminInputStyle, { paddingLeft: 28 }]}
              placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
              placeholder="0"
            />
          </View>
          {parseFloat(form.basePrice) > 0 && (
            <Text style={{ fontSize: 11, color: C.slate500, fontWeight: '600', marginTop: 6 }}>₦{fmt(parseFloat(form.basePrice))}</Text>
          )}
        </Field>

        <View style={{ borderTopWidth: 1, borderTopColor: C.slate100, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Tag size={10} color={C.slate400} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sale pricing — choose one</Text>
          </View>

          {/* Method A */}
          <View style={{
            borderRadius: 12, borderWidth: 2, padding: 14, marginBottom: 10,
            borderColor: aUsable ? C.slate300 : C.slate100,
            backgroundColor: aUsable ? C.slate50 : '#fff',
            opacity: aUsable ? 1 : 0.5,
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.slate600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>A — Set original price</Text>
            <View style={{ position: 'relative' }}>
              <Text style={{ position: 'absolute', left: 12, top: 11, color: C.slate400, fontSize: 14, fontWeight: '700', zIndex: 1 }}>₦</Text>
              <TextInput
                value={String(form.compareAtPrice ?? '')}
                onChangeText={(t) => setF({ compareAtPrice: t, discount: '' })}
                editable={aUsable}
                keyboardType="numeric"
                style={[adminInputStyle, { paddingLeft: 28 }]}
                placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
                placeholder="Was price (strikethrough)"
              />
            </View>
            <Text style={{ fontSize: 10, color: C.slate400, marginTop: 6 }}>Shows as "was ₦X" — you set both prices manually.</Text>
          </View>

          {/* Method B */}
          <View style={{
            borderRadius: 12, borderWidth: 2, padding: 14,
            borderColor: form.discount ? '#93c5fd' : C.slate100,
            backgroundColor: form.discount ? C.blue50 : '#fff',
            opacity: bUsable ? 1 : 0.5,
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.slate600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>B — Discount percentage</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                value={String(form.discount ?? '')}
                onChangeText={(t) => setF({ discount: t, compareAtPrice: '' })}
                editable={bUsable}
                keyboardType="numeric"
                style={[adminInputStyle, { paddingRight: 28 }]}
                placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
                placeholder="e.g. 15"
              />
              <Text style={{ position: 'absolute', right: 14, top: 11, color: C.slate400, fontSize: 14, fontWeight: '700' }}>%</Text>
            </View>
            {discountedPrice ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: C.emerald700 }}>₦{fmt(discountedPrice)}</Text>
                <Text style={{ fontSize: 11, color: C.slate400, textDecorationLine: 'line-through' }}>₦{fmt(parseFloat(form.basePrice))}</Text>
                <View style={{ backgroundColor: C.emerald100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: C.emerald700 }}>-{form.discount}%</Text>
                </View>
              </View>
            ) : (
              <Text style={{ fontSize: 10, color: C.slate400, marginTop: 6 }}>Server computes the final price automatically.</Text>
            )}
          </View>

          {(form.discount || form.compareAtPrice) ? (
            <Pressable onPress={() => setF({ discount: '', compareAtPrice: '' })} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 10, color: C.slate400, fontWeight: '600' }}>✕ Remove sale pricing</Text>
            </Pressable>
          ) : null}
        </View>
      </CardBody>
    </Card>
  );
}