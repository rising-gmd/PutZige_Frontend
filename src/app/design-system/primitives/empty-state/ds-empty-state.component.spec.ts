import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { DsEmptyStateComponent } from './ds-empty-state.component';

describe('DsEmptyStateComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  // ── Content ────────────────────────────────────────────────────────────

  it('renders title', async () => {
    await render(DsEmptyStateComponent, {
      componentInputs: { icon: 'pi-comments', title: 'No messages yet' },
    });
    expect(screen.getByText('No messages yet')).toBeTruthy();
  });

  it('renders subtitle when provided', async () => {
    await render(DsEmptyStateComponent, {
      componentInputs: {
        icon: 'pi-comments',
        title: 'No messages',
        subtitle: 'Start a conversation',
      },
    });
    expect(screen.getByText('Start a conversation')).toBeTruthy();
  });

  it('does not render subtitle when omitted', async () => {
    const { fixture } = await render(DsEmptyStateComponent, {
      componentInputs: { icon: 'pi-comments', title: 'No messages' },
    });
    expect(
      fixture.nativeElement.querySelector('.ds-empty-state__subtitle'),
    ).toBeNull();
  });

  // ── Action button ──────────────────────────────────────────────────────

  it('renders action button when actionLabel is provided', async () => {
    await render(DsEmptyStateComponent, {
      componentInputs: {
        icon: 'pi-plus',
        title: 'No contacts',
        actionLabel: 'Add contact',
      },
    });
    expect(screen.getByRole('button', { name: 'Add contact' })).toBeTruthy();
  });

  it('does not render action button when actionLabel is omitted', async () => {
    const { fixture } = await render(DsEmptyStateComponent, {
      componentInputs: { icon: 'pi-comments', title: 'No messages' },
    });
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('emits action event when action button is clicked', async () => {
    const { fixture } = await render(DsEmptyStateComponent, {
      componentInputs: {
        icon: 'pi-plus',
        title: 'No contacts',
        actionLabel: 'Add contact',
      },
    });
    let emitted = false;
    fixture.componentInstance.action.subscribe(() => (emitted = true));
    await userEvent.click(screen.getByRole('button', { name: 'Add contact' }));
    expect(emitted).toBe(true);
  });

  // ── Sizes ──────────────────────────────────────────────────────────────

  it.each(['sm', 'md', 'lg'] as const)(
    'applies %s size class',
    async (size) => {
      const { fixture } = await render(DsEmptyStateComponent, {
        componentInputs: { icon: 'pi-comments', title: 'Empty', size },
      });
      expect(
        fixture.nativeElement.querySelector(`.ds-empty-state--${size}`),
      ).not.toBeNull();
    },
  );

  // ── Accessibility ──────────────────────────────────────────────────────

  it('has role="status" on the container', async () => {
    const { fixture } = await render(DsEmptyStateComponent, {
      componentInputs: { icon: 'pi-comments', title: 'Empty' },
    });
    expect(
      fixture.nativeElement.querySelector('[role="status"]'),
    ).not.toBeNull();
  });

  it('has aria-hidden on the icon wrapper', async () => {
    const { fixture } = await render(DsEmptyStateComponent, {
      componentInputs: { icon: 'pi-comments', title: 'Empty' },
    });
    expect(
      fixture.nativeElement.querySelector('[aria-hidden="true"]'),
    ).not.toBeNull();
  });
});
