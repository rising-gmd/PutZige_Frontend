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
  private readonly tpl = inject(TemplateRef) as TemplateRef<unknown>;
  private readonly vcr = inject(ViewContainerRef) as ViewContainerRef;

  @Input() set appIfPermission(condition: boolean) {
    if (condition) {
      this.vcr.createEmbeddedView(this.tpl);
    } else {
      this.vcr.clear();
    }
  }
}
