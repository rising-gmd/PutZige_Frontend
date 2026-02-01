import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/auth-page';

test.describe('Auth - Register flow', () => {
  test('Register_Successfully_With_Valid_Credentials_And_Redirect_To_Login', async ({
    page,
  }) => {
    const auth = new AuthPage(page);

    await page.route('**/api/**/users', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'ok' }),
      });
    });

    await auth.goto('/register');
    await auth.emailInput.fill('new@x.com');
    await auth.passwordInput.fill('Password123!');
    // Username is a required field in the form; fill it to allow submission
    await auth.page
      .locator(
        'app-input[formcontrolname="username"] input, input[formcontrolname="username"]',
      )
      .fill('new_user');
    await page
      .locator('input[type="checkbox"][formcontrolname="terms"]')
      .check();
    await page
      .locator('form')
      .evaluate((f: any) =>
        f.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        ),
      );

    // App routes use /auth/login; accept either /login or /auth/login for robustness
    await expect(page).toHaveURL(/\/(?:auth\/)?login/);
  });

  test('Register_With_Google_Sign_Up', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto('/register');

    // Google button should be visible
    // match the visible/translated label instead of an i18n key
    await expect(
      page.getByRole('button', { name: /sign up with google/i }),
    ).toBeVisible();
  });

  test('Register_Button_Blocked_Until_Terms_Checkbox_Is_Checked', async ({
    page,
  }) => {
    const auth = new AuthPage(page);
    await auth.goto('/register');

    const submit = page.getByRole('button', { name: /register/i });
    await expect(submit).toBeDisabled();

    // Fill required fields
    await auth.emailInput.fill('new@x.com');
    await auth.passwordInput.fill('Password123!');
    await auth.page
      .locator(
        'app-input[formcontrolname="username"] input, input[formcontrolname="username"]',
      )
      .fill('tester_user');

    // Still disabled until terms is checked
    await expect(submit).toBeDisabled();

    await page
      .locator('input[type="checkbox"][formcontrolname="terms"]')
      .check();
    await expect(submit).not.toBeDisabled();
  });

  test('Register_Sign_In_Link_Navigates_To_Login_Page', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto('/register');

    const signInLink = page.getByRole('link', {
      name: /sign in|signin|common.buttons.signin/i,
    });
    // Click and wait for SPA navigation to /auth/login (or /login)
    await Promise.all([
      page.waitForURL(/\/(?:auth\/)?login/),
      signInLink.click(),
    ]);
  });

  test('Register_Show_Duplicate_Username_Error_From_Server', async ({
    page,
  }) => {
    const auth = new AuthPage(page);

    await page.route('**/api/**/users', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'username already exists',
        }),
      });
    });

    await auth.goto('/register');
    await auth.emailInput.fill('dup@x.com');
    await auth.passwordInput.fill('Password123!');
    await auth.page
      .locator(
        'app-input[formcontrolname="username"] input, input[formcontrolname="username"]',
      )
      .fill('duplicate_user');
    await page
      .locator('input[type="checkbox"][formcontrolname="terms"]')
      .check();
    await page
      .locator('form')
      .evaluate((f: any) =>
        f.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        ),
      );

    // server message may be translated or rendered in a toast; check body text for the key phrase
    await expect(page.locator('body')).toContainText(
      /(username.*exists|invalid request|already exists)/i,
    );
  });

  test('Register_Show_Duplicate_Email_Error_From_Server', async ({ page }) => {
    const auth = new AuthPage(page);

    await page.route('**/api/**/users', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'email already exists',
        }),
      });
    });

    await auth.goto('/register');
    await auth.emailInput.fill('dup@x.com');
    await auth.passwordInput.fill('Password123!');
    await auth.page
      .locator(
        'app-input[formcontrolname="username"] input, input[formcontrolname="username"]',
      )
      .fill('unique_user');
    await page
      .locator('input[type="checkbox"][formcontrolname="terms"]')
      .check();
    await page
      .locator('form')
      .evaluate((f: any) =>
        f.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        ),
      );

    await expect(page.locator('body')).toContainText(
      /(email.*exists|invalid request|already exists)/i,
    );
  });
});
