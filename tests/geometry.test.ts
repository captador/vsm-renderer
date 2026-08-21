/**
 * Geometry Tests
 *
 * Tests for shape generation functions (blob, envSilhouette, wave)
 * These should produce deterministic output for consistent seeds
 */

import { describe, it, expect } from 'vitest';
import { blob, envSilhouette, wave, shapeD, SHAPE_DEF } from '../src/utils/geometry';

describe('Geometry Functions', () => {
  describe('blob()', () => {
    it('should generate consistent path for same seed', () => {
      const path1 = blob(100, 100, 50, 50, 42, 1);
      const path2 = blob(100, 100, 50, 50, 42, 1);
      expect(path1).toBe(path2);
    });

    it('should generate different paths for different seeds', () => {
      const path1 = blob(100, 100, 50, 50, 1, 1);
      const path2 = blob(100, 100, 50, 50, 2, 1);
      expect(path1).not.toBe(path2);
    });

    it('should start with M command', () => {
      const path = blob(100, 100, 50, 50, 1, 1);
      expect(path.startsWith('M')).toBe(true);
    });

    it('should end with Z (close path)', () => {
      const path = blob(100, 100, 50, 50, 1, 1);
      expect(path.endsWith('Z')).toBe(true);
    });

    it('should contain Q commands for quadratic curves', () => {
      const path = blob(100, 100, 50, 50, 1, 1);
      expect(path.includes('Q')).toBe(true);
    });
  });

  describe('envSilhouette()', () => {
    it('should generate consistent path for same seed', () => {
      const path1 = envSilhouette(200, 70, 500, 2);
      const path2 = envSilhouette(200, 70, 500, 2);
      expect(path1).toBe(path2);
    });

    it('should generate different paths for different seeds', () => {
      const path1 = envSilhouette(200, 70, 500, 1);
      const path2 = envSilhouette(200, 70, 500, 2);
      expect(path1).not.toBe(path2);
    });

    it('should start with M command', () => {
      const path = envSilhouette(200, 70, 500, 1);
      expect(path.startsWith('M')).toBe(true);
    });

    it('should end with Z (close path)', () => {
      const path = envSilhouette(200, 70, 500, 1);
      expect(path.endsWith('Z')).toBe(true);
    });

    it('should contain Q commands for quadratic curves', () => {
      const path = envSilhouette(200, 70, 500, 1);
      expect(path.includes('Q')).toBe(true);
    });
  });

  describe('wave()', () => {
    it('should generate consistent path for same parameters', () => {
      const path1 = wave(100, 50, 150, 4);
      const path2 = wave(100, 50, 150, 4);
      expect(path1).toBe(path2);
    });

    it('should start with M command', () => {
      const path = wave(100, 50, 150, 4);
      expect(path.startsWith('M')).toBe(true);
    });

    it('should contain Q commands for quadratic curves', () => {
      const path = wave(100, 50, 150, 4);
      expect(path.includes('Q')).toBe(true);
    });

    it('should generate different paths for different amplitudes', () => {
      const path1 = wave(100, 50, 150, 2);
      const path2 = wave(100, 50, 150, 8);
      expect(path1).not.toBe(path2);
    });

    it('should generate longer paths for larger Y distance', () => {
      const path1 = wave(100, 50, 100, 4);
      const path2 = wave(100, 50, 200, 4);
      // Longer distance should result in more steps
      expect(path2.length).toBeGreaterThan(path1.length);
    });
  });

  describe('shapeD()', () => {
    it('should convert points array to path string', () => {
      const points = [
        [0, 0],
        [10, 10],
        [20, 20],
        [30, 30],
      ];
      const path = shapeD(points);
      expect(path).toBe('M 0.0 0.0 C 10.0 10.0 20.0 20.0 30.0 30.0');
    });

    it('should format numbers to 1 decimal place', () => {
      const points = [
        [0.123, 0.456],
        [1.789, 2.345],
        [3.678, 4.901],
        [5.234, 6.567],
      ];
      const path = shapeD(points);
      expect(path).toBe('M 0.1 0.5 C 1.8 2.3 3.7 4.9 5.2 6.6');
    });
  });

  describe('SHAPE_DEF', () => {
    it('should have all required shapes', () => {
      expect(SHAPE_DEF).toHaveProperty('red');
      expect(SHAPE_DEF).toHaveProperty('green');
      expect(SHAPE_DEF).toHaveProperty('armL');
      expect(SHAPE_DEF).toHaveProperty('armR');
    });

    it('should have arrays of 4 points each', () => {
      for (const key in SHAPE_DEF) {
        expect(SHAPE_DEF[key as keyof typeof SHAPE_DEF].length).toBe(4);
      }
    });

    it('should have points as [number, number] tuples', () => {
      for (const key in SHAPE_DEF) {
        const points = SHAPE_DEF[key as keyof typeof SHAPE_DEF];
        for (const point of points) {
          expect(point.length).toBe(2);
          expect(typeof point[0]).toBe('number');
          expect(typeof point[1]).toBe('number');
        }
      }
    });
  });
});
