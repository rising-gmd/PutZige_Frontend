import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
  LOCALE_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from '@angular/common/http';
import {
  TranslateModule,
  TranslateLoader,
  TranslateService,
} from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { providePrimeNG } from 'primeng/config';
import MyPreset from './theme/my-preset';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { API_CONFIG } from './core/config/api.config';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([apiBaseUrlInterceptor, errorInterceptor]),
    ),
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
    // ngx-translate configuration
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
    ),
    // Provide LOCALE_ID from the active TranslateService language
    {
      provide: LOCALE_ID,
      useFactory: (translate: TranslateService) =>
        translate.currentLang || 'en',
      deps: [TranslateService],
    },
    // API configuration provider (environment-aware)
    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: environment.api.baseUrl,
        version: environment.api.version,
        timeout: environment.api.timeout,
        production: environment.production,
      },
    },
    // PrimeNG MessageService used by NotificationService
    MessageService,
  ],
};

export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  return {
    getTranslation: (lang: string): Observable<Record<string, string>> =>
      http.get<Record<string, string>>(`./assets/i18n/${lang}.json`),
  } as TranslateLoader;
}
