import { ElementRef } from '@angular/core';
import { AutofocusDirective } from './autofocus.directive';

describe('AutofocusDirective', () => {
  it('calls focus on the native element in ngAfterViewInit', () => {
    const focusFn = jest.fn();
    const elRef = {
      nativeElement: { focus: focusFn },
    } as unknown as ElementRef<HTMLElement>;
    const dir = new AutofocusDirective(elRef);
    dir.ngAfterViewInit();
    expect(focusFn).toHaveBeenCalled();
  });
});
