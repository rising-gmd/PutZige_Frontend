import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, shareReplay } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/config/api.config';
import { UI_CONSTANTS } from '../../../core/constants/ui.constants';
import { extractErrorMessage } from '../../../core/utils/error.util';
import { UNWRAP_API_RESPONSE } from '../../../core/interceptors/api-response-unwrap.interceptor';
import { mapUserDtoToUser, mapConversationDtoToConversation } from '../mappers';
import {
  Conversation,
  User,
  ConversationsListResponse,
  ConversationHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
  UserSearchResponse,
} from '../models';

const { CONVERSATION_PAGE_SIZE } = UI_CONSTANTS;

/** Shorthand for the opt-in context that unwraps ApiResponse<T> envelopes. */
const unwrap = new HttpContext().set(UNWRAP_API_RESPONSE, true);

export interface ConversationResponse {
  conversationId: string;
  isGroup: boolean;
  lastActivity: string;
  otherUserId: string;
  otherUserDisplayName?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly http = inject(HttpClient);

  private conversationsCache$?: Observable<Conversation[]>;

  /** Retrieve current authenticated user profile. */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(API_ENDPOINTS.CHAT.ME, { context: unwrap }).pipe(
      map((dto) =>
        mapUserDtoToUser(dto as Parameters<typeof mapUserDtoToUser>[0]),
      ),
      catchError(this.handleError),
    );
  }

  /**
   * Fetch the conversation list for the current user.
   * @param refresh - Bypass the in-memory cache when true.
   */
  getConversations(refresh = false): Observable<Conversation[]> {
    if (!refresh && this.conversationsCache$) return this.conversationsCache$;

    this.conversationsCache$ = this.http
      .get<ConversationsListResponse>(API_ENDPOINTS.CHAT.CONVERSATIONS, {
        context: unwrap,
      })
      .pipe(
        map((res) =>
          (res.conversations ?? []).map(mapConversationDtoToConversation),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
        catchError(this.handleError),
      );

    return this.conversationsCache$!;
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
        { params, context: unwrap },
      )
      .pipe(catchError(this.handleError));
  }

  sendMessage(request: SendMessageRequest): Observable<SendMessageResponse> {
    return this.http
      .post<SendMessageResponse>(API_ENDPOINTS.CHAT.MESSAGES, request, {
        context: unwrap,
      })
      .pipe(retry(2), catchError(this.handleError));
  }

  /**
   * Create or retrieve a direct conversation with another user.
   * Call this before sending the first message to a new contact.
   */
  createOrGetConversation(
    otherUserId: string,
  ): Observable<ConversationResponse> {
    return this.http
      .post<ConversationResponse>(
        API_ENDPOINTS.CHAT.CONVERSATIONS,
        { otherUserId },
        { context: unwrap },
      )
      .pipe(retry(1), catchError(this.handleError));
  }

  markMessageAsRead(messageId: string): Observable<void> {
    return this.http
      .patch<void>(`${API_ENDPOINTS.CHAT.MESSAGES}/${messageId}/read`, {})
      .pipe(catchError(this.handleError));
  }

  searchUsers(query: string): Observable<User[]> {
    const params = new HttpParams().set('query', query);

    return this.http
      .get<UserSearchResponse>(API_ENDPOINTS.CHAT.USERS_SEARCH, {
        params,
        context: unwrap,
      })
      .pipe(
        map((res) => (res.users ?? []).map((dto) => mapUserDtoToUser(dto))),
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
