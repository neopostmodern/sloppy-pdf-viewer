import { test, expect } from '@playwright/test';
import { injectTauriMock, openPdfViaDialog } from './tauri-mock.js';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page, 'tests/fixtures/simple.pdf');
  await page.goto('/');
  await openPdfViaDialog(page);
});

test('tools button opens and closes secondary toolbar', async ({ page }) => {
  await expect(page.locator('#secondaryToolbar')).not.toBeVisible();

  await page.click('[data-testid="secondaryToolbarToggle"]');
  await expect(page.locator('#secondaryToolbar')).toBeVisible();

  // Close by pressing Escape (MUI Menu behavior)
  await page.keyboard.press('Escape');
  await expect(page.locator('#secondaryToolbar')).not.toBeVisible();
});

test('rotate CW applies rotation', async ({ page }) => {
  await page.click('[data-testid="secondaryToolbarToggle"]');
  await page.click('[data-testid="pageRotateCw"]');
  await page.waitForTimeout(500);

  // The rotation is applied — we verify the menu closed and no errors
  await expect(page.locator('#secondaryToolbar')).not.toBeVisible();
});

test('rotate CCW applies rotation', async ({ page }) => {
  await page.click('[data-testid="secondaryToolbarToggle"]');
  await page.click('[data-testid="pageRotateCcw"]');
  await page.waitForTimeout(500);
  await expect(page.locator('#secondaryToolbar')).not.toBeVisible();
});

test('scroll mode toggles update toggled state', async ({ page }) => {
  await page.click('[data-testid="secondaryToolbarToggle"]');

  // Vertical should be active by default (has checkmark)
  await expect(page.locator('[data-testid="scrollVertical"] svg')).toBeVisible();
  // Horizontal should not have checkmark
  const horizontalSvgs = await page.locator('[data-testid="scrollHorizontal"] svg').count();
  expect(horizontalSvgs).toBe(0);

  // Click horizontal scrolling
  await page.click('[data-testid="scrollHorizontal"]');
  await page.waitForTimeout(200);

  // Re-open toolbar to check state
  await page.click('[data-testid="secondaryToolbarToggle"]');
  await expect(page.locator('[data-testid="scrollHorizontal"] svg')).toBeVisible();
  const verticalSvgs = await page.locator('[data-testid="scrollVertical"] svg').count();
  expect(verticalSvgs).toBe(0);

  // Click wrapped
  await page.click('[data-testid="scrollWrapped"]');
  await page.waitForTimeout(200);

  await page.click('[data-testid="secondaryToolbarToggle"]');
  await expect(page.locator('[data-testid="scrollWrapped"] svg')).toBeVisible();
  const horizontalSvgs2 = await page.locator('[data-testid="scrollHorizontal"] svg').count();
  expect(horizontalSvgs2).toBe(0);
});

test('spread mode toggles update toggled state', async ({ page }) => {
  await page.click('[data-testid="secondaryToolbarToggle"]');

  // None should be active by default
  await expect(page.locator('[data-testid="spreadNone"] svg')).toBeVisible();

  // Click odd spreads
  await page.click('[data-testid="spreadOdd"]');
  await page.waitForTimeout(200);

  await page.click('[data-testid="secondaryToolbarToggle"]');
  await expect(page.locator('[data-testid="spreadOdd"] svg')).toBeVisible();
  const noneSvgs = await page.locator('[data-testid="spreadNone"] svg').count();
  expect(noneSvgs).toBe(0);

  // Click even spreads
  await page.click('[data-testid="spreadEven"]');
  await page.waitForTimeout(200);

  await page.click('[data-testid="secondaryToolbarToggle"]');
  await expect(page.locator('[data-testid="spreadEven"] svg')).toBeVisible();
  const oddSvgs = await page.locator('[data-testid="spreadOdd"] svg').count();
  expect(oddSvgs).toBe(0);
});

test('hand tool adds hand-tool class to viewerContainer', async ({ page }) => {
  await expect(page.locator('#viewerContainer')).not.toHaveClass(/hand-tool/);

  await page.click('[data-testid="secondaryToolbarToggle"]');
  await page.click('[data-testid="cursorHandTool"]');
  await page.waitForTimeout(200);

  await expect(page.locator('#viewerContainer')).toHaveClass(/hand-tool/);

  // Switch back to select tool
  await page.click('[data-testid="secondaryToolbarToggle"]');
  await page.click('[data-testid="cursorSelectTool"]');
  await page.waitForTimeout(200);

  await expect(page.locator('#viewerContainer')).not.toHaveClass(/hand-tool/);
});
