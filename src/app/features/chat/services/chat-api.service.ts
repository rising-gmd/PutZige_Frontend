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
  ConversationsListResponse,
  ConversationHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
  UserSearchResponse,
  UserDto,
  ApiResponse,
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
    return this.http.get<User>(API_ENDPOINTS.CHAT.ME);
  }

  /**
   * Fetch list of all conversations for current user
   * @param refresh - If true, bypass cache and fetch fresh data
   * @returns Observable of conversations array
   */
  getConversations(refresh = false): Observable<Conversation[]> {
    if (!refresh && this.conversationsCache$) return this.conversationsCache$;
    this.conversationsCache$ = this.http
      .get<
        ApiResponse<ConversationsListResponse>
      >(API_ENDPOINTS.CHAT.CONVERSATIONS)
      .pipe(
        map((res) => res.data?.conversations ?? []),
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
      .get<
        ApiResponse<ConversationHistoryResponse>
      >(API_ENDPOINTS.CHAT.CONVERSATION_MESSAGES(conversationId), { params })
      .pipe(
        map((r) => r.data as ConversationHistoryResponse),
        catchError(this.handleError),
      );
  }

  sendMessage(request: SendMessageRequest): Observable<SendMessageResponse> {
    return this.http
      .post<
        ApiResponse<SendMessageResponse>
      >(API_ENDPOINTS.CHAT.MESSAGES, request)
      .pipe(
        map((r) => r.data as SendMessageResponse),
        retry(2),
        catchError(this.handleError),
      );
  }

  markMessageAsRead(messageId: string): Observable<void> {
    return this.http
      .patch<void>(`${API_ENDPOINTS.CHAT.MESSAGES}/${messageId}/read`, {})
      .pipe(catchError(this.handleError));
  }

  searchUsers(query: string): Observable<User[]> {
    const params = new HttpParams().set('query', query);
    return this.http
      .get<
        ApiResponse<UserSearchResponse>
      >(API_ENDPOINTS.CHAT.USERS_SEARCH, { params })
      .pipe(
        map((r) => (r.data?.users ?? []).map(mapUserDtoToUser)),
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

function mapUserDtoToUser(dto: UserDto): User {
  // Safely access optional/unknown fields without using `any`
  const asRecord = dto as unknown as Record<string, unknown>;
  const maybeIsOnline = asRecord['isOnline'] as boolean | undefined;
  const maybeLastSeen = asRecord['lastSeen'] as string | Date | undefined;

  return {
    id: (dto.id ?? (asRecord['userId'] as string) ?? '') as string,
    username: (dto.username ?? '') as string,
    email: (dto.email ?? '') as string,
    displayName: (dto.displayName ?? '') as string,
    jobTitle: dto.jobTitle,
    bio: dto.bio,
    profilePictureUrl: dto.profilePictureUrl,
    isOnline: maybeIsOnline ?? false,
    lastSeen: maybeLastSeen ? new Date(String(maybeLastSeen)) : undefined,
  } as User;
}
