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
  const p = blobPoints(cx, cy, rx, ry, seed, amp);
  const n = p.length;

  let d = `M ${mid(p[n - 1], p[0])}`;
  for (let i = 0; i < n; i++) {
    const cur = p[i];
    const nx = p[(i + 1) % n];
    d += ` Q ${f(cur[0])} ${f(cur[1])} ${mid(cur, nx)}`;
  }
  return d + ' Z';
}

/**
 * The outline points of {@link blob}, for use as a clip region (e.g. to
 * paint only the overlap between two adjacent blobs).
 */
export function blobPoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  amp: number = 1
): [number, number][] {
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
  return p;
}

// ============================================================================
// Environment silhouette — outer amoeba shape
// ============================================================================

const ENV_PROFILE: [number, number][] = [
  [0, 6],
  [0.03, 38],
  [0.06, 54],
  [0.1, 63],
  [0.15, 64],
  [0.4, 58],
  [0.6, 60],
  [0.85, 56],
  [0.9, 54],
  [0.94, 40],
  [0.97, 22],
  [1, 6],
];

/** Widest half-width in ENV_PROFILE — the profile is scaled relative to this. */
const ENV_PROFILE_MAX = 64;

/** Target width of the whole amoeba as a fraction of its length. */
const ENV_ASPECT = 0.3;

function getHalfWidth(t: number): number {
  for (let i = 0; i < ENV_PROFILE.length - 1; i++) {
    const a = ENV_PROFILE[i];
    const b = ENV_PROFILE[i + 1];
    if (t <= b[0]) {
      // Cosine (smoothstep) interpolation — no creases between profile points
      const u = (t - a[0]) / (b[0] - a[0]);
      const s = (1 - Math.cos(Math.PI * u)) / 2;
      return a[1] + (b[1] - a[1]) * s;
    }
  }
  return ENV_PROFILE[ENV_PROFILE.length - 1][1];
}

/**
 * Convert a closed loop of points to a smooth path using a closed
 * Catmull-Rom spline rendered as cubic Bézier segments (C1-continuous,
 * passes through every point).
 */
function catmullRomClosed(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + ' Z';
}

/**
 * Generate the organic tall amoeba/silhouette for the outer environment.
 * The ENV_PROFILE supplies the broad amorphous outline (scaled so the whole
 * amoeba's width is ENV_ASPECT of its length); a gentle ripple on top and a
 * closed Catmull-Rom spline keep the border smooth and flowing.
 */
export function envSilhouette(cx: number, yTop: number, yBot: number, seed: number): string {
  const H = yBot - yTop;
  // Scale the profile so the whole amoeba's width is ENV_ASPECT of its
  // length regardless of how many S1 rows it spans: max half-width =
  // (ENV_ASPECT * H) / 2.
  const scale = (ENV_ASPECT * H) / 2 / ENV_PROFILE_MAX;
  // S-curve lean: the tube's centreline sways right in the upper half and
  // left in the lower half, like a letter S in a very wide font — kept
  // subtle so it stays close to the central line.
  const swayAmp = (0.12 * (ENV_ASPECT * H)) / 2;
  const pts: [number, number][] = [];
  const n = 30;

  // Side ripple: barely-there breathing (kept so different seeds still give
  // slightly different shapes), phase-shifted per side — the border reads as
  // a plain smooth S-capsule.
  const ripple = (i: number, phase: number): number =>
    1 +
    0.008 * Math.sin(seed * 1.7 + i * 0.8 + phase) +
    0.004 * Math.sin(seed * 0.9 + i * 1.6 + phase * 2);

  // Right side (top → bottom)
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = yTop + t * H;
    const sway = swayAmp * Math.sin(2 * Math.PI * t);
    const w = getHalfWidth(t) * scale * ripple(i, 0);
    pts.push([cx + sway + w, y]);
  }
  // Left side (bottom → top)
  for (let i = n; i >= 0; i--) {
    const t = i / n;
    const y = yTop + t * H;
    const sway = swayAmp * Math.sin(2 * Math.PI * t);
    const w = getHalfWidth(t) * scale * ripple(i, Math.PI / 3);
    pts.push([cx + sway - w, y]);
  }

  return catmullRomClosed(pts);
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
