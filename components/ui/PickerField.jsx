import { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, X, Check } from 'lucide-react-native';

/**
 * PickerField — bottom-sheet replacement for <select>.
 *
 * options: accepts EITHER
 *   - string[]                        (value === label)
 *   - { label, value }[]              (separate display + value)
 *
 * Props: label, value, onChange, options, placeholder, disabled, required
 */
const toOption = (opt) =>
  opt !== null && typeof opt === 'object'
    ? { label: String(opt.label ?? opt.value), value: opt.value }
    : { label: String(opt), value: opt };

export default function PickerField({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  disabled = false,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const normalized = options.map(toOption);
  const selected = normalized.find((o) => o.value === value);
  const hasValue = value !== undefined && value !== null && value !== '';
  const displayText = hasValue ? (selected?.label ?? String(value)) : placeholder;

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <View>
      {label && (
        <Text className="text-sm font-bold text-gray-900 mb-1.5">
          {label}{required && ' *'}
        </Text>
      )}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={`flex-row items-center justify-between p-3.5 border rounded-xl
          ${disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
      >
        <Text
          className={`flex-1 font-medium
            ${disabled ? 'text-gray-400' : hasValue ? 'text-gray-900' : 'text-gray-300'}`}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <ChevronDown size={16} color={disabled ? '#9CA3AF' : '#6B7280'} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/55" onPress={() => setOpen(false)} />
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '70%' }}>
            <SafeAreaView>
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 rounded-full bg-gray-200" />
              </View>
              <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
                <Text className="text-base font-black text-gray-900">{label || 'Select'}</Text>
                <Pressable onPress={() => setOpen(false)} className="p-1">
                  <X size={20} color="#4B5563" />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ paddingVertical: 8, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
                {normalized.length === 0 ? (
                  <View className="px-5 py-8 items-center">
                    <Text className="text-sm text-gray-400">No options available</Text>
                  </View>
                ) : (
                  normalized.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <Pressable
                        key={String(opt.value)}
                        onPress={() => handleSelect(opt.value)}
                        className={`flex-row items-center justify-between px-5 py-3.5 ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <Text className={`text-base ${isSelected ? 'font-bold text-blue-700' : 'text-gray-800'}`}>
                          {opt.label}
                        </Text>
                        {isSelected && <Check size={16} color="#1d4ed8" />}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}