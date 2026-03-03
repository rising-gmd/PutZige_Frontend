import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { DsSpinnerComponent } from './ds-spinner.component';

describe('DsSpinnerComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('renders with default aria-label "Loading"', async () => {
    await render(DsSpinnerComponent);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
  });

  it('renders with custom aria-label', async () => {
    await render(DsSpinnerComponent, {
      componentInputs: { ariaLabel: 'Sending message' },
    });
    expect(
      screen.getByRole('status', { name: 'Sending message' }),
    ).toBeTruthy();
  });

  it('applies size class', async () => {
    const { fixture } = await render(DsSpinnerComponent, {
      componentInputs: { size: 'lg' },
    });
    expect(
      fixture.nativeElement.querySelector('.ds-spinner--lg'),
    ).not.toBeNull();
  });
});
