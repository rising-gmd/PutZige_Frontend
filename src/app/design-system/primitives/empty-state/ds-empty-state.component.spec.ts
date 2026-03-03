import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { DsEmptyStateComponent } from './ds-empty-state.component';

describe('DsEmptyStateComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

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
});
