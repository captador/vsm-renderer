/**
 * VSM Renderer — Layout Constants
 * From vsm.html's L object and NOTATION.md §6 canonical layout.
 */

// ── Canvas ────────────────────────────────────────────────────────────────────

/** Default canvas width in pixels (portrait, viewBox 0 0 900 1100). */
export const CANVAS_WIDTH = 900;

/** Default canvas height in pixels (portrait, viewBox 0 0 900 1100). */
export const CANVAS_HEIGHT = 1100;

// ── Metasystem bars ───────────────────────────────────────────────────────────

/** Bounding box of the System 5 (Policy/Identity) bar. `x/y` is the top-left corner. */
export const S5 = { x: 493, y: 42, width: 150, height: 46 };

/** Bounding box of the System 4 (Intelligence) bar. `x/y` is the top-left corner. */
export const S4 = { x: 493, y: 112, width: 150, height: 38 };

/** Bounding box of the System 3 (Control) bar. `x/y` is the top-left corner. */
export const S3 = { x: 493, y: 194, width: 150, height: 48 };

/** Geometry of the S3* (Audit) inverted triangle ▽, tip pointing down, on the LEFT side.
 *  `cx` is the horizontal centre; `topY`/`botY` are the top and tip Y coordinates. */
export const S3STAR = { cx: 360, topY: 230, botY: 285 };

/** Geometry of the S2 (Coordination) upward triangle △, tip pointing up, on the RIGHT side.
 *  `cx` is the horizontal centre; `topY`/`botY` are the tip and base Y coordinates. */
export const S2 = { cx: 748, topY: 230, botY: 285 };

// ── S1 unit geometry ──────────────────────────────────────────────────────────

/** X coordinate of the centre of S1 operation circles. */
export const CIRCLE_X = 490;

/** Radius of S1 operation circles in pixels. */
export const CIRCLE_R = 25;

/** X coordinate of the centre of S1 management squares. */
export const SQ_CX = 568;

/** Width of S1 management squares in pixels. */
export const SQ_W = 102;

/** Height of S1 management squares in pixels. */
export const SQ_H = 48;

/** Vertical offset: each management square is this many pixels *above* its operation circle centre. */
export const S1_MGMT_DY = 48;

// ── Channel positions ─────────────────────────────────────────────────────────

/** X coordinate of the left command/intervention line (channel e). */
export const CMD_L = 561;

/** X coordinate of the right resource-bargain line (channel d). */
export const CMD_R = 575;

/** X coordinate of the vertical metasystem spine that S5/S4/S3 bars and management squares are centred on. */
export const SPINE_X = 568;

/** X coordinate of the S3* audit drop line (channel b). */
export const AUDIT_X = 458;

/** X coordinate of the left edge of the S2 coordination ladder (channel f). */
export const LADDER_L = 680;

/** X coordinate of the right edge of the S2 coordination ladder (channel f). */
export const LADDER_R = 702;

// ── Environment column ────────────────────────────────────────────────────────

/** X coordinate of the centre of the environment column (sub-env blobs and future env). */
export const ENV_X = 200;

// ── Row layout ────────────────────────────────────────────────────────────────

/** Y coordinate of the first S1 row (index 0). */
export const ROW_0 = 380;

/** Vertical step in pixels between consecutive S1 rows. */
export const ROW_H = 112;

// ── Viewport ──────────────────────────────────────────────────────────────────

/** Maximum zoom scale factor. */
export const MAX_ZOOM = 6;

/** Minimum zoom scale factor. */
export const MIN_ZOOM = 0.1;
