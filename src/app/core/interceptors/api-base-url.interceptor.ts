import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_CONFIG, ApiConfig } from '../config/api.config';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiConfig = inject(API_CONFIG) as ApiConfig;

  const url = req.url;

  // ==================== Skip Conditions ====================

  // 1. Absolute URLs (external APIs, CDNs)
  if (isAbsoluteUrl(url)) {
    return next(req);
  }

  // 2. Protocol-relative URLs (//cdn.example.com)
  if (url.startsWith('//')) {
    return next(req);
  }

  // 3. Relative file paths (./assets, ../config)
  if (url.startsWith('./') || url.startsWith('../')) {
    return next(req);
  }

  // 4. Frontend static assets
  if (isFrontendAsset(url)) {
    return next(req);
  }

  // ==================== Transform API URLs ====================

  // Only transform root-relative API calls
  if (url.startsWith('/')) {
    const transformedUrl = buildApiUrl(url, apiConfig);
    return next(req.clone({ url: transformedUrl }));
  }

  // Unknown pattern - log and pass through
  console.warn('[apiBaseUrlInterceptor] Unhandled URL pattern:', url);

  return next(req);
};

// ==================== Helper Functions ====================

/**
 * Check if URL is absolute (http://, https://, ftp://, etc.)
 */
function isAbsoluteUrl(url: string): boolean {
  return /^[a-z][a-z\d+\-.]*:/i.test(url);
}

/**
 * Check if URL points to frontend static assets
 */
function isFrontendAsset(url: string): boolean {
  const assetPaths = ['/assets/', '/i18n/', '/locales/', '/fonts/', '/images/'];

  return assetPaths.some((path) => url.startsWith(path));
}

function buildApiUrl(
  relativePath: string,
  config: EnvironmentApiConfig,
): string {
  // Remove trailing slash from base URL
  const base = config.baseUrl.replace(/\/$/, '');

  // Build API prefix (/api/v1)
  const apiPrefix = config.apiPrefix || `/api/${config.version || 'v1'}`;

  // Edge case: Request already includes /api prefix - don't double-prefix
  if (relativePath.startsWith('/api/')) {
    return `${base}${relativePath}`;
  }

  // Normal case: Prepend base + API prefix
  // Input: '/users' → 'https://localhost:7081/api/v1/users'
  return `${base}${apiPrefix}${relativePath}`;
}
