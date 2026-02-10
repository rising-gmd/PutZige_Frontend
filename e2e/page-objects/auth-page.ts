import { type Page, type Locator, expect } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page, urlPath = '/login') {
    this.page = page;
    // Robust locators with fallbacks for different markup patterns
    // Inputs inside wrapper components (app-input / app-password) or plain inputs
    this.emailInput = page.locator(
      'app-input[formcontrolname="email"] input, app-input[formcontrolname="identifier"] input, input[type="email"], input[name="email"], input[name="username"], [data-testid="email"], input[placeholder*="email" i], input[aria-label*="email" i], input[formcontrolname="identifier"]',
    );
    this.passwordInput = page.locator(
      'app-password[formcontrolname="password"] input, app-input[formcontrolname="password"] input, input[type="password"], input[name="password"], [data-testid="password"], input[placeholder*="password" i], input[aria-label*="password" i]',
    );
    // Prefer the real form submit button when present to avoid matching social buttons
    this.submitButton = page.locator(
      'form button[type="submit"], form [type="submit"]',
    );
    this.errorMessage = page.getByTestId('auth-error');
  }

  async goto(path = '/login') {
    await this.page.goto(path);
    await expect(this.emailInput).toBeVisible();
  }

  async loginAs(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.emailInput.press('Tab');
    await this.passwordInput.fill(password);
    await this.passwordInput.press('Tab');
    // Some app-button implementations wrap a native button; dispatch form submit to avoid disabled wrapper
    await this.page.waitForTimeout(50);
    await this.page
      .locator('form')
      .evaluate((f: any) =>
        f.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        ),
      );
  }
}
