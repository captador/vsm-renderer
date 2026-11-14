/**
 * TopLayerRenderer
 * Renders: S5 dampening arms, homeostat (S3<->S4 balance arrows)
 * These elements are rendered ON TOP so their ends stay visible above other layers
 */

import Konva from 'konva';
import { COLORS, type Palette } from '../utils/palette';
import { SHAPE_DEF, shapeD, arrowHeadPoints } from '../utils/geometry';

/**
 * Shape definitions for S5 arms and homeostat arrows
 * Ported from vsm.html SHAPE_DEF
 */
const TOP_SHAPE_DEF = {
  // Left S5 dampening arm
  armL: [
    [492, 69],
    [440, 82],
    [420, 140],
    [455, 172],
  ] as [number, number][],
  // Right S5 dampening arm
  armR: [
    [646, 67],
    [701, 81],
    [703, 145],
    [679, 171],
  ] as [number, number][],
  // Red homeostat arrow: S3 -> S4
  red: [
    [491, 220],
    [442, 181],
    [453, 160],
    [491, 133],
  ] as [number, number][],
  // Green homeostat arrow: S4 -> S3
  green: [
    [647, 133],
    [693, 145],
    [682, 201],
    [643, 218],
  ] as [number, number][],
};

/**
 * Render the top layer (S5 arms and homeostat)
 */
export function renderTopLayer(layer: Konva.Layer, colors: Palette = COLORS): void {
  // S5 dampening arms (ON TOP so their ends stay visible)
  // Left arm
  const armL = new Konva.Path({
    data: shapeD(TOP_SHAPE_DEF.armL),
    stroke: colors.s5,
    strokeWidth: 6,
    strokeLineCap: 'round',
    name: 'armL',
    listening: false,
  });
  layer.add(armL);

  // Right arm
  const armR = new Konva.Path({
    data: shapeD(TOP_SHAPE_DEF.armR),
    stroke: colors.s5,
    strokeWidth: 6,
    strokeLineCap: 'round',
    name: 'armR',
    listening: false,
  });
  layer.add(armR);

  // Homeostat (3-4 balance) drawn ON TOP of bars so arrowheads stay visible.
  // Butt caps so the stroke ends exactly where the arrowhead tip sits —
  // a round cap would bulge past the tip and make the head look mid-line.
  // Red arrow (S3 -> S4), left curl: head at the S4 end of the bezier
  const homeostatRed = new Konva.Path({
    data: shapeD(TOP_SHAPE_DEF.red),
    stroke: colors.s3,
    strokeWidth: 7,
    strokeLineCap: 'butt',
    name: 'homeostat-red',
    listening: false,
  });
  layer.add(homeostatRed);
  layer.add(
    new Konva.Line({
      // extend by half the stroke width so the tip reaches the bar edge
      points: arrowHeadPoints(...endTangent(TOP_SHAPE_DEF.red), 9, 4),
      closed: true,
      fill: colors.s3,
      name: 'homeostat-red-head',
      listening: false,
    })
  );

  // Green arrow (S4 -> S3), right curl: head at the S3 end of the bezier
  const homeostatGreen = new Konva.Path({
    data: shapeD(TOP_SHAPE_DEF.green),
    stroke: colors.s4,
    strokeWidth: 7,
    strokeLineCap: 'butt',
    name: 'homeostat-green',
    listening: false,
  });
  layer.add(homeostatGreen);
  layer.add(
    new Konva.Line({
      points: arrowHeadPoints(...endTangent(TOP_SHAPE_DEF.green), 9, 4),
      closed: true,
      fill: colors.s4,
      name: 'homeostat-green-head',
      listening: false,
    })
  );
}

/** Tip (x, y) and end-tangent angle of a 4-point cubic bezier spec. */
function endTangent(points: [number, number][]): [number, number, number] {
  const end = points[3];
  const ctrl = points[2];
  return [end[0], end[1], Math.atan2(end[1] - ctrl[1], end[0] - ctrl[0])];
}
