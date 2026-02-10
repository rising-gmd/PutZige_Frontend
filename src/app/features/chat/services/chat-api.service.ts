import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, shareReplay } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/config/api.config';
import { UI_CONSTANTS } from '../../../core/constants/ui.constants';

const { CONVERSATION_PAGE_SIZE } = UI_CONSTANTS;
import {
  Conversation,
  User,
  ConversationListResponse,
  ConversationHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly http = inject(HttpClient);

  // cached conversations
  private conversationsCache$?: Observable<Conversation[]>;

  /**
   * Retrieve current authenticated user profile
   * @returns Observable of current user data
   */
  getCurrentUser(): Observable<User> {
    return this.http
      .get<User>(API_ENDPOINTS.CHAT.ME)
      .pipe(catchError(this.handleError));
  }

  /**
   * Fetch list of all conversations for current user
   * @param refresh - If true, bypass cache and fetch fresh data
   * @returns Observable of conversations array
   */
  getConversations(refresh = false): Observable<Conversation[]> {
    if (!refresh && this.conversationsCache$) return this.conversationsCache$;
    this.conversationsCache$ = this.http
      .get<ConversationListResponse>(API_ENDPOINTS.CHAT.CONVERSATIONS)
      .pipe(
        map((res) => res.conversations ?? []),
        shareReplay({ bufferSize: 1, refCount: true }),
        catchError(this.handleError),
      );
    return this.conversationsCache$;
  }

  getConversationHistory(
    conversationId: string,
    pageNumber = 1,
    pageSize = CONVERSATION_PAGE_SIZE,
  ): Observable<ConversationHistoryResponse> {
    const params = new HttpParams()
      .set('pageNumber', String(pageNumber))
      .set('pageSize', String(pageSize));
    return this.http
      .get<ConversationHistoryResponse>(
        API_ENDPOINTS.CHAT.CONVERSATION_MESSAGES(conversationId),
        { params },
      )
      .pipe(catchError(this.handleError));
  }

  sendMessage(request: SendMessageRequest): Observable<SendMessageResponse> {
    return this.http
      .post<SendMessageResponse>(API_ENDPOINTS.CHAT.MESSAGES, request)
      .pipe(retry(2), catchError(this.handleError));
  }

  markMessageAsRead(messageId: string): Observable<void> {
    return this.http
      .patch<void>(`${API_ENDPOINTS.CHAT.MESSAGES}/${messageId}/read`, {})
      .pipe(catchError(this.handleError));
  }

  searchUsers(query: string): Observable<User[]> {
    const params = new HttpParams().set('query', query);
    return this.http
      .get<{ users: User[] }>(API_ENDPOINTS.CHAT.USERS_SEARCH, { params })
      .pipe(
        map((r) => r.users ?? []),
        catchError(this.handleError),
      );
  }

  clearCache(): void {
    this.conversationsCache$ = undefined;
  }

  private handleError(err: unknown): Observable<never> {
    const msg = extractErrorMessage(err);
    console.error('ChatApiService error', msg);
    return throwError(() => new Error(msg));
  }
}

function extractErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (typeof e['message'] === 'string') return e['message'];
  }
  try {
    return String(err);
  } catch {
    return 'Unknown error';
  }
}
