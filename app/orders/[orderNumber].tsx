import { useEffect, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import {
  ChevronLeft, Package, MapPin, Clock, CheckCircle, Truck, XCircle,
  RefreshCw, ShoppingBag, Receipt, AlertCircle, CreditCard,
} from 'lucide-react-native';
import api from '@/services/axiosConfig';
import { toast } from '@/utils/toast';

const parseSpringDate = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, min = 0, sec = 0] = value;
    return new Date(year, month - 1, day, hour, min, sec);
  }
  return new Date(value);
};

const formatDate = (value, opts = {}) => {
  const date = parseSpringDate(value);
  if (!date || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    ...opts,
  });
};

const STATUS_CONFIG = {
  PENDING_PAYMENT: { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa', label: 'Pending Payment',  step: 0, Icon: Clock },
  PROCESSING:      { bg: '#dbeafe', fg: '#1d4ed8', border: '#bfdbfe', label: 'Processing',        step: 1, Icon: Package },
  CONFIRMED:       { bg: '#e0e7ff', fg: '#4338ca', border: '#c7d2fe', label: 'Confirmed',         step: 2, Icon: CheckCircle },
  SHIPPED:         { bg: '#f3e8ff', fg: '#6d28d9', border: '#e9d5ff', label: 'Shipped',           step: 3, Icon: Truck },
  DELIVERED:       { bg: '#dcfce7', fg: '#15803d', border: '#bbf7d0', label: 'Delivered',         step: 4, Icon: CheckCircle },
  RETURNED:        { bg: '#fef9c3', fg: '#a16207', border: '#fef08a', label: 'Returned',          step: -1, Icon: RefreshCw },
  CANCELLED:       { bg: '#fee2e2', fg: '#b91c1c', border: '#fecaca', label: 'Cancelled',         step: -1, Icon: XCircle },
};

const PAYMENT_STATUS = {
  PENDING: { color: '#ea580c', text: 'Awaiting Payment' },
  SUCCESS: { color: '#16a34a', text: 'Paid' },
  FAILED:  { color: '#dc2626', text: 'Failed' },
};

const STEPS = ['Placed', 'Processing', 'Confirmed', 'Shipped', 'Delivered'];

function ProgressBar({ status }) {
  const cfg = STATUS_CONFIG[status];
  const currentStep = cfg?.step ?? 0;
  const isCancelled = status === 'CANCELLED' || status === 'RETURNED';

  if (isCancelled) return null;

  return (
    <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
      <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
        Order Progress
      </Text>
      <View className="flex-row items-start justify-between relative">
        {/* Track lines positioned behind dots */}
        <View
          className="absolute h-0.5 bg-gray-200"
          style={{ top: 14, left: 14, right: 14 }}
        />
        <View
          className="absolute h-0.5 bg-green-500"
          style={{
            top: 14,
            left: 14,
            width: `${Math.max(0, (currentStep / (STEPS.length - 1)) * 100)}%`,
          }}
        />

        {STEPS.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <View key={label} className="items-center flex-1">
              <View
                className={`w-7 h-7 rounded-full items-center justify-center border-2
                  ${done ? 'bg-green-500 border-green-500' : ''}
                  ${active ? 'bg-white border-blue-600' : ''}
                  ${!done && !active ? 'bg-white border-gray-200' : ''}`}
              >
                {done ? (
                  <CheckCircle size={12} color="#fff" />
                ) : (
                  <Text
                    className={`text-[10px] font-black
                      ${active ? 'text-blue-600' : 'text-gray-300'}`}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                className={`text-[9px] font-bold mt-1.5 text-center
                  ${done ? 'text-green-600' : ''}
                  ${active ? 'text-blue-600' : ''}
                  ${!done && !active ? 'text-gray-400' : ''}`}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { orderNumber } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/v1/orders/${orderNumber}`);
        setOrder(res.data);
      } catch (err) {
        setError(err.response?.status === 404
          ? 'Order not found.'
          : 'Could not load order details.');
      } finally {
        setLoading(false);
      }
    };
    if (orderNumber) fetchOrder();
  }, [orderNumber]);

  const handleRetryPayment = async () => {
    setRetrying(true);
    try {
      const returnUrl = ExpoLinking.createURL('payment-callback');
      const res = await api.post(`/v1/payments/retry/${order.id}`, { returnUrl });
      const retryUrl = res.data?.checkoutUrl;
      if (retryUrl) {
        await WebBrowser.openAuthSessionAsync(retryUrl, returnUrl);
        router.replace({
          pathname: '/payment-callback',
          params: { paymentReference: order.id },
        });
      } else {
        toast.error('Could not initialize payment.');
      }
    } catch {
      toast.error('Could not initialize payment.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between px-2 h-14 border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-base font-black text-gray-900 tracking-tight">
            Order Details
          </Text>
          <View className="w-10" />
        </View>
      </SafeAreaView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Package size={36} color="#D1D5DB" />
          <Text className="text-sm font-bold text-gray-500 mt-3">
            Loading order details...
          </Text>
        </View>
      ) : error || !order ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
            <AlertCircle size={28} color="#ef4444" />
          </View>
          <Text className="text-lg font-black text-gray-900 mb-4 text-center">
            {error || 'Order not found'}
          </Text>
          <Pressable
            onPress={() => router.replace('/orders')}
            className="bg-gray-900 px-5 py-2.5 rounded-xl"
          >
            <Text className="text-white text-sm font-bold">Back to Orders</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        >
          {/* Order header card */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
            <Text className="text-xl font-black text-gray-900 tracking-tight">
              {order.orderNumber}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              Placed on {formatDate(order.createdAt, { hour: undefined, minute: undefined })}
            </Text>
            {(() => {
              const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PROCESSING;
              const StatusIcon = cfg.Icon;
              return (
                <View
                  className="flex-row items-center gap-1.5 self-start px-3 py-1.5 rounded-lg border mt-3"
                  style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                >
                  <StatusIcon size={14} color={cfg.fg} />
                  <Text className="text-xs font-bold" style={{ color: cfg.fg }}>
                    {cfg.label}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* Progress bar */}
          <ProgressBar status={order.orderStatus} />

          {/* Retry payment (pending only) */}
          {order.orderStatus === 'PENDING_PAYMENT' && (
            <Pressable
              onPress={handleRetryPayment}
              disabled={retrying}
              className={`bg-green-600 rounded-2xl py-4 flex-row items-center justify-center gap-2 mb-4
                ${retrying ? 'opacity-50' : ''}`}
            >
              {retrying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CreditCard size={16} color="#fff" />
                  <Text className="text-white font-bold text-sm">Complete Payment</Text>
                </>
              )}
            </Pressable>
          )}

          {/* Items */}
          <View className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
            <View className="flex-row items-center gap-2 px-4 py-3 border-b border-gray-100">
              <ShoppingBag size={14} color="#6B7280" />
              <Text className="text-sm font-black text-gray-900">Order Items</Text>
              <Text className="text-xs text-gray-400 ml-auto">
                {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
              </Text>
            </View>
            {order.items?.map((item, i) => (
              <View
                key={`${item.variantId || item.productId}-${i}`}
                className={`px-4 py-3 flex-row items-start gap-3
                  ${i < order.items.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <View className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Package size={20} color="#D1D5DB" />
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900" numberOfLines={2}>
                    {item.productName}
                  </Text>
                  {item.sku && (
                    <Text className="text-[10px] text-gray-400 mt-0.5">SKU: {item.sku}</Text>
                  )}
                  {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
                    <View className="flex-row flex-wrap gap-1 mt-1.5">
                      {Object.entries(item.variantAttributes).map(([k, v]) => (
                        <View
                          key={k}
                          className="bg-gray-100 px-1.5 py-0.5 rounded"
                        >
                          <Text className="text-[10px] font-medium text-gray-600">
                            {k}: {v}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-black text-gray-900">
                    ₦{Number(item.subTotal ?? (item.unitPrice * item.quantity) ?? 0).toLocaleString()}
                  </Text>
                  <Text className="text-[10px] text-gray-400 mt-0.5">
                    ₦{Number(item.unitPrice ?? 0).toLocaleString()} each
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Payment summary */}
          <View className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
            <View className="flex-row items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Receipt size={14} color="#6B7280" />
              <Text className="text-sm font-black text-gray-900">Payment</Text>
            </View>
            <View className="px-4 py-3 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Subtotal</Text>
                <Text className="text-sm text-gray-900">
                  ₦{Number(order.itemSubTotal ?? 0).toLocaleString()}
                </Text>
              </View>
              {Number(order.taxAmount) > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">VAT</Text>
                  <Text className="text-sm text-gray-900">
                    ₦{Number(order.taxAmount).toLocaleString()}
                  </Text>
                </View>
              )}
              {Number(order.shippingFee) > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Shipping</Text>
                  <Text className="text-sm text-gray-900">
                    ₦{Number(order.shippingFee).toLocaleString()}
                  </Text>
                </View>
              )}
              {Number(order.discountAmount) > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-green-600">Discount</Text>
                  <Text className="text-sm text-green-600">
                    −₦{Number(order.discountAmount).toLocaleString()}
                  </Text>
                </View>
              )}
              <View className="border-t border-gray-100 pt-2 mt-1 flex-row justify-between">
                <Text className="text-sm font-black text-gray-900">Total</Text>
                <Text className="text-sm font-black text-gray-900">
                  ₦{Number(order.totalAmount ?? order.grandTotal ?? 0).toLocaleString()}
                </Text>
              </View>

              {(() => {
                const pc = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.PENDING;
                return (
                  <View className="flex-row justify-between pt-2 border-t border-gray-100 mt-1">
                    <Text className="text-xs text-gray-500">Status</Text>
                    <Text className="text-xs font-bold" style={{ color: pc.color }}>
                      {pc.text}
                    </Text>
                  </View>
                );
              })()}

              {order.paymentMethod && (
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-500">Method</Text>
                  <Text className="text-xs font-bold text-gray-700 uppercase">
                    {order.paymentMethod.replace('_', ' ')}
                  </Text>
                </View>
              )}

              {order.paymentReference && (
                <View className="bg-gray-50 rounded-lg p-2.5 mt-2">
                  <Text className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                    Reference
                  </Text>
                  <Text className="text-xs font-mono text-gray-700">{order.paymentReference}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Delivery address */}
          {order.shippingAddress && (
            <View className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
              <View className="flex-row items-center gap-2 px-4 py-3 border-b border-gray-100">
                <MapPin size={14} color="#6B7280" />
                <Text className="text-sm font-black text-gray-900">Delivery Address</Text>
              </View>
              <View className="px-4 py-3 gap-0.5">
                {order.shippingAddress.phoneNumber && (
                  <Text className="text-sm font-bold text-gray-900">
                    {order.shippingAddress.phoneNumber}
                  </Text>
                )}
                <Text className="text-sm text-gray-600">{order.shippingAddress.streetAddress}</Text>
                <Text className="text-sm text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </Text>
                <Text className="text-xs text-gray-400">{order.shippingAddress.country}</Text>
              </View>
            </View>
          )}

          {/* Tracking */}
          {(order.courierName || order.trackingNumber) && (
            <View className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
              <View className="flex-row items-center gap-2 px-4 py-3 border-b border-gray-100">
                <Truck size={14} color="#6B7280" />
                <Text className="text-sm font-black text-gray-900">Tracking</Text>
              </View>
              <View className="px-4 py-3 gap-2">
                {order.courierName && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-500">Courier</Text>
                    <Text className="text-sm font-bold text-gray-900">{order.courierName}</Text>
                  </View>
                )}
                {order.trackingNumber && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-500">Tracking #</Text>
                    <Text className="text-xs font-mono font-bold text-gray-900">
                      {order.trackingNumber}
                    </Text>
                  </View>
                )}
                {order.trackingUrl && (
                  <Pressable
                    onPress={() => Linking.openURL(order.trackingUrl)}
                    className="mt-1 items-center"
                  >
                    <Text className="text-xs font-bold text-blue-600">Track Package →</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <View className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
              <View className="flex-row items-center gap-2 px-4 py-3 border-b border-gray-100">
                <Clock size={14} color="#6B7280" />
                <Text className="text-sm font-black text-gray-900">Order Timeline</Text>
              </View>
              <View className="px-4 py-3 gap-3">
                {[...order.statusHistory].reverse().map((h, i) => {
                  const cfg = STATUS_CONFIG[h.status];
                  const HIcon = cfg?.Icon || Package;
                  return (
                    <View key={i} className="flex-row items-start gap-3">
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center border"
                        style={{
                          backgroundColor: cfg?.bg || '#f3f4f6',
                          borderColor: cfg?.border || '#e5e7eb',
                        }}
                      >
                        <HIcon size={12} color={cfg?.fg || '#6B7280'} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-900">
                          {cfg?.label || h.status}
                        </Text>
                        {h.note && (
                          <Text className="text-xs text-gray-500 mt-0.5">{h.note}</Text>
                        )}
                      </View>
                      <Text className="text-[10px] text-gray-400">
                        {formatDate(h.timestamp)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Help */}
          <View className="bg-gray-900 rounded-2xl p-5 items-center">
            <CreditCard size={20} color="#9CA3AF" />
            <Text className="text-white font-bold text-sm mt-2">Need help?</Text>
            <Text className="text-gray-400 text-xs mt-1 mb-3">Questions about your order?</Text>
            <Pressable onPress={() => Linking.openURL('mailto:support@exploreaba.ng')}>
              <Text className="text-xs font-bold text-green-400">
                support@exploreaba.ng
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}