// utils/adminUtils.js

// ─── Number / status / string helpers ────────────────────────────────────────

export const fmt = (n) => Number(n || 0).toLocaleString('en-NG');

export const isActive = (obj) => obj?.active !== false;

export const slugify = (s) =>
  (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ─── Axios error → readable string ──────────────────────────────────────────

export const getErr = (err) => {
  if (err?.response?.data?.errors?.length > 0)
    return err.response.data.errors[0].defaultMessage;
  return err?.response?.data?.message || err?.message || 'Something went wrong';
};

// ─── Flatten category tree for picker dropdowns ─────────────────────────────
// Returns [{ label, value }] with indented labels showing hierarchy.

export const flattenTree = (nodes, depth = 0, result = []) => {
  for (const n of nodes || []) {
    result.push({
      label: `${'  '.repeat(depth)}${depth > 0 ? '↳ ' : ''}${n.name}`,
      value: n.slug || n.id,
    });
    if (n.children?.length) flattenTree(n.children, depth + 1, result);
  }
  return result;
};



export const isAdminUser = (user) => {
  if (!user) return false;

  const matches = (claim) => {
    if (typeof claim === 'string') {
      return claim === 'ROLE_ADMIN' || claim === 'ADMIN';
    }
    if (claim && typeof claim === 'object') {
      return claim.authority === 'ROLE_ADMIN'
          || claim.authority === 'ADMIN'
          || claim.name === 'ROLE_ADMIN'
          || claim.name === 'ADMIN';
    }
    return false;
  };

  const claims = user.roles ?? user.authorities;
  if (Array.isArray(claims)) return claims.some(matches);

  if (typeof user.role === 'string') {
    return user.role === 'ROLE_ADMIN' || user.role === 'ADMIN';
  }

  return false;
};

// ─── JWT payload decoder ─────────────────────────────────────────────────────
// Returns the decoded payload (sub, roles, exp, etc.) or null if malformed.
// Hermes provides atob globally.

export const decodeJwtPayload = (token) => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

// ─── Where to land after a successful login ─────────────────────────────────
// Centralized so email login, Google login, and signup all behave the same.

export const postLoginRoute = (user) => (isAdminUser(user) ? '/admin' : '/');