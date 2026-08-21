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

  // Connectors / strokes
  navy: '#1D3880', // Navy connectors
  stroke: '#9A9A9A', // Element stroke / outlines
  amplifier: '#333333', // Amplifier arrows
  algedonic: '#C0399F', // Algedonic bypass (magenta)
  white: '#FFFFFF', // White labels on shapes

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
