jest.setTimeout(20000);
jest.mock('@microsoft/signalr', () => {
  const handlers: Record<string, (...args: unknown[]) => void> = {};

  class FakeConnection {
    start = jest.fn().mockResolvedValue(undefined);
    stop = jest.fn().mockResolvedValue(undefined);
    invoke = jest.fn().mockResolvedValue(undefined);
    on(name: string, cb: (...args: unknown[]) => void) {
      handlers[name] = cb;
    }
    onreconnecting(cb: (...args: unknown[]) => void) {
      handlers['onreconnecting'] = cb;
    }
    onreconnected(cb: (...args: unknown[]) => void) {
      handlers['onreconnected'] = cb;
    }
    onclose(cb: (...args: unknown[]) => void) {
      handlers['onclose'] = cb;
    }
    // helper to trigger events in tests
    __trigger(name: string, ...args: unknown[]) {
      const h = handlers[name];
      if (h) h(...args);
    }
  }

  class HubConnectionBuilder {
    private _url?: string;
    withUrl(url: string) {
      this._url = url;
      return this;
    }
    configureLogging() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    build() {
      return new FakeConnection();
    }
  }
  // Minimal LogLevel enum used by the service
  const LogLevel = { Warning: 1 };

  // Minimal HubConnectionState enum used by the service checks
  const HubConnectionState = { Connected: 1 };

  // Export the HubConnectionState so the service's runtime checks don't read
  // from `undefined` during unit tests.
  return { HubConnectionBuilder, LogLevel, HubConnectionState };
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SignalRService } from './signalr.service';
import { AuthApiService } from '../../../features/auth/services/auth-api.service';
import { AuthService } from '../auth/auth.service';
import { API_CONFIG } from '../../config/api.config';

describe('SignalRService (negotiate)', () => {
  let service: SignalRService;
  let mockApi: Partial<AuthApiService>;

  beforeEach(() => {
    mockApi = { negotiate: jest.fn() } as Partial<AuthApiService>;
    const mockAuth = { logout: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: mockApi },
        { provide: AuthService, useValue: mockAuth },
        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: 'http://localhost',
            version: 'v1',
            production: false,
          },
        },
      ],
    });
    service = TestBed.inject(SignalRService);
  });

  afterEach(() => jest.resetAllMocks());

  it('calls negotiate and starts connection', async () => {
    (mockApi.negotiate as jest.Mock).mockReturnValue(
      of({ accessToken: 't', expiresIn: 30 }),
    );
    await service.startConnection();
    expect(mockApi.negotiate).toHaveBeenCalled();
  });
});
import * as s from './signalr.service';

describe('signalr.service', () => {
  it('module loads', () => {
    expect(s).toBeDefined();
  });
});
