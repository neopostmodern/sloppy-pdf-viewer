import { test, expect } from '@playwright/test';
import { injectTauriMock, openPdfViaDialog } from './tauri-mock.js';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page, 'tests/fixtures/simple.pdf');
  await page.goto('/');
  await openPdfViaDialog(page);
});

test('page count shows 3 after opening', async ({ page }) => {
  await expect(page.locator('#numPages')).toHaveText('3');
});

test('click next navigates to page 2', async ({ page }) => {
  await page.click('[data-testid="next"]');
  await expect(page.locator('#pageNumber')).toHaveValue('2');
});

test('click previous goes back to page 1', async ({ page }) => {
  await page.click('[data-testid="next"]');
  await expect(page.locator('#pageNumber')).toHaveValue('2');
  await page.click('[data-testid="previous"]');
  await expect(page.locator('#pageNumber')).toHaveValue('1');
});

test('type page number and press Enter to navigate', async ({ page }) => {
  const input = page.locator('#pageNumber');
  await input.fill('3');
  await input.press('Enter');
  await expect(input).toHaveValue('3');
});

test('first page button navigates to page 1', async ({ page }) => {
  // Navigate to page 3 first
  const input = page.locator('#pageNumber');
  await input.fill('3');
  await input.press('Enter');
  await expect(input).toHaveValue('3');

  // Open secondary toolbar and click first page
  await page.click('[data-testid="secondaryToolbarToggle"]');
  await page.click('[data-testid="firstPage"]');
  await expect(input).toHaveValue('1');
});

test('last page button navigates to last page', async ({ page }) => {
  await page.click('[data-testid="secondaryToolbarToggle"]');
  await page.click('[data-testid="lastPage"]');
  await expect(page.locator('#pageNumber')).toHaveValue('3');
});
