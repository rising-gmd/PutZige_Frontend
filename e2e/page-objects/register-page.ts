import { type Locator, type Page, expect } from '@playwright/test';

export class RegisterPage {
  readonly url = '/register';
  readonly username: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly terms: Locator;
  readonly registerButton: Locator;
  readonly googleButton: Locator;
  readonly signinLink: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByPlaceholder('COMMON.LABELS.USERNAME');
    this.email = page.getByPlaceholder('COMMON.LABELS.EMAIL');
    this.password = page.getByPlaceholder('COMMON.LABELS.PASSWORD');
    this.terms = page.getByRole('checkbox');
    this.registerButton = page.getByRole('button', {
      name: 'COMMON.BUTTONS.REGISTER',
    });
    this.googleButton = page.getByRole('button', {
      name: 'FEATURES.REGISTER.GOOGLE_SIGN_UP',
    });
    this.signinLink = page.getByRole('link', { name: 'COMMON.BUTTONS.SIGNIN' });
    this.errorMessage = page.getByTestId('register-error');
  }

  async goto() {
    await this.page.goto(this.url);
    await expect(this.username).toBeVisible();
  }

  async fillForm(username: string, email: string, password: string) {
    await this.username.fill(username);
    await this.email.fill(email);
    await this.password.fill(password);
  }

  async acceptTerms() {
    await this.terms.check();
  }

  async submit() {
    await this.registerButton.click();
  }
}
