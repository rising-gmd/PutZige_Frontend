import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
  LOCALE_ID,
  APP_INITIALIZER,
} from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { chatFeature } from './store/chat/chat.reducer';
import { messagesFeature } from './store/messages/messages.reducer';
import { presenceFeature } from './store/presence/presence.reducer';
import { ChatEffects } from './store/chat/chat.effects';
import { MessagesEffects } from './store/messages/messages.effects';
import { PresenceEffects } from './store/presence/presence.effects';
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
import { STORAGE_KEYS } from './core/constants/storage-keys.constants';
import { I18N_CONFIG } from './core/constants/i18n.constants';
import { NGRX_DEVTOOLS_CONFIG } from './core/constants/app.constants';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { MessageService } from 'primeng/api';
import { AuthService } from './core/services/auth/auth.service';

export function initializeApp(
  translate: TranslateService,
  authService: AuthService,
): () => Promise<void> {
  return async () => {
    // Initialize auth state by asking the backend (/auth/me)
    await firstValueFrom(authService.checkAuthStatus());

    const savedLang =
      localStorage.getItem(STORAGE_KEYS.LANGUAGE) || I18N_CONFIG.DEFAULT_LANG;

    translate.setFallbackLang(I18N_CONFIG.DEFAULT_LANG);

    translate.addLangs([...I18N_CONFIG.SUPPORTED_LANGS]);

    return firstValueFrom(translate.use(savedLang))
      .then(() => {
        return;
      })

      .catch((err) => {
        console.error('Failed to load translations:', err);
        return firstValueFrom(translate.use(I18N_CONFIG.DEFAULT_LANG)).then(
          () => undefined,
        );
      });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        apiBaseUrlInterceptor,
        authInterceptor,
        errorInterceptor,
      ]),
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
    // ── NgRx Store ───────────────────────────────────────────────────────────
    provideStore({
      [chatFeature.name]: chatFeature.reducer,
      [messagesFeature.name]: messagesFeature.reducer,
      [presenceFeature.name]: presenceFeature.reducer,
    }),
    provideEffects([ChatEffects, MessagesEffects, PresenceEffects]),
    provideStoreDevtools({
      maxAge: NGRX_DEVTOOLS_CONFIG.MAX_AGE,
      logOnly: !isDevMode(), // Restrict extension to only logging in production.
      connectInZone: true,
    }),
    // ngx-translate configuration
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: I18N_CONFIG.DEFAULT_LANG,
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
    ),
    // APP_INITIALIZER - Preload translations and restore auth state before app starts
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [TranslateService, AuthService],
      multi: true,
    },
    {
      provide: LOCALE_ID,
      useFactory: (translate: TranslateService) =>
        translate.currentLang || I18N_CONFIG.DEFAULT_LANG,
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
      http.get<Record<string, string>>(
        `${I18N_CONFIG.ASSETS_PATH}/${lang}.json`,
      ),
  } as TranslateLoader;
}
