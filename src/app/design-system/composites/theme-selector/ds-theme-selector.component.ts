/**
 * DsThemeSelectorComponent — colour-theme and dark-mode switcher.
 *
 * Renders a radio-group of colour swatches (one per ThemeService preset) and
 * a dark/light mode toggle switch. Designed to live inside a settings panel or
 * popover; it does not manage its own open/close state.
 *
 * Accessibility:
 *  - Colour swatches use role="radiogroup" + role="radio" (ARIA APG §Radio Group)
 *  - Arrow keys navigate between swatches; Enter/Space selects
 *  - Dark mode uses role="switch" with aria-checked reflecting current state
 *  - Each swatch has a visible label and tooltip via title attribute
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  ThemeService,
  ColorThemePreset,
} from '../../../core/services/theme.service';
import { DarkModeService } from '../../../theme/dark-mode.service';
import { STORAGE_KEYS } from '../../../core/constants/storage-keys.constants';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'ds-theme-selector',
  standalone: true,
  imports: [],
  templateUrl: './ds-theme-selector.component.html',
  styleUrl: './ds-theme-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsThemeSelectorComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly darkModeService = inject(DarkModeService);
  private readonly userService = inject(UserService);

  /**
   * Mirror of DarkModeService state as a signal so the template can re-render
   * reactively without polling or Zone.js.
   * We initialise from the service's current value and keep in sync on toggle.
   */
  protected readonly isDark = signal(this.darkModeService.isDark());

  // ── Actions ────────────────────────────────────────────────────────────────

  protected selectTheme(preset: ColorThemePreset): void {
    this.themeService.applyTheme(preset.name);
  }

  protected toggleDarkMode(): void {
    this.darkModeService.toggle();
    const isDark = this.darkModeService.isDark();
    // Re-read the DOM class so our local signal stays in sync.
    this.isDark.set(isDark);
    // DarkModeService only manages the DOM class; persistence lives here so
    // APP_INITIALIZER can restore the preference on the next page load.
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDark));
    // Persist to backend (fire-and-forget; localStorage is the fast cache).
    this.userService.updateUserPreferences({ isDarkMode: isDark }).subscribe({
      error: () => {
        /* backend save is best-effort */
      },
    });
  }

  // ── Keyboard navigation (APG §Radio Group roving tabindex) ─────────────────

  protected onSwatchKeyDown(event: KeyboardEvent, index: number): void {
    const presets = this.themeService.presets;
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % presets.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index - 1 + presets.length) % presets.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = presets.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const swatches = (event.currentTarget as HTMLElement)
      .closest('[role="radiogroup"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    swatches?.[nextIndex]?.focus();
  }
}
