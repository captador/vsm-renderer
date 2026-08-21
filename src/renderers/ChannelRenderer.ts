/**
 * ChannelRenderer
 * Renders channels a–g as independently-toggleable Konva.Groups.
 * Returns the Record<ChannelId, Konva.Group> so VsmRenderer can toggle them.
 */

import Konva from 'konva';
import { ChannelId, ChannelVisibility, VsmSystem } from '../types';
import { COLORS } from '../utils/palette';
import { wave } from '../utils/geometry';
import { S3STAR, S2, S3, S5, CIRCLE_X, CIRCLE_R, CMD_L, CMD_R, ENV_X, S1_MGMT_DY, rowY } from '../layout';

export function renderChannelLayer(
  layer: Konva.Layer,
  system: VsmSystem,
  channels: ChannelVisibility
): Record<ChannelId, Konva.Group> {
  const n = system.s1.length;
  const lastY = rowY(Math.max(n, 1) - 1);
  const lastMgmtY = lastY - S1_MGMT_DY; // Y of the lowest management square
  const groups = {} as Record<ChannelId, Konva.Group>;

  // Create one group per channel
  for (const ch of ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as ChannelId[]) {
    groups[ch] = new Konva.Group({ visible: channels[ch] });
    layer.add(groups[ch]);
  }

  // -------------------------------------------------------------------------
  // Channel a — Environmental overlaps: amber lens shapes between sub-env blobs
  // -------------------------------------------------------------------------
  for (let i = 0; i < n - 1; i++) {
    const ym = (rowY(i) + rowY(i + 1)) / 2;
    groups.a.add(
      new Konva.Ellipse({
        x: ENV_X,
        y: ym,
        radiusX: 27,
        radiusY: 11,
        fill: COLORS.amber,
        opacity: 0.6,
      })
    );
  }

  // -------------------------------------------------------------------------
  // Channel b — System 3* audit: vertical line + horizontal branches into ops
  // -------------------------------------------------------------------------
  groups.b.add(
    new Konva.Line({
      points: [S3STAR.cx, S3STAR.botY - 2, S3STAR.cx, lastY],
      stroke: COLORS.red,
      strokeWidth: 3.6,
    })
  );
  for (let i = 0; i < n; i++) {
    const y = rowY(i);
    groups.b.add(
      new Konva.Line({
        points: [S3STAR.cx, y, 463, y],
        stroke: COLORS.red,
        strokeWidth: 2.4,
      })
    );
  }

  // -------------------------------------------------------------------------
  // Channel c — Operational dependencies: wavy path between adjacent op circles
  // -------------------------------------------------------------------------
  for (let i = 0; i < n - 1; i++) {
    groups.c.add(
      new Konva.Path({
        data: wave(CIRCLE_X, rowY(i) + CIRCLE_R, rowY(i + 1) - CIRCLE_R, 4),
        stroke: COLORS.s2, // amber/yellow squiggle per vsm.html
        strokeWidth: 2.6,
        fill: null as unknown as string,
      })
    );
  }

  // -------------------------------------------------------------------------
  // Channel d — Resource bargain: right vertical red line with rungs into mgmt
  // -------------------------------------------------------------------------
  groups.d.add(
    new Konva.Line({
      points: [CMD_R, S3.y + S3.height, CMD_R, lastMgmtY],
      stroke: COLORS.red,
      strokeWidth: 4.5,
    })
  );
  for (let i = 0; i < n; i++) {
    const my = rowY(i) - S1_MGMT_DY;
    groups.d.add(
      new Konva.Line({
        points: [CMD_R, my, CMD_R + 22, my],
        stroke: COLORS.red,
        strokeWidth: 3.6,
      })
    );
  }

  // -------------------------------------------------------------------------
  // Channel e — Command / intervention: left vertical red line to mgmt level
  // -------------------------------------------------------------------------
  groups.e.add(
    new Konva.Line({
      points: [CMD_L, S3.y + S3.height, CMD_L, lastMgmtY],
      stroke: COLORS.red,
      strokeWidth: 4.5,
    })
  );

  // -------------------------------------------------------------------------
  // Channel f — S2 coordination: vertical amber line + rungs to both mgmt and ops
  // Per Beer's notation S2 connects to both S1 management and S1 operations.
  // -------------------------------------------------------------------------
  groups.f.add(
    new Konva.Line({
      points: [S2.cx, S2.botY, S2.cx, lastY],
      stroke: COLORS.amber,
      strokeWidth: 4.5,
    })
  );
  for (let i = 0; i < n; i++) {
    const y = rowY(i);
    const my = y - S1_MGMT_DY;
    // rung to management square
    groups.f.add(
      new Konva.Line({
        points: [621, my, S2.cx, my],
        stroke: COLORS.amber,
        strokeWidth: 3.6,
      })
    );
    // rung to operation circle (from right edge of circle to S2 spine)
    groups.f.add(
      new Konva.Line({
        points: [CIRCLE_X + CIRCLE_R, y, S2.cx, y],
        stroke: COLORS.amber,
        strokeWidth: 3.6,
      })
    );
  }

  // -------------------------------------------------------------------------
  // Channel g — Algedonic bypass: dashed magenta path (default hidden)
  // Routes between the environment blob column (~x 243) and the S3* triangle
  // left edge (~x 330). Two-leg L-shape: horizontal from ops circle left edge
  // to ALG_X, then straight up to S5 mid-level, entering from the left.
  // -------------------------------------------------------------------------
  const algDotX = CIRCLE_X - CIRCLE_R;           // left edge of S1 ops circles
  const ALG_X   = 285;                            // between env right (~243) and S3* left (~330)
  const algEntryY = S5.y + Math.round(S5.height / 2); // S5 vertical centre
  groups.g.add(
    new Konva.Circle({
      x: algDotX,
      y: lastY,
      radius: 4.5,
      fill: COLORS.algedonic,
    })
  );
  groups.g.add(
    new Konva.Line({
      points: [
        algDotX - 5, lastY,      // depart leftward from ops circle left edge
        ALG_X,       lastY,      // horizontal leg to vertical column
        ALG_X,       algEntryY,  // vertical leg straight up to S5 midline
        S5.x + 14,   algEntryY,  // enter S5 bar from the left
      ],
      stroke: COLORS.algedonic,
      strokeWidth: 2.4,
      dash: [7, 4],
    })
  );

  return groups;
}
