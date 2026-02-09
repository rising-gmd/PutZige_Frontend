import { TestBed, ComponentFixture } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import { VerifyEmailComponent } from './verify-email.component';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { NotificationService } from '../../shared/services/notification.service';

describe('VerifyEmailComponent', () => {
  const mockAuthApi: any = {
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
  };

  const mockNotifications: any = {
    showError: jest.fn(),
    showSuccess: jest.fn(),
  };

  const mockTranslate: any = {
    instant: jest.fn((k: string) => k),
    get: jest.fn((k: string) => of(k)),
    stream: jest.fn((k: string) => of(k)),
    onLangChange: of(null),
  };

  const mockRouter: any = {
    navigate: jest.fn(),
    // RouterLink subscribes to router.events; provide a harmless observable
    events: of(null),
  };

  let fixture: ComponentFixture<VerifyEmailComponent> | null = null;

  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
    fixture?.destroy();
    fixture = null;
  });

  it('when token is missing, then shows error and notifies', async () => {
    const routeMock = { snapshot: { queryParamMap: { get: () => null } } };

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: AuthApiService, useValue: mockAuthApi },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: Router, useValue: mockRouter },
        { provide: TranslateService, useValue: mockTranslate },
      ],
    }).compileComponents();

    TestBed.overrideComponent(VerifyEmailComponent, {
      set: {
        template: `<div><p>{{message()}}</p><button (click)="resendEmail()">resend</button></div>`,
      },
    });
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();

    expect(mockTranslate.instant).toHaveBeenCalledWith(
      'auth.verify_email_missing_token',
    );
    expect(mockNotifications.showError).toHaveBeenCalledWith(
      'auth.verify_email_missing_token',
    );

    // message rendered by template should contain the missing-token key
    expect(fixture.nativeElement.textContent).toContain(
      'auth.verify_email_missing_token',
    );
  });

  it('when verification succeeds, then shows success and redirects', async () => {
    const token = 'tok';
    const routeMock = { snapshot: { queryParamMap: { get: () => token } } };

    mockAuthApi.verifyEmail.mockReturnValue(
      of({ success: true, responseCode: 'EMAIL_VERIFIED' }),
    );

    jest.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: AuthApiService, useValue: mockAuthApi },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: Router, useValue: mockRouter },
        { provide: TranslateService, useValue: mockTranslate },
      ],
    }).compileComponents();

    TestBed.overrideComponent(VerifyEmailComponent, {
      set: {
        template: `<div><p>{{message()}}</p><button (click)="resendEmail()">resend</button></div>`,
      },
    });
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();

    expect(mockNotifications.showSuccess).toHaveBeenCalled();

    // Advance past redirect delay (3000ms) to trigger navigation
    await jest.advanceTimersByTimeAsync(3000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('when verification fails, then shows error and renders resend CTA', async () => {
    const token = 'tok';
    const routeMock = { snapshot: { queryParamMap: { get: () => token } } };

    mockAuthApi.verifyEmail.mockReturnValue(
      of({ success: false, responseCode: 'TOKEN_INVALID' }),
    );

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: AuthApiService, useValue: mockAuthApi },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: Router, useValue: mockRouter },
        { provide: TranslateService, useValue: mockTranslate },
      ],
    }).compileComponents();

    TestBed.overrideComponent(VerifyEmailComponent, {
      set: {
        template: `<div><p>{{message()}}</p><button (click)="resendEmail()">resend</button></div>`,
      },
    });
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();

    expect(mockNotifications.showError).toHaveBeenCalled();

    // Resend button should be present
    expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
  });

  it('when resend succeeds, then state becomes resent and shows success', async () => {
    const token = 'tok';
    const routeMock = { snapshot: { queryParamMap: { get: () => token } } };

    // initial verify fails
    mockAuthApi.verifyEmail.mockReturnValue(
      of({ success: false, responseCode: 'TOKEN_INVALID' }),
    );
    mockAuthApi.resendVerification.mockReturnValue(
      of({ success: true, responseCode: 'EMAIL_VERIFICATION_SENT' }),
    );

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: AuthApiService, useValue: mockAuthApi },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: Router, useValue: mockRouter },
        { provide: TranslateService, useValue: mockTranslate },
      ],
    }).compileComponents();

    TestBed.overrideComponent(VerifyEmailComponent, {
      set: {
        template: `<div><p>{{message()}}</p><button (click)="resendEmail()">resend</button></div>`,
      },
    });
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    await userEvent.click(btn);

    expect(mockAuthApi.resendVerification).toHaveBeenCalledWith(token);
    expect(mockNotifications.showSuccess).toHaveBeenCalled();
  });

  it('when resend returns an HttpError with responseCode, then shows error', async () => {
    const token = 'tok';
    const routeMock = { snapshot: { queryParamMap: { get: () => token } } };

    mockAuthApi.verifyEmail.mockReturnValue(
      of({ success: false, responseCode: 'TOKEN_INVALID' }),
    );
    mockAuthApi.resendVerification.mockReturnValue(
      throwError(() => ({
        error: { responseCode: 'TOO_MANY_RESEND_ATTEMPTS' },
      })),
    );

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: AuthApiService, useValue: mockAuthApi },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
    TestBed.overrideProvider(TranslateService, { useValue: mockTranslate });

    TestBed.overrideComponent(VerifyEmailComponent, {
      set: {
        template: `<div><p>{{message()}}</p><button (click)="resendEmail()">resend</button></div>`,
      },
    });
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    await userEvent.click(btn);

    expect(mockNotifications.showError).toHaveBeenCalled();
  });
});
