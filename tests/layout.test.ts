/**
 * Layout Tests
 *
 * Tests for layout constants and calculations
 */

import { describe, it, expect } from 'vitest';
import {
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
  SPINE_X,
  MAX_ZOOM,
  MIN_ZOOM,
  rowY,
  canvasHeight,
  envRows,
  totalRows,
} from '../src/layout';

describe('Layout Constants', () => {
  describe('Canvas Dimensions', () => {
    it('should have correct canvas width', () => {
      expect(CANVAS_WIDTH).toBe(900);
    });

    it('should have correct canvas height', () => {
      expect(CANVAS_HEIGHT).toBe(1100);
    });
  });

  describe('Metasystem Positions', () => {
    it('should have correct S5 position', () => {
      expect(S5).toEqual({ x: 493, y: 42, width: 150, height: 46 });
    });

    it('should have correct S4 position', () => {
      expect(S4).toEqual({ x: 493, y: 112, width: 150, height: 38 });
    });

    it('should have correct S3 position', () => {
      expect(S3).toEqual({ x: 493, y: 194, width: 150, height: 48 });
    });

    it('should have correct S3STAR position', () => {
      expect(S3STAR).toEqual({ cx: 360, topY: 230, botY: 285 });
    });

    it('should have correct S2 position', () => {
      expect(S2).toEqual({ cx: 748, topY: 230, botY: 285 });
    });
  });

  describe('Operations (S1) Constants', () => {
    it('should have correct circle X position', () => {
      expect(CIRCLE_X).toBe(490);
    });

    it('should have correct circle radius', () => {
      expect(CIRCLE_R).toBe(25);
    });

    it('should have correct square center X', () => {
      expect(SQ_CX).toBe(568);
    });

    it('should have correct square width', () => {
      expect(SQ_W).toBe(102);
    });

    it('should have correct square height', () => {
      expect(SQ_H).toBe(48);
    });
  });

  describe('Environment Constants', () => {
    it('should have correct ENV_X position', () => {
      expect(ENV_X).toBe(200);
    });

    it('should have correct ROW_0', () => {
      expect(ROW_0).toBe(380);
    });

    it('should have correct ROW_H', () => {
      expect(ROW_H).toBe(112);
    });
  });

  describe('Channel Constants', () => {
    it('should have correct CMD_L', () => {
      expect(CMD_L).toBe(561);
    });

    it('should have correct CMD_R', () => {
      expect(CMD_R).toBe(575);
    });

    it('should have correct AUDIT_X', () => {
      expect(AUDIT_X).toBe(458);
    });

    it('should have correct LADDER_L', () => {
      expect(LADDER_L).toBe(680);
    });

    it('should have correct LADDER_R', () => {
      expect(LADDER_R).toBe(702);
    });
  });

  describe('Metasystem Spine', () => {
    it('should have correct SPINE_X', () => {
      expect(SPINE_X).toBe(568);
    });
  });

  describe('Viewport Constants', () => {
    it('should have correct MAX_ZOOM', () => {
      expect(MAX_ZOOM).toBe(6);
    });

    it('should have correct MIN_ZOOM', () => {
      expect(MIN_ZOOM).toBe(0.1);
    });
  });
});

describe('Layout Functions', () => {
  describe('rowY()', () => {
    it('should return correct Y for index 0', () => {
      expect(rowY(0)).toBe(ROW_0);
    });

    it('should return correct Y for index 1', () => {
      expect(rowY(1)).toBe(ROW_0 + ROW_H);
    });

    it('should return correct Y for index 2', () => {
      expect(rowY(2)).toBe(ROW_0 + ROW_H * 2);
    });

    it('should calculate Y correctly for any index', () => {
      const index = 5;
      expect(rowY(index)).toBe(ROW_0 + ROW_H * index);
    });
  });

  describe('canvasHeight()', () => {
    it('should calculate height for 1 S1 unit', () => {
      const height = canvasHeight(1);
      const lastY = rowY(0);
      expect(height).toBe(lastY + 74 + 26);
    });

    it('should calculate height for 3 S1 units', () => {
      const height = canvasHeight(3);
      const lastY = rowY(2);
      expect(height).toBe(lastY + 74 + 26);
    });

    it('should increase with more S1 units', () => {
      const height1 = canvasHeight(1);
      const height2 = canvasHeight(2);
      const height3 = canvasHeight(3);

      expect(height2).toBeGreaterThan(height1);
      expect(height3).toBeGreaterThan(height2);
    });
  });

  describe('envRows() / totalRows() — explicit s1Id mapping', () => {
    const s1 = [{ id: 's1-a' }, { id: 's1-b' }, { id: 's1-c' }];

    it('maps each env blob to the row of its s1Id unit, regardless of array order', () => {
      const rows = envRows({
        s1,
        environments: [
          { id: 'e1', s1Id: 's1-c' },
          { id: 'e2', s1Id: 's1-a' },
        ],
      });
      expect(rows).toEqual([2, 0]);
    });

    it('stacks blobs without a valid s1Id below all S1 rows', () => {
      const rows = envRows({
        s1,
        environments: [
          { id: 'e1', s1Id: 's1-b' },
          { id: 'e2' }, // not mapped yet
          { id: 'e3', s1Id: 's1-ghost' }, // dangling ref — also unmapped
        ],
      });
      expect(rows).toEqual([1, 3, 4]);
      expect(
        totalRows({
          s1,
          environments: [{ id: 'e1', s1Id: 's1-b' }, { id: 'e2' }, { id: 'e3', s1Id: 's1-ghost' }],
        })
      ).toBe(5);
    });

    it('gives no S1 row to any blob when none are mapped (bug: channels to unmapped envs)', () => {
      const system = {
        s1,
        environments: [{ id: 'e1' }, { id: 'e2' }], // added but not mapped
      };
      expect(envRows(system).every((r) => r >= s1.length)).toBe(true);
      expect(totalRows(system)).toBe(5);
    });

    it('keeps all-mapped systems at one row per S1 unit', () => {
      const system = {
        s1,
        environments: [
          { id: 'e1', s1Id: 's1-a' },
          { id: 'e2', s1Id: 's1-b' },
          { id: 'e3', s1Id: 's1-c' },
        ],
      };
      expect(envRows(system)).toEqual([0, 1, 2]);
      expect(totalRows(system)).toBe(3);
    });
  });
});
