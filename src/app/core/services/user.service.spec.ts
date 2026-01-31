import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UserService } from './user.service';
import { API_ENDPOINTS } from '../config/api.config';

describe('UserService', () => {
  let svc: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    svc = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getUsers issues GET to users list endpoint', (done) => {
    const mock = [{ id: '1', name: 'A', email: 'a@x' }];

    svc.getUsers().subscribe((res) => {
      expect(res).toEqual(mock);
      done();
    });

    const req = httpMock.expectOne(API_ENDPOINTS.USERS.LIST);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getUserById issues GET to detail endpoint', (done) => {
    const id = '42';
    const mock = { id, name: 'User', email: 'u@x' };

    svc.getUserById(id).subscribe((res) => {
      expect(res).toEqual(mock);
      done();
    });

    const req = httpMock.expectOne(API_ENDPOINTS.USERS.DETAIL(id));
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });
});
