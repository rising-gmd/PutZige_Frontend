import { render } from '@testing-library/angular';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  it('renders content', async () => {
    const { getByText } = await render(AvatarComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
