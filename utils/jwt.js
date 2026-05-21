/**
 * Decode a JWT payload and check if the user has ROLE_ADMIN.
 * Works in Hermes — atob is available globally in RN 0.71+.
 */
export const getRolesFromToken = (token) => {
  try {
    const payload = token.split('.')[1];
    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(base64));
    const roles = decoded.roles || decoded.authorities || decoded.role || [];

    if (Array.isArray(roles)) {
      return roles.some(
        (r) =>
          r === 'ROLE_ADMIN' ||
          r.name === 'ROLE_ADMIN' ||
          r.authority === 'ROLE_ADMIN'
      );
    }
    return roles === 'ROLE_ADMIN';
  } catch {
    return false;
  }
};