import { test, expect } from '@playwright/test';

test.describe('Help & User Guide Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lastActiveTime', Date.now().toString());
      localStorage.setItem('isAppLocked', 'false');
    });
  });

  test('desktop layout renders hero, workflow strip, category pills, and guide cards', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/help');

    await expect(page.locator('.help-hero-title')).toContainText('How to use TasksManager');
    await expect(page.locator('.help-workflow-section')).toBeVisible();
    await expect(page.locator('.help-search-input')).toBeVisible();

    const guideCards = page.locator('.help-guide-card');
    await expect(guideCards).toHaveCount(10);

    const firstCard = guideCards.first();
    await expect(firstCard.locator('.help-guide-title')).toBeVisible();
    await expect(firstCard.locator('.help-guide-steps-list')).toBeVisible();
    await expect(firstCard.locator('.help-guide-tip-box')).toBeVisible();
    await expect(firstCard.locator('.help-guide-action-link')).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('search filters topics dynamically and clears with Escape key', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/help');

    const searchInput = page.locator('.help-search-input');
    await searchInput.fill('escalation');

    const filteredCards = page.locator('.help-guide-card');
    await expect(filteredCards).toHaveCount(1);
    await expect(filteredCards.first().locator('.help-guide-title')).toContainText('Escalation');

    await page.keyboard.press('Escape');
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('.help-guide-card')).toHaveCount(10);
  });

  test('category filter pills isolate related topics', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/help');

    const aiPill = page.locator('.help-category-pill', { hasText: 'AI Quick-Add' });
    await aiPill.click();

    const guideCards = page.locator('.help-guide-card');
    await expect(guideCards).toHaveCount(2);

    const allPill = page.locator('.help-category-pill', { hasText: 'All Topics' });
    await allPill.click();
    await expect(page.locator('.help-guide-card')).toHaveCount(10);
  });

  test('tablet viewport renders without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/help');

    await expect(page.locator('.help-hero-title')).toBeVisible();
    await expect(page.locator('.help-workflow-grid')).toBeVisible();
    await expect(page.locator('.help-cards-grid')).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('mobile viewport renders single-column layout without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/help');

    await expect(page.locator('.help-hero-title')).toBeVisible();
    await expect(page.locator('.help-search-input')).toBeVisible();
    await expect(page.locator('.help-cards-grid')).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
