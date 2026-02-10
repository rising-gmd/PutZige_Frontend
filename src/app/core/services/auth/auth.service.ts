import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, Subject, of } from 'rxjs';
import { catchError, first, tap, map } from 'rxjs/operators';
import { authState } from './auth.state';
import { AuthApiService } from '../../../features/auth/services/auth-api.service';
import type { LoginRequest, AuthUser } from '../../models/auth.model';

/**
 * Cookie-based AuthService.
 * - No tokens are stored on the client
 * - Uses HttpOnly cookies set by the backend
 * - Provides `checkAuthStatus()` to query `/auth/me`
 * - Provides a single-flight `refreshAccessToken()` used by the interceptor
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly api = inject(AuthApiService);

  // Single-flight refresh control
  private refreshInProgress = false;
  private refreshResult$?: Subject<boolean>;

  // Public observables
  readonly user$ = new BehaviorSubject<AuthUser | null>(authState.getUser());
  readonly isAuthenticated$ = new BehaviorSubject<boolean>(
    authState.isLoggedIn(),
  );

  /** Check server auth status by calling `/auth/me`. Returns user or null. */
  checkAuthStatus(): Observable<AuthUser | null> {
    authState.isLoading.set(true);
    authState.error.set(null);

    return this.api.me().pipe(
      tap((user) => {
        authState.user.set(user);
        this.user$.next(user);
        this.isAuthenticated$.next(true);
        authState.isLoading.set(false);
      }),
      catchError(() => {
        authState.user.set(null);
        this.user$.next(null);
        this.isAuthenticated$.next(false);
        authState.isLoading.set(false);
        return of(null);
      }),
    );
  }

  /** Login — backend will set HttpOnly cookies; server returns user DTO. */
  login(credentials: LoginRequest): Observable<AuthUser> {
    authState.isLoading.set(true);
    authState.error.set(null);
    return this.api.login(credentials).pipe(
      map((resp) => {
        const user: AuthUser = {
          id: resp.userId,
          email: resp.email,
          displayName: resp.displayName ?? resp.username,
          username: resp.username,
        };
        return user;
      }),
      tap((user) => {
        authState.user.set(user);
        this.user$.next(user);
        this.isAuthenticated$.next(true);
        authState.isLoading.set(false);
      }),
      catchError((err: unknown) => {
        const msg = this.extractErrorMessage(err);
        authState.error.set(msg);
        authState.isLoading.set(false);
        throw err;
      }),
    );
  }

  /** Logout — call server to clear cookies and clear local state */
  logout(): void {
    // best-effort remote logout (fire-and-forget)
    this.api
      .logout()
      .pipe(catchError(() => of(undefined)))
      .subscribe({
        complete: () => {
          this.clearAuthState();
          void this.router.navigate(['/auth/login']);
        },
      });
  }

  /**
   * Silent refresh using server-side rotation. Returns Observable<boolean>
   * indicating success. Ensures only one refresh is in-flight and other
   * callers wait for the same result.
   */
  refreshAccessToken(): Observable<boolean> {
    if (this.refreshInProgress && this.refreshResult$) {
      return this.refreshResult$.asObservable();
    }

    this.refreshInProgress = true;
    this.refreshResult$ = new Subject<boolean>();

    this.api
      .refresh()
      .pipe(first())
      .subscribe({
        next: () => {
          this.refreshInProgress = false;
          this.refreshResult$?.next(true);
          this.refreshResult$?.complete();
        },
        error: () => {
          this.refreshInProgress = false;
          this.refreshResult$?.next(false);
          this.refreshResult$?.complete();
          this.clearAuthState();
        },
      });

    return this.refreshResult$.asObservable();
  }

  /** Simple accessor */
  isAuthenticated(): boolean {
    return this.isAuthenticated$.value;
  }

  getCurrentUser(): AuthUser | null {
    return this.user$.value;
  }

  private clearAuthState(): void {
    authState.user.set(null);
    authState.error.set(null);
    authState.isLoading.set(false);
    this.user$.next(null);
    this.isAuthenticated$.next(false);
  }

  private extractErrorMessage(err: unknown): string {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (typeof err === 'object') {
      const e = err as Record<string, unknown>;
      if (typeof e['message'] === 'string') return e['message'];
      if (typeof e['error'] === 'object' && e['error'] !== null) {
        const nested = e['error'] as Record<string, unknown>;
        if (typeof nested['message'] === 'string') return nested['message'];
      }
    }
    return 'Authentication failed';
  }
}
