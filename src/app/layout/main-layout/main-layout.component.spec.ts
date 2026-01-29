import { render } from '@testing-library/angular';
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  it('renders', async () => {
    const { getByText } = await render(MainLayoutComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
