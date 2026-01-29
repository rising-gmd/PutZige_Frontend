import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appIfPermission]'
})
export class IfPermissionDirective {
  @Input() set appIfPermission(condition: boolean) {
    if (condition) {
      this.vcr.createEmbeddedView(this.tpl);
    } else {
      this.vcr.clear();
    }
  }
  constructor(private tpl: TemplateRef<any>, private vcr: ViewContainerRef) {}
}
