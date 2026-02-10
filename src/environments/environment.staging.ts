export const environment = {
  production: false,

  // Staging API configuration
  api: {
    baseUrl: 'https://staging-api.example.com',
    version: 'v1',
    timeout: 30000,
  },

  // Feature flags
  features: {
    enableAnalytics: true,
    enableDebugMode: true,
  },
};
