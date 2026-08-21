/**
 * VSM Renderer — Layout Constants
 * From vsm.html's L object and NOTATION.md §6 canonical layout.
 */

// Canvas default size (portrait, viewBox 0 0 900 1100)
export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 1100;

// Metasystem boxes (x/y = top-left corner, w/h = size)
export const S5 = { x: 493, y: 42, width: 150, height: 46 };
export const S4 = { x: 493, y: 112, width: 150, height: 38 };
export const S3 = { x: 493, y: 194, width: 150, height: 48 };

// S3* — inverted triangle (▽), tip down, LEFT side
export const S3STAR = { cx: 360, topY: 230, botY: 285 };

// S2 — upward triangle (△), tip up, RIGHT side
export const S2 = { cx: 748, topY: 230, botY: 285 };

// S1 unit dimensions
export const CIRCLE_X = 490; // X centre for S1 operation circles
export const CIRCLE_R = 25; // Radius of S1 operation circles

export const SQ_CX = 568; // X centre for S1 management squares
export const SQ_W = 102; // Width of S1 management squares
export const SQ_H = 48; // Height of S1 management squares

// Diagonal offset: management square sits SQ_CX-CIRCLE_X px to the right
// and S1_MGMT_DY px above the operation circle.
export const S1_MGMT_DY = 48;

// Channel positions
export const CMD_L = 561; // Left command line X (channel e)
export const CMD_R = 575; // Right resource line X (channel d)
export const META_CX = 568; // Metasystem spine centre X

// Environment
export const ENV_X = 200; // X centre for the environment column

// Row layout
export const ROW_0 = 380; // Y coordinate of the first S1 row (index 0)
export const ROW_H = 112; // Vertical step between consecutive S1 rows

// Additional channel positions
export const AUDIT_X = 458; // S3* audit line X position
export const LADDER_L = 680; // S2 coordination ladder left X
export const LADDER_R = 702; // S2 coordination ladder right X

// Viewport
export const MAX_ZOOM = 6; // Maximum zoom factor
export const MIN_ZOOM = 0.1; // Minimum zoom factor
