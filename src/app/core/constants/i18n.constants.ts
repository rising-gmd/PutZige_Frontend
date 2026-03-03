/**
 * i18n / localisation constants.
 *
 * Single source of truth for language codes and asset paths so that
 * `app.config.ts`, initialise functions, and any future locale-switcher
 * component all agree on the same values.
 */
export const I18N_CONFIG = {
  /** BCP-47 tag for the application default / fallback locale. */
  DEFAULT_LANG: 'en',

  /**
   * Every locale the app ships translations for.
   * Adding a new language: add the BCP-47 tag here AND drop the matching
   * `<lang>.json` file in `src/assets/i18n/`.
   */
  SUPPORTED_LANGS: ['en', 'es', 'de'] as const,

  /**
   * Relative path (from `index.html`) to the directory that contains
   * `<lang>.json` translation files loaded by `HttpLoaderFactory`.
   */
  ASSETS_PATH: './assets/i18n',
} as const;

export type SupportedLang = (typeof I18N_CONFIG.SUPPORTED_LANGS)[number];
