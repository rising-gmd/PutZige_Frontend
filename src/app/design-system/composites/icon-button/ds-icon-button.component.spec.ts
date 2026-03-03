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

  // ── Rendering ──────────────────────────────────────────────────────────

  it('renders a button with the given aria-label', async () => {
    await render(DsIconButtonComponent, {
      componentInputs: { icon: 'pi-video', ariaLabel: 'Video call' },
    });
    expect(screen.getByRole('button', { name: 'Video call' })).toBeTruthy();
  });

  it('always renders a button with the ds-icon-button base class', async () => {
    const { fixture } = await render(DsIconButtonComponent, {
      componentInputs: { icon: 'pi-video', ariaLabel: 'Video call' },
    });
    expect(
      fixture.nativeElement.querySelector('button.ds-icon-button'),
    ).not.toBeNull();
  });

  // ── Interaction ────────────────────────────────────────────────────────

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

  // ── Sizes ──────────────────────────────────────────────────────────────

  it.each(['sm', 'md', 'lg'] as const)(
    'applies %s size class',
    async (size) => {
      const { fixture } = await render(DsIconButtonComponent, {
        componentInputs: { icon: 'pi-video', ariaLabel: 'Video call', size },
      });
      expect(
        fixture.nativeElement.querySelector(`.ds-icon-button--${size}`),
      ).not.toBeNull();
    },
  );

  // ── Variants ───────────────────────────────────────────────────────────

  it.each(['default', 'fab', 'ghost'] as const)(
    'applies %s variant class',
    async (variant) => {
      const { fixture } = await render(DsIconButtonComponent, {
        componentInputs: { icon: 'pi-plus', ariaLabel: 'Add', variant },
      });
      expect(
        fixture.nativeElement.querySelector(`.ds-icon-button--${variant}`),
      ).not.toBeNull();
    },
  );

  // ── Active state ───────────────────────────────────────────────────────

  it('applies is-active class when active=true', async () => {
    const { fixture } = await render(DsIconButtonComponent, {
      componentInputs: { icon: 'pi-phone', ariaLabel: 'Mute', active: true },
    });
    expect(
      fixture.nativeElement.querySelector('button.is-active'),
    ).not.toBeNull();
  });

  it('sets aria-pressed="true" when active=true', async () => {
    await render(DsIconButtonComponent, {
      componentInputs: { icon: 'pi-phone', ariaLabel: 'Mute', active: true },
    });
    const btn = screen.getByRole('button', { name: 'Mute' });
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('does not set aria-pressed when active=false', async () => {
    await render(DsIconButtonComponent, {
      componentInputs: { icon: 'pi-phone', ariaLabel: 'Mute', active: false },
    });
    const btn = screen.getByRole('button', { name: 'Mute' });
    expect(btn.getAttribute('aria-pressed')).toBeNull();
  });

  // ── Accessibility ──────────────────────────────────────────────────────

  it('has a title attribute matching ariaLabel', async () => {
    await render(DsIconButtonComponent, {
      componentInputs: { icon: 'pi-video', ariaLabel: 'Video call' },
    });
    const btn = screen.getByRole('button', { name: 'Video call' });
    expect(btn.getAttribute('title')).toBe('Video call');
  });

  it('has aria-hidden on the icon element', async () => {
    const { fixture } = await render(DsIconButtonComponent, {
      componentInputs: { icon: 'pi-video', ariaLabel: 'Video call' },
    });
    expect(
      fixture.nativeElement.querySelector('[aria-hidden="true"]'),
    ).not.toBeNull();
  });
});
