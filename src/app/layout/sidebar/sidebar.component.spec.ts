import { render } from '@testing-library/angular';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  it('renders', async () => {
    const { getByText } = await render(SidebarComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
