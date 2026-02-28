import { test, expect } from '@playwright/test';
import { injectTauriMock, openPdfViaDialog } from './tauri-mock.js';

test('opening file renders PDF and updates page count and title', async ({ page }) => {
  await injectTauriMock(page, 'tests/fixtures/simple.pdf');
  await page.goto('/');

  // Before opening, page count should be 0
  await expect(page.locator('#numPages')).toHaveText('0');

  await openPdfViaDialog(page);

  // After opening
  await expect(page.locator('#numPages')).toHaveText('3');
  const title = await page.title();
  expect(title).toContain('simple.pdf');
});

test('save calls dialog.save and fs.writeFile', async ({ page }) => {
  await injectTauriMock(page, 'tests/fixtures/simple.pdf');
  await page.goto('/');
  await openPdfViaDialog(page);

  // Trigger save
  await page.click('#download');
  await page.waitForTimeout(1000);

  const mockState = await page.evaluate(() => window.__tauriMock);
  expect(mockState.dialogSaveCalled).toBe(true);
  expect(mockState.fsWriteCalls.length).toBeGreaterThan(0);
  expect(mockState.fsWriteCalls[0].path).toBe('/mock/output.pdf');
  expect(mockState.fsWriteCalls[0].dataLength).toBeGreaterThan(0);
});
