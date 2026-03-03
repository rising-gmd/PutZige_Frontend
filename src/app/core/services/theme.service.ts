/**
 * ThemeService — runtime colour-palette switching for PrimeNG 21.
 *
 * Why this exists:
 *  PrimeNG's design token system lets us call `updatePreset()` at runtime to
 *  swap the primary colour scale without a page reload. We expose 6 curated
 *  presets that cover the most common brand colour families and persist the
 *  user's choice to localStorage so it survives refreshes.
 *
 * Relationship with DarkModeService:
 *  This service owns *colour* (hue). DarkModeService owns *luminance* (light vs
 *  dark). They are orthogonal and never touch each other's concerns.
 */

import { inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { updatePreset } from '@primeuix/themes';
import { STORAGE_KEYS } from '../constants/storage-keys.constants';

// ─── Public types ─────────────────────────────────────────────────────────────

export type ColorThemeName =
  | 'default'
  | 'rose'
  | 'forest'
  | 'ocean'
  | 'sunset'
  | 'lavender';

export interface ColorThemePreset {
  readonly name: ColorThemeName;
  /** Human-readable label shown in the theme selector UI. */
  readonly label: string;
  /**
   * Representative hex for swatch rendering only.
   * The actual applied colour comes from the PrimeNG palette tokens below
   * so it stays consistent across light and dark mode.
   */
  readonly swatchHex: string;
  /**
   * Full 50-950 primary palette expressed as PrimeNG token aliases.
   * Passed directly to `updatePreset({ semantic: { primary: ... } })`.
   */
  readonly primaryPalette: Record<string, string>;
}

// ─── Palette definitions ──────────────────────────────────────────────────────

const COLOR_THEMES = [
  {
    name: 'default',
    label: 'Blue',
    swatchHex: '#3b82f6',
    primaryPalette: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
  },
  {
    name: 'rose',
    label: 'Rose',
    swatchHex: '#f43f5e',
    primaryPalette: {
      50: '{rose.50}',
      100: '{rose.100}',
      200: '{rose.200}',
      300: '{rose.300}',
      400: '{rose.400}',
      500: '{rose.500}',
      600: '{rose.600}',
      700: '{rose.700}',
      800: '{rose.800}',
      900: '{rose.900}',
      950: '{rose.950}',
    },
  },
  {
    name: 'forest',
    label: 'Forest',
    swatchHex: '#22c55e',
    primaryPalette: {
      50: '{green.50}',
      100: '{green.100}',
      200: '{green.200}',
      300: '{green.300}',
      400: '{green.400}',
      500: '{green.500}',
      600: '{green.600}',
      700: '{green.700}',
      800: '{green.800}',
      900: '{green.900}',
      950: '{green.950}',
    },
  },
  {
    name: 'ocean',
    label: 'Ocean',
    swatchHex: '#06b6d4',
    primaryPalette: {
      50: '{cyan.50}',
      100: '{cyan.100}',
      200: '{cyan.200}',
      300: '{cyan.300}',
      400: '{cyan.400}',
      500: '{cyan.500}',
      600: '{cyan.600}',
      700: '{cyan.700}',
      800: '{cyan.800}',
      900: '{cyan.900}',
      950: '{cyan.950}',
    },
  },
  {
    name: 'sunset',
    label: 'Sunset',
    swatchHex: '#f97316',
    primaryPalette: {
      50: '{orange.50}',
      100: '{orange.100}',
      200: '{orange.200}',
      300: '{orange.300}',
      400: '{orange.400}',
      500: '{orange.500}',
      600: '{orange.600}',
      700: '{orange.700}',
      800: '{orange.800}',
      900: '{orange.900}',
      950: '{orange.950}',
    },
  },
  {
    name: 'lavender',
    label: 'Lavender',
    swatchHex: '#a855f7',
    primaryPalette: {
      50: '{purple.50}',
      100: '{purple.100}',
      200: '{purple.200}',
      300: '{purple.300}',
      400: '{purple.400}',
      500: '{purple.500}',
      600: '{purple.600}',
      700: '{purple.700}',
      800: '{purple.800}',
      900: '{purple.900}',
      950: '{purple.950}',
    },
  },
] satisfies ColorThemePreset[];

export const DEFAULT_THEME_NAME: ColorThemeName = 'default';

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  /** All available presets — bind to this in the selector UI. */
  readonly presets: readonly ColorThemePreset[] = COLOR_THEMES;

  /** Currently active theme name — use in template to mark the active swatch. */
  readonly activeThemeName = signal<ColorThemeName>(DEFAULT_THEME_NAME);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Switch to the supplied preset.
   * Calls PrimeNG's `updatePreset()` to regenerate CSS custom-properties for
   * the primary palette, then persists the choice so `restoreTheme()` can
   * reapply it on the next page load.
   */
  applyTheme(name: ColorThemeName): void {
    const preset = this.presets.find((p) => p.name === name);
    if (!preset) return;

    // Drive PrimeNG's token engine — this regenerates every --p-primary-* var.
    updatePreset({ semantic: { primary: preset.primaryPalette } });

    // Expose a convenience token consumed by custom SCSS outside PrimeNG's scope.
    this.document.documentElement.style.setProperty(
      '--app-primary',
      preset.swatchHex,
    );

    this.activeThemeName.set(name);
    localStorage.setItem(STORAGE_KEYS.THEME, name);
  }

  /**
   * Called once at app startup (via APP_INITIALIZER) to reapply the last
   * user-chosen theme before the first render avoids a flash of default colour.
   */
  restoreTheme(): void {
    const saved = localStorage.getItem(
      STORAGE_KEYS.THEME,
    ) as ColorThemeName | null;
    const name: ColorThemeName =
      saved && this.isValidThemeName(saved) ? saved : DEFAULT_THEME_NAME;
    this.applyTheme(name);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private isValidThemeName(value: string): value is ColorThemeName {
    return (this.presets as readonly { name: string }[]).some(
      (p) => p.name === value,
    );
  }
}
