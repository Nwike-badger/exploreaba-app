import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft, Ruler, ChevronDown, ChevronUp, Info, Scissors, ArrowRight,
} from 'lucide-react-native';
import { SIZE_CHARTS, MEASUREMENT_FIELDS, FITTING_PREFERENCES } from '@/lib/customDesignData';

/* ── Static data not covered by customDesignData.js ─────────────── */
const FOOTWEAR_SIZES = [
  { ng: '37', uk: '4', usM: '5', usW: '6.5', cm: '23.3' },
  { ng: '38', uk: '5', usM: '6', usW: '7.5', cm: '24.0' },
  { ng: '39', uk: '6', usM: '7', usW: '8.5', cm: '24.7' },
  { ng: '40', uk: '6.5', usM: '7.5', usW: '9', cm: '25.3' },
  { ng: '41', uk: '7', usM: '8', usW: '9.5', cm: '25.9' },
  { ng: '42', uk: '8', usM: '9', usW: '10.5', cm: '26.6' },
  { ng: '43', uk: '9', usM: '10', usW: '11', cm: '27.3' },
  { ng: '44', uk: '9.5', usM: '10.5', usW: '11.5', cm: '27.9' },
  { ng: '45', uk: '10', usM: '11', usW: '12', cm: '28.6' },
  { ng: '46', uk: '11', usM: '12', usW: '13', cm: '29.3' },
];

const KEY_FIELD_IDS = ['chest', 'bust', 'waist', 'hip', 'shoulder', 'sleeve', 'inseam'];

const GROUP_META = {
  upper: { label: 'Upper Body', emoji: '👕' },
  lower: { label: 'Lower Body', emoji: '👖' },
  length: { label: 'Garment Lengths', emoji: '📐' },
};

const TABS = [
  { id: 'men', label: "Men's Sizes", emoji: '👔' },
  { id: 'women', label: "Women's Sizes", emoji: '👗' },
  { id: 'measure', label: 'How to Measure', emoji: '📏' },
  { id: 'footwear', label: 'Footwear', emoji: '👞' },
  { id: 'fit', label: 'Fit Guide', emoji: '✂️' },
];

/* ── Utilities ────────────────────────────────────────────────── */
const inRange = (val, rangeStr) => {
  if (!val || !rangeStr) return false;
  const parts = rangeStr.split('-').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return false;
  return val >= parts[0] && val <= parts[1];
};

const buildGroups = () => {
  const groups = { upper: [], lower: [], length: [] };
  Object.entries(MEASUREMENT_FIELDS).forEach(([id, field]) => {
    if (groups[field.group]) groups[field.group].push({ id, ...field });
  });
  return groups;
};
const GROUPED = buildGroups();

/* ── Building blocks ─────────────────────────────────────────── */
function SizeBadge({ label, active }) {
  return (
    <View className={`self-start px-2.5 py-1 rounded-lg ${active ? 'bg-blue-600' : 'bg-gray-100'}`}>
      <Text className={`text-xs font-black ${active ? 'text-white' : 'text-gray-700'}`}>{label}</Text>
    </View>
  );
}

function NoteBox({ children }) {
  return (
    <View className="flex-row items-start gap-2 p-4 bg-blue-50 border border-blue-100 rounded-xl">
      <Info size={15} color="#3b82f6" style={{ marginTop: 2 }} />
      <Text className="flex-1 text-sm text-blue-800 leading-relaxed">{children}</Text>
    </View>
  );
}

function FinderBar({ value, onChangeValue, field, onChangeField, options, unitLabel = 'in', placeholder = 'e.g. 38' }) {
  return (
    <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-3">
      <View className="flex-row items-center gap-2">
        <Ruler size={15} color="#2563eb" />
        <Text className="text-sm font-bold text-gray-700">Find my size</Text>
      </View>
      {options.length > 1 && (
        <View className="flex-row flex-wrap gap-2">
          {options.map(({ value: v, label }) => (
            <Pressable
              key={v}
              onPress={() => onChangeField(v)}
              className={`px-3 py-1.5 rounded-full border ${
                field === v ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text className={`text-xs font-bold ${field === v ? 'text-white' : 'text-gray-600'}`}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View className="flex-row items-center gap-2">
        <TextInput
          value={value}
          onChangeText={onChangeValue}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900"
        />
        <Text className="text-sm text-gray-500 font-medium">{unitLabel}</Text>
        {!!value && (
          <Pressable onPress={() => onChangeValue('')}>
            <Text className="text-xs text-gray-400 underline">Clear</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function DataTable({ columns, rows, keyField, isMatch, pinned, onPressRow }) {
  return (
    <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <View className="flex-row bg-gray-900 px-3 py-3">
        {columns.map((c) => (
          <Text key={c.key} className="flex-1 text-white text-[10px] font-black uppercase tracking-wider">
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((row) => {
        const match = isMatch ? isMatch(row) : false;
        const isPinned = pinned === row[keyField];
        const hi = match || isPinned;
        return (
          <Pressable
            key={row[keyField]}
            onPress={() => onPressRow(row[keyField])}
            className={`flex-row items-center px-3 py-3 border-t border-gray-50 ${
              isPinned ? 'bg-blue-600' : match ? 'bg-blue-50' : ''
            }`}
          >
            {columns.map((c, i) => (
              <View key={c.key} className="flex-1">
                {i === 0 ? (
                  <SizeBadge label={row[c.key]} active={hi} />
                ) : (
                  <Text className={`text-sm ${isPinned ? 'text-white font-bold' : hi ? 'text-blue-900 font-bold' : 'text-gray-700'}`}>
                    {row[c.key]}
                  </Text>
                )}
              </View>
            ))}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── Main screen ─────────────────────────────────────────────── */
export default function SizeGuideScreen() {
  const [activeTab, setActiveTab] = useState('men');
  const [inputVal, setInputVal] = useState('');
  const [inputField, setInputField] = useState('chest');
  const [pinnedSize, setPinnedSize] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  const numVal = inputVal ? parseFloat(inputVal) : null;

  const resetFinder = () => { setInputVal(''); setPinnedSize(null); };

  const switchTab = (id) => {
    setActiveTab(id);
    resetFinder();
    setExpanded(new Set());
    if (id === 'women') setInputField('bust');
    else if (id === 'men') setInputField('chest');
  };

  const toggleExpand = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const togglePin = (size) => setPinnedSize((p) => (p === size ? null : size));

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center px-2 h-14 border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center" accessibilityLabel="Back">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-base font-black text-gray-900 tracking-tight ml-1">Size Guide</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
        >
          {TABS.map(({ id, label, emoji }) => (
            <Pressable
              key={id}
              onPress={() => switchTab(id)}
              className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                activeTab === id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
              }`}
            >
              <Text className="text-xs">{emoji}</Text>
              <Text className={`text-xs font-bold ${activeTab === id ? 'text-white' : 'text-gray-600'}`}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        <Text className="text-xs text-gray-400 leading-relaxed">
          All measurements are in inches (in) — the standard used by our Aba tailors.
        </Text>

        {/* MEN */}
        {activeTab === 'men' && (
          <>
            <FinderBar
              value={inputVal} onChangeValue={setInputVal}
              field={inputField} onChangeField={setInputField}
              options={[
                { value: 'chest', label: 'Chest' },
                { value: 'waist', label: 'Waist' },
                { value: 'hip', label: 'Hip' },
                { value: 'neck', label: 'Neck' },
              ]}
            />
            <DataTable
              columns={[
                { key: 'size', label: 'Size' },
                { key: 'chest', label: 'Chest' },
                { key: 'waist', label: 'Waist' },
                { key: 'hip', label: 'Hip' },
                { key: 'neck', label: 'Neck' },
              ]}
              rows={SIZE_CHARTS.men}
              keyField="size"
              isMatch={(row) => !!numVal && inRange(numVal, row[inputField])}
              pinned={pinnedSize}
              onPressRow={togglePin}
            />
            <NoteBox>
              Between sizes? Always size up — our Aba tailors cut a trim silhouette, and a slightly
              larger size gives you room to tailor it in. Or skip the guesswork and place a custom order.
            </NoteBox>
          </>
        )}

        {/* WOMEN */}
        {activeTab === 'women' && (
          <>
            <FinderBar
              value={inputVal} onChangeValue={setInputVal}
              field={inputField} onChangeField={setInputField}
              options={[
                { value: 'bust', label: 'Bust' },
                { value: 'waist', label: 'Waist' },
                { value: 'hip', label: 'Hip' },
              ]}
            />
            <DataTable
              columns={[
                { key: 'size', label: 'Size' },
                { key: 'bust', label: 'Bust' },
                { key: 'waist', label: 'Waist' },
                { key: 'hip', label: 'Hip' },
              ]}
              rows={SIZE_CHARTS.women}
              keyField="size"
              isMatch={(row) => !!numVal && inRange(numVal, row[inputField])}
              pinned={pinnedSize}
              onPressRow={togglePin}
            />
            <NoteBox>
              Our women's garments are designed with a fitted silhouette. If you prefer a relaxed fit or
              have a larger frame, size up by one — or order custom for a perfect fit.
            </NoteBox>
          </>
        )}

        {/* HOW TO MEASURE */}
        {activeTab === 'measure' && (
          <>
            <NoteBox>
              Wear fitted clothing or underwear only when measuring. Keep the tape snug but not tight —
              you should be able to slide one finger underneath. All measurements are in inches (in).
            </NoteBox>

            <View>
              <Text className="text-sm font-black text-gray-900 mb-1">Key Measurements</Text>
              <Text className="text-xs text-gray-400 mb-3">The ones needed to find your standard size</Text>
              <View className="gap-3">
                {KEY_FIELD_IDS.map((id) => {
                  const field = MEASUREMENT_FIELDS[id];
                  if (!field) return null;
                  return (
                    <View key={id} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="font-black text-gray-900 text-sm">{field.label}</Text>
                        <View className="bg-green-100 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] font-bold text-green-700 uppercase">{field.unit}</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-gray-600 leading-relaxed mb-2">{field.guide}</Text>
                      <View className="flex-row items-center gap-1.5">
                        <Ruler size={11} color="#22c55e" />
                        <Text className="text-xs text-gray-400">
                          Typical range: <Text className="text-gray-600 font-bold">{field.placeholder} in</Text>
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View>
              <Text className="text-sm font-black text-gray-900 mb-1">Full Measurement Reference</Text>
              <Text className="text-xs text-gray-400 mb-3">
                Tap any measurement to see the full guide — the exact fields our tailors use for custom orders.
              </Text>

              {Object.entries(GROUPED).map(([groupKey, fields]) => (
                <View key={groupKey} className="mb-5">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Text>{GROUP_META[groupKey].emoji}</Text>
                    <Text className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      {GROUP_META[groupKey].label}
                    </Text>
                  </View>
                  <View className="gap-2">
                    {fields.map(({ id, label, guide, placeholder, unit }) => {
                      const open = expanded.has(id);
                      return (
                        <View
                          key={id}
                          className={`bg-white rounded-xl border ${open ? 'border-green-200' : 'border-gray-100'}`}
                        >
                          <Pressable
                            onPress={() => toggleExpand(id)}
                            className="flex-row items-center justify-between px-4 py-3"
                          >
                            <View className="flex-row items-center gap-2">
                              <Text className="text-sm font-bold text-gray-800">{label}</Text>
                              <View className="bg-gray-100 px-1.5 py-0.5 rounded">
                                <Text className="text-[10px] font-bold text-gray-500 uppercase">{unit}</Text>
                              </View>
                            </View>
                            {open
                              ? <ChevronUp size={14} color="#16a34a" />
                              : <ChevronDown size={14} color="#9ca3af" />
                            }
                          </Pressable>
                          {open && (
                            <View className="px-4 pb-4 pt-1 border-t border-gray-50">
                              <Text className="text-xs text-gray-600 leading-relaxed mb-2">{guide}</Text>
                              <Text className="text-[11px] text-gray-400">
                                Range: <Text className="text-gray-600 font-bold">{placeholder} in</Text>
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            <View className="bg-gray-900 rounded-2xl p-5">
              <Text className="text-white font-black text-base mb-2">Measuring for a custom order?</Text>
              <Text className="text-gray-300 text-sm leading-relaxed mb-3">
                For the best result, have someone else take your measurements — it's difficult to measure
                yourself accurately, especially shoulder width and back length.
              </Text>
              <Pressable onPress={() => router.push('/custom')}>
                <Text className="text-green-400 text-xs font-bold">Start your custom order →</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* FOOTWEAR */}
        {activeTab === 'footwear' && (
          <>
            <FinderBar
              value={inputVal} onChangeValue={setInputVal}
              field="cm" onChangeField={() => {}}
              options={[{ value: 'cm', label: 'Foot Length' }]}
              unitLabel="cm"
              placeholder="e.g. 26.5"
            />
            <DataTable
              columns={[
                { key: 'ng', label: 'NG/EU' },
                { key: 'uk', label: 'UK' },
                { key: 'usM', label: 'US M' },
                { key: 'usW', label: 'US W' },
                { key: 'cm', label: 'CM' },
              ]}
              rows={FOOTWEAR_SIZES}
              keyField="ng"
              isMatch={(row) => !!numVal && Math.abs(parseFloat(row.cm) - numVal) < 0.4}
              pinned={pinnedSize}
              onPressRow={togglePin}
            />
            <NoteBox>
              Our Aba leather shoes are true to EU size. If you are between sizes or have wider feet, go
              up by one. Brand-new leather molds to your foot within a few wears. Measure in the evening
              when feet are at their largest.
            </NoteBox>
          </>
        )}

        {/* FIT GUIDE */}
        {activeTab === 'fit' && (
          <>
            <View className="gap-3">
              {FITTING_PREFERENCES.map(({ id, name, desc }) => (
                <View key={id} className="bg-white rounded-2xl border border-gray-100 p-5 flex-row items-center gap-4">
                  <View className="w-14 h-16 bg-gray-900 rounded-xl items-center justify-center overflow-hidden relative">
                    <View
                      className="bg-green-500 rounded-lg absolute bottom-0"
                      style={{ width: id === 'slim' ? 20 : id === 'regular' ? 30 : 44, height: 56 }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-black text-gray-900 mb-1">{name}</Text>
                    <Text className="text-sm text-gray-500 leading-relaxed">{desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="flex-row items-start gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <Info size={15} color="#f59e0b" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-sm text-amber-800 leading-relaxed">
                When ordering custom, you'll select your preferred fit and our tailors will add the
                appropriate ease allowance on top of your body measurements.
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/custom')}
              className="flex-row items-center justify-center gap-2 bg-blue-600 py-4 rounded-xl"
            >
              <Scissors size={16} color="#fff" />
              <Text className="text-white font-bold text-sm">Browse Custom Garments</Text>
              <ArrowRight size={16} color="#fff" />
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}