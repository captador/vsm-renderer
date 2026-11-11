/**
 * VSM Renderer — Color Palette
 * Exact hex values from NOTATION.md §4
 */

export const COLORS = {
  // Metasystem
  s5: '#A0C0D5', // Policy / Identity (light blue)
  s4: '#7BCA79', // Intelligence (green)
  s3: '#FF5534', // Control (red — also S3*)
  s3star: '#FF5534', // Audit (same red as S3)
  s2: '#FFCC50', // Coordination (amber)

  // Environment
  envFuture: '#A2DAA0', // Future environment (pale green)
  envOuter: '#D7D7D7', // Outer environment amoeba
  envBlob: '#8F8F8F', // S1 sub-environment blobs
  envBlobUnmapped: '#C0C0C0', // Not-mapped complexity slice
  envOverlap: '#6B6B6B', // Darker grey mask where adjacent env blobs overlap

  // Connectors / strokes
  navy: '#1D3880', // Navy connectors
  stroke: '#9A9A9A', // Element stroke / outlines
  amplifier: '#333333', // Amplifier arrows
  algedonic: '#C0399F', // Algedonic bypass (magenta)
  white: '#FFFFFF', // White labels on shapes

  // Labels
  label: '#3A3F45', // Unit name labels (dark on light canvas)
  labelMuted: '#777777', // '?' marker on unmapped env slices

  // Derived aliases (for channel code clarity)
  amber: '#FFCC50',
  red: '#FF5534',
  green: '#7BCA79',
  blue: '#A0C0D5',
  // Interaction
  hover: '#E8F0FE', // hover tint for white-filled shapes
} as const;

export function lightenHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// Themes
// ============================================================================

/** Color theme for the renderer. `'light'` is the default (COLORS as-is). */
export type RendererTheme = 'light' | 'dark';

/** Resolved palette: every key of COLORS mapped to a plain string. */
export type Palette = { [K in keyof typeof COLORS]: string };

/**
 * Colors overridden in dark theme. Only the colors that are unreadable on a
 * dark canvas change (navy connectors, amplifier arrows); mid greys and
 * saturated fills work on both backgrounds. Unit labels are NOT overridden:
 * they sit on white-filled shapes (management squares), which stay white in
 * dark theme. Env blob labels use `white` directly (they sit on grey blobs).
 */
const DARK_OVERRIDES: Partial<Palette> = {
  navy: '#8FA8E8', // light periwinkle connectors
  amplifier: '#C8C8C8',
  envOuter: '#2A2E38', // dark grey wash for the outer env amoeba
};

/** Resolve the palette for a theme. */
export function getColors(theme: RendererTheme = 'light'): Palette {
  return theme === 'dark' ? { ...COLORS, ...DARK_OVERRIDES } : COLORS;
}
