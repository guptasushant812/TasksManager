import { test, expect } from '@playwright/test';

test.describe('Theme System & Kyoto Kanso Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lastActiveTime', Date.now().toString());
      localStorage.setItem('isAppLocked', 'false');
    });
  });

  test('settings page displays all 5 themes including Kyoto Kanso', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('.settings-theme-grid')).toBeVisible({ timeout: 15000 });

    const themeCards = page.locator('.settings-theme-card');
    await expect(themeCards).toHaveCount(5);

    // Verify all 5 theme titles exist
    await expect(page.locator('.settings-theme-card:has-text("Light Mode")')).toBeVisible();
    await expect(page.locator('.settings-theme-card:has-text("Dark Mode")')).toBeVisible();
    await expect(page.locator('.settings-theme-card:has-text("Midnight Slate")')).toBeVisible();
    await expect(page.locator('.settings-theme-card:has-text("Sketch")')).toBeVisible();
    await expect(page.locator('.settings-theme-card:has-text("Kyoto Kanso")')).toBeVisible();
  });

  test('switching to Kyoto Kanso updates theme attribute, styles and persists across reload', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('.settings-theme-grid')).toBeVisible({ timeout: 15000 });

    // Click Kyoto Kanso theme card
    const kansoCard = page.locator('.settings-theme-card:has-text("Kyoto Kanso")');
    await kansoCard.click();

    // Verify confirmation modal appears
    const confirmBtn = page.locator('button:has-text("Apply Theme")');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify html attributes
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'kanso');
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(false);

    // Verify localStorage persistence
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(savedTheme).toBe('kanso');

    // Reload page and check persistence
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'kanso');
    const isDarkAfterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkAfterReload).toBe(false);

    // Verify dashboard renders with kanso theme
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'kanso');
    await expect(page.locator('.summary-cards-container')).toBeVisible({ timeout: 10000 });
  });
});
