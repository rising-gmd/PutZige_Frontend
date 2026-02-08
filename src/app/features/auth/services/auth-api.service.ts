import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/config/api.config';
import type { ApiResponse } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

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
