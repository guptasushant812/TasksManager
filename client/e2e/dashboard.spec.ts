import { test, expect } from '@playwright/test';

test.describe('Dashboard Responsive Layout & Container Queries', () => {
  test.beforeEach(async ({ page }) => {
    // Unlock PasswordGate via localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem('lastActiveTime', Date.now().toString());
      localStorage.setItem('isAppLocked', 'false');
    });
  });

  test('desktop layout renders 3 metric cards and scope bar horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator('.summary-cards-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.dashboard-scope-container')).toBeVisible({ timeout: 10000 });

    const inProgressCard = page.locator('#summary-card-inprogress');
    const pendingCard = page.locator('#summary-card-pending');
    const completedCard = page.locator('#summary-card-completed');

    await expect(inProgressCard).toBeVisible();
    await expect(pendingCard).toBeVisible();
    await expect(completedCard).toBeVisible();

    // Verify cards are side-by-side on wide viewport
    const inProgressBox = await inProgressCard.boundingBox();
    const pendingBox = await pendingCard.boundingBox();
    expect(inProgressBox).not.toBeNull();
    expect(pendingBox).not.toBeNull();
    if (inProgressBox && pendingBox) {
      expect(pendingBox.x).toBeGreaterThan(inProgressBox.x);
    }
  });

  test('mobile viewport renders without horizontal document overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('.summary-cards-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.dashboard-scope-bar')).toBeVisible({ timeout: 10000 });

    // Verify no horizontal document overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allowance for subpixel rendering
  });

  test('dashboard table shows at most 5 tasks with View All Tasks button and no numeric pagination', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator('.summary-cards-container')).toBeVisible({ timeout: 10000 });

    // Wait for initial loading skeleton to finish
    await page.locator('.skeleton-row').first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

    // Table rows should be at most 5
    const taskRows = page.locator('table.task-table tbody tr.task-row');
    const rowCount = await taskRows.count();
    expect(rowCount).toBeLessThanOrEqual(5);

    // If tasks are present, check View All Tasks button is present and numeric pagination buttons are absent
    if (rowCount > 0) {
      const viewAllBtn = page.getByRole('button', { name: /view all tasks/i });
      await expect(viewAllBtn).toBeVisible({ timeout: 5000 });

      // Ensure no ChevronLeft/ChevronRight pagination buttons
      const paginationBtns = page.locator('button.brutalist-hover').filter({ hasText: /^[0-9]+$/ });
      expect(await paginationBtns.count()).toBe(0);
    }
  });
});
