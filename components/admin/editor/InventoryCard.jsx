import { View, Text, Pressable, TextInput } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Card, CardHeader, CardBody, Field, adminInputStyle, ADMIN_PLACEHOLDER_COLOR } from '../SharedUI';
import { C } from './tokens';

function StockDisplay({ stock }) {
  const num = parseInt(stock) || 0;
  let bg, border, dot, text, msg;
  if (num === 0) {
    bg = C.red50; border = C.red200; dot = C.red500; text = C.red700;
    msg = 'Out of stock — product hidden from purchase';
  } else if (num <= 10) {
    bg = C.amber50; border = C.amber200; dot = C.amber500; text = C.amber700;
    msg = `Low stock — only ${num} unit${num !== 1 ? 's' : ''} left`;
  } else {
    bg = C.green50; border = C.green200; dot = C.green500; text = C.green700;
    msg = `${num} units in stock`;
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, backgroundColor: bg, borderWidth: 1, borderColor: border, paddingHorizontal: 12, paddingVertical: 10 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: text, flex: 1 }}>{msg}</Text>
    </View>
  );
}

export default function InventoryCard({ options, variants, directInventory, setDirectInventory, form }) {
  const num = parseInt(directInventory.stock) || 0;
  const inc = () => setDirectInventory((d) => ({ ...d, stock: String(num + 1) }));
  const dec = () => setDirectInventory((d) => ({ ...d, stock: String(Math.max(0, num - 1)) }));

  const border = num === 0 ? C.red200 : num <= 10 ? C.amber200 : C.slate200;
  const bg = num === 0 ? C.red50 : num <= 10 ? C.amber50 : '#fff';
  const numColor = num === 0 ? C.red700 : num <= 10 ? C.amber700 : C.slate800;

  return (
    <Card>
      <CardHeader>Inventory</CardHeader>
      <CardBody style={{ gap: 16 }}>
        {options.length === 0 ? (
          <>
            <Field label="Stock Quantity" required hint="Units currently available to sell">
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 12, borderWidth: 1, borderColor: border, backgroundColor: bg, overflow: 'hidden' }}>
                <Pressable onPress={dec} style={{ width: 44, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus size={14} color={C.slate400} />
                </Pressable>
                <TextInput
                  value={directInventory.stock}
                  onChangeText={(t) => setDirectInventory((d) => ({ ...d, stock: t }))}
                  keyboardType="numeric"
                  style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: numColor }}
                />
                <Pressable onPress={inc} style={{ width: 44, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={14} color={C.slate400} />
                </Pressable>
              </View>
            </Field>

            <StockDisplay stock={directInventory.stock} />

            <Field label="SKU (Stock Keeping Unit)" hint="Leave blank to auto-generate">
              <TextInput
                value={directInventory.sku}
                onChangeText={(t) => setDirectInventory((d) => ({ ...d, sku: t }))}
                style={[adminInputStyle, { fontFamily: 'monospace' }]}
                placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
                placeholder={`${(form.name || 'PRODUCT').split(/\s+/)[0].toUpperCase()}-DEFAULT`}
                autoCapitalize="characters"
              />
            </Field>
          </>
        ) : (
          <View style={{ gap: 8 }}>
            <View style={{ borderRadius: 12, backgroundColor: C.blue50, borderWidth: 1, borderColor: C.blue200, padding: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e3a8a', marginBottom: 4 }}>Managed per variant</Text>
              <Text style={{ fontSize: 11, color: C.blue600 }}>Set quantity for each variant in the Variants section above.</Text>
            </View>
            {variants.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, borderRadius: 12, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: C.slate800 }}>
                    {variants.reduce((s, v) => s + (parseInt(v.stockQuantity) || 0), 0)}
                  </Text>
                  <Text style={{ fontSize: 10, color: C.slate500, fontWeight: '600' }}>Total units</Text>
                </View>
                <View style={{ flex: 1, borderRadius: 12, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: C.slate800 }}>{variants.length}</Text>
                  <Text style={{ fontSize: 10, color: C.slate500, fontWeight: '600' }}>Variants</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </CardBody>
    </Card>
  );
}