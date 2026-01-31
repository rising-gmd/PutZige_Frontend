import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  let svc: AuthApiService;

  beforeEach(() => {
    svc = new AuthApiService();
  });

  it('login resolves success true', async () => {
    const res = await svc.login('u', 'p');
    expect(res).toEqual({ success: true });
  });

  it('register resolves success true', async () => {
    const res = await svc.register('u', 'p');
    expect(res).toEqual({ success: true });
  });

  it('forgotPassword resolves success true', async () => {
    const res = await svc.forgotPassword('a@b.com');
    expect(res).toEqual({ success: true });
  });
});
import * as s from './auth-api.service';

describe('auth-api.service', () => {
  it('module loads', () => {
    expect(s).toBeDefined();
  });
});
