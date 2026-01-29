import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('can be instantiated', () => {
    TestBed.configureTestingModule({ providers: [AuthService] });
    const svc = TestBed.inject(AuthService);
    expect(svc).toBeTruthy();
  });
});
