import { render } from '@testing-library/angular';
import { AppPasswordComponent } from './app-password.component';

describe('AppPasswordComponent', () => {
  it('writeValue and update propagate changes', async () => {
    const { fixture } = await render(AppPasswordComponent);
    const comp = fixture.componentInstance;

    const changes: string[] = [];
    comp.registerOnChange((v) => changes.push(v));

    comp.writeValue('abc');
    expect(comp.value).toBe('abc');

    comp.update('def');
    expect(comp.value).toBe('def');
    expect(changes).toEqual(['def']);
  });

  it('setDisabledState updates disabled flag', async () => {
    const { fixture } = await render(AppPasswordComponent);
    const comp = fixture.componentInstance;

    comp.setDisabledState(true);
    expect(comp.disabled).toBe(true);
  });
});
