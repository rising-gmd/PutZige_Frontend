import { AutofocusDirective } from './autofocus.directive';

describe('AutofocusDirective', () => {
  it('calls focus on the native element in ngAfterViewInit', () => {
    const focusFn = jest.fn();
    const elRef: any = { nativeElement: { focus: focusFn } };
    const dir = new AutofocusDirective(elRef);
    dir.ngAfterViewInit();
    expect(focusFn).toHaveBeenCalled();
  });
});
