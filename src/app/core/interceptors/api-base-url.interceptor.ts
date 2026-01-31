import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_CONFIG } from '../config/api.config';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiConfig = inject(API_CONFIG);

  const rawUrl = req.url;

  // Leave absolute and protocol-relative URLs untouched
  if (rawUrl.startsWith('http') || rawUrl.startsWith('//')) {
    return next(req);
  }

  // Ignore loader/asset relative URLs (e.g. './assets/...') and parent-relative paths
  if (rawUrl.startsWith('./') || rawUrl.startsWith('../')) {
    return next(req);
  }

  // Only prepend base URL for root-relative API calls (e.g. '/users', '/auth/...').
  // Skip frontend assets to avoid CORS and 404s (e.g. '/assets/...').
  if (rawUrl.startsWith('/') && !rawUrl.startsWith('/assets')) {
    const base = apiConfig.baseUrl.replace(/\/$/, '');
    const url = `${base}${rawUrl}`;
    const apiReq = req.clone({ url });
    return next(apiReq);
  }

  return next(req);
};
