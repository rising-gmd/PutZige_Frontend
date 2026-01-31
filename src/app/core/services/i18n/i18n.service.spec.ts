import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let mockTranslate: any;
  let service: I18nService;

  beforeEach(() => {
    mockTranslate = {
      addLangs: jest.fn(),
      setDefaultLang: jest.fn(),
      use: jest.fn().mockReturnValue(of(true)),
      instant: jest.fn().mockReturnValue('t'),
      get: jest.fn().mockReturnValue(of('v')),
      stream: jest.fn().mockReturnValue(of('s')),
      currentLang: undefined,
      getDefaultLang: jest.fn().mockReturnValue('en'),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: mockTranslate }],
    });
    service = TestBed.inject(I18nService);
  });

  it('init uses saved language when present', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('es');
    service.init('en');
    expect(mockTranslate.addLangs).toHaveBeenCalled();
    expect(mockTranslate.use).toHaveBeenCalledWith('es');
    spy.mockRestore();
  });

  it('instant delegates to translate.instant', () => {
    expect(service.instant('k')).toBe('t');
    expect(mockTranslate.instant).toHaveBeenCalledWith('k', undefined);
  });

  it('get returns observable from translate.get', (done) => {
    service.get('k').subscribe((v) => {
      expect(v).toBe('v');
      done();
    });
  });

  it('stream returns observable from translate.stream', (done) => {
    service.stream('k').subscribe((v) => {
      expect(v).toBe('s');
      done();
    });
  });

  it('use stores prefered language and delegates to translate.use', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem');
    service.use('de');
    expect(spy).toHaveBeenCalledWith('preferredLanguage', 'de');
    spy.mockRestore();
  });

  it('currentLang falls back to default when currentLang undefined', () => {
    mockTranslate.currentLang = undefined;
    (mockTranslate.getDefaultLang as jest.Mock).mockReturnValue('en');
    expect(service.currentLang).toBe('en');
  });
});
import * as s from './i18n.service';

describe('i18n.service', () => {
  it('module loads', () => {
    expect(s).toBeDefined();
  });
});
