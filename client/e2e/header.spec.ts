import { test, expect } from '@playwright/test';

test.describe('Header Navigation & Actions', () => {
  test.beforeEach(async ({ page }) => {
    // Unlock PasswordGate via localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem('lastActiveTime', Date.now().toString());
      localStorage.setItem('isAppLocked', 'false');
    });
  });

  test('header components render with proper buttons and actions', async ({ page }) => {
    await page.goto('/');

    // Verify header exists
    const header = page.locator('header.app-header');
    await expect(header).toBeVisible();

    // Verify action buttons
    const shareBtn = page.locator('.header-btn-share');
    await expect(shareBtn).toBeVisible();

    const newTaskBtn = page.locator('#btn-new-task');
    await expect(newTaskBtn).toBeVisible();

    const notifBtn = page.locator('.header-notif-btn');
    await expect(notifBtn).toBeVisible();

    const userBtn = page.locator('.header-user-btn');
    await expect(userBtn).toBeVisible();
  });
});
