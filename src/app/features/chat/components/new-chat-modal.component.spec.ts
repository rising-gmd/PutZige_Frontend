import { render } from '@testing-library/angular';
import { NewChatModalComponent } from './new-chat-modal.component';
import { NewChatService } from '../services/new-chat.service';
import { of } from 'rxjs';

describe('NewChatModalComponent', () => {
  it('loads recent contacts and suggestions on show', async () => {
    const mockSvc = {
      getRecentContacts: jest.fn(() =>
        of({ contacts: [], lastUpdated: new Date() }),
      ),
      getSuggestedUsers: jest.fn(() =>
        of({ suggestions: [], reason: 'frequent_interaction' }),
      ),
      searchUsers: jest.fn(),
    } as Partial<NewChatService> as NewChatService;

    const { fixture } = await render(NewChatModalComponent, {
      providers: [{ provide: NewChatService, useValue: mockSvc }],
    });

    const instance = fixture.componentInstance;
    instance.show();

    expect(mockSvc.getRecentContacts).toHaveBeenCalled();
    expect(mockSvc.getSuggestedUsers).toHaveBeenCalled();
  });
});
