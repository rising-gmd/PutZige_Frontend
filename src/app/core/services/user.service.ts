import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../config/api.config';
import { ApiResponse } from '../models/api.model';
import {
  UserPreferencesDto,
  UserPreferencesPatchDto,
  UpdatePreferencesRequest,
} from '../models/user-settings.model';

export interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    // Use relative endpoint; interceptor will prepend the configured base URL.
    return this.http.get<User[]>(API_ENDPOINTS.USERS.LIST);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(API_ENDPOINTS.USERS.DETAIL(id));
  }

  /**
   * Get user preferences from backend
   */
  getUserPreferences(): Observable<UserPreferencesDto> {
    return this.http
      .get<
        ApiResponse<UserPreferencesDto>
      >(API_ENDPOINTS.USERS.SETTINGS_PREFERENCES)
      .pipe(
        map((r) => r.data as UserPreferencesDto),
        catchError((err) => this.handleError(err)),
      );
  }

  /**
   * Update user preferences. Body must be { preferences: patch }
   */
  updateUserPreferences(
    patch: UserPreferencesPatchDto,
  ): Observable<UserPreferencesDto> {
    const body: UpdatePreferencesRequest = { preferences: patch };
    return this.http
      .patch<
        ApiResponse<UserPreferencesDto>
      >(API_ENDPOINTS.USERS.SETTINGS_PREFERENCES, body)
      .pipe(
        map((r) => r.data as UserPreferencesDto),
        catchError((err) => this.handleError(err)),
      );
  }

  private handleError(err: unknown): Observable<never> {
    console.error('UserService error', err);
    const msg = this.extractErrorMessage(err);
    return throwError(() => new Error(msg));
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
    try {
      return String(err);
    } catch {
      return 'Unknown error';
    }
  }
}
