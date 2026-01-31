import { TestBed } from '@angular/core/testing';
import { DarkModeService } from './dark-mode.service';
import { DOCUMENT } from '@angular/common';

describe('DarkModeService', () => {
  let svc: DarkModeService;
  let docMock: any;

  beforeEach(() => {
    docMock = {
      documentElement: {
        classList: {
          contains: jest.fn().mockReturnValue(false),
          toggle: jest.fn(),
          add: jest.fn(),
          remove: jest.fn(),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: docMock }, DarkModeService],
    });
    svc = TestBed.inject(DarkModeService);
  });

  it('isDark returns false when class not present', () => {
    expect(svc.isDark()).toBe(false);
    expect(docMock.documentElement.classList.contains).toHaveBeenCalled();
  });

  it('toggle calls classList.toggle', () => {
    svc.toggle();
    expect(docMock.documentElement.classList.toggle).toHaveBeenCalled();
  });

  it('set(true) adds class and set(false) removes class', () => {
    svc.set(true);
    expect(docMock.documentElement.classList.add).toHaveBeenCalled();

    svc.set(false);
    expect(docMock.documentElement.classList.remove).toHaveBeenCalled();
  });
});
