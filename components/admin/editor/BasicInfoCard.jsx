import { View, Text, TextInput } from 'react-native';
import { Card, CardBody, Field, adminInputStyle, ADMIN_PLACEHOLDER_COLOR } from '../SharedUI';
import { C } from './tokens';

export default function BasicInfoCard({ form, setF, handleNameChange, slugEdited }) {
  return (
    <Card>
      <CardBody style={{ gap: 16 }}>
        <Field label="Product Title" required>
          <TextInput
            value={form.name}
            onChangeText={handleNameChange}
            style={adminInputStyle}
            placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
            placeholder="e.g. Apple iPhone 15 Pro Max"
          />
        </Field>

        <Field label="Description">
          <TextInput
            value={form.description}
            onChangeText={(t) => setF({ description: t })}
            style={[adminInputStyle, { height: 110, textAlignVertical: 'top' }]}
            placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
            placeholder="Describe key features, materials, dimensions, and use cases…"
            multiline
          />
        </Field>

        <Field label="URL Slug" hint="Auto-generated from title. Edit to customise the product URL.">
          <View style={{ position: 'relative' }}>
            <Text style={{ position: 'absolute', left: 14, top: 11, color: C.slate300, fontSize: 14, zIndex: 1 }}>/</Text>
            <TextInput
              value={form.slug}
              onChangeText={(t) => {
                slugEdited.current = true;
                setF({ slug: t.toLowerCase().replace(/\s+/g, '-') });
              }}
              style={[adminInputStyle, { paddingLeft: 24, fontFamily: 'monospace', color: C.slate600 }]}
              placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
              placeholder="auto-generated-from-title"
              autoCapitalize="none"
            />
          </View>
        </Field>
      </CardBody>
    </Card>
  );
}