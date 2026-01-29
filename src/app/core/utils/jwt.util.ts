export function decodeJwt(token: string): unknown {
  // Dummy decode for placeholder
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
