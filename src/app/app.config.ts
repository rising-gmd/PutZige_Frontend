import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';
import MyPreset from './theme/my-preset';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          // enable toggleable dark mode via a root class
          darkModeSelector: '.my-app-dark',
          // wrap PrimeNG styles in a CSS layer for predictable overrides
          cssLayer: {
            name: 'primeng',
            order: 'app-styles, primeng',
          },
        },
      },
    }),
  ],
};
