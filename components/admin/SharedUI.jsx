// components/admin/SharedUI.jsx
import { View, Text } from 'react-native';

const SLATE_800 = '#1e293b';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const RED_400 = '#f87171';

// ─── Field: label + hint + children ──────────────────────────────────────────

export const Field = ({ label, hint, required, children }) => (
  <View>
    {label && (
      <View style={{ marginBottom: 6 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: SLATE_500,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
          {required && <Text style={{ color: RED_400 }}> *</Text>}
        </Text>
        {hint && (
          <Text style={{ fontSize: 10, color: SLATE_400, marginTop: 2, lineHeight: 14 }}>
            {hint}
          </Text>
        )}
      </View>
    )}
    {children}
  </View>
);

// ─── Card: white surface with border + soft shadow ───────────────────────────

export const Card = ({ children, style }) => (
  <View
    style={[
      {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
        overflow: 'hidden',
      },
      style,
    ]}
  >
    {children}
  </View>
);

// ─── CardHeader: title + optional subtitle + optional right-aligned action ───

export const CardHeader = ({ children, action, subtitle }) => (
  <View
    style={{
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderColor: SLATE_100,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}
  >
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: SLATE_800 }}>{children}</Text>
      {subtitle && (
        <Text style={{ fontSize: 11, color: SLATE_400, marginTop: 2 }}>{subtitle}</Text>
      )}
    </View>
    {action && <View style={{ flexShrink: 0 }}>{action}</View>}
  </View>
);

// ─── CardBody: padded content area ───────────────────────────────────────────

export const CardBody = ({ children, style }) => (
  <View style={[{ padding: 20 }, style]}>{children}</View>
);

// ─── Divider: horizontal line with optional centered label ──────────────────

export const Divider = ({ label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 }}>
    <View style={{ flex: 1, height: 1, backgroundColor: SLATE_100 }} />
    {label && (
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: SLATE_400,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    )}
    <View style={{ flex: 1, height: 1, backgroundColor: SLATE_100 }} />
  </View>
);

// ─── Badge: small colored pill ──────────────────────────────────────────────

export const Badge = ({ color = 'slate', children }) => {
  const palette = {
    green: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    red:   { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    amber: { bg: '#fffbeb', text: '#a16207', border: '#fde68a' },
    blue:  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    slate: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
  };
  const c = palette[color] || palette.slate;
  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '700', color: c.text }}>{children}</Text>
    </View>
  );
};

// ─── Shared TextInput style ──────────────────────────────────────────────────
// Use as: <TextInput style={adminInputStyle} placeholderTextColor={ADMIN_PLACEHOLDER_COLOR} />

export const adminInputStyle = {
  width: '100%',
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: SLATE_200,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 10,
  fontSize: 14,
  fontWeight: '500',
  color: SLATE_800,
};

export const ADMIN_PLACEHOLDER_COLOR = '#cbd5e1';