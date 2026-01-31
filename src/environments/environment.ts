export const environment = {
  production: false,

  // API Configuration
  api: {
    // Backend base URL (no trailing slash, no /api prefix)
    baseUrl: 'https://localhost:7081',

    // API version (used to construct /api/v1 prefix)
    version: 'v1',

    // Optional: Override auto-constructed prefix
    // apiPrefix: '/api/v1', // Uncomment to manually set

    // Request timeout (30 seconds)
    timeout: 30000,
  },

  // Feature flags
  features: {
    enableAnalytics: false,
    enableDebugMode: true,
  },
};
