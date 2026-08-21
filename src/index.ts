/**
 * VSM Renderer - Main Entry Point
 *
 * Export all public types and the VsmRenderer class
 */

// Re-export types
export type {
  VsmSystem,
  S1Unit,
  S1Operation,
  S1Management,
  Metasystem,
  EnvBlob,
  FutureEnvironment,
  ChannelId,
  ChannelVisibility,
  VsmEvent,
  VsmRendererOptions,
} from './types';

// Export the main renderer
export { VsmRenderer } from './VsmRenderer';

// Export layout constants and helpers
export {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  S5,
  S4,
  S3,
  S3STAR,
  S2,
  CIRCLE_X,
  CIRCLE_R,
  SQ_CX,
  SQ_W,
  SQ_H,
  ENV_X,
  ROW_0,
  ROW_H,
  CMD_L,
  CMD_R,
  AUDIT_X,
  LADDER_L,
  LADDER_R,
  META_CX,
  MAX_ZOOM,
  MIN_ZOOM,
  rowY,
  canvasHeight,
} from './layout';

// Export colors
export { COLORS } from './utils/palette';

// Export geometry utilities
export { blob, envSilhouette, wave, SHAPE_DEF, shapeD } from './utils/geometry';
