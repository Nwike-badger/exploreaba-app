import { View, Text, Pressable, TextInput } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { Card, CardHeader, CardBody, adminInputStyle, ADMIN_PLACEHOLDER_COLOR } from '../SharedUI';
import { C } from './tokens';

export default function SpecsCard({ specs, setSpecs, updateSpec }) {
  const filled = specs.filter((s) => s.key.trim()).length;
  return (
    <Card>
      <CardHeader
        subtitle={filled > 0 ? `${filled} spec${filled !== 1 ? 's' : ''} defined` : 'Optional product details'}
        action={
          <Pressable
            onPress={() => setSpecs((prev) => [...prev, { key: '', value: '' }])}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.slate200, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Plus size={12} color={C.slate500} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate500 }}>Add row</Text>
          </Pressable>
        }
      >
        Technical Specifications
      </CardHeader>
      <CardBody style={{ gap: 8 }}>
        {specs.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={s.key}
              onChangeText={(t) => updateSpec(i, 'key', t)}
              style={[adminInputStyle, { width: '36%' }]}
              placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
              placeholder="Attribute"
            />
            <TextInput
              value={s.value}
              onChangeText={(t) => updateSpec(i, 'value', t)}
              style={[adminInputStyle, { flex: 1 }]}
              placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
              placeholder="Value"
            />
            <Pressable
              onPress={() => specs.length > 1 && setSpecs((p) => p.filter((_, j) => j !== i))}
              disabled={specs.length === 1}
              hitSlop={6}
              style={{ padding: 6 }}
            >
              <X size={14} color={specs.length > 1 ? C.slate400 : C.slate100} />
            </Pressable>
          </View>
        ))}
        {!specs.some((s) => s.key) && (
          <Text style={{ fontSize: 11, color: C.slate400 }}>
            e.g. Weight → 180g · Screen → 6.1" OLED · Battery → 3,800 mAh
          </Text>
        )}
      </CardBody>
    </Card>
  );
}