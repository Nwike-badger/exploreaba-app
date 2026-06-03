import { View, Text, Pressable, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Video, Info, X } from 'lucide-react-native';
import { Card, CardHeader, CardBody, adminInputStyle, ADMIN_PLACEHOLDER_COLOR } from '../SharedUI';
import { C } from './tokens';

export default function MediaGalleryCard({ media, mediaInput, setMediaInput, addMedia, removeMedia, setPrimary }) {
  return (
    <Card>
      <CardHeader>Media</CardHeader>
      <CardBody style={{ gap: 16 }}>
        {media.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {media.map((m, i) => (
              <Pressable
                key={i}
                onPress={() => m.type === 'IMAGE' && setPrimary(i)}
                style={{
                  width: '22%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
                  borderWidth: 2, borderColor: m.isPrimary ? C.blue500 : C.slate200, position: 'relative',
                }}
              >
                {m.type === 'VIDEO' ? (
                  <View style={{ flex: 1, backgroundColor: C.slate800, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <Video size={16} color="#fff" />
                    <Text style={{ fontSize: 8, color: C.slate300, fontWeight: '700' }}>VIDEO</Text>
                  </View>
                ) : (
                  <Image source={{ uri: m.url }} style={{ flex: 1 }} contentFit="cover" />
                )}
                {m.isPrimary && (
                  <View style={{ position: 'absolute', top: 3, left: 3, backgroundColor: C.blue500, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ fontSize: 8, color: '#fff', fontWeight: '700' }}>Cover</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => removeMedia(i)}
                  hitSlop={6}
                  style={{ position: 'absolute', top: 3, right: 3, backgroundColor: 'rgba(255,255,255,0.92)', padding: 3, borderRadius: 6 }}
                >
                  <X size={10} color={C.red500} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={mediaInput}
            onChangeText={setMediaInput}
            placeholder="Paste image URL or YouTube/Vimeo link…"
            placeholderTextColor={ADMIN_PLACEHOLDER_COLOR}
            style={[adminInputStyle, { flex: 1 }]}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => addMedia()}
            style={{ paddingHorizontal: 16, backgroundColor: C.slate100, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.slate700 }}>Add</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
          <Info size={11} color={C.slate400} style={{ marginTop: 1 }} />
          <Text style={{ fontSize: 10, color: C.slate400, flex: 1 }}>
            Tap an image to set it as the cover photo. YouTube/Vimeo links become video entries.
          </Text>
        </View>
      </CardBody>
    </Card>
  );
}