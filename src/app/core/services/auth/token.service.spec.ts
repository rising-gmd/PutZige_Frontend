import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  it('can be instantiated', () => {
    TestBed.configureTestingModule({ providers: [TokenService] });
    const svc = TestBed.inject(TokenService);
    expect(svc).toBeTruthy();
  });
});
