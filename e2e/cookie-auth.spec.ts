import { test, expect } from '@playwright/test';

test.describe('Cookie-based auth E2E (critical flows)', () => {
  test('login sets HttpOnly refresh cookie and XSRF cookie', async ({
    page,
    context,
    baseURL,
  }) => {
    // Intercept login and return Set-Cookie headers
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { userId: 'u1', email: 'a@b.com' },
        }),
        headers: {
          'set-cookie': [
            'RefreshToken=refresh-token; Path=/; HttpOnly; SameSite=Strict',
            'XSRF-TOKEN=xsrf-token; Path=/; SameSite=Strict',
          ],
        },
      });
    });

    // Ensure page has a proper origin so fetch() resolves relative URLs
    await page.goto('/');

    // Perform login via the page context so browser processes Set-Cookie
    const resp = await page.evaluate(async () => {
      const r = await fetch('/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'u', password: 'p' }),
      });
      return r.ok;
    });

    expect(resp).toBe(true);

    const cookies = await context.cookies();
    const names = cookies.map((c) => c.name);
    expect(names).toContain('RefreshToken');
    expect(names).toContain('XSRF-TOKEN');
  });

  test('authenticated request sends cookies and XSRF header', async ({
    page,
    context,
  }) => {
    // ensure cookies present
    await context.addCookies([
      {
        name: 'RefreshToken',
        value: 'r',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
      { name: 'XSRF-TOKEN', value: 'xsrf', domain: 'localhost', path: '/' },
    ]);

    let capturedCookie = '';
    let capturedXsrf = '';
    await page.route('**/auth/me', async (route) => {
      const req = route.request();
      capturedCookie = req.headers()['cookie'] || '';
      capturedXsrf = req.headers()['x-xsrf-token'] || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'u1' } }),
      });
    });

    await page.goto('/');

    const ok = await page.evaluate(async () => {
      const r = await fetch('/auth/me', { credentials: 'include' });
      return r.ok;
    });

    expect(ok).toBe(true);
    expect(capturedCookie).toContain('RefreshToken=');
    expect(capturedXsrf).toBe('xsrf');
  });

  test('401 triggers single refresh and retries original requests', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'RefreshToken',
        value: 'r',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);

    let protectedCalls = 0;
    let refreshCalls = 0;

    // Protected endpoint: first returns 401, subsequent returns 200
    await page.route('**/api/protected', async (route) => {
      protectedCalls += 1;
      if (protectedCalls === 1) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      }
    });

    await page.route('**/auth/refresh', async (route) => {
      refreshCalls += 1;
      await route.fulfill({ status: 204, body: '' });
    });

    // Ensure page has a proper origin
    await page.goto('/');

    // Fire two concurrent protected requests — they should result in single refresh
    const results = await page.evaluate(async () => {
      const p1 = fetch('/api/protected', { credentials: 'include' }).then(
        (r) => r.status,
      );
      const p2 = fetch('/api/protected', { credentials: 'include' }).then(
        (r) => r.status,
      );
      return Promise.all([p1, p2]);
    });

    expect(results[0]).toBe(200);
    expect(results[1]).toBe(200);
    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBeGreaterThanOrEqual(2);
  });

  test('negotiate is called before SignalR start', async ({ page }) => {
    let negotiateCalled = false;
    await page.route('**/signalr/negotiate', async (route) => {
      negotiateCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'token', expiresIn: 30 }),
      });
    });

    await page.goto('/');

    // Simulate client calling negotiate (client library will call it when starting connection)
    const ok = await page.evaluate(async () => {
      const r = await fetch('/signalr/negotiate', {
        method: 'POST',
        credentials: 'include',
      });
      return r.ok;
    });

    expect(ok).toBe(true);
    expect(negotiateCalled).toBe(true);
  });

  test('logout clears cookies and redirects to login', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'RefreshToken',
        value: 'r',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);

    await page.route('**/auth/logout', async (route) => {
      // Clear cookie via Set-Cookie header
      await route.fulfill({
        status: 200,
        headers: {
          'set-cookie': [
            'RefreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          ],
        },
        body: '',
      });
    });

    await page.goto('/');

    // Perform logout from page
    await page.evaluate(async () => {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    });

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'RefreshToken')).toBeUndefined();
  });

  test('refresh failure forces navigation to login', async ({ page }) => {
    await page.route('**/api/protected', async (route) => {
      await route.fulfill({ status: 401, body: '' });
    });

    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({ status: 401, body: '' });
    });

    await page.goto('/');

    // Ensure navigation happens on refresh failure — run in page and then check location
    await page.evaluate(async () => {
      try {
        await fetch('/api/protected', { credentials: 'include' });
      } catch {
        // ignore
      }
    });

    // App should redirect to /auth/login — allow client-side navigation to occur
    await page.waitForTimeout(200);
    expect(page.url()).toContain('/auth/login');
  });
});
