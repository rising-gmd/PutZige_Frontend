import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/config/api.config';
import {
  SearchUsersRequest,
  SearchUsersResponse,
  RecentContactsResponse,
  SuggestedUsersResponse,
} from '../models/new-chat.models';

@Injectable({ providedIn: 'root' })
export class NewChatService {
  private readonly http = inject(HttpClient);

  searchUsers(request: SearchUsersRequest): Observable<SearchUsersResponse> {
    const params = new HttpParams()
      .set('query', request.query)
      .set('pageNumber', (request.pageNumber ?? 1).toString())
      .set('pageSize', (request.pageSize ?? 20).toString());

    return this.http
      .get<SearchUsersResponse>(API_ENDPOINTS.USERS.SEARCH, { params })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getRecentContacts(): Observable<RecentContactsResponse> {
    return this.http
      .get<RecentContactsResponse>(API_ENDPOINTS.USERS.RECENT_CONTACTS)
      .pipe(catchError((err) => this.handleError(err)));
  }

  getSuggestedUsers(): Observable<SuggestedUsersResponse> {
    return this.http
      .get<SuggestedUsersResponse>(API_ENDPOINTS.USERS.SUGGESTIONS)
      .pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(error: unknown): Observable<never> {
    console.error('NewChatService error:', error);
    return throwError(() =>
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
