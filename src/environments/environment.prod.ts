export const environment = {
  production: true,

  // API Configuration
  api: {
    // Production backend URL
    baseUrl: 'https://api.yourapp.com',

    // API version
    version: 'v1',

    // Request timeout (30 seconds)
    timeout: 30000,
  },

  // Feature flags
  features: {
    enableAnalytics: true,
    enableDebugMode: false,
  },
};
