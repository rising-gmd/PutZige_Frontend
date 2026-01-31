import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appIfPermission]',
})
export class IfPermissionDirective {
  private tpl: TemplateRef<unknown>;
  private vcr: ViewContainerRef;

  // Allow constructor params for unit tests to provide TemplateRef/ViewContainerRef
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(tpl?: TemplateRef<unknown>, vcr?: ViewContainerRef) {
    this.tpl = tpl ?? inject(TemplateRef);
    this.vcr = vcr ?? inject(ViewContainerRef);
  }

  @Input() set appIfPermission(condition: boolean) {
    if (condition) {
      this.vcr.createEmbeddedView(this.tpl);
    } else {
      this.vcr.clear();
    }
  }
}
