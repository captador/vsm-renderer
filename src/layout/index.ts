/**
 * VSM Renderer — Layout helpers
 */

export * from './constants';

import { ROW_0, ROW_H } from './constants';

// Legacy export for backward compatibility
export const ROW0 = ROW_0;

/**
 * Y coordinate for the S1 unit at zero-based index i.
 */
export function rowY(i: number): number {
  return ROW_0 + i * ROW_H;
}

/**
 * Total canvas height needed for n S1 units.
 */
export function canvasHeight(n: number): number {
  const lastY = rowY(Math.max(n, 1) - 1);
  return lastY + 74 + 26;
}
