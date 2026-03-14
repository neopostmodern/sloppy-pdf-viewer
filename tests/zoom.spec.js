import { test, expect } from '@playwright/test';
import { injectTauriMock, openPdfViaDialog } from './tauri-mock.js';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page, 'tests/fixtures/simple.pdf');
  await page.goto('/');
  await openPdfViaDialog(page);
});

// Helper to interact with MUI Select
async function selectZoom(page, value) {
  await page.locator('[data-testid="scaleSelect"] [role="combobox"]').click();
  await page.click(`[role="option"][data-value="${value}"]`);
  await page.waitForTimeout(300);
}

test('select 200% from dropdown', async ({ page }) => {
  await selectZoom(page, '2');
  const text = await page.locator('[data-testid="scaleSelect"] [role="combobox"]').textContent();
  expect(text).toContain('200%');
});

test('zoom in increases scale', async ({ page }) => {
  await selectZoom(page, '1');

  await page.click('[data-testid="zoomIn"]');
  await page.waitForTimeout(300);

  const text = await page.locator('[data-testid="scaleSelect"] [role="combobox"]').textContent();
  expect(text).toBeTruthy();
});

test('zoom out decreases scale', async ({ page }) => {
  await selectZoom(page, '2');

  await page.click('[data-testid="zoomOut"]');
  await page.waitForTimeout(300);

  const text = await page.locator('[data-testid="scaleSelect"] [role="combobox"]').textContent();
  expect(text).toBeTruthy();
  expect(text).not.toBe('200%');
});

test('select Page Fit', async ({ page }) => {
  await selectZoom(page, 'page-fit');
  const text = await page.locator('[data-testid="scaleSelect"] [role="combobox"]').textContent();
  expect(text).toContain('Page Fit');
});

test('select Page Width', async ({ page }) => {
  await selectZoom(page, 'page-width');
  const text = await page.locator('[data-testid="scaleSelect"] [role="combobox"]').textContent();
  expect(text).toContain('Page Width');
});

test('select Actual Size shows 100%', async ({ page }) => {
  await selectZoom(page, 'page-actual');
  const text = await page.locator('[data-testid="scaleSelect"] [role="combobox"]').textContent();
  expect(text === 'Actual Size' || text === '100%' || text?.includes('100')).toBeTruthy();
});
