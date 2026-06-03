import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Plus, Trash2, Zap, CheckCircle, EyeOff, X, ArrowDown, Minus, Image as ImageIcon } from 'lucide-react-native';
import { Card, CardHeader, CardBody } from '../SharedUI';
import PickerField from '@/components/ui/PickerField';
import { fmt } from '@/utils/adminUtils';
import { C } from './tokens';

const labelStyle = { fontSize: 10, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };
const optInputStyle = { backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.slate800 };
const pillBtn = { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.blue50, borderWidth: 1, borderColor: C.blue200, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 };
const pillBtnText = { fontSize: 12, fontWeight: '700', color: C.blue600 };

function StockStepper({ value, onChange }) {
  const num = parseInt(value) || 0;
  const border = num === 0 ? C.red200 : num <= 5 ? C.amber200 : C.slate200;
  const bg = num === 0 ? C.red50 : num <= 5 ? C.amber50 : '#fff';
  const txt = num === 0 ? '#dc2626' : num <= 5 ? C.amber700 : C.slate800;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 36, borderRadius: 12, borderWidth: 1, borderColor: border, backgroundColor: bg, overflow: 'hidden', alignSelf: 'flex-start' }}>
      <Pressable onPress={() => onChange(String(Math.max(0, num - 1)))} style={{ width: 34, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Minus size={13} color={C.slate400} />
      </Pressable>
      <TextInput value={String(value ?? '')} onChangeText={onChange} keyboardType="numeric" style={{ width: 46, textAlign: 'center', fontSize: 14, fontWeight: '700', color: txt }} />
      <Pressable onPress={() => onChange(String(num + 1))} style={{ width: 34, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={13} color={C.slate400} />
      </Pressable>
    </View>
  );
}

function PriceInput({ value, onChange, placeholder = '0', dim = false }) {
  const formatted = value && parseFloat(value) > 0 ? `₦${fmt(parseFloat(value))}` : null;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 36, borderRadius: 12, borderWidth: 1, borderColor: dim ? C.slate100 : C.slate200, backgroundColor: dim ? C.slate50 : '#fff', overflow: 'hidden' }}>
        <Text style={{ paddingLeft: 10, fontSize: 14, fontWeight: '700', color: dim ? C.slate300 : C.slate400 }}>₦</Text>
        <TextInput value={String(value ?? '')} onChangeText={onChange} keyboardType="numeric" placeholder={placeholder} placeholderTextColor={C.slate300} style={{ flex: 1, paddingHorizontal: 8, fontSize: 14, fontWeight: '600', color: dim ? C.slate400 : C.slate800 }} />
      </View>
      {formatted && (
        <Text style={{ fontSize: 10, fontWeight: '700', marginTop: 4, color: dim ? C.slate400 : C.slate600, textDecorationLine: dim ? 'line-through' : 'none' }}>{formatted}</Text>
      )}
    </View>
  );
}

function VariantCard({ v, i, imageOptions, updateVariant, removeVariant }) {
  const stockNum = parseInt(v.stockQuantity) || 0;
  const stockLabel =
    stockNum === 0 ? { text: 'Out of stock', bg: C.red50, color: '#dc2626', border: C.red200 }
    : stockNum <= 5 ? { text: `Low — ${stockNum} left`, bg: C.amber50, color: C.amber700, border: C.amber200 }
    : null;

  const imgOptions = [
    { label: 'Use product gallery', value: '' },
    ...imageOptions.map((m, idx) => ({ label: `Photo ${idx + 1}`, value: m.url })),
  ];

  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: v.isActive ? C.slate200 : C.slate100, backgroundColor: v.isActive ? '#fff' : C.slate50, opacity: v.isActive ? 1 : 0.7, overflow: 'hidden' }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 }}>
          {Object.entries(v.attributes).map(([key, val]) => (
            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.slate100, borderWidth: 1, borderColor: C.slate200, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 9, color: C.slate400, textTransform: 'uppercase' }}>{key}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate700 }}>{val}</Text>
            </View>
          ))}
          {stockLabel && (
            <View style={{ backgroundColor: stockLabel.bg, borderWidth: 1, borderColor: stockLabel.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: stockLabel.color }}>{stockLabel.text}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable
            onPress={() => updateVariant(i, { isActive: !v.isActive })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: v.isActive ? C.green200 : C.slate200, backgroundColor: v.isActive ? C.green50 : C.slate100 }}
          >
            {v.isActive ? <CheckCircle size={11} color={C.green700} /> : <EyeOff size={11} color={C.slate500} />}
            <Text style={{ fontSize: 10, fontWeight: '700', color: v.isActive ? C.green700 : C.slate500 }}>{v.isActive ? 'Active' : 'Hidden'}</Text>
          </Pressable>
          <Pressable onPress={() => removeVariant(i)} hitSlop={6} style={{ padding: 6 }}>
            <Trash2 size={14} color={C.slate300} />
          </Pressable>
        </View>
      </View>

      {/* Body */}
      <View style={{ padding: 14, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Price *</Text>
            <PriceInput value={v.price} onChange={(val) => updateVariant(i, { price: val })} placeholder="0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Was (compare)</Text>
            <PriceInput value={v.compareAtPrice || ''} onChange={(val) => updateVariant(i, { compareAtPrice: val })} placeholder="—" dim />
          </View>
        </View>

        <View>
          <Text style={labelStyle}>Stock *</Text>
          <StockStepper value={v.stockQuantity} onChange={(val) => updateVariant(i, { stockQuantity: val })} />
        </View>

        <View>
          <Text style={labelStyle}>SKU / Product Code</Text>
          <TextInput
            value={v.sku}
            onChangeText={(t) => updateVariant(i, { sku: t })}
            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, fontFamily: 'monospace', color: C.slate600 }}
            placeholder="Auto-generated"
            placeholderTextColor={C.slate300}
            autoCapitalize="characters"
          />
        </View>

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <ImageIcon size={9} color={C.slate500} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Variant Image</Text>
          </View>
          <PickerField
            value={v.imageUrl || ''}
            onChange={(val) => updateVariant(i, { imageUrl: val })}
            options={imgOptions}
            placeholder="Use product gallery"
          />
        </View>
      </View>
    </View>
  );
}

export default function VariantsCard({
  options, variants, form,
  bulkPrice, bulkStock, setBulkPrice, setBulkStock,
  imageOptions, hasVariants, totalUnits,
  addOption, updateOptionName,
  addOptionValue, removeOptionValue, removeOption,
  syncVariants, updateVariant, removeVariant, applyBulk,
}) {
  const [inputVals, setInputVals] = useState({});

  const handleChange = (i, text) => {
    if (text.includes(',')) {
      const val = text.replace(/,/g, '').trim();
      if (val) addOptionValue(i, val);
      setInputVals((p) => ({ ...p, [i]: '' }));
    } else {
      setInputVals((p) => ({ ...p, [i]: text }));
    }
  };
  const handleSubmit = (i) => {
    const val = (inputVals[i] || '').trim();
    if (val) { addOptionValue(i, val); setInputVals((p) => ({ ...p, [i]: '' })); }
  };

  const validOptions = options.filter((o) => o.name.trim() && o.values.length > 0);
  const potentialCount = validOptions.length > 0 ? validOptions.reduce((acc, o) => acc * o.values.length, 1) : 0;

  return (
    <Card>
      <CardHeader subtitle="Define options like Size or Color, then set per-item pricing & stock.">
        Product Variants
      </CardHeader>
      <CardBody style={{ gap: 28 }}>

        {/* STEP 1 — options */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.blue600, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate800 }}>Product Options</Text>
                <Text style={{ fontSize: 11, color: C.slate400 }}>Different sizes, colors, or styles?</Text>
              </View>
            </View>
            {options.length > 0 && (
              <Pressable onPress={addOption} style={pillBtn}><Plus size={12} color={C.blue600} /><Text style={pillBtnText}>Add</Text></Pressable>
            )}
          </View>

          {options.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, borderWidth: 2, borderStyle: 'dashed', borderColor: C.slate200, borderRadius: 16, backgroundColor: C.slate50 }}>
              <View style={{ width: 44, height: 44, backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Zap size={18} color={C.slate400} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate600 }}>No variants needed</Text>
              <Text style={{ fontSize: 12, color: C.slate400, marginTop: 4, textAlign: 'center', maxWidth: 240, lineHeight: 17 }}>
                Leave blank for a single standard product. Add an option to create size/color variants.
              </Text>
              <Pressable onPress={addOption} style={[pillBtn, { marginTop: 16 }]}><Plus size={12} color={C.blue600} /><Text style={pillBtnText}>Add an option</Text></Pressable>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {options.map((opt, i) => (
                <View key={i} style={{ flexDirection: 'row', borderRadius: 16, borderWidth: 1, borderColor: C.slate200, backgroundColor: '#fff', overflow: 'hidden' }}>
                  <View style={{ width: 4, backgroundColor: C.blue500 }} />
                  <View style={{ flex: 1, padding: 14, gap: 12 }}>
                    <View>
                      <Text style={labelStyle}>Option name</Text>
                      <TextInput value={opt.name} onChangeText={(t) => updateOptionName(i, t)} style={optInputStyle} placeholder="e.g. Size, Color" placeholderTextColor={C.slate300} />
                    </View>
                    <View>
                      <Text style={labelStyle}>Available values  (type & press return)</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 8, minHeight: 42, backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12, alignItems: 'center' }}>
                        {opt.values.map((val, vIdx) => (
                          <View key={vIdx} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.slate100, borderWidth: 1, borderColor: C.slate200, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate700 }}>{val}</Text>
                            <Pressable onPress={() => removeOptionValue(i, vIdx)} hitSlop={6}><X size={11} color={C.slate400} /></Pressable>
                          </View>
                        ))}
                        <TextInput
                          style={{ flex: 1, minWidth: 100, fontSize: 14, color: C.slate700, paddingVertical: 2 }}
                          placeholder={opt.values.length === 0 ? 'Type a value…' : ''}
                          placeholderTextColor={C.slate300}
                          value={inputVals[i] || ''}
                          onChangeText={(t) => handleChange(i, t)}
                          onSubmitEditing={() => handleSubmit(i)}
                          onBlur={() => handleSubmit(i)}
                          blurOnSubmit={false}
                          returnKeyType="done"
                          autoCapitalize="words"
                        />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      {opt.values.length > 0 ? (
                        <Text style={{ fontSize: 10, color: C.slate400 }}>{opt.values.length} value{opt.values.length !== 1 ? 's' : ''} defined</Text>
                      ) : <View />}
                      <Pressable onPress={() => removeOption(i)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={14} color={C.slate300} />
                        <Text style={{ fontSize: 11, color: C.slate400, fontWeight: '600' }}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}

              {potentialCount > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                  <Pressable onPress={addOption} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Plus size={12} color={C.slate400} /><Text style={{ fontSize: 12, color: C.slate400, fontWeight: '600' }}>Add another</Text>
                  </Pressable>
                  <Pressable onPress={syncVariants} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.blue600, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}>
                    <ArrowDown size={14} color="#fff" /><Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Generate {potentialCount}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {/* STEP 2 — inventory */}
        {hasVariants && (
          <View style={{ borderTopWidth: 1, borderTopColor: C.slate100, paddingTop: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate800 }}>Pricing & Inventory</Text>
                <Text style={{ fontSize: 11, color: C.slate400 }}>{variants.length} variant{variants.length !== 1 ? 's' : ''} · {totalUnits} total units</Text>
              </View>
            </View>

            {/* Bulk apply */}
            <View style={{ backgroundColor: C.slate900, borderRadius: 12, padding: 12, marginBottom: 14, gap: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bulk set all</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 8 }}>
                  <Text style={{ color: C.slate400, fontSize: 12, fontWeight: '700' }}>₦</Text>
                  <TextInput value={bulkPrice} onChangeText={setBulkPrice} keyboardType="numeric" placeholder="Price" placeholderTextColor="#64748b" style={{ flex: 1, color: '#fff', fontSize: 12, paddingVertical: 8, paddingHorizontal: 4 }} />
                </View>
                <TextInput value={bulkStock} onChangeText={setBulkStock} keyboardType="numeric" placeholder="Qty" placeholderTextColor="#64748b" style={{ width: 60, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, paddingVertical: 8, paddingHorizontal: 8, textAlign: 'center' }} />
                <Pressable onPress={applyBulk} style={{ backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: C.slate900 }}>Apply</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {variants.map((v, i) => (
                <VariantCard key={i} v={v} i={i} imageOptions={imageOptions} updateVariant={updateVariant} removeVariant={removeVariant} />
              ))}
            </View>

            {options.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 10, color: C.slate400 }}>Added new options above? </Text>
                <Pressable onPress={syncVariants}><Text style={{ fontSize: 10, color: C.blue500, fontWeight: '700' }}>Re-sync variants</Text></Pressable>
                <Text style={{ fontSize: 10, color: C.slate400 }}> — prices & stock preserved.</Text>
              </View>
            )}
          </View>
        )}
      </CardBody>
    </Card>
  );
}