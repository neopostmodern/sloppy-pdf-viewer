import { test, expect } from '@playwright/test';
import { injectTauriMock, openPdfViaDialog } from './tauri-mock.js';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page, 'tests/fixtures/simple.pdf');
  await page.goto('/');
  await openPdfViaDialog(page);
});

test('select 200% from dropdown', async ({ page }) => {
  await page.selectOption('#scaleSelect', '2');
  await expect(page.locator('#scaleSelect')).toHaveValue('2');
});

test('zoom in increases scale', async ({ page }) => {
  // Set a known starting zoom
  await page.selectOption('#scaleSelect', '1');
  await page.waitForTimeout(300);

  await page.click('#zoomIn');
  await page.waitForTimeout(300);

  // After zoom in, scale changes — either a preset value > 1 or "custom" with a higher percentage
  const value = await page.locator('#scaleSelect').inputValue();
  if (value === 'custom') {
    // Custom zoom — check the displayed text shows > 100%
    const text = await page.locator('#scaleSelect option[value="custom"]').textContent();
    const pct = parseInt(text);
    expect(pct).toBeGreaterThan(100);
  } else {
    expect(parseFloat(value)).toBeGreaterThan(1);
  }
});

test('zoom out decreases scale', async ({ page }) => {
  // Set a known starting zoom
  await page.selectOption('#scaleSelect', '2');
  await page.waitForTimeout(300);

  await page.click('#zoomOut');
  await page.waitForTimeout(300);

  const value = await page.locator('#scaleSelect').inputValue();
  // Should be less than 2 (or custom)
  expect(value === 'custom' || parseFloat(value) < 2).toBeTruthy();
});

test('select Page Fit', async ({ page }) => {
  await page.selectOption('#scaleSelect', 'page-fit');
  await expect(page.locator('#scaleSelect')).toHaveValue('page-fit');
});

test('select Page Width', async ({ page }) => {
  await page.selectOption('#scaleSelect', 'page-width');
  await expect(page.locator('#scaleSelect')).toHaveValue('page-width');
});

test('select Actual Size shows 100%', async ({ page }) => {
  await page.selectOption('#scaleSelect', 'page-actual');
  // After selecting page-actual, the scalechanging event fires with scale=1
  // which matches the option value="1" (100%)
  await page.waitForTimeout(300);
  const value = await page.locator('#scaleSelect').inputValue();
  expect(value === 'page-actual' || value === '1').toBeTruthy();
});
