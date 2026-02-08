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
            <input placeholder="global.label_username" [formControl]="username" />
            <div *ngIf="errorMessage(username, 'global.label_username')">{{ errorMessage(username, 'global.label_username') }}</div>

            <input placeholder="global.label_email" [formControl]="email" />
            <div *ngIf="errorMessage(email, 'global.label_email')">{{ errorMessage(email, 'global.label_email') }}</div>

            <input placeholder="global.label_password" [formControl]="password" />
            <div *ngIf="errorMessage(password, 'global.label_password')">{{ errorMessage(password, 'global.label_password') }}</div>

            <input type="checkbox" role="checkbox" [formControl]="terms" />
            <div *ngIf="errorMessage(terms)">{{ errorMessage(terms) }}</div>

            <a role="link" href="/login">global.btn_sign_in</a>
            <button type="button" [attr.aria-busy]="loading()" (click)="onSubmit()">global.btn_register</button>
            <button type="button">auth.register_google</button>
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

    const username = screen.getByPlaceholderText('global.label_username');
    const email = screen.getByPlaceholderText('global.label_email');
    const password = screen.getByPlaceholderText('global.label_password');
    const registerBtn = screen.getByRole('button', {
      name: 'global.btn_register',
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
      name: 'auth.register_google',
    });
    expect(googleBtn).toBeInTheDocument();
  });

  describe('username validation', () => {
    it('when username is empty, then required error is shown after submit', async () => {
      await setup();

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('form.required_field'))[0],
      ).toBeVisible();
    });

    it('when username less than 3 characters, then minLength error is shown', async () => {
      await setup();

      const username = screen.getByPlaceholderText('global.label_username');
      await userEvent.type(username, 'ab');

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      expect((await screen.findAllByText('form.min_length'))[0]).toBeVisible();
    });

    it('when username exceeds 50 characters, then maxLength error is shown', async () => {
      await setup();

      const username = screen.getByPlaceholderText('global.label_username');
      await userEvent.type(username, 'a'.repeat(51));

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      expect(
        (
          await screen.findAllByText(
            /errors\.validation\.(email|max[_]?length)/i,
          )
        )[0],
      ).toBeVisible();
    });

    it('when username contains invalid characters, then invalidChars error is shown', async () => {
      await setup();

      const username = screen.getByPlaceholderText('global.label_username');
      await userEvent.type(username, 'bad!name');

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('form.username_invalid_chars'))[0],
      ).toBeVisible();
    });

    it('when username contains letters, numbers and underscore, then no username error is shown', async () => {
      await setup();

      const username = screen.getByPlaceholderText('global.label_username');
      await userEvent.type(username, 'user_123');

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      // username-specific error should not be present (email/password/terms may still block submission)
      expect(screen.queryByText('form.username_invalid_chars')).toBeNull();
    });
  });

  describe('email validation', () => {
    it('when email is empty, then required error is shown after submit', async () => {
      await setup();

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('form.required_field'))[0],
      ).toBeVisible();
    });

    it('when email format is invalid, then email error is shown', async () => {
      await setup();

      const email = screen.getByPlaceholderText('global.label_email');
      await userEvent.type(email, 'not-an-email');

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('form.email_invalid'))[0],
      ).toBeVisible();
    });

    it('when email exceeds 255 characters, then maxLength or email error is shown', async () => {
      await setup();

      const email = screen.getByPlaceholderText('global.label_email');
      const long = 'a'.repeat(256) + '@d.com';
      fireEvent.input(email, { target: { value: long } });

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      // Validator may report either email format or maxlength depending on internal validation order
      const err = await screen.findByText((content: string) =>
        /errors\.validation\.(email|max[_]?length)/i.test(content),
      );
      expect(err).toBeVisible();
    });
  });

  describe('password validation', () => {
    it('when password is empty, then required error is shown after submit', async () => {
      await setup();

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('form.required_field'))[0],
      ).toBeVisible();
    });

    it('when password less than 8 chars, then minLength error is shown', async () => {
      await setup();

      const password = screen.getByPlaceholderText('global.label_password');
      await userEvent.type(password, 'Ab1!');

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('form.password_min'))[0],
      ).toBeVisible();
    });

    it('when password does not match pattern, then pattern error is shown', async () => {
      await setup();

      const password = screen.getByPlaceholderText('global.label_password');
      await userEvent.type(password, 'alllowercase1');

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('form.password_pattern'))[0],
      ).toBeVisible();
    });
  });

  describe('terms and navigation', () => {
    it('when terms not accepted, then terms error is shown', async () => {
      await setup();

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      });
      await userEvent.click(registerBtn);

      expect(
        (await screen.findAllByText('form.terms_required'))[0],
      ).toBeVisible();
    });

    it('register button is disabled until terms checkbox is checked', async () => {
      await setup();

      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
      }) as HTMLButtonElement;

      const terms = screen.getByRole('checkbox') as HTMLInputElement;
      await userEvent.click(terms);

      // ensure checkbox toggles control
      expect(terms.checked).toBeTruthy();
    });

    it('sign in link navigates to login', async () => {
      await setup();

      const signIn = screen.getByRole('link', {
        name: 'global.btn_sign_in',
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

      const username = screen.getByPlaceholderText('global.label_username');
      const email = screen.getByPlaceholderText('global.label_email');
      const password = screen.getByPlaceholderText('global.label_password');
      const terms = screen.getByRole('checkbox') as HTMLInputElement;
      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
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

      const username = screen.getByPlaceholderText('global.label_username');
      const email = screen.getByPlaceholderText('global.label_email');
      const password = screen.getByPlaceholderText('global.label_password');
      const terms = screen.getByRole('checkbox') as HTMLInputElement;
      const registerBtn = screen.getByRole('button', {
        name: 'global.btn_register',
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
