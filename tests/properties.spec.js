import { test, expect } from '@playwright/test';
import { injectTauriMock, openPdfViaDialog } from './tauri-mock.js';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page, 'tests/fixtures/simple.pdf');
  await page.goto('/');
  await openPdfViaDialog(page);
});

test('open document properties from secondary toolbar', async ({ page }) => {
  await page.click('#secondaryToolbarToggle');
  await page.click('#documentProperties');
  await page.waitForTimeout(300);

  await expect(page.locator('#propertiesOverlay')).not.toHaveClass(/hidden/);
});

test('dialog shows file name and page count', async ({ page }) => {
  await page.click('#secondaryToolbarToggle');
  await page.click('#documentProperties');
  await page.waitForTimeout(300);

  await expect(page.locator('#propFileName')).toHaveText('simple.pdf');
  await expect(page.locator('#propPageCount')).toHaveText('3');
});

test('dialog shows page size', async ({ page }) => {
  await page.click('#secondaryToolbarToggle');
  await page.click('#documentProperties');
  await page.waitForTimeout(300);

  const pageSize = await page.locator('#propPageSize').textContent();
  // Should contain dimensions like "8.50 × 11.00 in"
  expect(pageSize).toMatch(/\d+\.\d+ × \d+\.\d+ in/);
});

test('close button dismisses dialog', async ({ page }) => {
  await page.click('#secondaryToolbarToggle');
  await page.click('#documentProperties');
  await page.waitForTimeout(300);

  await page.click('#propertiesClose');
  await expect(page.locator('#propertiesOverlay')).toHaveClass(/hidden/);
});

test('click overlay dismisses dialog', async ({ page }) => {
  await page.click('#secondaryToolbarToggle');
  await page.click('#documentProperties');
  await page.waitForTimeout(300);

  // Click the overlay (not the dialog itself)
  await page.locator('#propertiesOverlay').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('#propertiesOverlay')).toHaveClass(/hidden/);
});

test('Escape dismisses dialog', async ({ page }) => {
  await page.click('#secondaryToolbarToggle');
  await page.click('#documentProperties');
  await page.waitForTimeout(300);

  await page.keyboard.press('Escape');
  await expect(page.locator('#propertiesOverlay')).toHaveClass(/hidden/);
});
