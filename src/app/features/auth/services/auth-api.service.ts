import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/config/api.config';
import type { ApiResponse } from '../../../core/models/api.model';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../../../core/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

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
