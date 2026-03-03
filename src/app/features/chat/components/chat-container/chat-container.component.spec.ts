import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { ChatContainerComponent } from './chat-container.component';
import { API_CONFIG } from '../../../../core/config/api.config';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { chatFeature } from '../../../../store/chat/chat.reducer';
import { messagesFeature } from '../../../../store/messages/messages.reducer';
import { presenceFeature } from '../../../../store/presence/presence.reducer';

describe('ChatContainerComponent', () => {
  let fixture: ComponentFixture<ChatContainerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChatContainerComponent],
      providers: [
        provideStore({
          [chatFeature.name]: chatFeature.reducer,
          [messagesFeature.name]: messagesFeature.reducer,
          [presenceFeature.name]: presenceFeature.reducer,
        }),
        // No effects registered — unit test, no side effects wanted.
        provideEffects([]),
        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: 'http://localhost',
            version: 'v1',
            production: false,
          },
        },
        { provide: AuthService, useValue: { getAccessToken: () => null } },
      ],
    });
    fixture = TestBed.createComponent(ChatContainerComponent);
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeInstanceOf(ChatContainerComponent);
  });
});
