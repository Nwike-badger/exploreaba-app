import { useState, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import {
  X, Package, CreditCard, Clock, CheckCircle, Truck, RotateCcw, XCircle,
  AlertTriangle, Copy, Phone, Mail, ArrowRight,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { fmt } from '@/utils/adminUtils';
import { toast } from '@/utils/toast';
import { C } from '@/components/admin/editor/tokens';

// ─── Status metadata ──────────────────────────────────────────────────────────
const STATUS_META = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'amber',  icon: Clock },
  PROCESSING:      { label: 'Processing',      color: 'blue',   icon: Package },
  CONFIRMED:       { label: 'Confirmed',       color: 'indigo', icon: CheckCircle },
  SHIPPED:         { label: 'Shipped',         color: 'violet', icon: Truck },
  DELIVERED:       { label: 'Delivered',       color: 'green',  icon: CheckCircle },
  RETURNED:        { label: 'Returned',        color: 'orange', icon: RotateCcw },
  CANCELLED:       { label: 'Cancelled',       color: 'red',    icon: XCircle },
};

const PAYMENT_META = {
  PENDING:  { label: 'Pending',  color: 'amber' },
  SUCCESS:  { label: 'Paid',     color: 'green' },
  FAILED:   { label: 'Failed',   color: 'red'   },
  REFUNDED: { label: 'Refunded', color: 'slate' },
};

const PILL = {
  amber:  { bg: '#fffbeb', fg: '#b45309', border: '#fde68a' },
  blue:   { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  indigo: { bg: '#eef2ff', fg: '#4338ca', border: '#c7d2fe' },
  violet: { bg: '#f5f3ff', fg: '#6d28d9', border: '#ddd6fe' },
  green:  { bg: '#f0fdf4', fg: '#15803d', border: '#bbf7d0' },
  orange: { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' },
  red:    { bg: '#fef2f2', fg: '#dc2626', border: '#fecaca' },
  slate:  { bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0' },
};
const DOT = { amber: '#fbbf24', blue: '#60a5fa', indigo: '#818cf8', violet: '#a78bfa', green: '#22c55e', orange: '#fb923c', red: '#ef4444', slate: '#cbd5e1' };

// Mirrors backend OrderService state machine
const NEXT_STATUSES = {
  PENDING_PAYMENT: ['PROCESSING', 'CANCELLED'],
  PROCESSING:      ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:       ['SHIPPED', 'CANCELLED'],
  SHIPPED:         ['DELIVERED', 'RETURNED'],
  DELIVERED:       ['RETURNED'],
  RETURNED:        [],
  CANCELLED:       [],
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

function AddressBlock({ address, label }) {
  if (!address) return null;
  const lines = [address.street || address.addressLine1, address.city, address.state, address.country, address.postalCode].filter(Boolean);
  return (
    <View style={{ flex: 1, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 12, padding: 12 }}>
      <Text style={{ fontSize: 9, fontWeight: '700', color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</Text>
      {lines.map((l, i) => <Text key={i} style={{ fontSize: 13, color: C.slate700, fontWeight: '500', lineHeight: 18 }}>{l}</Text>)}
      {address.phone ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: C.slate200 }}>
          <Phone size={11} color={C.slate400} /><Text style={{ fontSize: 12, color: C.slate500 }}>{address.phone}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Timeline({ history = [] }) {
  if (!history.length) return <Text style={{ fontSize: 12, color: C.slate400, fontStyle: 'italic' }}>No status history yet.</Text>;
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
              {h.timestamp ? <Text style={{ fontSize: 10, color: C.slate400, marginTop: 3 }}>{fmtDate(h.timestamp)}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderDetailPanel({ orderId, onClose, onStatusChanged }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    setLoading(true);
    api.get(`/admin/orders/${orderId}`)
      .then((r) => { if (active) setOrder(r.data); })
      .catch(() => { toast.error('Could not load order'); onClose(); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId]);

  const copyRef = async () => {
    if (!order?.orderNumber) return;
    try { await Clipboard.setStringAsync(order.orderNumber); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const advanceStatus = async (newStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await api.patch(`/admin/orders/${order.id}/status`, {
        status: newStatus,
        note: `Status updated to ${STATUS_META[newStatus]?.label ?? newStatus} by admin`,
      });
      setOrder(res.data);
      toast.success(`Order marked as ${STATUS_META[newStatus]?.label ?? newStatus}`);
      onStatusChanged?.(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await api.patch(`/admin/orders/${order.id}/cancel`, {
        reason: cancelNote.trim() || 'Cancelled by admin',
      });
      setOrder(res.data);
      setShowCancel(false);
      setCancelNote('');
      toast.success('Order cancelled — stock restored');
      onStatusChanged?.(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Cancel failed');
    } finally {
      setUpdating(false);
    }
  };

  const nextStatuses = order ? (NEXT_STATUSES[order.orderStatus] || []) : [];
  const nonCancelNext = nextStatuses.filter((s) => s !== 'CANCELLED');
  const canCancel = order && !['SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.orderStatus);

  const breakdown = order ? [
    { label: 'Subtotal', val: order.itemSubTotal, neg: false },
    { label: 'Shipping', val: order.shippingFee, neg: false },
    { label: 'VAT (7.5%)', val: order.taxAmount, neg: false },
    { label: 'Discount', val: order.discountAmount, neg: true },
  ].filter((r) => r.val != null && Number(r.val) !== 0) : [];

  return (
    <Modal visible={!!orderId} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: C.slate900 }}>{loading ? '—' : (order?.orderNumber ?? '—')}</Text>
              {order?.orderNumber ? (
                <Pressable onPress={copyRef} hitSlop={8}>
                  {copied ? <CheckCircle size={13} color="#16a34a" /> : <Copy size={13} color={C.slate300} />}
                </Pressable>
              ) : null}
            </View>
            {order ? <Text style={{ fontSize: 11, color: C.slate400, marginTop: 2 }}>{fmtDate(order.createdAt)}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {order ? <StatusPill status={order.orderStatus} large /> : null}
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
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 12, padding: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate800 }}>{order.customerEmail}</Text>
                  {order.shippingAddress?.recipientName ? <Text style={{ fontSize: 12, color: C.slate500, marginTop: 2 }}>{order.shippingAddress.recipientName}</Text> : null}
                </View>
                <Mail size={14} color={C.slate400} />
              </View>
            </View>

            {/* Items */}
            <View>
              <SectionLabel>Items · {order.items?.length || 0}</SectionLabel>
              <View style={{ gap: 12 }}>
                {(order.items || []).map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', backgroundColor: C.slate100, borderWidth: 1, borderColor: C.slate200, alignItems: 'center', justifyContent: 'center' }}>
                      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <Package size={14} color={C.slate300} />}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: C.slate800 }}>{item.productName}</Text>
                      {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 ? (
                        <Text style={{ fontSize: 11, color: C.slate400, marginTop: 2 }}>
                          {Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </Text>
                      ) : null}
                      {item.sku ? <Text style={{ fontSize: 10, color: C.slate300, marginTop: 2, fontFamily: 'monospace' }}>SKU: {item.sku}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: C.slate900 }}>₦{fmt(item.subTotal)}</Text>
                      <Text style={{ fontSize: 10, color: C.slate400, marginTop: 2 }}>₦{fmt(item.unitPrice)} × {item.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Payment breakdown */}
            <View>
              <SectionLabel>Payment Breakdown</SectionLabel>
              <View style={{ backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 12, overflow: 'hidden' }}>
                {breakdown.map((row) => (
                  <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
                    <Text style={{ fontSize: 12, color: C.slate500, fontWeight: '500' }}>{row.label}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: row.neg ? '#16a34a' : C.slate700 }}>{row.neg ? '−' : ''}₦{fmt(row.val)}</Text>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.slate900 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: C.slate300, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>₦{fmt(order.grandTotal)}</Text>
                </View>
              </View>

              {/* Payment method + status */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate100, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                <CreditCard size={13} color={C.slate400} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: C.slate500, fontWeight: '500' }}>{order.paymentMethod || 'N/A'}</Text>
                  {order.paymentReference ? <Text style={{ fontSize: 10, color: C.slate300, fontFamily: 'monospace' }}>ref: {order.paymentReference}</Text> : null}
                </View>
                {order.paymentStatus ? (() => {
                  const pm = PAYMENT_META[order.paymentStatus] || { label: order.paymentStatus, color: 'slate' };
                  const c = PILL[pm.color] || PILL.slate;
                  return <View style={{ backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}><Text style={{ fontSize: 10, fontWeight: '800', color: c.fg }}>{pm.label}</Text></View>;
                })() : null}
              </View>

              {order.appliedPromoCode ? <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '700', marginTop: 8 }}>🏷 Promo: {order.appliedPromoCode}</Text> : null}
            </View>

            {/* Addresses */}
            <View>
              <SectionLabel>Addresses</SectionLabel>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AddressBlock address={order.shippingAddress} label="Ship to" />
                {order.billingAddress ? <AddressBlock address={order.billingAddress} label="Bill to" /> : null}
              </View>
            </View>

            {/* Notes */}
            {order.orderNotes ? (
              <View>
                <SectionLabel>Order Notes</SectionLabel>
                <Text style={{ fontSize: 13, color: C.slate600, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, lineHeight: 18 }}>{order.orderNotes}</Text>
              </View>
            ) : null}

            {/* Timeline */}
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
              {showCancel ? (
                <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={12} color="#dc2626" /><Text style={{ fontSize: 12, fontWeight: '700', color: '#b91c1c' }}>Confirm cancellation — stock will be restored</Text>
                  </View>
                  <TextInput value={cancelNote} onChangeText={setCancelNote} placeholder="Reason (optional)" placeholderTextColor={C.slate400} multiline
                    style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: C.slate800, minHeight: 48, textAlignVertical: 'top' }} />
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
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {nonCancelNext.map((status) => {
                    const meta = STATUS_META[status];
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
                  {canCancel ? (
                    <Pressable onPress={() => setShowCancel(true)} disabled={updating}
                      style={{ paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: updating ? 0.6 : 1 }}>
                      <XCircle size={13} color="#dc2626" /><Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626' }}>Cancel</Text>
                    </Pressable>
                  ) : null}
                  {nextStatuses.length === 0 ? (
                    <Text style={{ fontSize: 12, color: C.slate400, fontWeight: '500', paddingVertical: 8, width: '100%', textAlign: 'center' }}>No further transitions available for this order.</Text>
                  ) : null}
                </View>
              )}
            </View>
          </SafeAreaView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}