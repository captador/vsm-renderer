/**
 * VSM Renderer — Geometry Functions
 * Path generators ported verbatim from the reference vsm.html
 */

// ============================================================================
// Helpers
// ============================================================================

function f(n: number): string {
  return (+n).toFixed(1);
}

function mid(A: [number, number], B: [number, number]): string {
  return `${f((A[0] + B[0]) / 2)} ${f((A[1] + B[1]) / 2)}`;
}

// ============================================================================
// Organic blob — used for sub-env blobs and future env
// ============================================================================

/**
 * Generate an organic blob shape.
 * @param cx  Centre X
 * @param cy  Centre Y
 * @param rx  Horizontal radius
 * @param ry  Vertical radius
 * @param seed  Deterministic seed (same seed → same shape)
 * @param amp  Perturbation amplitude (0–1)
 */
export function blob(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  amp: number = 1
): string {
  const n = 16;
  const p: [number, number][] = [];

  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w =
      0.8 +
      0.18 * amp * Math.sin(seed * 1.3 + i * 1.7) +
      0.07 * amp * Math.cos(seed * 0.7 + i * 2.3);
    p.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
  }

  let d = `M ${mid(p[n - 1], p[0])}`;
  for (let i = 0; i < n; i++) {
    const cur = p[i];
    const nx = p[(i + 1) % n];
    d += ` Q ${f(cur[0])} ${f(cur[1])} ${mid(cur, nx)}`;
  }
  return d + ' Z';
}

// ============================================================================
// Environment silhouette — outer amoeba shape
// ============================================================================

const ENV_PROFILE: [number, number][] = [
  [0, 12],
  [0.07, 62],
  [0.16, 54],
  [0.27, 38],
  [0.38, 52],
  [0.54, 62],
  [0.7, 58],
  [0.85, 52],
  [0.95, 42],
  [1, 20],
];

function getHalfWidth(t: number): number {
  for (let i = 0; i < ENV_PROFILE.length - 1; i++) {
    const a = ENV_PROFILE[i];
    const b = ENV_PROFILE[i + 1];
    if (t <= b[0]) {
      const u = (t - a[0]) / (b[0] - a[0]);
      return a[1] + (b[1] - a[1]) * u;
    }
  }
  return ENV_PROFILE[ENV_PROFILE.length - 1][1];
}

/**
 * Generate the organic tall amoeba/silhouette for the outer environment.
 */
export function envSilhouette(cx: number, yTop: number, yBot: number, seed: number): string {
  const H = yBot - yTop;
  const pts: [number, number][] = [];
  const n = 15;

  // Right side (top → bottom)
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = yTop + t * H;
    const w = getHalfWidth(t) * (1 + 0.05 * Math.sin(seed + i * 1.9));
    pts.push([cx + w, y]);
  }
  // Left side (bottom → top)
  for (let i = n; i >= 0; i--) {
    const t = i / n;
    const y = yTop + t * H;
    const w = getHalfWidth(t) * (1 + 0.05 * Math.cos(seed * 1.3 + i * 1.4));
    pts.push([cx - w, y]);
  }

  let d = `M ${mid(pts[pts.length - 1], pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const nx = pts[(i + 1) % pts.length];
    d += ` Q ${f(cur[0])} ${f(cur[1])} ${mid(cur, nx)}`;
  }
  return d + ' Z';
}

// ============================================================================
// Wave — vertical squiggle for channel c
// ============================================================================

/**
 * Generate a vertical squiggle/wave between two Y positions.
 */
export function wave(x: number, y1: number, y2: number, amp: number): string {
  let d = `M ${f(x)} ${f(y1)}`;
  const steps = Math.max(3, Math.round((y2 - y1) / 12));
  let dir = 1;

  for (let i = 1; i <= steps; i++) {
    const y = y1 + ((y2 - y1) * i) / steps;
    const ya = y1 + ((y2 - y1) * (i - 0.5)) / steps;
    d += ` Q ${f(x + amp * dir)} ${f(ya)} ${f(x)} ${f(y)}`;
    dir *= -1;
  }
  return d;
}

// ============================================================================
// Homeostat / S5 arm shape definitions (from vsm.html SHAPE_DEF)
// ============================================================================

export const SHAPE_DEF = {
  /** Red homeostat arrow: S3 → S4 */
  red: [
    [491, 220],
    [442, 181],
    [453, 160],
    [491, 133],
  ] as [number, number][],
  /** Green homeostat arrow: S4 → S3 */
  green: [
    [647, 133],
    [693, 145],
    [682, 201],
    [643, 218],
  ] as [number, number][],
  /** Left S5 dampening arm */
  armL: [
    [492, 69],
    [440, 82],
    [420, 140],
    [455, 172],
  ] as [number, number][],
  /** Right S5 dampening arm */
  armR: [
    [646, 67],
    [701, 81],
    [703, 145],
    [679, 171],
  ] as [number, number][],
};

/** Convert a 4-point cubic bezier spec to an SVG/Konva path string */
export function shapeD(points: [number, number][]): string {
  return (
    `M ${f(points[0][0])} ${f(points[0][1])} ` +
    `C ${f(points[1][0])} ${f(points[1][1])} ` +
    `${f(points[2][0])} ${f(points[2][1])} ` +
    `${f(points[3][0])} ${f(points[3][1])}`
  );
}
