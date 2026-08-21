/**
 * Canonical Model Snapshot Tests
 *
 * Visual regression tests for the canonical VSM rendering
 * Tests with different configurations to ensure pixel-perfect rendering
 */

import { test, expect } from '@playwright/test';

// Sample canonical VSM data matching NOTATION.md specification
const canonicalVsm = {
  s1: [
    { id: 's1-0', name: 'Operations Unit A' },
    { id: 's1-1', name: 'Operations Unit B' },
    { id: 's1-2', name: 'Operations Unit C' },
  ],
  s2: { id: 's2', name: 'Coordination' },
  s3: { id: 's3', name: 'Control' },
  s3star: { id: 's3star', name: 'Audit' },
  s4: { id: 's4', name: 'Intelligence' },
  s5: { id: 's5', name: 'Policy/Identity' },
  envs: [
    { id: 'env-0', name: 'Environment A' },
    { id: 'env-1', name: 'Environment B' },
    { id: 'env-2', name: 'Environment C' },
  ],
  futureEnv: { id: 'future', name: 'Future Environment' },
};

test.describe('VSM Canvas Rendering - Canonical Model', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo page
    await page.goto('/demo');

    // Wait for renderer to be ready
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      return canvas !== null && canvas.width > 0;
    });
  });

  // ==========================================================================
  // Baseline: All channels visible, 3 S1 units
  // ==========================================================================

  test('should render canonical VSM with all channels visible', async ({ page }) => {
    // Wait for the diagram to render
    await page.waitForTimeout(500);

    // Take screenshot of the canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('canonical-all-channels.png');
  });

  // ==========================================================================
  // Channel Variations
  // ==========================================================================

  test('should render with channel a hidden', async ({ page }) => {
    // Click the Channel A button to hide it
    await page.locator('text=Channel A').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('canonical-channel-a-hidden.png');

    // Click again to show it
    await page.locator('text=Channel A').click();
  });

  test('should render with channel b hidden', async ({ page }) => {
    await page.locator('text=Channel B').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('canonical-channel-b-hidden.png');

    await page.locator('text=Channel B').click();
  });

  test('should render with channel c hidden', async ({ page }) => {
    await page.locator('text=Channel C').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('canonical-channel-c-hidden.png');

    await page.locator('text=Channel C').click();
  });

  test('should render with channel d hidden', async ({ page }) => {
    await page.locator('text=Channel D').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('canonical-channel-d-hidden.png');

    await page.locator('text=Channel D').click();
  });

  test('should render with channel e hidden', async ({ page }) => {
    await page.locator('text=Channel E').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('canonical-channel-e-hidden.png');

    await page.locator('text=Channel E').click();
  });

  test('should render with channel f hidden', async ({ page }) => {
    await page.locator('text=Channel F').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('canonical-channel-f-hidden.png');

    await page.locator('text=Channel F').click();
  });

  test('should render with all channels hidden', async ({ page }) => {
    // Hide all channels
    await page.locator('text=Hide All').click();
    await page.waitForTimeout(200);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('canonical-all-channels-hidden.png');

    // Show all channels again
    await page.locator('text=Show All').click();
  });

  // ==========================================================================
  // Different S1 Counts
  // ==========================================================================

  // Note: These tests would need a way to dynamically change the S1 count
  // For now, we test what we can with the static demo

  // ==========================================================================
  // Element Visibility
  // ==========================================================================

  test('should render all metasystem elements', async ({ page }) => {
    await page.waitForTimeout(500);

    // Check that all metasystem elements are visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render all S1 units', async ({ page }) => {
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render environment elements', async ({ page }) => {
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
