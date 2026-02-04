import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private translate = inject(TranslateService);

  // No need for init() anymore - APP_INITIALIZER handles it

  instant(
    key: string | string[],
    params?: Record<string, unknown>,
  ): string | unknown {
    return this.translate.instant(key, params);
  }

  get(
    key: string | string[],
    params?: Record<string, unknown>,
  ): Observable<unknown> {
    return this.translate.get(key, params);
  }

  stream(key: string | string[]): Observable<unknown> {
    return this.translate.stream(key);
  }

  use(lang: string): Observable<unknown> {
    localStorage.setItem('preferredLanguage', lang);
    return this.translate.use(lang);
  }

  get currentLang(): string | undefined {
    return (this.translate.currentLang ?? this.translate.getDefaultLang()) as
      | string
      | undefined;
  }
}
