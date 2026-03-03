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

  it('renders initials when no profilePictureUrl is provided', async () => {
    await render(DsAvatarComponent, {
      componentInputs: { user: { name: 'Ada Lovelace' } },
    });
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('renders image when profilePictureUrl is provided', async () => {
    await render(DsAvatarComponent, {
      componentInputs: {
        user: { name: 'Ada Lovelace', profilePictureUrl: '/avatar.png' },
      },
    });
    const img = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(img.tagName.toLowerCase()).toBe('img');
  });

  it('renders online status dot when showOnline is true and isOnline is true', async () => {
    await render(DsAvatarComponent, {
      componentInputs: {
        user: { name: 'Ada Lovelace' },
        showOnline: true,
        isOnline: true,
      },
    });
    expect(screen.getByRole('img', { name: 'Online' })).toBeTruthy();
  });

  it('applies size class based on size input', async () => {
    const { fixture } = await render(DsAvatarComponent, {
      componentInputs: { user: { name: 'Ada Lovelace' }, size: 'lg' },
    });
    const el = fixture.nativeElement.querySelector('.ds-avatar--lg');
    expect(el).not.toBeNull();
  });
});
