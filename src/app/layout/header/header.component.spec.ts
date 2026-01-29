import { render } from '@testing-library/angular';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  it('renders', async () => {
    const { getByText } = await render(HeaderComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
