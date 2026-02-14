import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/config/api.config';
import {
  SearchUsersRequest,
  SearchUsersData,
  RecentContactsData,
  SuggestedUsersData,
} from '../models/new-chat.models';

@Injectable({ providedIn: 'root' })
export class NewChatService {
  private readonly http = inject(HttpClient);

  searchUsers(request: SearchUsersRequest): Observable<SearchUsersData> {
    const params = new HttpParams()
      .set('query', request.query)
      .set('pageNumber', (request.pageNumber ?? 1).toString())
      .set('pageSize', (request.pageSize ?? 20).toString());

    return this.http
      .get<{ data: SearchUsersData }>(API_ENDPOINTS.USERS.SEARCH, { params })
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err)),
      );
  }

  getRecentContacts(): Observable<RecentContactsData> {
    return this.http
      .get<{ data: RecentContactsData }>(API_ENDPOINTS.USERS.RECENT_CONTACTS)
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err)),
      );
  }

  getSuggestedUsers(): Observable<SuggestedUsersData> {
    return this.http
      .get<{ data: SuggestedUsersData }>(API_ENDPOINTS.USERS.SUGGESTIONS)
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err)),
      );
  }

  private handleError(error: unknown): Observable<never> {
    console.error('NewChatService error:', error);
    return throwError(() =>
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
