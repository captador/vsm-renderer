/**
 * Test Setup
 *
 * Global test setup for vitest
 */

import { expect } from 'vitest';

// Extend expect with jest-dom matchers
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock Konva for tests that don't need the full library
vi.mock('konva', async () => {
  const actual = await vi.importActual('konva');
  return {
    ...actual,
    // Add any mocks if needed
  };
});
