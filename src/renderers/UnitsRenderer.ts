/**
 * UnitsRenderer
 * Renders S1 operational units: circles, management squares, labels, and connectors
 */

import Konva from 'konva';
import { VsmSystem, VsmEvent, S1Unit } from '../types';
import { COLORS } from '../utils/palette';
import { CIRCLE_X, CIRCLE_R, SQ_CX, SQ_W, SQ_H, S1_MGMT_DY, rowY } from '../layout';

function createUnitClickHandler(
  emit: (e: VsmEvent) => void,
  index: number,
  unit: S1Unit
): () => void {
  return () => {
    emit({ type: 'click:s1', index, unit });
  };
}

/**
 * Render all S1 units
 */
export function renderUnitsLayer(
  layer: Konva.Layer,
  system: VsmSystem,
  emit: (e: VsmEvent) => void
): void {
  const n = system.s1.length;

  // Shared tooltip — shown on mgmt-box hover, added last so it renders above all units
  const tooltip = new Konva.Label({ listening: false, visible: false, opacity: 0.92 });
  tooltip.add(new Konva.Tag({ fill: '#2a2a2a', cornerRadius: 3 }));
  tooltip.add(
    new Konva.Text({
      fontFamily: '-apple-system, system-ui, sans-serif',
      fontSize: 11,
      padding: 5,
      fill: 'white',
      listening: false,
    })
  );

  for (let i = 0; i < n; i++) {
    const y = rowY(i);
    const unit = system.s1[i];
    const label = `1${String.fromCharCode(97 + i)}`; // 1a, 1b, 1c...
    const displayName = unit.name || label;

    const unitGroup = new Konva.Group({ name: `unit-${i}`, x: 0, y: 0 });

    const my = y - S1_MGMT_DY; // mgmt square centre Y
    const isHolon = Boolean(unit.children);
    const borderSW = isHolon ? 3.5 : 2;
    const lineSW = isHolon ? 2.5 : 1.5;

    // Diagonal connector: op circle centre → lower-left corner of mgmt square
    unitGroup.add(
      new Konva.Line({
        points: [CIRCLE_X, y, SQ_CX - SQ_W / 2, my + SQ_H / 2],
        stroke: COLORS.stroke,
        strokeWidth: lineSW,
        listening: false,
      })
    );

    // S1 operation circle
    const opCircle = new Konva.Circle({
      x: CIRCLE_X,
      y,
      radius: CIRCLE_R,
      fill: COLORS.white,
      stroke: COLORS.stroke,
      strokeWidth: borderSW,
      name: `s1-op-${i}`,
    });
    unitGroup.add(opCircle);

    // S1 management square — positioned diagonally above the op circle
    const mgmtSquare = new Konva.Rect({
      x: SQ_CX - SQ_W / 2,
      y: my - SQ_H / 2,
      width: SQ_W,
      height: SQ_H,
      cornerRadius: 7,
      fill: COLORS.white,
      stroke: COLORS.stroke,
      strokeWidth: borderSW,
      name: `s1-mgmt-${i}`,
    });
    unitGroup.add(mgmtSquare);

    // Label: centered in the box, word-wrapped, truncated with ellipsis if too long
    unitGroup.add(
      new Konva.Text({
        x: SQ_CX - SQ_W / 2 + 4,
        y: my - SQ_H / 2,
        width: SQ_W - 8,
        height: SQ_H,
        text: displayName,
        fontSize: 10,
        fontFamily: '-apple-system, system-ui, sans-serif',
        fontStyle: 'bold',
        fill: '#3a3f45',
        align: 'center',
        verticalAlign: 'middle',
        wrap: 'word',
        ellipsis: true,
        listening: false,
      })
    );


    unitGroup.on('click', createUnitClickHandler(emit, i, unit));

    unitGroup.on('mouseenter', () => {
      opCircle.fill(COLORS.hover);
      mgmtSquare.fill(COLORS.hover);
      tooltip.getText().text(displayName);
      tooltip.position({ x: SQ_CX + SQ_W / 2 + 6, y: my - SQ_H / 2 });
      tooltip.visible(true);
      layer.batchDraw();
      const stage = layer.getStage();
      if (stage?.container()?.style) stage.container()!.style.cursor = 'pointer';
    });
    unitGroup.on('mouseleave', () => {
      opCircle.fill(COLORS.white);
      mgmtSquare.fill(COLORS.white);
      tooltip.visible(false);
      layer.batchDraw();
      const stage = layer.getStage();
      if (stage?.container()?.style) stage.container()!.style.cursor = 'grab';
    });

    layer.add(unitGroup);
  }

  // Add tooltip last — renders above all unit groups within the layer
  layer.add(tooltip);
}
