/**
 * TopLayerRenderer
 * Renders: S5 dampening arms, homeostat (S3<->S4 balance arrows)
 * These elements are rendered ON TOP so their ends stay visible above other layers
 */

import Konva from 'konva';
import { COLORS } from '../utils/palette';
import { SHAPE_DEF, shapeD } from '../utils/geometry';

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
export function renderTopLayer(layer: Konva.Layer): void {
  // S5 dampening arms (ON TOP so their ends stay visible)
  // Left arm
  const armL = new Konva.Path({
    data: shapeD(TOP_SHAPE_DEF.armL),
    stroke: COLORS.s5,
    strokeWidth: 6,
    strokeLineCap: 'round',
    name: 'armL',
    listening: false,
  });
  layer.add(armL);

  // Right arm
  const armR = new Konva.Path({
    data: shapeD(TOP_SHAPE_DEF.armR),
    stroke: COLORS.s5,
    strokeWidth: 6,
    strokeLineCap: 'round',
    name: 'armR',
    listening: false,
  });
  layer.add(armR);

  // Homeostat (3-4 balance) drawn ON TOP of bars so arrowheads stay visible
  // Red arrow (S3 -> S4)
  const homeostatRed = new Konva.Path({
    data: shapeD(TOP_SHAPE_DEF.red),
    stroke: COLORS.s3,
    strokeWidth: 7,
    strokeLineCap: 'round',
    name: 'homeostat-red',
    listening: false,
  });
  layer.add(homeostatRed);

  // Green arrow (S4 -> S3)
  const homeostatGreen = new Konva.Path({
    data: shapeD(TOP_SHAPE_DEF.green),
    stroke: COLORS.s4,
    strokeWidth: 7,
    strokeLineCap: 'round',
    name: 'homeostat-green',
    listening: false,
  });
  layer.add(homeostatGreen);
}
