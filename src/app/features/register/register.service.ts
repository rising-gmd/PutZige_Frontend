import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api.config';
import { ApiResponse } from '../../core/models/api.model';

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
    return this.http.post<ApiResponse<RegisterResponse>>(
      API_ENDPOINTS.USERS.CREATE,
      payload,
    );
  }
}
