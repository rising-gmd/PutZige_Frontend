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
    this.username = page.getByPlaceholder('common.labels.username');
    this.email = page.getByPlaceholder('common.labels.email');
    this.password = page.getByPlaceholder('common.labels.password');
    this.terms = page.getByRole('checkbox');
    this.registerButton = page.getByRole('button', {
      name: 'common.buttons.register',
    });
    this.googleButton = page.getByRole('button', {
      name: 'features.register.googleSignUp',
    });
    this.signinLink = page.getByRole('link', { name: 'common.buttons.signin' });
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
