export const environment = {
  production: false,
  // Structured API configuration for local development.
  api: {
    // Base origin for backend services (no trailing slash)
    baseUrl: 'https://localhost:7081',
    // Optional API version, used by helpers when needed
    version: 'v1',
  },
};
