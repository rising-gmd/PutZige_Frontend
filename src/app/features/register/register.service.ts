import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api.model';
import { API_ENDPOINTS } from '../../core/config/api.config';

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string | null;
}

export interface RegisterResponse {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RegisterService {
  private readonly http = inject(HttpClient);

  register(
    payload: RegisterRequest,
  ): Observable<ApiResponse<RegisterResponse>> {
    // Use relative endpoint; interceptor will prepend the baseUrl.
    return this.http.post<ApiResponse<RegisterResponse>>(
      API_ENDPOINTS.USERS.CREATE,
      payload,
    );
  }
}
