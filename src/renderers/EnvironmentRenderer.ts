/**
 * EnvironmentRenderer
 * Renders: outer silhouette, future env blob, sub-env blobs, eye-loops.
 */

import Konva from 'konva';
import type { VsmSystem, VsmEvent, EnvBlob } from '../types';
import { COLORS, lightenHex, type Palette } from '../utils/palette';
import { blob, envSilhouette, arrowHeadPoints } from '../utils/geometry';
import { ENV_X, rowY, envRows, totalRows } from '../layout';

const ENV_BLOB_EX = ENV_X + 40; // right edge of env blob (used for eye-loops)
const EYE_CX = 462; // left edge of eye-loop (near circle left)
const EYE_GAP = 11; // vertical gap at circle / blob edge

function handleFutureEnvClick(emit: (e: VsmEvent) => void, id: string): () => void {
  return () => emit({ type: 'click:futureEnv', id });
}

function createEnvClickHandler(
  emit: (e: VsmEvent) => void,
  index: number,
  env: EnvBlob
): () => void {
  return () => emit({ type: 'click:env', index, env });
}

export function renderEnvironmentLayer(
  layer: Konva.Layer,
  system: VsmSystem,
  emit: (e: VsmEvent) => void,
  colors: Palette = COLORS
): void {
  const n = system.s1.length;
  const envLen = system.environments.length;
  // Explicit mapping via EnvBlob.s1Id: a blob pairs with the S1 unit it
  // references and takes that unit's row; unmapped blobs stack below all S1
  // rows as "complexity slices". Positional pairing is NOT used — adding an
  // env blob without mapping it must not create S1↔env connections.
  const rowOfEnv = envRows(system);
  const rowCount = totalRows(system);
  const lastY = rowY(rowCount - 1);

  // --- Outer silhouette (large amoeba encompassing everything) ---
  // Slightly grey fill, no border.
  layer.add(
    new Konva.Path({
      data: envSilhouette(ENV_X, 70, lastY + 90, 2),
      fill: colors.envOuter,
      opacity: 0.5,
      listening: false,
    })
  );

  // --- Future environment blob (green, top) ---
  const futureBlob = new Konva.Group({ name: 'futureEnv', opacity: 0.92 });

  const futureBlobPath = new Konva.Path({
    data: blob(ENV_X, 150, 46, 40, 7),
    fill: colors.envFuture,
  });
  futureBlob.add(futureBlobPath);

  layer.add(futureBlob);

  const futureFill = colors.envFuture;
  const futureFillHover = lightenHex(futureFill, 30);

  futureBlob.on('mouseenter', () => {
    futureBlobPath.fill(futureFillHover);
    layer.batchDraw();
    const stage = layer.getStage();
    if (stage?.container()?.style) stage.container()!.style.cursor = 'pointer';
  });
  futureBlob.on('mouseleave', () => {
    futureBlobPath.fill(futureFill);
    layer.batchDraw();
    const stage = layer.getStage();
    if (stage?.container()?.style) stage.container()!.style.cursor = 'grab';
  });
  futureBlob.on('click tap', handleFutureEnvClick(emit, system.futureEnvironment.id));
  futureBlob.on('dblclick dbltap', (e) => {
    e.cancelBubble = true;
    emit({ type: 'dblclick:futureEnv', id: system.futureEnvironment.id });
  });

  // --- Sub-environment blobs ---
  // Every blob is rendered at the row given by the s1Id mapping; blobs whose
  // row is >= s1.length are "not-mapped" slices.
  const envGroup = new Konva.Group();
  for (let i = 0; i < envLen; i++) {
    const y = rowY(rowOfEnv[i]);
    const envBlobData = system.environments[i];
    const isUnmapped = rowOfEnv[i] >= n;

    const fill = isUnmapped ? colors.envBlobUnmapped : colors.envBlob;
    const opacity = isUnmapped ? 0.55 : 0.72;

    const envBlobGroup = new Konva.Group({ name: `env-${i}`, opacity });

    const envPath = new Konva.Path({
      data: blob(ENV_X, y, 43, 86, i + 3, 0.6),
      fill,
    });
    envBlobGroup.add(envPath);

    if (isUnmapped) {
      // "?" label to signal the complexity slice is not yet mapped
      envBlobGroup.add(
        new Konva.Text({
          x: ENV_X - 8,
          y: y - 10,
          text: '?',
          fontSize: 18,
          fontStyle: 'bold',
          fontFamily: '-apple-system, system-ui, sans-serif',
          fill: colors.labelMuted,
          listening: false,
        })
      );
    } else {
      // Name label centered on the blob — white, since dark grey on the grey
      // blob is hard to read
      envBlobGroup.add(
        new Konva.Text({
          x: ENV_X - 38,
          y: y - 20,
          width: 76,
          height: 40,
          text: envBlobData.name || envBlobData.id,
          fontSize: 10,
          fontFamily: '-apple-system, system-ui, sans-serif',
          fontStyle: 'bold',
          fill: colors.white,
          align: 'center',
          verticalAlign: 'middle',
          wrap: 'word',
          ellipsis: true,
          listening: false,
        })
      );
    }

    const fillHover = lightenHex(fill, 30);

    envBlobGroup.on('mouseenter', () => {
      envPath.fill(fillHover);
      layer.batchDraw();
      const stage = layer.getStage();
      if (stage?.container()?.style) stage.container()!.style.cursor = 'pointer';
    });
    envBlobGroup.on('mouseleave', () => {
      envPath.fill(fill);
      layer.batchDraw();
      const stage = layer.getStage();
      if (stage?.container()?.style) stage.container()!.style.cursor = 'grab';
    });
    envBlobGroup.on('click tap', createEnvClickHandler(emit, i, envBlobData));
    envBlobGroup.on('dblclick dbltap', (e) => {
      e.cancelBubble = true;
      emit({ type: 'dblclick:env', index: i, env: envBlobData });
    });

    envGroup.add(envBlobGroup);
  }
  layer.add(envGroup);

  // --- Eye-loops: only for env blobs explicitly mapped to an S1 unit ---
  const eyeGroup = new Konva.Group({ opacity: 0.85 });
  for (let i = 0; i < envLen; i++) {
    if (rowOfEnv[i] >= n) continue; // unmapped slice — no connection to S1
    const y = rowY(rowOfEnv[i]);

    // Upper arc: circle → env blob (input / attenuator)
    eyeGroup.add(
      new Konva.Path({
        data:
          `M ${EYE_CX} ${y - EYE_GAP} ` +
          `C ${EYE_CX - 36} ${y - 41} ` +
          `${ENV_BLOB_EX + 36} ${y - 41} ` +
          `${ENV_BLOB_EX} ${y - EYE_GAP}`,
        stroke: colors.navy,
        strokeWidth: 1.8,
        fill: null as unknown as string,
        listening: false,
      })
    );

    // Lower arc: env blob → circle (output / amplifier)
    eyeGroup.add(
      new Konva.Path({
        data:
          `M ${ENV_BLOB_EX} ${y + EYE_GAP} ` +
          `C ${ENV_BLOB_EX + 36} ${y + 41} ` +
          `${EYE_CX - 36} ${y + 41} ` +
          `${EYE_CX} ${y + EYE_GAP}`,
        stroke: colors.navy,
        strokeWidth: 1.8,
        fill: null as unknown as string,
        listening: false,
      })
    );

    // Arrowheads make the loop double-headed (NOTATION §5: amplifier /
    // attenuator arrows are double-headed). Upper arc ends at the env blob,
    // lower arc at the ops circle; each head points along the arc's end
    // tangent (derived from the last Bézier control point to the endpoint).
    const arrowSize = 5;
    const arrowExtend = 1; // tip sits just past the arc's butt-capped end
    eyeGroup.add(
      new Konva.Line({
        points: arrowHeadPoints(
          ENV_BLOB_EX,
          y - EYE_GAP,
          Math.atan2(41 - EYE_GAP, -36),
          arrowSize,
          arrowExtend
        ),
        closed: true,
        fill: colors.navy,
        listening: false,
      })
    );
    eyeGroup.add(
      new Konva.Line({
        points: arrowHeadPoints(
          EYE_CX,
          y + EYE_GAP,
          Math.atan2(EYE_GAP - 41, 36),
          arrowSize,
          arrowExtend
        ),
        closed: true,
        fill: colors.navy,
        listening: false,
      })
    );
  }
  layer.add(eyeGroup);
}
