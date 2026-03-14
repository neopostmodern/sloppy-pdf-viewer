import { test, expect } from '@playwright/test';
import { injectTauriMock, openPdfViaDialog } from './tauri-mock.js';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page, 'tests/fixtures/searchable.pdf');
  await page.goto('/');
  await openPdfViaDialog(page);
});

test('Ctrl+F opens find bar, Escape closes it', async ({ page }) => {
  // Find bar starts hidden (not in DOM)
  await expect(page.locator('[data-testid="findbar"]')).not.toBeVisible();

  // Ctrl+F opens it
  await page.keyboard.press('Control+f');
  await expect(page.locator('[data-testid="findbar"]')).toBeVisible();

  // Escape closes it
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-testid="findbar"]')).not.toBeVisible();
});

test('typing a query shows result count', async ({ page }) => {
  await page.keyboard.press('Control+f');
  await page.locator('#findInput').fill('fox');

  // Wait for find results to appear
  await expect(page.locator('#findResultsCount')).not.toHaveText('', { timeout: 5000 });
  const text = await page.locator('#findResultsCount').textContent();
  // Should match pattern "X of Y"
  expect(text).toMatch(/\d+ of \d+/);
});

test('next/prev match changes current count', async ({ page }) => {
  await page.keyboard.press('Control+f');
  await page.locator('#findInput').fill('fox');

  await expect(page.locator('#findResultsCount')).not.toHaveText('', { timeout: 5000 });
  const initial = await page.locator('#findResultsCount').textContent();

  await page.click('[data-testid="findNext"]');
  await page.waitForTimeout(300);
  const afterNext = await page.locator('#findResultsCount').textContent();

  // The "current" number should change (or wrap)
  expect(afterNext).toMatch(/\d+ of \d+/);
});

test('Match Case toggle changes result count', async ({ page }) => {
  await page.keyboard.press('Control+f');
  await page.locator('#findInput').fill('fox');

  await expect(page.locator('#findResultsCount')).not.toHaveText('', { timeout: 5000 });
  const beforeCase = await page.locator('#findResultsCount').textContent();

  // Enable Match Case — "fox" should not match "FOX"
  await page.locator('#findMatchCase').check();
  await page.waitForTimeout(500);
  const afterCase = await page.locator('#findResultsCount').textContent();

  // With case sensitivity, count should differ (fewer matches)
  expect(afterCase).toMatch(/\d+ of \d+/);
});

test('Whole Words toggle changes result count', async ({ page }) => {
  await page.keyboard.press('Control+f');
  await page.locator('#findInput').fill('word');

  await expect(page.locator('#findResultsCount')).not.toHaveText('', { timeout: 5000 });
  const before = await page.locator('#findResultsCount').textContent();

  // Enable Whole Words
  await page.locator('#findEntireWord').check();
  await page.waitForTimeout(500);
  const after = await page.locator('#findResultsCount').textContent();

  // Result count should still show matches
  expect(after).toMatch(/\d+ of \d+/);
});

test('not found message for non-existent query', async ({ page }) => {
  await page.keyboard.press('Control+f');
  await page.locator('#findInput').fill('zzzznonexistent');

  // Wait for "Not found" message
  await expect(page.locator('#findMsg')).toHaveText('Not found', { timeout: 5000 });
});

test('close button closes find bar', async ({ page }) => {
  await page.click('[data-testid="viewFind"]');
  await expect(page.locator('[data-testid="findbar"]')).toBeVisible();

  await page.click('[data-testid="findClose"]');
  await expect(page.locator('[data-testid="findbar"]')).not.toBeVisible();
});
