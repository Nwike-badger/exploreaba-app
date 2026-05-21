import { View, Text, TextInput } from 'react-native';
import { NIGERIA_STATES } from '@/utils/nigeriaGeo';
import PickerField from '@/components/ui/PickerField';

const AddressForm = ({ address, setAddress, loading }) => {
  // Phone formatting — identical logic, just rewired for onChangeText (no event)
  const handlePhoneChange = (val) => {
    val = val.replace(/\D/g, '');
    if (val.startsWith('234') && val.length > 10) val = val.slice(3);
    if (val.startsWith('0')) val = val.slice(1);
    if (val.length > 10) val = val.slice(0, 10);
    setAddress({ ...address, phoneNumber: val });
  };

  const stateOptions = Object.keys(NIGERIA_STATES).sort();
  const cityOptions = address.state
    ? [...(NIGERIA_STATES[address.state] || [])].sort()
    : [];

  return (
    <View className="gap-5">
      {/* Country — locked */}
      <View>
        <Text className="text-sm font-bold text-gray-900 mb-1.5">
          Country / Region
        </Text>
        <View className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
          <Text className="text-gray-500 font-medium">Nigeria</Text>
        </View>
      </View>

      {/* Phone */}
      <View>
        <View className="flex-row justify-between items-end mb-1.5">
          <Text className="text-sm font-bold text-gray-900">Phone number *</Text>
          <Text className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            For delivery updates
          </Text>
        </View>
        <View className="relative">
          {/* +234 prefix badge */}
          <View
            className="absolute left-1 top-1 bottom-1 px-3 bg-gray-100 rounded-lg border-r border-gray-200 justify-center z-10"
            pointerEvents="none"
          >
            <Text className="text-sm font-black text-gray-700">+234</Text>
          </View>
          <TextInput
            value={address.phoneNumber || ''}
            onChangeText={handlePhoneChange}
            editable={!loading}
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="8067087765"
            placeholderTextColor="#D1D5DB"
            className="border border-gray-300 rounded-xl p-3.5 pl-[84px] font-bold text-gray-900"
          />
        </View>
        {/* Inline validation */}
        {address.phoneNumber &&
          address.phoneNumber.length > 0 &&
          address.phoneNumber.length < 10 && (
            <Text className="text-[10px] text-red-500 font-bold mt-1.5">
              {10 - address.phoneNumber.length} more digit
              {10 - address.phoneNumber.length !== 1 ? 's' : ''} needed.
            </Text>
          )}
        {address.phoneNumber && address.phoneNumber.length === 10 && (
          <Text className="text-[10px] text-green-600 font-bold mt-1.5">
            ✓ Looks good!
          </Text>
        )}
      </View>

      {/* Street Address */}
      <View>
        <Text className="text-sm font-bold text-gray-900 mb-1.5">
          Delivery address *
        </Text>
        <TextInput
          value={address.streetAddress || ''}
          onChangeText={(val) => setAddress({ ...address, streetAddress: val })}
          editable={!loading}
          placeholder="Street number, name, and other details"
          placeholderTextColor="#D1D5DB"
          className="border border-gray-300 rounded-xl p-3.5 font-medium text-gray-900"
        />
      </View>

      {/* State & City — side by side */}
      <View className="flex-row gap-4">
        <View className="flex-1">
          <PickerField
            label="State"
            required
            value={address.state}
            onChange={(s) => setAddress({ ...address, state: s, city: '' })}
            options={stateOptions}
            placeholder="Select State"
            disabled={loading}
          />
        </View>
        <View className="flex-1">
          <PickerField
            label="City / LGA"
            required
            value={address.city}
            onChange={(c) => setAddress({ ...address, city: c })}
            options={cityOptions}
            placeholder={address.state ? 'Select City' : 'Select State First'}
            disabled={loading || !address.state}
          />
        </View>
      </View>
    </View>
  );
};

export default AddressForm;