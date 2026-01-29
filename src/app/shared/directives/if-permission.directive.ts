import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appIfPermission]',
})
export class IfPermissionDirective {
  constructor(
    private tpl: TemplateRef<unknown>,
    private vcr: ViewContainerRef
  ) {}

  @Input() set appIfPermission(condition: boolean) {
    if (condition) {
      this.vcr.createEmbeddedView(this.tpl as TemplateRef<unknown>);
    } else {
      this.vcr.clear();
    }
  }
}
