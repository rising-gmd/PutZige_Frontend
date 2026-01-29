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
  private tpl = inject<TemplateRef<unknown>>(TemplateRef);
  private vcr = inject(ViewContainerRef);

  @Input() set appIfPermission(condition: boolean) {
    if (condition) {
      this.vcr.createEmbeddedView(this.tpl as TemplateRef<unknown>);
    } else {
      this.vcr.clear();
    }
  }
}
