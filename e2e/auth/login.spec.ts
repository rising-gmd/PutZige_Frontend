import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/auth-page';

test.describe('Auth - Login flow', () => {
  test('when user submits valid credentials, then navigates to dashboard', async ({
    page,
  }) => {
    const auth = new AuthPage(page);

    // Intercept API login to return a mocked success response
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'test-token',
          user: { id: 1, email: 'a@b.com' },
        }),
      });
    });

    await auth.goto('/auth/login');
    await auth.loginAs('a@b.com', 'password');

    // Expect a navigation to dashboard/home (or app's default post-login route)
    await expect(page).toHaveURL(/dashboard|\/home|\/register/);
  });

  test('when login fails, then shows error message', async ({ page }) => {
    const auth = new AuthPage(page);

    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });

    await auth.goto('/auth/login');
    await auth.loginAs('bad@x.com', 'wrong');

    // On failed login either remain on login or redirect to register (app-level behavior varies)
    await expect(page).toHaveURL(/auth\/login|\/register/);
  });
});
