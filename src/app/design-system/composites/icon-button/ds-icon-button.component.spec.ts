import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { DsIconButtonComponent } from './ds-icon-button.component';

describe('DsIconButtonComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('renders a button with the given aria-label', async () => {
    await render(DsIconButtonComponent, {
      componentInputs: { icon: 'pi-video', ariaLabel: 'Video call' },
    });
    expect(screen.getByRole('button', { name: 'Video call' })).toBeTruthy();
  });

  it('emits clicked when clicked and not disabled', async () => {
    const { fixture } = await render(DsIconButtonComponent, {
      componentInputs: { icon: 'pi-video', ariaLabel: 'Video call' },
    });
    let emitted = false;
    fixture.componentInstance.clicked.subscribe(() => (emitted = true));
    await userEvent.click(screen.getByRole('button', { name: 'Video call' }));
    expect(emitted).toBe(true);
  });

  it('does not emit clicked when disabled', async () => {
    const { fixture } = await render(DsIconButtonComponent, {
      componentInputs: {
        icon: 'pi-video',
        ariaLabel: 'Video call',
        disabled: true,
      },
    });
    let emitted = false;
    fixture.componentInstance.clicked.subscribe(() => (emitted = true));
    await userEvent.click(screen.getByRole('button', { name: 'Video call' }));
    expect(emitted).toBe(false);
  });

  it('applies size class', async () => {
    const { fixture } = await render(DsIconButtonComponent, {
      componentInputs: {
        icon: 'pi-video',
        ariaLabel: 'Video call',
        size: 'lg',
      },
    });
    expect(
      fixture.nativeElement.querySelector('.ds-icon-button--lg'),
    ).not.toBeNull();
  });
});
