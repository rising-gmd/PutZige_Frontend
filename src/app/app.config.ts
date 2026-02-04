import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
  LOCALE_ID,
  APP_INITIALIZER,
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
import { Observable, firstValueFrom } from 'rxjs';

import { providePrimeNG } from 'primeng/config';
import MyPreset from './theme/my-preset';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { API_CONFIG } from './core/config/api.config';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { MessageService } from 'primeng/api';

export function initializeApp(
  translate: TranslateService,
): () => Promise<void> {
  return () => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';

    translate.setFallbackLang('en');

    translate.addLangs(['en', 'es', 'de']);

    return firstValueFrom(translate.use(savedLang))
      .then(() => {
        console.log('Translations loaded successfully');
        return;
      })

      .catch((err) => {
        console.error('Failed to load translations:', err);
        return firstValueFrom(translate.use('en')).then(() => undefined);
      });
  };
}

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
          darkModeSelector: '.my-app-dark',
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
    // APP_INITIALIZER - Preload translations before app starts
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [TranslateService],
      multi: true,
    },
    {
      provide: LOCALE_ID,
      useFactory: (translate: TranslateService) =>
        translate.currentLang || 'en',
      deps: [TranslateService],
    },
    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: environment.api.baseUrl,
        version: environment.api.version,
        timeout: environment.api.timeout,
        production: environment.production,
      },
    },
    MessageService,
  ],
};

export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  return {
    getTranslation: (lang: string): Observable<Record<string, string>> =>
      http.get<Record<string, string>>(`./assets/i18n/${lang}.json`),
  } as TranslateLoader;
}
