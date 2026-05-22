import { useState, useRef } from 'react';
import { View, Text, Pressable, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { PlayCircle } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const isVideo = (url) => Boolean(url?.match(/\.(mp4|webm|mov|m4v)$/i));

const FALLBACK = 'https://placehold.co/800x800?text=No+Image';

// Each video gets its own player instance — React's render lifecycle handles cleanup
const VideoSlide = ({ uri, size }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: size, height: size }}
      contentFit="contain"
      nativeControls={false}
    />
  );
};

const ImageSlide = ({ uri, size }) => (
  <Image
    source={{ uri }}
    style={{ width: size, height: size }}
    contentFit="contain"
    transition={200}
  />
);

const ProductGallery = ({ images = [] }) => {
  const safeImages = images.length > 0 ? images : [FALLBACK];
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef(null);

  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== activeIdx) setActiveIdx(idx);
  };

  const jumpTo = (idx) => {
    listRef.current?.scrollToIndex({ index: idx, animated: true });
    setActiveIdx(idx);
  };

  return (
    <View>
      {/* MAIN GALLERY — full-width swipeable */}
      <View style={{ height: SCREEN_WIDTH }} className="bg-gray-50">
        <FlatList
          ref={listRef}
          data={safeImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => `slide-${i}`}
          onMomentumScrollEnd={handleScroll}
          getItemLayout={(_, i) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * i,
            index: i,
          })}
          renderItem={({ item }) =>
            isVideo(item) ? (
              <VideoSlide uri={item} size={SCREEN_WIDTH} />
            ) : (
              <ImageSlide uri={item} size={SCREEN_WIDTH} />
            )
          }
        />

        {/* Image counter pill */}
        {safeImages.length > 1 && (
          <View
            className="absolute bottom-4 self-center bg-black/60 px-3 py-1.5 rounded-full"
            pointerEvents="none"
          >
            <Text className="text-white text-[10px] font-bold tracking-widest">
              {activeIdx + 1} / {safeImages.length}
            </Text>
          </View>
        )}
      </View>

      {/* DOT INDICATORS */}
      {safeImages.length > 1 && (
        <View className="flex-row justify-center gap-1.5 mt-3">
          {safeImages.map((_, i) => (
            <View
              key={i}
              className={`rounded-full ${
                i === activeIdx ? 'w-5 h-1.5 bg-gray-900' : 'w-1.5 h-1.5 bg-gray-300'
              }`}
            />
          ))}
        </View>
      )}

      {/* THUMBNAIL ROW */}
      {safeImages.length > 1 && (
        <FlatList
          data={safeImages}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 8 }}
          keyExtractor={(_, i) => `thumb-${i}`}
          renderItem={({ item, index }) => {
            const isActive = activeIdx === index;
            return (
              <Pressable
                onPress={() => jumpTo(index)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${
                  isActive ? 'border-gray-900' : 'border-gray-100'
                }`}
              >
                {isVideo(item) ? (
                  <View className="w-full h-full bg-gray-900 items-center justify-center">
                    <PlayCircle size={22} color="#fff" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: item }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
};

export default ProductGallery;