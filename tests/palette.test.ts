/**
 * Palette Tests
 *
 * Tests for color constants from NOTATION.md
 */

import { describe, it, expect } from 'vitest';
import { COLORS } from '../src/utils/palette';

describe('Color Palette', () => {
  describe('System Colors', () => {
    it('should have correct S5 color (light blue)', () => {
      expect(COLORS.s5).toBe('#A0C0D5');
    });

    it('should have correct S4 color (green)', () => {
      expect(COLORS.s4).toBe('#7BCA79');
    });

    it('should have correct S3 color (red)', () => {
      expect(COLORS.s3).toBe('#FF5534');
    });

    it('should have correct S3* color (red, same as S3)', () => {
      expect(COLORS.s3star).toBe('#FF5534');
    });

    it('should have correct S2 color (amber)', () => {
      expect(COLORS.s2).toBe('#FFCC50');
    });
  });

  describe('Environment Colors', () => {
    it('should have correct future environment color', () => {
      expect(COLORS.envFuture).toBe('#A2DAA0');
    });

    it('should have correct outer environment color', () => {
      expect(COLORS.envOuter).toBe('#D7D7D7');
    });

    it('should have correct S1 environment blob color', () => {
      expect(COLORS.envBlob).toBe('#8F8F8F');
    });
  });

  describe('Connector Colors', () => {
    it('should have correct navy color', () => {
      expect(COLORS.navy).toBe('#1D3880');
    });

    it('should have correct stroke color', () => {
      expect(COLORS.stroke).toBe('#9A9A9A');
    });

    it('should have correct amplifier color', () => {
      expect(COLORS.amplifier).toBe('#333333');
    });

    it('should have correct white color', () => {
      expect(COLORS.white).toBe('#FFFFFF');
    });

    it('should have correct algedonic bypass color (magenta)', () => {
      expect(COLORS.algedonic).toBe('#C0399F');
    });
  });

  describe('Derived Colors', () => {
    it('should have correct amber color', () => {
      expect(COLORS.amber).toBe('#FFCC50');
    });

    it('should have correct red color', () => {
      expect(COLORS.red).toBe('#FF5534');
    });

    it('should have correct green color', () => {
      expect(COLORS.green).toBe('#7BCA79');
    });

    it('should have correct blue color', () => {
      expect(COLORS.blue).toBe('#A0C0D5');
    });
  });

  describe('Color Values', () => {
    it('should have all colors as valid hex strings', () => {
      for (const key in COLORS) {
        const color = COLORS[key as keyof typeof COLORS];
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('should have unique colors for different systems', () => {
      // S5, S4, S3 should all have different colors
      expect(COLORS.s5).not.toBe(COLORS.s4);
      expect(COLORS.s5).not.toBe(COLORS.s3);
      expect(COLORS.s4).not.toBe(COLORS.s3);
    });

    it('should have S3 and S3* with same color', () => {
      expect(COLORS.s3).toBe(COLORS.s3star);
    });
  });
});
