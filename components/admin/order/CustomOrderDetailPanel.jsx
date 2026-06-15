import { useState, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Modal, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import {
  X, Package, Clock, CheckCircle, Truck, XCircle, AlertTriangle, Copy,
  Phone, Mail, MessageCircle, ArrowRight, Ruler, MapPin, Upload, Check, DollarSign,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { fmt } from '@/utils/adminUtils';
import { toast } from '@/utils/toast';
import { C } from '@/components/admin/editor/tokens';

const STATUS_META = {
  SUBMITTED:     { label: 'Submitted',     color: 'amber',  icon: Clock },
  QUOTED:        { label: 'Quoted',        color: 'blue',   icon: CheckCircle },
  DEPOSIT_PAID:  { label: 'Deposit Paid',  color: 'indigo', icon: CheckCircle },
  IN_PRODUCTION: { label: 'In Production', color: 'violet', icon: Package },
  READY:         { label: 'Ready',         color: 'green',  icon: CheckCircle },
  SHIPPED:       { label: 'Shipped',       color: 'teal',   icon: Truck },
  DELIVERED:     { label: 'Delivered',     color: 'green',  icon: CheckCircle },
  COMPLETED:     { label: 'Completed',     color: 'green',  icon: CheckCircle },
  CANCELLED:     { label: 'Cancelled',     color: 'red',    icon: XCircle },
  REJECTED:      { label: 'Rejected',      color: 'red',    icon: XCircle },
};

const PILL = {
  amber:  { bg: '#fffbeb', fg: '#b45309', border: '#fde68a' },
  blue:   { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  indigo: { bg: '#eef2ff', fg: '#4338ca', border: '#c7d2fe' },
  violet: { bg: '#f5f3ff', fg: '#6d28d9', border: '#ddd6fe' },
  green:  { bg: '#f0fdf4', fg: '#15803d', border: '#bbf7d0' },
  teal:   { bg: '#f0fdfa', fg: '#0f766e', border: '#99f6e4' },
  red:    { bg: '#fef2f2', fg: '#dc2626', border: '#fecaca' },
  slate:  { bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0' },
};
const DOT = { amber: '#fbbf24', blue: '#60a5fa', indigo: '#818cf8', violet: '#a78bfa', green: '#22c55e', teal: '#2dd4bf', red: '#ef4444', slate: '#cbd5e1' };

// Mirrors ALLOWED_TRANSITIONS in CustomOrderService
const NEXT_STATUSES = {
  SUBMITTED:     ['QUOTED', 'REJECTED', 'CANCELLED'],
  QUOTED:        ['DEPOSIT_PAID', 'CANCELLED'],
  DEPOSIT_PAID:  ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  READY:         ['SHIPPED', 'DELIVERED'],
  SHIPPED:       ['DELIVERED'],
  DELIVERED:     ['COMPLETED'],
  COMPLETED:     [],
  CANCELLED:     [],
  REJECTED:      [],
};

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ status, large }) {
  const meta = STATUS_META[status] || { label: status, color: 'slate', icon: Package };
  const c = PILL[meta.color] || PILL.slate;
  const Icon = meta.icon;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: large ? 12 : 8, paddingVertical: large ? 5 : 3 }}>
      <Icon size={large ? 12 : 10} color={c.fg} />
      <Text style={{ fontSize: large ? 12 : 10, fontWeight: '700', color: c.fg }}>{meta.label}</Text>
    </View>
  );
}

function SectionLabel({ children }) {
  return <Text style={{ fontSize: 10, fontWeight: '800', color: C.slate400, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>{children}</Text>;
}

function Timeline({ history = [] }) {
  if (!history.length) return <Text style={{ fontSize: 12, color: C.slate400, fontStyle: 'italic' }}>No history yet.</Text>;
  const rev = [...history].reverse();
  return (
    <View>
      {rev.map((h, i) => {
        const meta = STATUS_META[h.status] || { label: h.status, color: 'slate' };
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, backgroundColor: DOT[meta.color] || DOT.slate }} />
              {i < rev.length - 1 && <View style={{ width: 1, flex: 1, backgroundColor: C.slate100, marginVertical: 4 }} />}
            </View>
            <View style={{ paddingBottom: 16, flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate800 }}>{meta.label}</Text>
              {h.note ? <Text style={{ fontSize: 11, color: C.slate500, marginTop: 2, lineHeight: 16 }}>{h.note}</Text> : null}
              {h.actor ? <Text style={{ fontSize: 10, color: C.slate400, marginTop: 2 }}>by {h.actor}</Text> : null}
              {h.timestamp ? <Text style={{ fontSize: 10, color: C.slate400, marginTop: 2 }}>{fmtDate(h.timestamp)}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function CustomOrderDetailPanel({ referenceNumber, onClose, onChanged }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showQuote, setShowQuote] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!referenceNumber) return;
    let active = true;
    setLoading(true);
    api.get(`/v1/custom-orders/${referenceNumber}`)
      .then((r) => { if (active) setOrder(r.data); })
      .catch(() => { toast.error('Could not load order'); onClose(); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [referenceNumber]);

  const copyRef = async () => {
    if (!order?.referenceNumber) return;
    try { await Clipboard.setStringAsync(order.referenceNumber); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const openWhatsApp = (number, text) => {
    const url = `https://wa.me/${(number || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => toast.error('Could not open WhatsApp'));
  };

  const handleApplyQuote = async () => {
    const amount = parseFloat(quoteAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid quoted amount'); return; }
    setUpdating(true);
    try {
      const res = await api.post(`/v1/custom-orders/${referenceNumber}/quote`, {
        quotedAmount: amount,
        quoteNotes: quoteNotes.trim() || null,
      });
      setOrder(res.data);
      setShowQuote(false);
      setQuoteAmount('');
      setQuoteNotes('');
      toast.success(`Quote ₦${fmt(amount)} applied — deposit ₦${fmt(amount * 0.5)}`);
      onChanged?.(referenceNumber, res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply quote');
    } finally {
      setUpdating(false);
    }
  };

  const advanceStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await api.post(`/v1/custom-orders/${referenceNumber}/status`, {
        newStatus,
        note: statusNote.trim() || `Moved to ${STATUS_META[newStatus]?.label ?? newStatus} by admin`,
      });
      setOrder(res.data);
      setStatusNote('');
      toast.success(`Order is now ${STATUS_META[newStatus]?.label ?? newStatus}`);
      onChanged?.(referenceNumber, res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setUpdating(true);
    try {
      const res = await api.post(`/v1/custom-orders/${referenceNumber}/status`, {
        newStatus: 'CANCELLED',
        note: cancelNote.trim() || 'Cancelled by admin',
      });
      setOrder(res.data);
      setShowCancel(false);
      setCancelNote('');
      toast.success('Order cancelled');
      onChanged?.(referenceNumber, res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    } finally {
      setUpdating(false);
    }
  };

  const pickAndUpload = async () => {
    const existing = order?.style?.referenceImageUrls?.length || 0;
    if (existing >= 4) { toast.error('Max 4 reference images'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: asset.fileName || 'upload.jpg', type: asset.mimeType || 'image/jpeg' });
      const res = await api.post('/v1/custom-uploads/style-reference', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setOrder((prev) => ({ ...prev, style: { ...prev.style, referenceImageUrls: [...(prev.style?.referenceImageUrls || []), res.data.url] } }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const currentStatus = order?.status;
  const nextAll = currentStatus ? (NEXT_STATUSES[currentStatus] || []) : [];
  const nonCancelNext = nextAll.filter((s) => s !== 'CANCELLED' && s !== 'REJECTED');
  const canCancel = nextAll.includes('CANCELLED');
  const canReject = nextAll.includes('REJECTED');
  const needsQuote = currentStatus === 'SUBMITTED';
  const refImgs = order?.style?.referenceImageUrls || [];

  return (
    <Modal visible={!!referenceNumber} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: C.slate900, fontFamily: 'monospace' }}>{loading ? '—' : (order?.referenceNumber ?? '—')}</Text>
              {order?.referenceNumber ? (
                <Pressable onPress={copyRef} hitSlop={8}>{copied ? <CheckCircle size={13} color="#16a34a" /> : <Copy size={13} color={C.slate300} />}</Pressable>
              ) : null}
            </View>
            {order ? <Text style={{ fontSize: 11, color: C.slate400, marginTop: 2 }}>{order.categoryName} · {order.gender === 'MEN' ? 'Men' : 'Women'} · {fmtDate(order.createdAt)}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {order ? <StatusPill status={order.status} large /> : null}
            <Pressable onPress={onClose} hitSlop={8} style={{ padding: 4 }}><X size={18} color={C.slate400} /></Pressable>
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.slate300} /></View>
        ) : !order ? null : (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
            {/* Customer */}
            <View>
              <SectionLabel>Customer</SectionLabel>
              <View style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 12, padding: 14, gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate800 }}>{order.customerName}</Text>
                {order.whatsappNumber ? (
                  <Pressable onPress={() => openWhatsApp(order.whatsappNumber, `Hello ${order.customerName}! This is regarding your ExploreAba custom order ${order.referenceNumber}.`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MessageCircle size={13} color="#15803d" /><Text style={{ fontSize: 12, fontWeight: '600', color: '#15803d' }}>{order.whatsappNumber}</Text>
                  </Pressable>
                ) : null}
                {order.phoneNumber && order.phoneNumber !== order.whatsappNumber ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Phone size={12} color={C.slate400} /><Text style={{ fontSize: 12, color: C.slate500 }}>{order.phoneNumber}</Text></View>
                ) : null}
                {order.customerEmail ? (
                  <Pressable onPress={() => Linking.openURL(`mailto:${order.customerEmail}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Mail size={12} color={C.slate400} /><Text style={{ fontSize: 12, color: C.slate500 }}>{order.customerEmail}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Style */}
            <View>
              <SectionLabel>Style</SectionLabel>
              {order.style?.selectedStyleName ? (
                <Text style={{ fontSize: 13, color: C.slate700, fontWeight: '600', marginBottom: 8 }}>
                  Gallery pick: <Text style={{ color: C.slate900, fontWeight: '800' }}>{order.style.selectedStyleName}</Text>
                </Text>
              ) : null}
              {order.style?.styleNotes ? (
                <Text style={{ fontSize: 12, color: C.slate600, fontStyle: 'italic', backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 }}>"{order.style.styleNotes}"</Text>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {refImgs.map((url, i) => (
                  <Pressable key={i} onPress={() => Linking.openURL(url)} style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', backgroundColor: C.slate100, borderWidth: 1, borderColor: C.slate200 }}>
                    <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </Pressable>
                ))}
                {refImgs.length < 4 ? (
                  <Pressable onPress={pickAndUpload} disabled={uploading} style={{ width: 72, height: 72, borderRadius: 12, borderWidth: 2, borderColor: C.slate200, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', opacity: uploading ? 0.5 : 1 }}>
                    {uploading ? <ActivityIndicator size="small" color={C.slate400} /> : <><Upload size={15} color={C.slate400} /><Text style={{ fontSize: 9, fontWeight: '700', color: C.slate400, marginTop: 2 }}>Add</Text></>}
                  </Pressable>
                ) : null}
              </View>
              <Text style={{ fontSize: 10, color: C.slate400, marginTop: 6 }}>Upload additional reference images (max 4 total).</Text>
            </View>

            {/* Size */}
            <View>
              <SectionLabel>Size</SectionLabel>
              {order.size?.mode === 'TAILOR_VISIT' ? (
                <Text style={{ fontSize: 13, color: C.slate700, fontWeight: '500', backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 }}>🧵 Client requested a tailor visit — arrange in-person measuring.</Text>
              ) : order.size?.mode === 'CHART' ? (
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.slate800 }}>
                  Chart size: <Text style={{ fontWeight: '800', color: C.slate900 }}>{order.size.chartSize}</Text>
                  {order.size.profileName ? <Text style={{ fontSize: 11, color: C.slate400 }}>  ({order.size.profileName})</Text> : null}
                </Text>
              ) : (
                <View>
                  {order.size?.profileName ? <Text style={{ fontSize: 11, color: C.slate500, marginBottom: 8 }}>Profile: <Text style={{ fontWeight: '700' }}>{order.size.profileName}</Text></Text> : null}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 12, padding: 12 }}>
                    {Object.entries(order.size?.measurements || {}).filter(([, v]) => v).map(([k, v]) => (
                      <View key={k} style={{ width: '50%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingRight: 12 }}>
                        <Text style={{ fontSize: 12, color: C.slate500, textTransform: 'capitalize' }}>{k}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate900 }}>{v}″</Text>
                      </View>
                    ))}
                  </View>
                  {order.details?.fitting ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}><Ruler size={12} color={C.slate400} /><Text style={{ fontSize: 10, color: C.slate400 }}>Fitting: {order.details.fitting}</Text></View>
                  ) : null}
                </View>
              )}
            </View>

            {/* Details */}
            {(order.details?.fabric || order.details?.color || order.details?.occasion || order.details?.needBy || order.details?.notes) ? (
              <View>
                <SectionLabel>Details</SectionLabel>
                <View style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 12, padding: 14, gap: 4 }}>
                  {order.details.fabric ? <Text style={{ fontSize: 12, color: C.slate600 }}>Fabric: <Text style={{ fontWeight: '700', color: C.slate800 }}>{order.details.fabric}</Text></Text> : null}
                  {order.details.color ? <Text style={{ fontSize: 12, color: C.slate600 }}>Color: <Text style={{ fontWeight: '700', color: C.slate800 }}>{order.details.color}</Text></Text> : null}
                  {order.details.occasion ? <Text style={{ fontSize: 12, color: C.slate600 }}>Occasion: <Text style={{ fontWeight: '700', color: C.slate800 }}>{order.details.occasion}</Text></Text> : null}
                  {order.details.needBy ? <Text style={{ fontSize: 12, color: C.slate600 }}>Need by: <Text style={{ fontWeight: '700', color: C.slate800 }}>{order.details.needBy}</Text></Text> : null}
                  {order.details.notes ? <Text style={{ fontSize: 12, color: C.slate600, fontStyle: 'italic', paddingTop: 4, marginTop: 2, borderTopWidth: 1, borderTopColor: C.slate200 }}>"{order.details.notes}"</Text> : null}
                </View>
              </View>
            ) : null}

            {/* Delivery */}
            <View>
              <SectionLabel>Delivery</SectionLabel>
              <View style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 12, padding: 14, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} color={C.slate400} /><Text style={{ fontSize: 13, fontWeight: '700', color: C.slate800 }}>{order.delivery?.mode === 'ABA' ? 'Within Aba' : 'Nationwide delivery'}</Text>
                </View>
                {order.delivery?.address?.streetAddress ? (
                  <Text style={{ fontSize: 12, color: C.slate500, lineHeight: 17, paddingLeft: 18 }}>
                    {[order.delivery.address.streetAddress, order.delivery.address.city, order.delivery.address.state].filter(Boolean).join(', ')}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Pricing */}
            {order.pricing?.quotedAmount ? (
              <View>
                <SectionLabel>Pricing</SectionLabel>
                <View style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 12, overflow: 'hidden' }}>
                  {[
                    { label: 'Quoted total', val: order.pricing.quotedAmount },
                    { label: 'Deposit (50%)', val: order.pricing.depositAmount },
                    { label: 'Balance', val: order.pricing.balanceAmount },
                  ].map((row) => (
                    <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
                      <Text style={{ fontSize: 12, color: C.slate500, fontWeight: '500' }}>{row.label}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: C.slate900 }}>₦{fmt(row.val)}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff' }}>
                    <View style={{ backgroundColor: order.pricing.depositPaid ? PILL.green.bg : PILL.amber.bg, borderWidth: 1, borderColor: order.pricing.depositPaid ? PILL.green.border : PILL.amber.border, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: order.pricing.depositPaid ? PILL.green.fg : PILL.amber.fg }}>Deposit: {order.pricing.depositPaid ? '✓ Paid' : 'Pending'}</Text>
                    </View>
                    <View style={{ backgroundColor: order.pricing.balancePaid ? PILL.green.bg : PILL.amber.bg, borderWidth: 1, borderColor: order.pricing.balancePaid ? PILL.green.border : PILL.amber.border, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: order.pricing.balancePaid ? PILL.green.fg : PILL.amber.fg }}>Balance: {order.pricing.balancePaid ? '✓ Paid' : 'Pending'}</Text>
                    </View>
                  </View>
                  {order.pricing.quoteNotes ? <Text style={{ fontSize: 11, color: C.slate500, fontStyle: 'italic', paddingHorizontal: 14, paddingBottom: 12 }}>{order.pricing.quoteNotes}</Text> : null}
                </View>
              </View>
            ) : null}

            {/* Status history */}
            <View>
              <SectionLabel>Status History</SectionLabel>
              <Timeline history={order.statusHistory || []} />
            </View>
          </ScrollView>
        )}

        {/* Action footer */}
        {order && !loading ? (
          <SafeAreaView edges={['bottom']} style={{ borderTopWidth: 1, borderTopColor: C.slate100, backgroundColor: '#fff' }}>
            <View style={{ padding: 16, gap: 12 }}>

              {/* Quote form (SUBMITTED) */}
              {needsQuote && !showCancel ? (
                showQuote ? (
                  <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <DollarSign size={12} color="#1d4ed8" /><Text style={{ fontSize: 12, fontWeight: '700', color: '#1e40af' }}>Apply quote — 50% deposit auto-computed</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: 4 }}>Total (₦) *</Text>
                      <TextInput value={quoteAmount} onChangeText={setQuoteAmount} keyboardType="number-pad" placeholder="e.g. 65000" placeholderTextColor={C.slate400}
                        style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, fontWeight: '700', color: C.slate900 }} />
                      {quoteAmount && parseFloat(quoteAmount) > 0 ? <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: '700', marginTop: 4 }}>Deposit: ₦{fmt(parseFloat(quoteAmount) * 0.5)}</Text> : null}
                    </View>
                    <View>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: 4 }}>Notes</Text>
                      <TextInput value={quoteNotes} onChangeText={setQuoteNotes} placeholder="e.g. Cashmere fabric" placeholderTextColor={C.slate400}
                        style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: C.slate900 }} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable onPress={() => { setShowQuote(false); setQuoteAmount(''); setQuoteNotes(''); }} style={{ flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: C.slate200, borderRadius: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate600 }}>Cancel</Text>
                      </Pressable>
                      <Pressable onPress={handleApplyQuote} disabled={updating || !quoteAmount || parseFloat(quoteAmount) <= 0} style={{ flex: 1, paddingVertical: 10, backgroundColor: '#2563eb', borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, opacity: (updating || !quoteAmount || parseFloat(quoteAmount) <= 0) ? 0.6 : 1 }}>
                        {updating ? <ActivityIndicator size="small" color="#fff" /> : <Check size={12} color="#fff" />}
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>Send Quote</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable onPress={() => setShowQuote(true)} disabled={updating} style={{ paddingVertical: 12, backgroundColor: '#2563eb', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <DollarSign size={14} color="#fff" /><Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Apply Quote</Text>
                  </Pressable>
                )
              ) : null}

              {/* Cancel form */}
              {showCancel ? (
                <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><AlertTriangle size={12} color="#dc2626" /><Text style={{ fontSize: 12, fontWeight: '700', color: '#b91c1c' }}>Confirm cancellation</Text></View>
                  <TextInput value={cancelNote} onChangeText={setCancelNote} placeholder="Reason (optional)" placeholderTextColor={C.slate400} multiline
                    style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: C.slate800, minHeight: 44, textAlignVertical: 'top' }} />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={() => { setShowCancel(false); setCancelNote(''); }} style={{ flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: C.slate200, borderRadius: 8, alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate600 }}>Never mind</Text>
                    </Pressable>
                    <Pressable onPress={handleCancel} disabled={updating} style={{ flex: 1, paddingVertical: 10, backgroundColor: '#dc2626', borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, opacity: updating ? 0.6 : 1 }}>
                      {updating ? <ActivityIndicator size="small" color="#fff" /> : <XCircle size={12} color="#fff" />}
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>Cancel Order</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {/* Status note + action buttons */}
              {!showQuote && !showCancel ? (
                <>
                  {nonCancelNext.length > 0 ? (
                    <TextInput value={statusNote} onChangeText={setStatusNote} placeholder="Optional note for status update…" placeholderTextColor={C.slate400}
                      style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: C.slate800 }} />
                  ) : null}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {nonCancelNext.map((status) => {
                      const meta = STATUS_META[status] || { label: status, icon: Package };
                      const Icon = meta.icon;
                      return (
                        <Pressable key={status} onPress={() => advanceStatus(status)} disabled={updating}
                          style={{ flexGrow: 1, minWidth: 140, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: C.slate900, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: updating ? 0.6 : 1 }}>
                          {updating ? <ActivityIndicator size="small" color="#fff" /> : (
                            <><Icon size={13} color="#fff" /><Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>Mark {meta.label}</Text><ArrowRight size={11} color="#fff" /></>
                          )}
                        </Pressable>
                      );
                    })}
                    {canReject ? (
                      <Pressable onPress={() => advanceStatus('REJECTED')} disabled={updating} style={{ paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: updating ? 0.6 : 1 }}>
                        <XCircle size={13} color="#dc2626" /><Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626' }}>Reject</Text>
                      </Pressable>
                    ) : null}
                    {canCancel ? (
                      <Pressable onPress={() => setShowCancel(true)} disabled={updating} style={{ paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: updating ? 0.6 : 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate500 }}>Cancel</Text>
                      </Pressable>
                    ) : null}
                    {nextAll.length === 0 ? (
                      <Text style={{ fontSize: 12, color: C.slate400, fontWeight: '500', paddingVertical: 8, width: '100%', textAlign: 'center' }}>Terminal state — no further transitions.</Text>
                    ) : null}
                  </View>

                  {/* WhatsApp quote shortcut */}
                  {order.whatsappNumber && order.pricing?.quotedAmount && order.status === 'QUOTED' ? (
                    <Pressable
                      onPress={() => openWhatsApp(order.whatsappNumber, `Hello ${order.customerName}! Your ExploreAba custom ${order.categoryName} (ref: ${order.referenceNumber}) has been reviewed.\n\nYour quote: ₦${fmt(order.pricing.quotedAmount)}\nDeposit (50%): ₦${fmt(order.pricing.depositAmount)}\nBalance on delivery: ₦${fmt(order.pricing.balanceAmount)}\n\nReply to confirm and we will share the deposit payment link.`)}
                      style={{ paddingVertical: 12, backgroundColor: '#22c55e', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <MessageCircle size={13} color="#fff" /><Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Send Quote via WhatsApp</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : null}
            </View>
          </SafeAreaView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}