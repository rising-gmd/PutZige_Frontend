import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, timer, EMPTY } from 'rxjs';
import { catchError, switchMap, tap, shareReplay } from 'rxjs/operators';
import { TokenStorageService } from '../token-storage.service';
import { STORAGE_KEYS } from '../../constants/storage-keys.constants';
import { authState } from './auth.state';
import { AuthApiService } from '../../../features/auth/services/auth-api.service';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  AuthUser,
  TokenPayload,
} from '../../models/auth.model';

const TOKEN_REFRESH_BUFFER_MS = 60_000; // refresh 1min before expiry

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly api = inject(AuthApiService);

  private readonly refreshInProgress$ = new BehaviorSubject<boolean>(false);

  // Public observables
  readonly user$ = new BehaviorSubject<AuthUser | null>(authState.getUser());
  readonly isAuthenticated$ = new BehaviorSubject<boolean>(
    authState.isLoggedIn(),
  );

  /** Initialize auth state on app startup (call from APP_INITIALIZER) */
  initializeAuthState(): void {
    const token = this.getAccessToken();
    if (!token) {
      this.clearAuthState();
      return;
    }

    try {
      const payload = this.decodeToken(token);
      if (this.isTokenExpired(payload)) {
        void this.attemptTokenRefresh();
        return;
      }

      this.restoreUserFromToken(payload);
      this.scheduleTokenRefresh(payload.exp);
    } catch {
      this.clearAuthState();
    }
  }

  /** Login user with credentials */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    authState.isLoading.set(true);
    authState.error.set(null);

    return this.api.login(credentials).pipe(
      tap((response) => {
        this.handleLoginSuccess(response);
      }),
      catchError((err: unknown) => {
        const message = this.extractErrorMessage(err);
        authState.error.set(message);
        authState.isLoading.set(false);
        return throwError(() => new Error(message));
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  /** Logout user and clear all auth state */
  logout(): void {
    this.clearAuthState();
    void this.router.navigate(['/auth/login']);
  }

  /** Get current access token from storage */
  getAccessToken(): string | null {
    return this.tokenStorage.getToken(STORAGE_KEYS.AUTH_TOKEN);
  }

  /** Get refresh token from storage */
  getRefreshToken(): string | null {
    return this.tokenStorage.getToken(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /** Refresh access token using refresh token */
  refreshAccessToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return EMPTY;
    }

    if (this.refreshInProgress$.value) {
      return EMPTY;
    }

    this.refreshInProgress$.next(true);

    return this.api.refreshToken({ refreshToken }).pipe(
      tap((response) => {
        this.handleTokenRefreshSuccess(response);
        this.refreshInProgress$.next(false);
      }),
      catchError(() => {
        this.refreshInProgress$.next(false);
        this.logout();
        return EMPTY;
      }),
    );
  }

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    return authState.isLoggedIn();
  }

  /** Get current user */
  getCurrentUser(): AuthUser | null {
    return authState.getUser();
  }

  // ==================== PRIVATE HELPERS ====================

  private handleLoginSuccess(response: LoginResponse): void {
    this.tokenStorage.setToken(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
    this.tokenStorage.setToken(
      STORAGE_KEYS.REFRESH_TOKEN,
      response.refreshToken,
    );

    const payload = this.decodeToken(response.accessToken);
    const user: AuthUser = {
      id: response.userId,
      email: response.email,
      displayName: response.displayName ?? response.username,
    };

    authState.user.set(user);
    authState.isLoading.set(false);
    this.user$.next(user);
    this.isAuthenticated$.next(true);

    this.scheduleTokenRefresh(payload.exp);
  }

  private handleTokenRefreshSuccess(response: RefreshTokenResponse): void {
    this.tokenStorage.setToken(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
    this.tokenStorage.setToken(
      STORAGE_KEYS.REFRESH_TOKEN,
      response.refreshToken,
    );

    const payload = this.decodeToken(response.accessToken);
    this.scheduleTokenRefresh(payload.exp);
  }

  private restoreUserFromToken(payload: TokenPayload): void {
    const user: AuthUser = {
      id: payload.sub,
      email: payload.email,
      displayName: payload.email.split('@')[0] ?? 'User',
    };

    authState.user.set(user);
    this.user$.next(user);
    this.isAuthenticated$.next(true);
  }

  private clearAuthState(): void {
    this.tokenStorage.removeToken(STORAGE_KEYS.AUTH_TOKEN);
    this.tokenStorage.removeToken(STORAGE_KEYS.REFRESH_TOKEN);
    authState.user.set(null);
    authState.error.set(null);
    authState.isLoading.set(false);
    this.user$.next(null);
    this.isAuthenticated$.next(false);
  }

  private scheduleTokenRefresh(expiresAt: number): void {
    const now = Date.now();
    const expiresAtMs = expiresAt * 1000;
    const refreshAt = expiresAtMs - TOKEN_REFRESH_BUFFER_MS;
    const delay = Math.max(0, refreshAt - now);

    timer(delay)
      .pipe(switchMap(() => this.refreshAccessToken()))
      .subscribe();
  }

  private async attemptTokenRefresh(): Promise<void> {
    try {
      await this.refreshAccessToken().toPromise();
    } catch {
      this.clearAuthState();
    }
  }

  private decodeToken(token: string): TokenPayload {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token: token is required and must be a string');
    }

    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const payload = parts[1];
    if (!payload) throw new Error('Missing token payload');

    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as TokenPayload;
  }

  private isTokenExpired(payload: TokenPayload): boolean {
    return Date.now() >= payload.exp * 1000;
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
