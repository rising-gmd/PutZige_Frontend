import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AppInputComponent } from './app-input.component';

describe('AppInputComponent', () => {
  it('writeValue sets value and update notifies onChange', async () => {
    const { fixture } = await render(AppInputComponent);
    const comp = fixture.componentInstance;

    const changes: string[] = [];
    comp.registerOnChange((v) => changes.push(v));

    comp.writeValue('hello');
    expect(comp.value).toBe('hello');

    comp.update('world');
    expect(comp.value).toBe('world');
    expect(changes).toEqual(['world']);
  });

  it('onTouched calls registered touched callback', async () => {
    const { fixture } = await render(AppInputComponent);
    const comp = fixture.componentInstance;

    let touched = false;
    comp.registerOnTouched(() => (touched = true));

    comp.onTouched();
    expect(touched).toBe(true);
  });
});
