export function decodeJwt(token: string): unknown {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
