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

/**
 * Row index of every environment blob, driven by the explicit `s1Id` mapping.
 *
 * A blob is mapped when its `s1Id` references an existing S1 unit — it then
 * takes that unit's row. Unmapped blobs are stacked below all S1 rows
 * (indices ≥ `s1.length`) as "complexity slices" and get no S1 connections.
 *
 * @returns `rowOfEnv[i]` = row index for `system.environments[i]`.
 */
export function envRows(system: {
  s1: Array<{ id: string }>;
  environments: Array<{ s1Id?: string }>;
}): number[] {
  const s1IndexById = new Map(system.s1.map((u, i) => [u.id, i]));
  const rows: number[] = [];
  let unmapped = 0;
  for (const env of system.environments) {
    const mapped = env.s1Id ? s1IndexById.get(env.s1Id) : undefined;
    if (mapped !== undefined) rows.push(mapped);
    else rows.push(system.s1.length + unmapped++);
  }
  return rows;
}

/**
 * Total diagram rows: one per S1 unit plus one per unmapped env blob.
 */
export function totalRows(system: {
  s1: Array<{ id: string }>;
  environments: Array<{ s1Id?: string }>;
}): number {
  const n = system.s1.length;
  const unmapped = envRows(system).filter((r) => r >= n).length;
  return Math.max(n + unmapped, 1);
}
