import { Directive, ElementRef, AfterViewInit, inject } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
})
export class AutofocusDirective implements AfterViewInit {
  private readonly el: ElementRef<HTMLElement>;

  // Allow constructor param for easier unit testing (tests supply a mock ElementRef)
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(el?: ElementRef<HTMLElement>) {
    this.el = el ?? inject(ElementRef);
  }

  ngAfterViewInit() {
    this.el.nativeElement.focus();
  }
}
