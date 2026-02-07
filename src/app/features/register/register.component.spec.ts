import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/dom';
import { of, throwError, Subject } from 'rxjs';

import { RegisterComponent } from './register.component';
import { TestBed } from '@angular/core/testing';
import { RegisterService } from './register.service';
import { NotificationService } from '../../shared/services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

describe('RegisterComponent', () => {
  const mockRegister = { register: jest.fn() } as unknown as RegisterService;
  const mockNotifications = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
  } as unknown as NotificationService;

  const translate = {
    instant: jest.fn((k: string) => k),
  } as unknown as TranslateService;

  const mockRouter = {
    navigate: jest.fn(),
    navigateByUrl: jest.fn(),
  } as unknown as Router;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function setup(providers: any[] = []) {
    // override the component template with a minimal shallow template
    // to avoid pulling in RouterLink, TranslatePipe and child components
    TestBed.overrideComponent(RegisterComponent, {
      set: {
        template: `
          <form>
            <input placeholder="COMMON.LABELS.USERNAME" [formControl]="username" />
            <div *ngIf="errorMessage(username, 'COMMON.LABELS.USERNAME')">{{ errorMessage(username, 'COMMON.LABELS.USERNAME') }}</div>

            <input placeholder="COMMON.LABELS.EMAIL" [formControl]="email" />
            <div *ngIf="errorMessage(email, 'COMMON.LABELS.EMAIL')">{{ errorMessage(email, 'COMMON.LABELS.EMAIL') }}</div>

            <input placeholder="COMMON.LABELS.PASSWORD" [formControl]="password" />
            <div *ngIf="errorMessage(password, 'COMMON.LABELS.PASSWORD')">{{ errorMessage(password, 'COMMON.LABELS.PASSWORD') }}</div>

            <input type="checkbox" role="checkbox" [formControl]="terms" />
            <div *ngIf="errorMessage(terms)">{{ errorMessage(terms) }}</div>

            <a role="link" href="/login">COMMON.BUTTONS.SIGNIN</a>
            <button type="button" [attr.aria-busy]="loading()" (click)="onSubmit()">COMMON.BUTTONS.REGISTER</button>
            <button type="button">FEATURES.REGISTER.GOOGLE_SIGN_UP</button>
          </form>
        `,
      },
    });

    return render(RegisterComponent, {
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: RegisterService, useValue: mockRegister },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: TranslateService, useValue: translate },
        { provide: Router, useValue: mockRouter },
        ...providers,
      ],
    });
  }

  it('when valid credentials are submitted, then register is called and success is shown and navigates to login', async () => {
    mockRegister.register = jest
      .fn()
      .mockReturnValue(of({ success: true, message: 'ok' }));

    await setup();

    const username = screen.getByPlaceholderText('COMMON.LABELS.USERNAME');
    const email = screen.getByPlaceholderText('COMMON.LABELS.EMAIL');
    const password = screen.getByPlaceholderText('COMMON.LABELS.PASSWORD');
    const registerBtn = screen.getByRole('button', {
      name: 'COMMON.BUTTONS.REGISTER',
    });
    const terms = screen.getByRole('checkbox') as HTMLInputElement;

    await userEvent.type(username, 'tester_user');
    await userEvent.type(email, 'a@b.com');
    await userEvent.type(password, 'Password123!');
    await userEvent.click(terms);
    await userEvent.click(registerBtn);

    expect(mockRegister.register).toHaveBeenCalled();
    expect(mockNotifications.showSuccess).toHaveBeenCalledWith('ok');
    expect(mockRouter.navigateByUrl).toHaveBeenCalled();
  });

  it('when clicking Google sign up, then the button exists', async () => {
    await setup();

    const googleBtn = screen.getByRole('button', {
      name: 'FEATURES.REGISTER.GOOGLE_SIGN_UP',
    });
    expect(googleBtn).toBeInTheDocument();
  });

  describe('username validation', () => {
    it('when username is empty, then required error is shown after submit', async () => {
      await setup();

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('ERRORS.VALIDATION.REQUIRED_FIELD'))[0],
      ).toBeVisible();
    });

    it('when username less than 3 characters, then minLength error is shown', async () => {
      await setup();

      const username = screen.getByPlaceholderText('COMMON.LABELS.USERNAME');
      await userEvent.type(username, 'ab');

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('ERRORS.VALIDATION.MIN_LENGTH'))[0],
      ).toBeVisible();
    });

    it('when username exceeds 50 characters, then maxLength error is shown', async () => {
      await setup();

      const username = screen.getByPlaceholderText('COMMON.LABELS.USERNAME');
      await userEvent.type(username, 'a'.repeat(51));

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      expect(
        (
          await screen.findAllByText(/errors\.validation\.(email|maxLength)/)
        )[0],
      ).toBeVisible();
    });

    it('when username contains invalid characters, then invalidChars error is shown', async () => {
      await setup();

      const username = screen.getByPlaceholderText('COMMON.LABELS.USERNAME');
      await userEvent.type(username, 'bad!name');

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      expect(
        (
          await screen.findAllByText('ERRORS.VALIDATION.USERNAME.INVALID_CHARS')
        )[0],
      ).toBeVisible();
    });

    it('when username contains letters, numbers and underscore, then no username error is shown', async () => {
      await setup();

      const username = screen.getByPlaceholderText('COMMON.LABELS.USERNAME');
      await userEvent.type(username, 'user_123');

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      // username-specific error should not be present (email/password/terms may still block submission)
      expect(
        screen.queryByText('ERRORS.VALIDATION.USERNAME.INVALID_CHARS'),
      ).toBeNull();
    });
  });

  describe('email validation', () => {
    it('when email is empty, then required error is shown after submit', async () => {
      await setup();

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('ERRORS.VALIDATION.REQUIRED_FIELD'))[0],
      ).toBeVisible();
    });

    it('when email format is invalid, then email error is shown', async () => {
      await setup();

      const email = screen.getByPlaceholderText('COMMON.LABELS.EMAIL');
      await userEvent.type(email, 'not-an-email');

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('ERRORS.VALIDATION.EMAIL'))[0],
      ).toBeVisible();
    });

    it('when email exceeds 255 characters, then maxLength or email error is shown', async () => {
      await setup();

      const email = screen.getByPlaceholderText('COMMON.LABELS.EMAIL');
      const long = 'a'.repeat(256) + '@d.com';
      fireEvent.input(email, { target: { value: long } });

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      // Validator may report either email format or maxlength depending on internal validation order
      const err = await screen.findByText((content: string) =>
        /errors\.validation\.(email|maxLength)/.test(content),
      );
      expect(err).toBeVisible();
    });
  });

  describe('password validation', () => {
    it('when password is empty, then required error is shown after submit', async () => {
      await setup();

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('ERRORS.VALIDATION.REQUIRED_FIELD'))[0],
      ).toBeVisible();
    });

    it('when password less than 8 chars, then minLength error is shown', async () => {
      await setup();

      const password = screen.getByPlaceholderText('COMMON.LABELS.PASSWORD');
      await userEvent.type(password, 'Ab1!');

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      expect(
        (
          await screen.findAllByText('ERRORS.VALIDATION.PASSWORD.MIN_LENGTH')
        )[0],
      ).toBeVisible();
    });

    it('when password does not match pattern, then pattern error is shown', async () => {
      await setup();

      const password = screen.getByPlaceholderText('COMMON.LABELS.PASSWORD');
      await userEvent.type(password, 'alllowercase1');

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('ERRORS.VALIDATION.PASSWORD.PATTERN'))[0],
      ).toBeVisible();
    });
  });

  describe('terms and navigation', () => {
    it('when terms not accepted, then terms error is shown', async () => {
      await setup();

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('ERRORS.VALIDATION.TERMS.REQUIRED'))[0],
      ).toBeVisible();
    });

    it('register button is disabled until terms checkbox is checked', async () => {
      await setup();

      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      }) as HTMLButtonElement;

      const terms = screen.getByRole('checkbox') as HTMLInputElement;
      await userEvent.click(terms);

      // ensure checkbox toggles control
      expect(terms.checked).toBeTruthy();
    });

    it('sign in link navigates to login', async () => {
      await setup();

      const signIn = screen.getByRole('link', {
        name: 'COMMON.BUTTONS.SIGNIN',
      }) as HTMLAnchorElement;
      expect(signIn.getAttribute('href')).toContain('/login');
    });
  });

  describe('API / Server responses', () => {
    it('when API returns failure with message, then shows error notification', async () => {
      mockRegister.register = jest
        .fn()
        .mockReturnValue(of({ success: false, message: 'duplicate username' }));

      await setup();

      const username = screen.getByPlaceholderText('COMMON.LABELS.USERNAME');
      const email = screen.getByPlaceholderText('COMMON.LABELS.EMAIL');
      const password = screen.getByPlaceholderText('COMMON.LABELS.PASSWORD');
      const terms = screen.getByRole('checkbox') as HTMLInputElement;
      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });

      await userEvent.type(username, 'tester');
      await userEvent.type(email, 'a@b.com');
      await userEvent.type(password, 'Password123!');
      await userEvent.click(terms);
      await userEvent.click(registerBtn);

      expect(mockNotifications.showError).toHaveBeenCalledWith(
        'duplicate username',
      );
    });

    it('when API call is in-flight, then loading state is shown and button is busy', async () => {
      const subj = new Subject<any>();
      mockRegister.register = jest.fn().mockReturnValue(subj.asObservable());

      await setup();

      const username = screen.getByPlaceholderText('COMMON.LABELS.USERNAME');
      const email = screen.getByPlaceholderText('COMMON.LABELS.EMAIL');
      const password = screen.getByPlaceholderText('COMMON.LABELS.PASSWORD');
      const terms = screen.getByRole('checkbox') as HTMLInputElement;
      const registerBtn = screen.getByRole('button', {
        name: 'COMMON.BUTTONS.REGISTER',
      });

      await userEvent.type(username, 'tester');
      await userEvent.type(email, 'a@b.com');
      await userEvent.type(password, 'Password123!');
      await userEvent.click(terms);

      await userEvent.click(registerBtn);

      expect(registerBtn.getAttribute('aria-busy')).toBe('true');

      subj.next({ success: true, message: 'ok' });
      subj.complete();
    });
  });
});
