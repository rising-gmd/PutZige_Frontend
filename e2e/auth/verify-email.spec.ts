import { test, expect } from '@playwright/test';

test.describe('Verify Email - flow', () => {
  test('when token is valid, then redirects to login after verification', async ({
    page,
  }) => {
    // Mock backend verification success
    await page.route('**/auth/verify-email', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, responseCode: 'EMAIL_VERIFIED' }),
      });
    });

    await page.goto('/verify-email?token=good-token');

    // Expect the app to redirect to login after the client-side timeout
    await page.waitForURL(/\/auth\/login/, { timeout: 6000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('when token is invalid, then user can resend verification', async ({
    page,
  }) => {
    // Respond to initial verification as an application-level failure
    await page.route('**/auth/verify-email', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, responseCode: 'TOKEN_INVALID' }),
      });
    });

    await page.goto('/verify-email?token=bad-token');

    // Wait for the resend button to appear
    const resend = page.getByRole('button', {
      name: /resend|send again|verify/i,
    });
    await expect(resend).toBeVisible();

    // Prepare to capture the resend request
    const [req] = await Promise.all([
      page.waitForRequest('**/auth/resend-verification'),
      resend.click(),
    ]);

    expect(req).toBeTruthy();

    // Fulfill the resend with a success so UI can update
    await page.route('**/auth/resend-verification', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          responseCode: 'EMAIL_VERIFICATION_SENT',
        }),
      });
    });
  });
});
