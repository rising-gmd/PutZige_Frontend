import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthApiService } from '../../../features/auth/services/auth-api.service';
import { Router } from '@angular/router';

describe('AuthService (cookie-based)', () => {
  let service: AuthService;
  let mockApi: Partial<AuthApiService>;
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockApi = {
      me: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    } as Partial<AuthApiService>;

    mockRouter = { navigate: jest.fn() } as Partial<Router>;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: mockApi },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => jest.resetAllMocks());

  it('checkAuthStatus sets user when /me returns user', (done) => {
    const user = { id: 'u1', email: 'a@b.com', displayName: 'A' } as any;
    (mockApi.me as jest.Mock).mockReturnValue(of(user));

    service.checkAuthStatus().subscribe((res) => {
      expect(res).toEqual(user);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getCurrentUser()).toEqual(user);
      done();
    });
  });

  it('checkAuthStatus clears state on 401', (done) => {
    (mockApi.me as jest.Mock).mockReturnValue(
      throwError(() => new Error('401')),
    );

    service.checkAuthStatus().subscribe((res) => {
      expect(res).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getCurrentUser()).toBeNull();
      done();
    });
  });

  it('refreshAccessToken is single-flight and not duplicated', (done) => {
    const subj = new Subject<void>();
    (mockApi.refresh as jest.Mock).mockReturnValue(subj.asObservable());

    // Call refreshAccessToken twice before the underlying refresh completes
    const obs1 = service.refreshAccessToken();
    const obs2 = service.refreshAccessToken();

    let results = 0;
    obs1.subscribe((ok) => {
      expect(ok).toBe(true);
      results += 1;
      if (results === 2) done();
    });
    obs2.subscribe((ok) => {
      expect(ok).toBe(true);
      results += 1;
      if (results === 2) done();
    });

    // complete the underlying refresh
    subj.next();
    subj.complete();
  });
});
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('is created', () => {
    expect(service).toBeInstanceOf(AuthService);
  });
});
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('can be instantiated', () => {
    TestBed.configureTestingModule({ providers: [AuthService] });
    const svc = TestBed.inject(AuthService);
    expect(svc).toBeTruthy();
  });
});
