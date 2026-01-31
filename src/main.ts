import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { I18nService } from './app/core/services/i18n/i18n.service';

bootstrapApplication(App, appConfig)
  .then((appRef) => {
    try {
      const i18n = appRef.injector.get(I18nService);
      i18n.init();
    } catch {
      // noop if service not available during early bootstrap
    }
  })
  .catch((err) => console.error(err));
