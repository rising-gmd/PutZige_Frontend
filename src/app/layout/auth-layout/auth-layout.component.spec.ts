import { render } from '@testing-library/angular';
import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  it('renders', async () => {
    const { getByText } = await render(AuthLayoutComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
