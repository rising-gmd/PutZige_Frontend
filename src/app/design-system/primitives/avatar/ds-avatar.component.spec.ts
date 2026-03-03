import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { DsAvatarComponent } from './ds-avatar.component';

describe('DsAvatarComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  // ── Initials fallback ──────────────────────────────────────────────────

  it('renders initials from name when no profilePictureUrl is provided', async () => {
    await render(DsAvatarComponent, {
      componentInputs: { user: { name: 'Ada Lovelace' } },
    });
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('prefers displayName over name for initials', async () => {
    await render(DsAvatarComponent, {
      componentInputs: {
        user: { name: 'Ada Lovelace', displayName: 'Computing Pioneer' },
      },
    });
    expect(screen.getByText('CP')).toBeTruthy();
  });

  it('renders "?" fallback when both name and displayName are absent', async () => {
    await render(DsAvatarComponent, {
      componentInputs: { user: {} },
    });
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('renders "?" fallback when name is an empty string', async () => {
    await render(DsAvatarComponent, {
      componentInputs: { user: { name: '' } },
    });
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('slices initials to max 2 characters', async () => {
    await render(DsAvatarComponent, {
      componentInputs: { user: { name: 'Ada Grace Lovelace' } },
    });
    expect(screen.getByText('AG')).toBeTruthy();
  });

  // ── Image rendering ────────────────────────────────────────────────────

  it('renders image when profilePictureUrl is provided', async () => {
    await render(DsAvatarComponent, {
      componentInputs: {
        user: { name: 'Ada Lovelace', profilePictureUrl: '/avatar.png' },
      },
    });
    const img = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(img.tagName.toLowerCase()).toBe('img');
    expect(img.getAttribute('src')).toBe('/avatar.png');
  });

  it('does not render an img when profilePictureUrl is absent', async () => {
    const { fixture } = await render(DsAvatarComponent, {
      componentInputs: { user: { name: 'Ada Lovelace' } },
    });
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  // ── Online indicator ───────────────────────────────────────────────────

  it('renders online status dot when showOnline=true and isOnline=true', async () => {
    await render(DsAvatarComponent, {
      componentInputs: {
        user: { name: 'Ada Lovelace' },
        showOnline: true,
        isOnline: true,
      },
    });
    expect(screen.getByRole('img', { name: 'Online' })).toBeTruthy();
  });

  it('renders offline status dot when showOnline=true and isOnline=false', async () => {
    await render(DsAvatarComponent, {
      componentInputs: {
        user: { name: 'Ada Lovelace' },
        showOnline: true,
        isOnline: false,
      },
    });
    expect(screen.getByRole('img', { name: 'Offline' })).toBeTruthy();
  });

  it('does not render status dot when showOnline=false', async () => {
    const { fixture } = await render(DsAvatarComponent, {
      componentInputs: {
        user: { name: 'Ada Lovelace' },
        showOnline: false,
      },
    });
    expect(
      fixture.nativeElement.querySelector('.ds-avatar__status'),
    ).toBeNull();
  });

  // ── Sizes ──────────────────────────────────────────────────────────────

  it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
    'applies the %s size class',
    async (size) => {
      const { fixture } = await render(DsAvatarComponent, {
        componentInputs: { user: { name: 'Ada' }, size },
      });
      expect(
        fixture.nativeElement.querySelector(`.ds-avatar--${size}`),
      ).not.toBeNull();
    },
  );

  // ── Accessibility ──────────────────────────────────────────────────────

  it('sets aria-label to displayName when provided', async () => {
    await render(DsAvatarComponent, {
      componentInputs: {
        user: { name: 'Ada Lovelace', displayName: 'Computing Pioneer' },
      },
    });
    expect(screen.getByRole('img', { name: 'Computing Pioneer' })).toBeTruthy();
  });

  it('has role="img" on the avatar container', async () => {
    const { fixture } = await render(DsAvatarComponent, {
      componentInputs: { user: { name: 'Ada' } },
    });
    expect(fixture.nativeElement.querySelector('[role="img"]')).not.toBeNull();
  });
});
