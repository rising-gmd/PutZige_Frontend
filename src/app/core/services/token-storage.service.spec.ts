import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorageService);
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve token', () => {
    service.setToken('test_key', 'test_value');
    expect(service.getToken('test_key')).toBe('test_value');
  });

  it('should persist to sessionStorage', () => {
    service.setToken('persist_key', 'persist_value');
    expect(sessionStorage.getItem('persist_key')).toBe('persist_value');
  });

  it('should restore from sessionStorage on cache miss', () => {
    sessionStorage.setItem('restore_key', 'restore_value');
    expect(service.getToken('restore_key')).toBe('restore_value');
  });

  it('should remove token from memory and sessionStorage', () => {
    service.setToken('remove_key', 'remove_value');
    service.removeToken('remove_key');
    expect(service.getToken('remove_key')).toBeNull();
    expect(sessionStorage.getItem('remove_key')).toBeNull();
  });

  it('should clear all tokens', () => {
    service.setToken('key1', 'value1');
    service.setToken('key2', 'value2');
    service.clear();
    expect(service.getToken('key1')).toBeNull();
    expect(service.getToken('key2')).toBeNull();
  });
});
