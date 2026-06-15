import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import {
  ShoppingBag, Search, RefreshCw, X, Clock, Package, CheckCircle, Truck, RotateCcw, XCircle, Eye,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { fmt } from '@/utils/adminUtils';
import { toast } from '@/utils/toast';
import { C } from '@/components/admin/editor/tokens';
import OrderDetailPanel from '@/components/admin/order/OrderDetailPanel';

const STATUS_META = {
  ALL:             { label: 'All',        icon: ShoppingBag, color: 'slate' },
  PENDING_PAYMENT: { label: 'Pending',    icon: Clock,       color: 'amber' },
  PROCESSING:      { label: 'Processing', icon: Package,     color: 'blue' },
  CONFIRMED:       { label: 'Confirmed',  icon: CheckCircle, color: 'indigo' },
  SHIPPED:         { label: 'Shipped',    icon: Truck,       color: 'violet' },
  DELIVERED:       { label: 'Delivered',  icon: CheckCircle, color: 'green' },
  RETURNED:        { label: 'Returned',   icon: RotateCcw,   color: 'orange' },
  CANCELLED:       { label: 'Cancelled',  icon: XCircle,     color: 'red' },
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

const TABS = ['ALL', 'PENDING_PAYMENT', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function relativeTime(iso) {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' });
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status, color: 'slate' };
  const c = PILL[meta.color] || PILL.slate;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: DOT[meta.color] || DOT.slate }} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: c.fg }}>{meta.label}</Text>
    </View>
  );
}

function PaymentBadge({ status }) {
  const paid = status === 'SUCCESS';
  const failed = status === 'FAILED';
  const c = paid ? PILL.green : failed ? PILL.red : PILL.amber;
  const label = paid ? 'Paid' : failed ? 'Failed' : 'Pending';
  return (
    <View style={{ backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
      <Text style={{ fontSize: 9, fontWeight: '800', color: c.fg }}>{label}</Text>
    </View>
  );
}

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const fetchOrders = useCallback(async (pg = 0, mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true); else setLoading(true);
    try {
      const params = { page: pg, size: 20, ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}) };
      const res = await api.get('/admin/orders', { params });
      const data = res.data;
      setOrders(data.content ?? data ?? []);
      setTotalPages(data.totalPages ?? 1);
      setPage(pg);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(0); }, [fetchOrders]);

  const filtered = useMemo(() => orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      (o.items || []).some((i) => i.productName?.toLowerCase().includes(q))
    );
  }), [orders, search]);

  const stats = [
    { label: 'Total', value: orders.length, color: 'slate' },
    { label: 'Pending', value: orders.filter((o) => o.orderStatus === 'PENDING_PAYMENT').length, color: 'amber' },
    { label: 'Active', value: orders.filter((o) => ['PROCESSING', 'CONFIRMED', 'SHIPPED'].includes(o.orderStatus)).length, color: 'blue' },
    { label: 'Delivered', value: orders.filter((o) => o.orderStatus === 'DELIVERED').length, color: 'green' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.slate50 }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.slate200, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={20} color={C.slate500} />
              <Text style={{ fontSize: 20, fontWeight: '800', color: C.slate900 }}>Orders</Text>
            </View>
            <Text style={{ fontSize: 12, color: C.slate400, marginTop: 2 }}>{orders.length} orders</Text>
          </View>
          <Pressable onPress={() => fetchOrders(page)} style={{ padding: 10, borderWidth: 1, borderColor: C.slate200, borderRadius: 12 }}>
            <RefreshCw size={14} color={C.slate400} />
          </Pressable>
        </View>

        {/* Status tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingTop: 14 }}>
          {TABS.map((s) => {
            const m = STATUS_META[s];
            const Icon = m.icon;
            const active = statusFilter === s;
            const count = s === 'ALL' ? orders.length : orders.filter((o) => o.orderStatus === s).length;
            return (
              <Pressable key={s} onPress={() => { setStatusFilter(s); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: active ? C.slate900 : 'transparent' }}>
                <Icon size={12} color={active ? C.slate900 : C.slate400} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: active ? C.slate900 : C.slate400 }}>{m.label}</Text>
                {count > 0 ? (
                  <View style={{ backgroundColor: active ? C.slate200 : C.slate100, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: active ? C.slate700 : C.slate400 }}>{count}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(0, 'refresh')} tintColor={C.blue600} />}
      >
        {/* Stat cards */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {stats.map((s) => {
            const c = PILL[s.color] || PILL.slate;
            return (
              <View key={s.label} style={{ flex: 1, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: c.fg }}>{s.value}</Text>
                <Text style={{ fontSize: 9, fontWeight: '600', color: c.fg, marginTop: 2, opacity: 0.8 }}>{s.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Search */}
        <View style={{ position: 'relative' }}>
          <Search size={14} color={C.slate400} style={{ position: 'absolute', left: 12, top: 13, zIndex: 1 }} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search order #, email, product…" placeholderTextColor={C.slate300} autoCapitalize="none"
            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingLeft: 36, paddingRight: 36, paddingVertical: 10, fontSize: 14, color: C.slate900 }} />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8} style={{ position: 'absolute', right: 12, top: 12 }}><X size={14} color={C.slate300} /></Pressable>
          ) : null}
        </View>

        {/* Orders list */}
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={C.slate300} /></View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ShoppingBag size={28} color={C.slate200} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.slate400, marginTop: 10 }}>{search ? `No results for "${search}"` : 'No orders yet'}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((order) => {
              const itemSummary = (order.items || []).slice(0, 2).map((i) => i.productName).join(', ');
              const more = (order.items?.length || 0) > 2 ? ` +${order.items.length - 2} more` : '';
              return (
                <Pressable key={order.id} onPress={() => setSelectedId(order.id)}
                  style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 16, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: C.slate900, fontFamily: 'monospace' }}>{order.orderNumber}</Text>
                    <StatusPill status={order.orderStatus} />
                  </View>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: C.slate600, fontWeight: '600' }}>{order.customerEmail}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 11, color: C.slate400, marginTop: 2 }}>
                    {itemSummary}{more}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.slate100 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: C.slate900 }}>₦{fmt(order.grandTotal)}</Text>
                      <PaymentBadge status={order.paymentStatus} />
                    </View>
                    <Text style={{ fontSize: 11, color: C.slate400, fontWeight: '500' }}>{relativeTime(order.createdAt)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 4 }}>
            <Pressable onPress={() => fetchOrders(page - 1)} disabled={page === 0} style={{ paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, opacity: page === 0 ? 0.4 : 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate600 }}>← Prev</Text>
            </Pressable>
            <Text style={{ fontSize: 12, color: C.slate500, fontWeight: '500' }}>Page {page + 1} of {totalPages}</Text>
            <Pressable onPress={() => fetchOrders(page + 1)} disabled={page >= totalPages - 1} style={{ paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate600 }}>Next →</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Detail panel */}
      {selectedId ? (
        <OrderDetailPanel
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChanged={(updated) => setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)))}
        />
      ) : null}
    </View>
  );
}