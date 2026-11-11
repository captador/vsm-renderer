/**
 * ChannelRenderer
 * Renders channels a–g as independently-toggleable Konva.Groups.
 * Returns the Record<ChannelId, Konva.Group> so VsmRenderer can toggle them.
 */

import Konva from 'konva';
import { ChannelId, ChannelVisibility, VsmSystem } from '../types';
import { COLORS, type Palette } from '../utils/palette';
import { wave, blob, blobPoints } from '../utils/geometry';
import {
  S3STAR,
  S2,
  S3,
  S5,
  CIRCLE_X,
  CIRCLE_R,
  CMD_L,
  CMD_R,
  ENV_X,
  S1_MGMT_DY,
  rowY,
  envRows,
} from '../layout';

export function renderChannelLayer(
  layer: Konva.Layer,
  system: VsmSystem,
  channels: ChannelVisibility,
  colors: Palette = COLORS
): Record<ChannelId, Konva.Group> {
  const n = system.s1.length;
  const envLen = system.environments.length;
  // Explicit mapping via EnvBlob.s1Id: channels touch only S1 units that have
  // a mapped environment blob. Adding env blobs without mapping them must
  // not draw any S1↔env channels.
  const mappedRows = system.s1
    .map((u, i) => (system.environments.some((e) => e.s1Id === u.id) ? i : -1))
    .filter((i) => i >= 0);
  const mappedCount = mappedRows.length;
  const rowOfEnv = envRows(system);
  const lastY = rowY(Math.max(n, 1) - 1);
  const lastMappedY = rowY(mappedCount > 0 ? mappedRows[mappedCount - 1] : 0);
  const lastMgmtY = lastMappedY - S1_MGMT_DY;
  const groups = {} as Record<ChannelId, Konva.Group>;

  // Create one group per channel
  for (const ch of ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as ChannelId[]) {
    groups[ch] = new Konva.Group({ visible: channels[ch] });
    layer.add(groups[ch]);
  }

  // -------------------------------------------------------------------------
  // Channel a — Environmental overlaps: darker grey color mask over the
  // actual intersection of adjacent sub-env blobs (no lens shape). Spans
  // all adjacent env blobs (by mapped row), including not-mapped ones.
  // Blob geometry must match EnvironmentRenderer exactly (same seed/amp).
  // -------------------------------------------------------------------------
  for (let i = 0; i < envLen - 1; i++) {
    const y1 = rowY(rowOfEnv[i]);
    const y2 = rowY(rowOfEnv[i + 1]);
    const clipPts = blobPoints(ENV_X, y1, 43, 86, i + 3, 0.6);
    // clipFunc is a Container feature in Konva — wrap the mask path in a
    // group clipped to the previous blob's outline. (Konva calls beginPath
    // itself before clipFunc, so only trace the path here.)
    const mask = new Konva.Group({
      listening: false,
      clipFunc: (ctx: Konva.Context) => {
        ctx.moveTo(clipPts[0][0], clipPts[0][1]);
        for (let k = 1; k < clipPts.length; k++) ctx.lineTo(clipPts[k][0], clipPts[k][1]);
        ctx.closePath();
      },
    });
    mask.add(
      new Konva.Path({
        data: blob(ENV_X, y2, 43, 86, i + 4, 0.6),
        fill: colors.envOverlap,
        opacity: 0.5,
        listening: false,
      })
    );
    groups.a.add(mask);
  }

  // -------------------------------------------------------------------------
  // Channel b — System 3* audit: vertical line + horizontal branches into ops
  // -------------------------------------------------------------------------
  groups.b.add(
    new Konva.Line({
      points: [S3STAR.cx, S3STAR.botY - 2, S3STAR.cx, lastMappedY],
      stroke: colors.red,
      strokeWidth: 3.6,
    })
  );
  for (const i of mappedRows) {
    const y = rowY(i);
    groups.b.add(
      new Konva.Line({
        points: [S3STAR.cx, y, 463, y],
        stroke: colors.red,
        strokeWidth: 2.4,
      })
    );
  }

  // -------------------------------------------------------------------------
  // Channel c — Operational dependencies: wavy path between adjacent op circles
  // -------------------------------------------------------------------------
  for (let k = 0; k < mappedCount - 1; k++) {
    const i = mappedRows[k];
    const j = mappedRows[k + 1];
    groups.c.add(
      new Konva.Path({
        data: wave(CIRCLE_X, rowY(i) + CIRCLE_R, rowY(j) - CIRCLE_R, 4),
        stroke: colors.s2, // amber/yellow squiggle per vsm.html
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
      stroke: colors.red,
      strokeWidth: 4.5,
    })
  );
  for (const i of mappedRows) {
    const my = rowY(i) - S1_MGMT_DY;
    groups.d.add(
      new Konva.Line({
        points: [CMD_R, my, CMD_R + 22, my],
        stroke: colors.red,
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
      stroke: colors.red,
      strokeWidth: 4.5,
    })
  );

  // -------------------------------------------------------------------------
  // Channel f — S2 coordination: vertical amber line + rungs to S1 mgmt only
  // -------------------------------------------------------------------------
  groups.f.add(
    new Konva.Line({
      points: [S2.cx, S2.botY, S2.cx, lastMgmtY],
      stroke: colors.amber,
      strokeWidth: 4.5,
    })
  );
  for (const i of mappedRows) {
    const my = rowY(i) - S1_MGMT_DY;
    // rung to management square
    groups.f.add(
      new Konva.Line({
        points: [621, my, S2.cx, my],
        stroke: colors.amber,
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
  const algDotX = CIRCLE_X - CIRCLE_R; // left edge of S1 ops circles
  const ALG_X = 285; // between env right (~243) and S3* left (~330)
  const algEntryY = S5.y + Math.round(S5.height / 2); // S5 vertical centre
  groups.g.add(
    new Konva.Circle({
      x: algDotX,
      y: lastY,
      radius: 4.5,
      fill: colors.algedonic,
    })
  );
  groups.g.add(
    new Konva.Line({
      points: [
        algDotX - 5,
        lastY, // depart leftward from ops circle left edge
        ALG_X,
        lastY, // horizontal leg to vertical column
        ALG_X,
        algEntryY, // vertical leg straight up to S5 midline
        S5.x + 14,
        algEntryY, // enter S5 bar from the left
      ],
      stroke: colors.algedonic,
      strokeWidth: 2.4,
      dash: [7, 4],
    })
  );

  return groups;
}
