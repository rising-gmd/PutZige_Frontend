import { render } from '@testing-library/angular';
import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  it('renders', async () => {
    const { getByText } = await render(LoaderComponent);
    expect(getByText('hello hi')).toBeTruthy();
  });
});
