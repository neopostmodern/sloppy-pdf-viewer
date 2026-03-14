import { test, expect } from '@playwright/test';
import { injectTauriMock, openPdfViaDialog } from './tauri-mock.js';

test.describe('sidebar with simple PDF', () => {
  test.beforeEach(async ({ page }) => {
    await injectTauriMock(page, 'tests/fixtures/simple.pdf');
    await page.goto('/');
    await openPdfViaDialog(page);
  });

  test('sidebar toggle shows and hides sidebar', async ({ page }) => {
    // Sidebar starts hidden (not in DOM)
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();

    // Toggle open
    await page.click('[data-testid="sidebarToggle"]');
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Toggle closed
    await page.click('[data-testid="sidebarToggle"]');
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
  });

  test('thumbnails tab shows correct number of thumbnails', async ({ page }) => {
    await page.click('[data-testid="sidebarToggle"]');
    // Wait for thumbnails to render
    await page.waitForTimeout(1000);

    const thumbnails = page.locator('.thumbnail-item');
    await expect(thumbnails).toHaveCount(3);
  });

  test('click thumbnail navigates to that page', async ({ page }) => {
    await page.click('[data-testid="sidebarToggle"]');
    await page.waitForTimeout(1000);

    // Click the third thumbnail
    await page.locator('.thumbnail-item[data-page="3"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#pageNumber')).toHaveValue('3');
  });

  test('no outline available shown for PDF without outline', async ({ page }) => {
    await page.click('[data-testid="sidebarToggle"]');
    await page.click('[data-testid="tabOutline"]');

    await expect(page.locator('.outline-empty')).toHaveText('No outline available');
  });
});

test.describe('sidebar with outline PDF', () => {
  test.beforeEach(async ({ page }) => {
    await injectTauriMock(page, 'tests/fixtures/with-outline.pdf');
    await page.goto('/');
    await openPdfViaDialog(page);
  });

  test('outline tab shows outline items', async ({ page }) => {
    await page.click('[data-testid="sidebarToggle"]');
    await page.click('[data-testid="tabOutline"]');
    await page.waitForTimeout(500);

    const items = page.locator('.outline-item');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toHaveText('Chapter 1');
    await expect(items.nth(1)).toHaveText('Chapter 2');
    await expect(items.nth(2)).toHaveText('Chapter 3');
  });

  test('click outline item navigates to correct page', async ({ page }) => {
    await page.click('[data-testid="sidebarToggle"]');
    await page.click('[data-testid="tabOutline"]');
    await page.waitForTimeout(500);

    await page.locator('.outline-item', { hasText: 'Chapter 3' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('#pageNumber')).toHaveValue('3');
  });
});
