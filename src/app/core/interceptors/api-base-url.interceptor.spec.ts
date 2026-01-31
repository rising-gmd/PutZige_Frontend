import {
  isAbsoluteUrl,
  isFrontendAsset,
  buildApiUrl,
} from './api-base-url.interceptor';

describe('apiBaseUrl helpers', () => {
  it('isAbsoluteUrl recognizes http urls', () => {
    expect(isAbsoluteUrl('http://example.com')).toBe(true);
    expect(isAbsoluteUrl('https://x')).toBe(true);
    expect(isAbsoluteUrl('/relative')).toBe(false);
  });

  it('isFrontendAsset recognizes assets paths', () => {
    expect(isFrontendAsset('/assets/img.png')).toBe(true);
    expect(isFrontendAsset('/i18n/en.json')).toBe(true);
    expect(isFrontendAsset('/api/users')).toBe(false);
  });

  it('buildApiUrl does not double-prefix when already contains /api/', () => {
    const cfg = {
      baseUrl: 'https://api.local/',
      apiPrefix: '/api/v2',
      version: 'v2',
    } as any;
    expect(buildApiUrl('/api/users', cfg)).toBe('https://api.local/api/users');
  });

  it('buildApiUrl prepends base and prefix for normal path', () => {
    const cfg = {
      baseUrl: 'https://api.local',
      apiPrefix: '/api/v2',
      version: 'v2',
    } as any;
    expect(buildApiUrl('/users', cfg)).toBe('https://api.local/api/v2/users');
  });
});
