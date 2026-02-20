import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);

  /**
   * Mark an entire conversation as read for the current user.
   * Silent-fail: this is best-effort and should not surface errors to the UI.
   */
  markConversationAsRead(conversationId: string): Observable<void> {
    return this.http
      .patch<void>(
        `${API_ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/read`,
        {},
      )
      .pipe(catchError(() => of(undefined)));
  }
}
