import { TemplateRef, ViewContainerRef } from '@angular/core';
import { IfPermissionDirective } from './if-permission.directive';

describe('IfPermissionDirective', () => {
  it('creates embedded view when set true and clears when false', () => {
    const createEmbeddedView = jest.fn();
    const clear = jest.fn();
    const tpl = {} as unknown as TemplateRef<unknown>;
    const vcr = { createEmbeddedView, clear } as unknown as ViewContainerRef;
    const dir = new IfPermissionDirective(tpl, vcr);

    dir.appIfPermission = true;
    expect(createEmbeddedView).toHaveBeenCalledWith(tpl);

    dir.appIfPermission = false;
    expect(clear).toHaveBeenCalled();
  });
});
