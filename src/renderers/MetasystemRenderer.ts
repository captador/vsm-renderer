/**
 * MetasystemRenderer
 * Renders S5/S4/S3 bars, S3* ▽ and S2 △ triangles, spine connectors,
 * S3→S3* and S3→S2 elbows, and S4↔futureEnv arcs.
 */

import Konva from 'konva';
import type { VsmEvent } from '../types';
import { COLORS, lightenHex } from '../utils/palette';
import { S5, S4, S3, S3STAR, S2, CMD_L, CMD_R, ENV_X } from '../layout';

function bar(
  label: string,
  color: string,
  rect: { x: number; y: number; width: number; height: number },
  emit: (e: VsmEvent) => void,
  eventEl: VsmEvent & { type: 'select' },
  layer: Konva.Layer
): Konva.Group {
  const g = new Konva.Group();
  const hoverFill = lightenHex(color, 40);

  const rectShape = new Konva.Rect({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    cornerRadius: 7,
    fill: color,
  });
  g.add(rectShape);

  g.add(
    new Konva.Text({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      text: label,
      fontSize: 17,
      fontFamily: '-apple-system, system-ui, sans-serif',
      fontStyle: 'bold',
      fill: COLORS.white,
      align: 'center',
      verticalAlign: 'middle',
      listening: false,
    })
  );

  g.on('mouseenter', () => {
    rectShape.fill(hoverFill);
    layer.batchDraw();
    const stage = layer.getStage();
    if (stage?.container()?.style) stage.container()!.style.cursor = 'pointer';
  });
  g.on('mouseleave', () => {
    rectShape.fill(color);
    layer.batchDraw();
    const stage = layer.getStage();
    if (stage?.container()?.style) stage.container()!.style.cursor = 'grab';
  });

  g.on('click', () => {
    handleBarClick(emit, eventEl);
  });

  return g;
}

function handleBarClick(emit: (e: VsmEvent) => void, eventEl: VsmEvent & { type: 'select' }): void {
  const { elementType } = eventEl;
  if (
    elementType === 's5' ||
    elementType === 's4' ||
    elementType === 's3' ||
    elementType === 's3star' ||
    elementType === 's2'
  ) {
    emit({ type: `click:${elementType}` } as VsmEvent);
  }
}

export function renderMetasystemLayer(layer: Konva.Layer, emit: (e: VsmEvent) => void): void {
  // ── Spine connectors ─────────────────────────────────────────────────────

  // S5 ↔ S4 (blue)
  layer.add(
    new Konva.Line({
      points: [CMD_L, S5.y + S5.height, CMD_L, S4.y],
      stroke: COLORS.s5,
      strokeWidth: 3.4,
    })
  );
  layer.add(
    new Konva.Line({
      points: [CMD_R, S5.y + S5.height, CMD_R, S4.y],
      stroke: COLORS.s5,
      strokeWidth: 3.4,
    })
  );

  // S4 ↔ S3 (green)
  layer.add(
    new Konva.Line({
      points: [CMD_L, S4.y + S4.height, CMD_L, S3.y],
      stroke: COLORS.s4,
      strokeWidth: 4.5,
    })
  );
  layer.add(
    new Konva.Line({
      points: [CMD_R, S4.y + S4.height, CMD_R, S3.y],
      stroke: COLORS.s4,
      strokeWidth: 4.5,
    })
  );

  // S3 → S3* elbow (red, tip plugs into S3 left side)
  layer.add(
    new Konva.Path({
      data: `M 520 216 L ${S3STAR.cx} 216 L ${S3STAR.cx} ${S3STAR.topY}`,
      fill: null as unknown as string,
      stroke: COLORS.s3,
      strokeWidth: 5,
      lineJoin: 'round',
      lineCap: 'round',
    })
  );

  // S3 → S2 elbow (amber, tip plugs into S3 right side)
  layer.add(
    new Konva.Path({
      data: `M 616 216 L ${S2.cx} 216 L ${S2.cx} ${S2.topY}`,
      fill: null as unknown as string,
      stroke: COLORS.s2,
      strokeWidth: 5,
      lineJoin: 'round',
      lineCap: 'round',
    })
  );

  // ── Metasystem bars ──────────────────────────────────────────────────────

  layer.add(bar('5', COLORS.s5, S5, emit, { type: 'select', elementType: 's5' }, layer));
  layer.add(bar('4', COLORS.s4, S4, emit, { type: 'select', elementType: 's4' }, layer));
  layer.add(bar('3', COLORS.s3, S3, emit, { type: 'select', elementType: 's3' }, layer));

  // ── S3* inverted triangle ▽ (LEFT) ──────────────────────────────────────

  const s3starG = new Konva.Group();
  const s3starPoly = new Konva.Line({
    points: [S3STAR.cx - 30, S3STAR.topY, S3STAR.cx + 30, S3STAR.topY, S3STAR.cx, S3STAR.botY],
    closed: true,
    fill: COLORS.s3,
    stroke: '#c23a22',
    strokeWidth: 1,
  });
  s3starG.add(s3starPoly);
  s3starG.add(
    new Konva.Text({
      x: S3STAR.cx - 30,
      y: S3STAR.topY,
      width: 60,
      height: S3STAR.botY - S3STAR.topY,
      text: '3*',
      fontSize: 14,
      fontFamily: '-apple-system, system-ui, sans-serif',
      fontStyle: 'bold',
      fill: COLORS.white,
      align: 'center',
      verticalAlign: 'middle',
      listening: false,
    })
  );

  s3starG.on('mouseenter', () => {
    s3starPoly.fill(lightenHex(COLORS.s3, 40));
    layer.batchDraw();
    const stage = layer.getStage();
    if (stage?.container()?.style) stage.container()!.style.cursor = 'pointer';
  });
  s3starG.on('mouseleave', () => {
    s3starPoly.fill(COLORS.s3);
    layer.batchDraw();
    const stage = layer.getStage();
    if (stage?.container()?.style) stage.container()!.style.cursor = 'grab';
  });
  s3starG.on('click', () => emit({ type: 'click:s3star' }));
  layer.add(s3starG);

  // ── S2 upward triangle △ (RIGHT) ─────────────────────────────────────────

  const s2G = new Konva.Group();
  const s2Poly = new Konva.Line({
    points: [S2.cx - 30, S2.botY, S2.cx + 30, S2.botY, S2.cx, S2.topY],
    closed: true,
    fill: COLORS.s2,
    stroke: '#d9a52f',
    strokeWidth: 1,
  });
  s2G.add(s2Poly);
  s2G.add(
    new Konva.Text({
      x: S2.cx - 30,
      y: S2.topY,
      width: 60,
      height: S2.botY - S2.topY,
      text: '2',
      fontSize: 14,
      fontFamily: '-apple-system, system-ui, sans-serif',
      fontStyle: 'bold',
      fill: COLORS.white,
      align: 'center',
      verticalAlign: 'middle',
      listening: false,
    })
  );

  s2G.on('mouseenter', () => {
    s2Poly.fill(lightenHex(COLORS.s2, 40));
    layer.batchDraw();
    const stage = layer.getStage();
    if (stage?.container()?.style) stage.container()!.style.cursor = 'pointer';
  });
  s2G.on('mouseleave', () => {
    s2Poly.fill(COLORS.s2);
    layer.batchDraw();
    const stage = layer.getStage();
    if (stage?.container()?.style) stage.container()!.style.cursor = 'grab';
  });
  s2G.on('click', () => emit({ type: 'click:s2' }));
  layer.add(s2G);

  // ── S4 ↔ future env arcs (thin green, two-way) ───────────────────────────

  layer.add(
    new Konva.Path({
      data: `M 499 126 C 451 107 ${ENV_X + 96} 107 ${ENV_X + 48} 126`,
      fill: null as unknown as string,
      stroke: COLORS.s4,
      strokeWidth: 2.3,
    })
  );
  layer.add(
    new Konva.Path({
      data: `M ${ENV_X + 48} 136 C ${ENV_X + 96} 155 451 155 499 136`,
      fill: null as unknown as string,
      stroke: COLORS.s4,
      strokeWidth: 2.3,
    })
  );
}
