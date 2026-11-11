/**
 * UnitsRenderer
 * Renders S1 operational units: circles, management squares, labels, and connectors
 */

import Konva from 'konva';
import { VsmSystem, VsmEvent, S1Unit } from '../types';
import { COLORS, type Palette } from '../utils/palette';
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
  emit: (e: VsmEvent) => void,
  colors: Palette = COLORS
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
    const borderSW = 2;
    const lineSW = 1.5;

    // Diagonal connector: op circle centre → lower-left corner of mgmt square
    unitGroup.add(
      new Konva.Line({
        points: [CIRCLE_X, y, SQ_CX - SQ_W / 2, my + SQ_H / 2],
        stroke: colors.stroke,
        strokeWidth: lineSW,
        listening: false,
      })
    );

    // S1 operation circle
    const opCircle = new Konva.Circle({
      x: CIRCLE_X,
      y,
      radius: CIRCLE_R,
      fill: colors.white,
      stroke: colors.stroke,
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
      fill: colors.white,
      stroke: colors.stroke,
      strokeWidth: borderSW,
      name: `s1-mgmt-${i}`,
    });
    unitGroup.add(mgmtSquare);

    // BPMN-style [+] marker for holons: a small square with a plus inside,
    // horizontally centred, vertically at the bottom edge of the mgmt square
    if (isHolon) {
      const plusCx = SQ_CX;
      const boxR = 8;
      const plusCy = my + SQ_H / 2 - boxR - 2;
      const plusR = 5;
      const plusProps = { stroke: colors.label, strokeWidth: 1.6, listening: false };
      unitGroup.add(
        new Konva.Rect({
          x: plusCx - boxR,
          y: plusCy - boxR,
          width: boxR * 2,
          height: boxR * 2,
          stroke: colors.label,
          strokeWidth: 1.6,
          listening: false,
        })
      );
      unitGroup.add(
        new Konva.Line({
          points: [plusCx - plusR, plusCy, plusCx + plusR, plusCy],
          ...plusProps,
        })
      );
      unitGroup.add(
        new Konva.Line({
          points: [plusCx, plusCy - plusR, plusCx, plusCy + plusR],
          ...plusProps,
        })
      );
    }

    // Label: centered in the box, word-wrapped, truncated with ellipsis if too long
    // (height reduced to leave room for the [+] marker at the bottom)
    unitGroup.add(
      new Konva.Text({
        x: SQ_CX - SQ_W / 2 + 4,
        y: my - SQ_H / 2,
        width: SQ_W - 8,
        height: SQ_H - 12,
        text: displayName,
        fontSize: 10,
        fontFamily: '-apple-system, system-ui, sans-serif',
        fontStyle: 'bold',
        fill: colors.label,
        align: 'center',
        verticalAlign: 'middle',
        wrap: 'word',
        ellipsis: true,
        listening: false,
      })
    );

    unitGroup.on('click tap', createUnitClickHandler(emit, i, unit));

    unitGroup.on('dblclick dbltap', (e) => {
      e.cancelBubble = true;
      emit({ type: 'dblclick:s1', index: i, unit });
      if (unit.children) {
        emit({ type: 'drillDown', index: i, unit, path: [] });
      }
    });

    unitGroup.on('mouseenter', () => {
      opCircle.fill(colors.hover);
      mgmtSquare.fill(colors.hover);
      tooltip.getText().text(displayName);
      tooltip.position({ x: SQ_CX + SQ_W / 2 + 6, y: my - SQ_H / 2 });
      tooltip.visible(true);
      layer.batchDraw();
      const stage = layer.getStage();
      if (stage?.container()?.style) stage.container()!.style.cursor = 'pointer';
    });
    unitGroup.on('mouseleave', () => {
      opCircle.fill(colors.white);
      mgmtSquare.fill(colors.white);
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
