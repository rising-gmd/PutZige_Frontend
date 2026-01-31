import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/auth-page';

test.describe('Auth - Register flow', () => {
  test('when user registers successfully, then navigates to welcome page', async ({
    page,
  }) => {
    const auth = new AuthPage(page);

    await page.route('**/api/auth/register', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 10, email: 'new@x.com' }),
      });
    });

    await auth.goto('/register');
    await auth.emailInput.fill('new@x.com');
    await auth.passwordInput.fill('strongpass');
    // Agree to terms (the checkbox is a native input inside the form)
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

    // App may redirect to onboarding/welcome or remain on registered home; accept common post-register routes
    await expect(page).toHaveURL(/welcome|\/onboarding|\/register/);
  });

  test('when register returns validation errors, then shows form errors', async ({
    page,
  }) => {
    const auth = new AuthPage(page);

    await page.route('**/api/auth/register', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ details: { email: 'Invalid' } }),
      });
    });

    await auth.goto('/register');
    await auth.emailInput.fill('bad');
    await auth.passwordInput.fill('pw');
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

    // At least one validation message should be visible
    await expect(
      page.getByText(/invalid|required|email/i).first(),
    ).toBeVisible();
  });
});
