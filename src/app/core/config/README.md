# API Configuration

This folder contains a type-safe, environment-aware API configuration used across the app.

Migration steps (short):

1. Search for hardcoded URLs:
   - `grep -r "http://" src/app || true`
   - `grep -r "https://" src/app || true`
2. Move base origins to `src/environments/*` `api.baseUrl`.
3. Add endpoint paths to `API_ENDPOINTS` in this folder.
4. Update services to use relative `API_ENDPOINTS` and rely on the `apiBaseUrlInterceptor`.
5. Do not use `ApiUrlService`, `BaseApiService`, or `buildUrl` — the interceptor is the single place that applies the base URL.

Security: avoid committing private production endpoints; use CI overrides or secret management for real production baseUrls.
