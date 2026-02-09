import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { HttpClient } from '@angular/common/http';

describe('AuthApiService', () => {
  let svc: AuthApiService;
  const mockHttp = { post: jest.fn() } as unknown as HttpClient;

  beforeEach(() => {
    (mockHttp.post as jest.Mock).mockReturnValue(of({ success: true }));
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: mockHttp }, AuthApiService],
    });
    svc = TestBed.inject(AuthApiService);
  });

  it('verifyEmail calls http.post and returns success true', (done) => {
    svc.verifyEmail('tok').subscribe((res) => {
      expect(res).toEqual({ success: true });
      expect(mockHttp.post).toHaveBeenCalled();
      done();
    });
  });

  it('resendVerification calls http.post and returns success true', (done) => {
    svc.resendVerification('tok').subscribe((res) => {
      expect(res).toEqual({ success: true });
      expect(mockHttp.post).toHaveBeenCalled();
      done();
    });
  });
});

import * as s from './auth-api.service';

describe('auth-api.service', () => {
  it('module loads', () => {
    expect(s).toBeDefined();
  });
});
