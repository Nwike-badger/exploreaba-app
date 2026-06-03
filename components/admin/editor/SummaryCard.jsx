import { View, Text } from 'react-native';
import { Card, CardHeader, CardBody } from '../SharedUI';
import { C } from './tokens';

export default function SummaryCard({ variants, totalUnits, media, specs, form }) {
  const rows = [
    { label: 'Variants', val: String(variants.length) },
    { label: 'Total stock', val: `${totalUnits} units` },
    { label: 'Media', val: `${media.length} file${media.length !== 1 ? 's' : ''}` },
    { label: 'Specs', val: String(specs.filter((s) => s.key).length) },
    { label: 'Tags', val: String(form.tags ? form.tags.split(',').filter(Boolean).length : 0) },
  ];
  return (
    <Card>
      <CardHeader>Quick Summary</CardHeader>
      <CardBody style={{ padding: 0 }}>
        {rows.map(({ label, val }, i) => (
          <View
            key={label}
            style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingHorizontal: 20, paddingVertical: 10,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: C.slate50,
            }}
          >
            <Text style={{ fontSize: 12, color: C.slate500 }}>{label}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate800 }}>{val}</Text>
          </View>
        ))}
      </CardBody>
    </Card>
  );
}