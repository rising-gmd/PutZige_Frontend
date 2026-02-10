import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/config/api.config';
import type { ApiResponse } from '../../../core/models/api.model';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  AuthUser,
} from '../../../core/models/auth.model';

/**
 * AuthApiService wraps auth-related HTTP calls.
 * For sensitive endpoints that must bypass global interceptors (refresh/logout),
 * a raw HttpClient constructed from HttpBackend is used.
 */

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  // rawHttp bypasses the interceptor chain (use for /refresh and /logout)
  private readonly rawHttp = new HttpClient(inject(HttpBackend));

  /**
   * Login with credentials
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(API_ENDPOINTS.AUTH.LOGIN, credentials)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Login failed');
          }
          return response.data;
        }),
      );
  }

  /** Get current authenticated user using cookie-based auth. */
  me(): Observable<AuthUser> {
    return this.http
      .get<
        ApiResponse<AuthUser>
      >(API_ENDPOINTS.AUTH.ME, { withCredentials: true })
      .pipe(
        map((resp) => {
          if (!resp.success || !resp.data)
            throw new Error(resp.message || 'Unauthorized');
          return resp.data;
        }),
      );
  }

  /**
   * Refresh access token
   */
  refreshToken(request: RefreshTokenRequest): Observable<RefreshTokenResponse> {
    return this.http
      .post<
        ApiResponse<RefreshTokenResponse>
      >(API_ENDPOINTS.AUTH.REFRESH, request)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Token refresh failed');
          }
          return response.data;
        }),
      );
  }

  /**
   * Perform a silent server-side refresh using the cookie-based refresh endpoint.
   * Uses rawHttp to avoid interceptor recursion.
   * Returns void (204) on success.
   */
  refresh(): Observable<void> {
    return this.rawHttp.post<void>(API_ENDPOINTS.AUTH.REFRESH, null, {
      withCredentials: true,
    });
  }

  /** Logout (server clears cookies). Uses rawHttp to avoid interceptor recursion. */
  logout(): Observable<void> {
    return this.rawHttp.post<void>(API_ENDPOINTS.AUTH.LOGOUT, null, {
      withCredentials: true,
    });
  }

  /** Negotiate a short-lived SignalR token (used only at connection time).
   * Server must authenticate the request via cookie and return a short-lived token.
   */
  negotiate(): Observable<{ accessToken: string; expiresIn: number }> {
    return this.http
      .post<
        ApiResponse<{ accessToken: string; expiresIn: number }>
      >(API_ENDPOINTS.SIGNALR.NEGOTIATE, null, { withCredentials: true })
      .pipe(
        map((resp) => {
          if (!resp.success || !resp.data)
            throw new Error(resp.message || 'Negotiate failed');
          return resp.data;
        }),
      );
  }

  /**
   * Verify using token from query params
   */
  verifyEmail(token: string): Observable<ApiResponse<null>> {
    const payload = { token } as const;
    return this.http.post<ApiResponse<null>>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      payload,
    );
  }

  /**
   * Resend verification using token (token-only flow)
   */
  resendVerification(token: string): Observable<ApiResponse<null>> {
    const payload = { token } as const;
    return this.http.post<ApiResponse<null>>(
      API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
      payload,
    );
  }
}
