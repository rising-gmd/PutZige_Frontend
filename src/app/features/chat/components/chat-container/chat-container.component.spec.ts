import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatContainerComponent } from './chat-container.component';
import { API_CONFIG } from '../../../../core/config/api.config';
import { ChatStateService } from '../../services/chat-state.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

describe('ChatContainerComponent', () => {
  let fixture: ComponentFixture<ChatContainerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChatContainerComponent],
      providers: [
        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: 'http://localhost',
            version: 'v1',
            production: false,
          },
        },
        {
          provide: ChatStateService,
          useValue: { initialize: async () => Promise.resolve() },
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
