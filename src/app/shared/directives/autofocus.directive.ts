import { Directive, ElementRef, AfterViewInit, inject } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
})
export class AutofocusDirective implements AfterViewInit {
  private el = inject(ElementRef);
  ngAfterViewInit() {
    this.el.nativeElement.focus();
  }
}
