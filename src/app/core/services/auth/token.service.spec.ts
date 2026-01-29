import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  it('is created', () => {
    expect(service).toBeInstanceOf(TokenService);
  });
});
import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  it('can be instantiated', () => {
    TestBed.configureTestingModule({ providers: [TokenService] });
    const svc = TestBed.inject(TokenService);
    expect(svc).toBeTruthy();
  });
});
