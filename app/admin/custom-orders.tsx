import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Scissors, Search, RefreshCw, X, Clock, CheckCircle, Truck, XCircle, Package,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { fmt } from '@/utils/adminUtils';
import { toast } from '@/utils/toast';
import { C } from '@/components/admin/editor/tokens';
import CustomOrderDetailPanel from '@/components/admin/order/CustomOrderDetailPanel';

const STATUS_META = {
  ALL:           { label: 'All',           icon: Scissors,    color: 'slate' },
  SUBMITTED:     { label: 'Submitted',     icon: Clock,       color: 'amber' },
  QUOTED:        { label: 'Quoted',        icon: CheckCircle, color: 'blue' },
  DEPOSIT_PAID:  { label: 'Deposit Paid',  icon: CheckCircle, color: 'indigo' },
  IN_PRODUCTION: { label: 'In Production', icon: Package,     color: 'violet' },
  READY:         { label: 'Ready',         icon: CheckCircle, color: 'green' },
  SHIPPED:       { label: 'Shipped',       icon: Truck,       color: 'teal' },
  DELIVERED:     { label: 'Delivered',     icon: CheckCircle, color: 'green' },
  COMPLETED:     { label: 'Completed',     icon: CheckCircle, color: 'green' },
  CANCELLED:     { label: 'Cancelled',     icon: XCircle,     color: 'red' },
  REJECTED:      { label: 'Rejected',      icon: XCircle,     color: 'red' },
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

const TABS = ['ALL', 'SUBMITTED', 'QUOTED', 'DEPOSIT_PAID', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

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

function Thumbs({ urls = [] }) {
  const imgs = (urls || []).slice(0, 3);
  if (imgs.length === 0) {
    return <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: C.slate100, borderWidth: 1, borderColor: C.slate200, alignItems: 'center', justifyContent: 'center' }}><Scissors size={12} color={C.slate300} /></View>;
  }
  return (
    <View style={{ flexDirection: 'row' }}>
      {imgs.map((url, i) => (
        <View key={i} style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#fff', backgroundColor: C.slate100, marginLeft: i === 0 ? 0 : -8 }}>
          <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>
      ))}
    </View>
  );
}

export default function AdminCustomOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRef, setSelectedRef] = useState(null);

  const fetchOrders = useCallback(async (pg = 0, mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true); else setLoading(true);
    try {
      const params = { page: pg, size: 20, sort: 'createdAt,desc', ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}) };
      const res = await api.get('/v1/custom-orders', { params });
      const data = res.data;
      setOrders(data.content ?? data ?? []);
      setTotalPages(data.totalPages ?? 1);
      setPage(pg);
    } catch {
      toast.error('Failed to load custom orders');
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
      o.referenceNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.whatsappNumber?.toLowerCase().includes(q) ||
      o.categoryName?.toLowerCase().includes(q)
    );
  }), [orders, search]);

  const stats = [
    { label: 'Total', value: orders.length, color: 'slate' },
    { label: 'Submitted', value: orders.filter((o) => o.status === 'SUBMITTED').length, color: 'amber' },
    { label: 'Quoted', value: orders.filter((o) => o.status === 'QUOTED').length, color: 'blue' },
    { label: 'Production', value: orders.filter((o) => o.status === 'IN_PRODUCTION').length, color: 'violet' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.slate50 }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.slate200, paddingHorizontal: 16, paddingTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Scissors size={20} color={C.slate500} />
              <Text style={{ fontSize: 20, fontWeight: '800', color: C.slate900 }}>Custom Orders</Text>
            </View>
            <Text style={{ fontSize: 12, color: C.slate400, marginTop: 2 }}>{orders.length} made-to-measure orders</Text>
          </View>
          <Pressable onPress={() => fetchOrders(page)} style={{ padding: 10, borderWidth: 1, borderColor: C.slate200, borderRadius: 12 }}>
            <RefreshCw size={14} color={C.slate400} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingTop: 14 }}>
          {TABS.map((s) => {
            const m = STATUS_META[s];
            const Icon = m.icon;
            const active = statusFilter === s;
            const count = s === 'ALL' ? orders.length : orders.filter((o) => o.status === s).length;
            return (
              <Pressable key={s} onPress={() => setStatusFilter(s)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: active ? C.slate900 : 'transparent' }}>
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
              <View key={s.label} style={{ flex: 1, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: c.fg }}>{s.value}</Text>
                <Text style={{ fontSize: 9, fontWeight: '600', color: c.fg, marginTop: 2, opacity: 0.8 }}>{s.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Search */}
        <View style={{ position: 'relative' }}>
          <Search size={14} color={C.slate400} style={{ position: 'absolute', left: 12, top: 13, zIndex: 1 }} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search ref, name, email, WhatsApp, garment…" placeholderTextColor={C.slate300} autoCapitalize="none"
            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingLeft: 36, paddingRight: 36, paddingVertical: 10, fontSize: 14, color: C.slate900 }} />
          {search ? <Pressable onPress={() => setSearch('')} hitSlop={8} style={{ position: 'absolute', right: 12, top: 12 }}><X size={14} color={C.slate300} /></Pressable> : null}
        </View>

        {/* List */}
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={C.slate300} /></View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Scissors size={28} color={C.slate200} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.slate400, marginTop: 10 }}>{search ? `No results for "${search}"` : 'No custom orders yet'}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((order) => (
              <Pressable key={order.referenceNumber} onPress={() => setSelectedRef(order.referenceNumber)}
                style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.slate200, borderRadius: 16, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: C.slate900, fontFamily: 'monospace' }}>{order.referenceNumber}</Text>
                    <Text style={{ fontSize: 10, color: C.slate400, textTransform: 'capitalize', marginTop: 1 }}>{order.gender?.toLowerCase()}</Text>
                  </View>
                  <StatusPill status={order.status} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Thumbs urls={order.referenceImageUrls} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.slate800 }}>{order.categoryName}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 12, color: C.slate600, marginTop: 1 }}>{order.customerName}</Text>
                    {order.whatsappNumber ? <Text style={{ fontSize: 10, color: C.slate400, fontFamily: 'monospace', marginTop: 1 }}>{order.whatsappNumber}</Text> : null}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.slate100 }}>
                  {order.quotedAmount ? (
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: C.slate900 }}>₦{fmt(order.quotedAmount)}</Text>
                      <Text style={{ fontSize: 9, color: C.slate400, marginTop: 1 }}>{order.depositPaid ? '✓ Deposit paid' : 'Deposit pending'}</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12, color: C.slate300 }}>Not quoted yet</Text>
                  )}
                  <Text style={{ fontSize: 11, color: C.slate400, fontWeight: '500' }}>{relativeTime(order.createdAt)}</Text>
                </View>
              </Pressable>
            ))}
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
      {selectedRef ? (
        <CustomOrderDetailPanel
          referenceNumber={selectedRef}
          onClose={() => setSelectedRef(null)}
          onChanged={(ref, data) => setOrders((prev) => prev.map((o) => (o.referenceNumber === ref ? { ...o, ...data } : o)))}
        />
      ) : null}
    </View>
  );
}