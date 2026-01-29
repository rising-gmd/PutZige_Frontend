import { IfPermissionDirective } from './if-permission.directive';

describe('IfPermissionDirective', () => {
  it('creates embedded view when set true and clears when false', () => {
    const createEmbeddedView = jest.fn();
    const clear = jest.fn();
    const tpl: any = {};
    const vcr: any = { createEmbeddedView, clear };
    const dir = new IfPermissionDirective(tpl, vcr);

    dir.appIfPermission = true as any;
    expect(createEmbeddedView).toHaveBeenCalledWith(tpl);

    dir.appIfPermission = false as any;
    expect(clear).toHaveBeenCalled();
  });
});
