import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AppButtonComponent } from './app-button.component';

describe('AppButtonComponent', () => {
  it('when clicked and enabled, then emits clicked', async () => {
    const { fixture } = await render(AppButtonComponent, {
      componentProperties: { label: 'Go' },
    });
    const btn = screen.getByRole('button', { name: /go/i });

    let emitted = false;
    fixture.componentInstance.clicked.subscribe(() => (emitted = true));

    await userEvent.click(btn);
    expect(emitted).toBe(true);
  });

  it('when disabled, then click does not emit', async () => {
    const { fixture } = await render(AppButtonComponent, {
      componentProperties: { label: 'Go', disabled: true },
    });
    const btn = screen.getByRole('button', { name: /go/i });

    let emitted = false;
    fixture.componentInstance.clicked.subscribe(() => (emitted = true));

    await userEvent.click(btn);
    expect(emitted).toBe(false);
  });

  it('when loading, then click does not emit', async () => {
    const { fixture } = await render(AppButtonComponent, {
      componentProperties: { label: 'Go', loading: true },
    });
    const btn = screen.getByRole('button', { name: /go/i });

    let emitted = false;
    fixture.componentInstance.clicked.subscribe(() => (emitted = true));

    await userEvent.click(btn);
    expect(emitted).toBe(false);
  });
});
