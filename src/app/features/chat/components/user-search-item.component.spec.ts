import { render, screen, fireEvent } from '@testing-library/angular';
import { UserSearchItemComponent } from './user-search-item.component';
import { UserSearchResult } from '../models/new-chat.models';

describe('UserSearchItemComponent', () => {
  const user: UserSearchResult = {
    id: 'u1',
    username: 'alice',
    email: 'alice@example.com',
    displayName: 'Alice Doe',
    profilePictureUrl: undefined,
    isOnline: true,
  };

  it('renders display name and emits selected on click', async () => {
    const { container, getByRole, fixture } = await render(
      UserSearchItemComponent,
      {
        componentProperties: { user },
      },
    );

    expect(container).toHaveTextContent('Alice Doe');

    const button = getByRole('button', { name: /Start chat with/i });
    // Spy on the EventEmitter's emit method — more reliable than subscribing
    // to the output since it avoids timing/detection subtleties in tests.
    const emitSpy = jest.spyOn(fixture.componentInstance.selected, 'emit');

    await fireEvent.click(button);
    expect(emitSpy).toHaveBeenCalledWith(user);
  });
});
