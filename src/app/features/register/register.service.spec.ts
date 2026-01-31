import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RegisterService, RegisterRequest } from './register.service';
import { API_ENDPOINTS } from '../../core/config/api.config';

describe('RegisterService', () => {
  let svc: RegisterService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    svc = TestBed.inject(RegisterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('register posts to users create endpoint', (done) => {
    const payload: RegisterRequest = {
      email: 'a@b.com',
      username: 'u',
      password: 'p',
    };
    const resp = { data: { id: '1', email: 'a@b.com', username: 'u' } } as any;

    svc.register(payload).subscribe((res) => {
      expect(res).toEqual(resp);
      done();
    });

    const req = httpMock.expectOne(API_ENDPOINTS.USERS.CREATE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(resp);
  });
});
