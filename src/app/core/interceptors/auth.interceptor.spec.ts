import { TestBed } from '@angular/core/testing';
import { Injector, runInInjectionContext } from '@angular/core';
import {
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';

describe('authInterceptor', () => {
  let mockAuth: Partial<AuthService>;
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockAuth = {
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
    } as Partial<AuthService>;

    mockRouter = { navigate: jest.fn() } as Partial<Router>;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  afterEach(() => {
    document.cookie =
      'XSRF-TOKEN=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    jest.resetAllMocks();
  });

  it('attaches withCredentials and XSRF header when cookie present', (done) => {
    document.cookie = 'XSRF-TOKEN=abc123';

    let capturedReq: HttpRequest<unknown> | null = null;
    const next = (req: HttpRequest<unknown>) => {
      capturedReq = req;
      return of(new HttpResponse({ status: 200 }));
    };

    const injector = TestBed.inject(Injector);
    runInInjectionContext(injector, () => {
      authInterceptor(new HttpRequest('GET', '/api/test'), next).subscribe({
        next: () => {
          expect(capturedReq).not.toBeNull();
          expect(capturedReq?.withCredentials).toBe(true);
          expect(capturedReq?.headers.get('X-XSRF-TOKEN')).toBe('abc123');
          done();
        },
        error: done.fail,
      });
    });
  });

  it('on 401 attempts refresh and retries request when refresh succeeds', (done) => {
    const refreshSpy = jest.fn().mockReturnValue(of(true));
    mockAuth.refreshAccessToken = refreshSpy;

    let callCount = 0;
    const next = (req: HttpRequest<unknown>) => {
      callCount += 1;
      if (callCount === 1)
        return throwError(() => new HttpErrorResponse({ status: 401 }));
      return of(new HttpResponse({ status: 200 }));
    };

    const injector = TestBed.inject(Injector);
    runInInjectionContext(injector, () => {
      authInterceptor(new HttpRequest('GET', '/api/protected'), next).subscribe(
        {
          next: (res) => {
            expect(callCount).toBe(2);
            expect(res instanceof HttpResponse).toBe(true);
            done();
          },
          error: done.fail,
        },
      );
    });
  });

  it('on 401 and refresh fails forces logout and navigates to login', (done) => {
    const refreshSpy = jest.fn().mockReturnValue(of(false));
    mockAuth.refreshAccessToken = refreshSpy;

    const logoutSpy = jest.fn();
    mockAuth.logout = logoutSpy;

    const next = () => throwError(() => new HttpErrorResponse({ status: 401 }));

    const injector = TestBed.inject(Injector);
    runInInjectionContext(injector, () => {
      authInterceptor(new HttpRequest('GET', '/api/protected'), next).subscribe(
        {
          next: () => done.fail('should not succeed'),
          error: (err) => {
            expect(logoutSpy).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalled();
            done();
          },
        },
      );
    });
  });
});
import * as mod from './auth.interceptor';

describe('auth.interceptor', () => {
  it('module loads', () => {
    expect(mod).toBeDefined();
  });
});
