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
