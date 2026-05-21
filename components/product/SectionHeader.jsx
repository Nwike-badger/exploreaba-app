import { View, Text, Pressable } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

const SectionHeader = ({ title, actionText, onAction, align = 'left' }) => {
  const titleAlign =
    align === 'center' ? 'text-center' :
    align === 'right'  ? 'text-right'  :
                         'text-left';

  return (
    <View
      className={`flex-row items-center justify-between mb-3 border-b border-gray-100 pb-3
        ${align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      <View className={align === 'center' ? 'flex-1' : ''}>
        <Text className={`text-base font-black text-gray-900 tracking-tight ${titleAlign}`}>
          {title}
        </Text>
      </View>

      {actionText && (
        <Pressable
          onPress={onAction}
          className="flex-row items-center gap-1 ml-4"
        >
          <Text className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
            {actionText}
          </Text>
          <ArrowRight size={12} color="#16a34a" />
        </Pressable>
      )}
    </View>
  );
};

export default SectionHeader;