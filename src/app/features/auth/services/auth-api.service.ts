import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/config/api.config';
import type { ApiResponse } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  // Existing placeholder methods kept for backward compatibility
  async login(
    _username: string,
    _password: string,
  ): Promise<{ success: boolean }> {
    // reference params to avoid unused-variable lint errors
    void _username;
    void _password;
    return Promise.resolve({ success: true });
  }

  async register(
    _username: string,
    _password: string,
  ): Promise<{ success: boolean }> {
    void _username;
    void _password;
    return Promise.resolve({ success: true });
  }

  async forgotPassword(_email: string): Promise<{ success: boolean }> {
    void _email;
    return Promise.resolve({ success: true });
  }

  /**
   * Verify email using token from query params
   */
  verifyEmail(email: string, token: string): Observable<ApiResponse<null>> {
    const payload = { email, token } as const;
    return this.http.post<ApiResponse<null>>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      payload,
    );
  }

  /**
   * Resend verification email to the given address
   */
  resendVerification(email: string): Observable<ApiResponse<null>> {
    const payload = { email } as const;
    return this.http.post<ApiResponse<null>>(
      API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
      payload,
    );
  }
}
