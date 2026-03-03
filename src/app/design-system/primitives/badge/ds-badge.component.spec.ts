import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { DsBadgeComponent } from './ds-badge.component';

describe('DsBadgeComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('renders count when count > 0 and visible is true', async () => {
    await render(DsBadgeComponent, { componentInputs: { count: 5 } });
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('renders max+ when count exceeds max', async () => {
    await render(DsBadgeComponent, { componentInputs: { count: 150 } });
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('renders custom max+', async () => {
    await render(DsBadgeComponent, { componentInputs: { count: 10, max: 9 } });
    expect(screen.getByText('9+')).toBeTruthy();
  });

  it('renders nothing when count is 0', async () => {
    const { fixture } = await render(DsBadgeComponent, {
      componentInputs: { count: 0 },
    });
    expect(fixture.nativeElement.querySelector('.ds-badge')).toBeNull();
  });

  it('renders nothing when visible is false', async () => {
    const { fixture } = await render(DsBadgeComponent, {
      componentInputs: { count: 5, visible: false },
    });
    expect(fixture.nativeElement.querySelector('.ds-badge')).toBeNull();
  });
});
