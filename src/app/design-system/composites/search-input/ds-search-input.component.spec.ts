import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsSearchInputComponent } from './ds-search-input.component';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function setup(
  inputs: Partial<{
    value: string;
    placeholder: string;
    debounceMs: number;
    disabled: boolean;
  }> = {},
) {
  const user = userEvent.setup();
  const rendered = await render(DsSearchInputComponent, {
    inputs: { debounceMs: 0, ...inputs },
    providers: [provideZonelessChangeDetection()],
  });
  const input = screen.getByRole('searchbox') as HTMLInputElement;
  return {
    user,
    rendered,
    input,
    component: rendered.fixture.componentInstance,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DsSearchInputComponent', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  afterEach(() => jest.useRealTimers());

  // ── Rendering ───────────────────────────────────────────────────────────────

  it('renders the input element', async () => {
    await setup();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('applies placeholder passed via input', async () => {
    await setup({ placeholder: 'Find people…' });
    expect(screen.getByPlaceholderText('Find people…')).toBeInTheDocument();
  });

  it('disables the input when disabled=true', async () => {
    await setup({ disabled: true });
    expect(screen.getByRole('searchbox')).toBeDisabled();
  });

  it('does not show clear button when field is empty', async () => {
    await setup({ value: '' });
    expect(screen.queryByRole('button', { name: /clear search/i })).toBeNull();
  });

  it('shows clear button when value is present', async () => {
    await setup({ value: 'hello' });
    expect(
      screen.getByRole('button', { name: /clear search/i }),
    ).toBeInTheDocument();
  });

  it('does NOT show clear button when disabled even with a value', async () => {
    await setup({ value: 'hello', disabled: true });
    expect(screen.queryByRole('button', { name: /clear search/i })).toBeNull();
  });

  // ── External value sync ─────────────────────────────────────────────────────

  it('reflects externally provided value as input field value', async () => {
    const { input } = await setup({ value: 'preset' });
    expect(input.value).toBe('preset');
  });

  // ── Typing ──────────────────────────────────────────────────────────────────

  it('emits valueChange after debounce elapses', async () => {
    const handler = jest.fn();
    const { rendered, user, input } = await setup({ debounceMs: 300 });
    rendered.fixture.componentInstance.valueChange.subscribe(handler);

    await user.type(input, 'abc');
    expect(handler).not.toHaveBeenCalled(); // debounce not yet elapsed

    jest.advanceTimersByTime(300);
    TestBed.tick();

    expect(handler).toHaveBeenCalledWith('abc');
    expect(handler).toHaveBeenCalledTimes(1); // coalesced, not per-keystroke
  });

  it('does NOT emit before debounce elapses', async () => {
    const handler = jest.fn();
    const { rendered, user, input } = await setup({ debounceMs: 300 });
    rendered.fixture.componentInstance.valueChange.subscribe(handler);

    await user.type(input, 'hello');
    jest.advanceTimersByTime(100); // only 100ms of 300ms elapsed
    TestBed.tick();

    expect(handler).not.toHaveBeenCalled();
  });

  // ── Clear ───────────────────────────────────────────────────────────────────

  it('clears the field and emits cleared + empty valueChange on clear click', async () => {
    const clearHandler = jest.fn();
    const changeHandler = jest.fn();
    const { rendered, user } = await setup({ value: 'some text' });
    rendered.fixture.componentInstance.cleared.subscribe(clearHandler);
    rendered.fixture.componentInstance.valueChange.subscribe(changeHandler);

    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearBtn);
    TestBed.tick();

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(clearHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler).toHaveBeenCalledWith('');
  });

  // ── Focus / blur ────────────────────────────────────────────────────────────

  it('adds --focused modifier class on focus', async () => {
    const { user, input } = await setup();
    await user.click(input);
    const wrapper = input.closest('.ds-search-input');
    expect(wrapper).toHaveClass('ds-search-input--focused');
  });

  it('removes --focused modifier class on blur', async () => {
    const { user, input } = await setup();
    await user.click(input);
    await user.tab(); // blur by moving focus elsewhere
    const wrapper = input.closest('.ds-search-input');
    expect(wrapper).not.toHaveClass('ds-search-input--focused');
  });

  // ── Programmatic focus ──────────────────────────────────────────────────────

  it('focus() method moves focus to the underlying input', async () => {
    const { component, input } = await setup();
    component.focus();
    TestBed.tick();
    expect(document.activeElement).toBe(input);
  });

  // ── Accessibility ────────────────────────────────────────────────────────────

  it('has type="search" for correct AT announcement', async () => {
    await setup();
    expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
  });

  it('aria-label on input matches placeholder', async () => {
    await setup({ placeholder: 'Search users' });
    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'aria-label',
      'Search users',
    );
  });
});
