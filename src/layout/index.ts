/**
 * VSM Renderer — Layout helpers
 */

export * from './constants';

import { ROW_0, ROW_H } from './constants';


/**
 * Y coordinate of the centre of the S1 unit at zero-based row index `i`.
 *
 * @param i - Zero-based row index (0 = topmost S1 unit).
 */
export function rowY(i: number): number {
  return ROW_0 + i * ROW_H;
}

/**
 * Minimum canvas height in pixels required to fit `n` S1 units without clipping.
 *
 * @param n - Number of S1 units (or total rows, including not-mapped env blobs).
 */
export function canvasHeight(n: number): number {
  const lastY = rowY(Math.max(n, 1) - 1);
  return lastY + 74 + 26;
}
