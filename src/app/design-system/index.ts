// ============================================================
// design-system/index.ts
//
// Single barrel export for all design-system components.
// Import from this file — never from deep paths.
//
// Usage:
//   import { DsAvatarComponent, DsBadgeComponent } from '@app/design-system';
//
// Dependency direction (enforced, never reversed):
//   features → design-system ✅
//   design-system → features ❌
// ============================================================

// ── Primitives ──────────────────────────────────────────────
export { AppButtonComponent } from './primitives/button/app-button.component';
export { AppInputComponent } from './primitives/input/app-input.component';
export { AppPasswordComponent } from './primitives/password/app-password.component';
export { AppIconFieldComponent } from './primitives/icon-field/app-icon-field.component';
export { DsAvatarComponent } from './primitives/avatar/ds-avatar.component';
export { DsSpinnerComponent } from './primitives/spinner/ds-spinner.component';
export { DsBadgeComponent } from './primitives/badge/ds-badge.component';
export { DsEmptyStateComponent } from './primitives/empty-state/ds-empty-state.component';

// ── Composites ───────────────────────────────────────────────
export { DsIconButtonComponent } from './composites/icon-button/ds-icon-button.component';
export { DsSearchInputComponent } from './composites/search-input/ds-search-input.component';
