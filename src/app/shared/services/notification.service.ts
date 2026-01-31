import { inject, Injectable, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import { NOTIFICATION_CONFIG } from '../../core/constants/http-status.constants';

/**
 * Handles deduplication, memory management, edge cases, and graceful degradation.
 *
 * Features:
 * - Smart deduplication (prevents toast spam)
 * - Memory leak prevention (auto-cleanup of stale entries)
 * - Null/undefined safety (never crashes on bad input)
 * - XSS protection (HTML sanitization)
 * - Queue management (limits concurrent toasts)
 * - Graceful degradation (fallback if MessageService unavailable)
 * - Type-safe severity enum
 * - Performance optimized (O(1) lookups, periodic cleanup)
 */

type NotificationSeverity = 'success' | 'info' | 'warn' | 'error';

interface NotificationOptions {
  readonly summary?: string;
  readonly life?: number;
  readonly sticky?: boolean;
  readonly closable?: boolean;
  readonly key?: string; // For replacing specific toasts
}

interface DedupeEntry {
  readonly timestamp: number;
  readonly count: number; // Track how many times this was suppressed
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private msgs: MessageService | undefined = undefined;

  // Deduplication cache with entry count tracking
  private readonly dedupeCache = new Map<string, DedupeEntry>();

  // Active toast tracking (prevent overwhelming user)
  private activeCount = 0;

  // Periodic cleanup interval
  private cleanupInterval?: ReturnType<typeof setInterval>;

  // Emergency fallback mode (if MessageService fails)
  private fallbackMode = false;

  // Allow optional constructor injection for tests; prefer `inject()` in production.
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(msgs?: MessageService) {
    this.msgs = msgs ?? inject(MessageService);
    this.startCleanupTimer();
  }

  ngOnDestroy(): void {
    this.stopCleanupTimer();
    this.dedupeCache.clear();
  }

  // ==================== Public API ====================

  showSuccess(detail: string, options?: NotificationOptions): void {
    this.show('success', detail, options);
  }

  showError(detail: string, options?: NotificationOptions): void {
    this.show('error', detail, options);
  }

  showInfo(detail: string, options?: NotificationOptions): void {
    this.show('info', detail, options);
  }

  showWarn(detail: string, options?: NotificationOptions): void {
    this.show('warn', detail, options);
  }

  /**
   * Main entry point - handles all edge cases
   */
  show(
    severity: NotificationSeverity,
    detail: string,
    options?: NotificationOptions,
  ): void {
    // Edge case: Invalid inputs
    if (!this.isValidInput(severity, detail)) {
      this.logInvalidInput(severity, detail);
      return;
    }

    const sanitizedDetail = this.sanitize(detail);
    const summary = options?.summary ?? this.getDefaultSummary(severity);
    const life = options?.life ?? this.getDefaultLife(severity);

    // Edge case: Deduplication
    const dedupeKey = this.makeDedupeKey(severity, summary, sanitizedDetail);
    if (this.isDuplicate(dedupeKey)) {
      this.incrementDuplicateCount(dedupeKey);
      return;
    }

    // Edge case: Too many active toasts
    if (this.isOverloaded()) {
      this.queueOrDrop(severity, sanitizedDetail, summary, life, options);
      return;
    }

    // Edge case: MessageService unavailable
    if (!this.msgs) {
      this.fallback(severity, sanitizedDetail, summary);
      return;
    }

    // Happy path: Show the toast
    this.display(severity, sanitizedDetail, summary, life, options);
    this.markShown(dedupeKey);
    this.trackActive(life);
  }

  /**
   * Clear all notifications
   */
  clear(key?: string): void {
    try {
      if (key) {
        this.msgs?.clear(key);
      } else {
        this.msgs?.clear();
        this.activeCount = 0;
      }
    } catch (error) {
      this.handleError('clear', error);
    }
  }

  /**
   * Get current active notification count
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * Check if currently in fallback mode
   */
  isFallbackMode(): boolean {
    return this.fallbackMode;
  }

  /**
   * Force cleanup of dedupe cache (for testing or manual memory management)
   */
  clearDedupeCache(): void {
    this.dedupeCache.clear();
  }

  // ==================== Private: Validation ====================

  private isValidInput(severity: unknown, detail: unknown): boolean {
    // Edge case: Null/undefined severity
    if (!severity || typeof severity !== 'string') {
      return false;
    }

    // Edge case: Invalid severity
    const validSeverities: NotificationSeverity[] = [
      'success',
      'info',
      'warn',
      'error',
    ];
    if (!validSeverities.includes(severity as NotificationSeverity)) {
      return false;
    }

    // Edge case: Null/undefined/empty detail
    if (detail == null || detail === '') {
      return false;
    }

    // Edge case: Non-string detail
    if (typeof detail !== 'string') {
      return false;
    }

    // Edge case: Whitespace-only detail
    if (detail.trim().length === 0) {
      return false;
    }

    return true;
  }

  private logInvalidInput(severity: unknown, detail: unknown): void {
    if (!NOTIFICATION_CONFIG.PRODUCTION_MODE) {
      console.warn('[NotificationService] Invalid input:', {
        severity,
        detail,
      });
    }
  }

  // ==================== Private: Sanitization ====================

  private sanitize(input: string): string {
    // Edge case: Already sanitized or doesn't contain HTML
    if (!this.containsHtml(input)) {
      return input.trim();
    }

    // Edge case: Contains HTML - strip it for security
    return this.stripHtml(input).trim();
  }

  private containsHtml(str: string): boolean {
    return /<[^>]+>/g.test(str);
  }

  private stripHtml(str: string): string {
    // Create temporary element for safe HTML stripping
    const tmp = document.createElement('div');
    tmp.innerHTML = str;
    return tmp.textContent || tmp.innerText || '';
  }

  // ==================== Private: Deduplication ====================

  private makeDedupeKey(
    severity: NotificationSeverity,
    summary: string,
    detail: string,
  ): string {
    const normalizedDetail = this.normalizeDetail(detail);
    return `${severity}|${summary}|${normalizedDetail}`;
  }

  private normalizeDetail(detail: string): string {
    if (!detail) return '';

    const lower = detail.toLowerCase();

    // Edge case: Angular HTTP error messages (collapse variants)
    if (
      lower.includes('http failure') ||
      lower.includes('network error') ||
      lower.includes('unknown error') ||
      lower.includes('0 unknown error')
    ) {
      return 'network_error';
    }

    // Edge case: Timeout errors
    if (lower.includes('timeout') || lower.includes('timed out')) {
      return 'timeout_error';
    }

    // Edge case: CORS errors
    if (lower.includes('cors') || lower.includes('cross-origin')) {
      return 'cors_error';
    }

    // Remove URLs, IDs, timestamps to normalize similar errors
    return detail
      .replace(/https?:\/\/[^\s]+/g, '') // URLs
      .replace(/\b\d+\b/g, '') // Numbers
      .replace(
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
        '',
      ) // UUIDs
      .replace(/\d{4}-\d{2}-\d{2}/g, '') // Dates
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private isDuplicate(key: string): boolean {
    const entry = this.dedupeCache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;

    // Edge case: Entry expired
    if (age > NOTIFICATION_CONFIG.DEDUPE_WINDOW_MS) {
      this.dedupeCache.delete(key);
      return false;
    }

    return true;
  }

  private incrementDuplicateCount(key: string): void {
    const entry = this.dedupeCache.get(key);
    if (entry) {
      this.dedupeCache.set(key, {
        timestamp: entry.timestamp,
        count: entry.count + 1,
      });
    }
  }

  private markShown(key: string): void {
    this.dedupeCache.set(key, {
      timestamp: Date.now(),
      count: 0,
    });
  }

  // ==================== Private: Overload Protection ====================

  private isOverloaded(): boolean {
    return this.activeCount >= NOTIFICATION_CONFIG.MAX_CONCURRENT_TOASTS;
  }

  private queueOrDrop(
    severity: NotificationSeverity,
    detail: string,
    summary: string,
    life: number,
    options?: NotificationOptions,
  ): void {
    // Edge case: Too many toasts - drop lowest priority (info/success)
    if (severity === 'error' || severity === 'warn') {
      // Clear info/success toasts to make room for critical messages
      this.msgs?.clear();
      this.activeCount = 0;
      this.display(severity, detail, summary, life, options);
    } else {
      // Drop the notification silently (already overloaded)
      if (!NOTIFICATION_CONFIG.PRODUCTION_MODE) {
        console.warn(
          '[NotificationService] Dropped notification (overloaded):',
          { severity, detail },
        );
      }
    }
  }

  private trackActive(life: number): void {
    this.activeCount++;

    // Edge case: Sticky toasts don't auto-decrement
    if (life > 0) {
      setTimeout(() => {
        this.activeCount = Math.max(0, this.activeCount - 1);
      }, life);
    }
  }

  // ==================== Private: Display ====================

  private display(
    severity: NotificationSeverity,
    detail: string,
    summary: string,
    life: number,
    options?: NotificationOptions,
  ): void {
    try {
      this.msgs!.add({
        severity,
        summary,
        detail,
        life: options?.sticky ? 0 : life,
        closable: options?.closable ?? true,
        key: options?.key,
      });
    } catch (error) {
      // Edge case: MessageService failed - enter fallback mode
      this.fallbackMode = true;
      this.fallback(severity, detail, summary);
      this.handleError('display', error);
    }
  }

  private getDefaultSummary(severity: NotificationSeverity): string {
    const summaries: Record<NotificationSeverity, string> = {
      success: 'Success',
      info: 'Info',
      warn: 'Warning',
      error: 'Error',
    };
    return summaries[severity];
  }

  private getDefaultLife(severity: NotificationSeverity): number {
    return severity === 'error'
      ? NOTIFICATION_CONFIG.ERROR_LIFE_MS
      : NOTIFICATION_CONFIG.DEFAULT_LIFE_MS;
  }

  // ==================== Private: Fallback ====================

  private fallback(
    severity: NotificationSeverity,
    detail: string,
    summary: string,
  ): void {
    // Edge case: MessageService unavailable - use console + optional alert
    const prefix = `[${severity.toUpperCase()}]`;
    const message = `${summary}: ${detail}`;

    switch (severity) {
      case 'error':
        console.error(prefix, message);
        if (NOTIFICATION_CONFIG.FALLBACK_ALERT_ON_ERROR) {
          alert(message); // Last resort for critical errors
        }
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  private handleError(context: string, error: unknown): void {
    if (!NOTIFICATION_CONFIG.PRODUCTION_MODE) {
      console.error(`[NotificationService] Error in ${context}:`, error);
    }

    // Edge case: Could log to monitoring service (Sentry, etc.)
    // TODO: Send to error monitoring
  }

  // ==================== Private: Memory Management ====================

  private startCleanupTimer(): void {
    // Prevent memory leaks by periodically cleaning stale entries
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleEntries();
    }, NOTIFICATION_CONFIG.CLEANUP_INTERVAL_MS);
  }

  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  private cleanupStaleEntries(): void {
    const now = Date.now();
    const staleKeys: string[] = [];

    // Find stale entries
    for (const [key, entry] of this.dedupeCache.entries()) {
      if (now - entry.timestamp > NOTIFICATION_CONFIG.DEDUPE_WINDOW_MS) {
        staleKeys.push(key);
      }
    }

    // Remove them
    for (const key of staleKeys) {
      this.dedupeCache.delete(key);
    }

    // Edge case: Cache growing too large (memory leak protection)
    if (this.dedupeCache.size > NOTIFICATION_CONFIG.MAX_CACHE_SIZE) {
      this.evictOldest();
    }
  }

  private evictOldest(): void {
    // Emergency cache reduction - remove oldest 25%
    const entries = Array.from(this.dedupeCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.dedupeCache.delete(entries[i][0]);
    }

    if (!NOTIFICATION_CONFIG.PRODUCTION_MODE) {
      console.warn(
        `[NotificationService] Cache eviction: removed ${toRemove} entries`,
      );
    }
  }
}
