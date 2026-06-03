import { View, Text, Pressable } from 'react-native';
import { CheckCircle, EyeOff } from 'lucide-react-native';
import { Card, CardHeader, CardBody } from '../SharedUI';
import { C } from './tokens';

export default function StatusCard({ form, setF }) {
  return (
    <Card>
      <CardHeader>Status</CardHeader>
      <CardBody style={{ gap: 10 }}>
        <Pressable
          onPress={() => setF({ isActive: true })}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 2,
            borderColor: form.isActive ? C.green400 : C.slate200,
            backgroundColor: form.isActive ? C.green50 : '#fff',
          }}
        >
          <CheckCircle size={18} color={form.isActive ? C.green500 : C.slate300} />
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate900 }}>Active</Text>
            <Text style={{ fontSize: 11, color: C.slate500 }}>Visible in store and search</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setF({ isActive: false })}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 2,
            borderColor: !form.isActive ? C.slate400 : C.slate200,
            backgroundColor: !form.isActive ? C.slate100 : '#fff',
          }}
        >
          <EyeOff size={18} color={!form.isActive ? C.slate600 : C.slate300} />
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate900 }}>Draft</Text>
            <Text style={{ fontSize: 11, color: C.slate500 }}>Hidden from customers</Text>
          </View>
        </Pressable>
      </CardBody>
    </Card>
  );
}