/**
 * EnvironmentRenderer
 * Renders: outer silhouette, future env blob, sub-env blobs, eye-loops.
 */

import Konva from 'konva';
import type { VsmSystem, VsmEvent, EnvBlob } from '../types';
import { COLORS, lightenHex } from '../utils/palette';
import { blob, envSilhouette } from '../utils/geometry';
import { ENV_X, rowY } from '../layout';

const ENV_BLOB_EX = ENV_X + 40; // right edge of env blob (used for eye-loops)
const EYE_CX = 462; // left edge of eye-loop (near circle left)
const EYE_GAP = 11; // vertical gap at circle / blob edge

function handleFutureEnvClick(emit: (e: VsmEvent) => void): () => void {
  return () => emit({ type: 'click:futureEnv' });
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
  emit: (e: VsmEvent) => void
): void {
  const n = system.s1.length;
  const lastY = rowY(Math.max(n, 1) - 1);

  // --- Outer silhouette (large grey amoeba encompassing everything) ---
  layer.add(
    new Konva.Path({
      data: envSilhouette(ENV_X, 70, lastY + 90, 2),
      fill: COLORS.envOuter,
      opacity: 0.5,
      listening: false,
    })
  );

  // --- Future environment blob (green, top) ---
  const futureBlob = new Konva.Group({ name: 'futureEnv', opacity: 0.92 });

  const futureBlobPath = new Konva.Path({
    data: blob(ENV_X, 150, 46, 40, 7),
    fill: COLORS.envFuture,
  });
  futureBlob.add(futureBlobPath);

  layer.add(futureBlob);

  const futureFill = COLORS.envFuture;
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
  futureBlob.on('click', handleFutureEnvClick(emit));

  // --- Sub-environment blobs (one per S1 unit) ---
  const envGroup = new Konva.Group();
  for (let i = 0; i < n; i++) {
    const y = rowY(i);
    const envBlob = system.environments[i];

    const envBlobGroup = new Konva.Group({ name: `env-${i}`, opacity: 0.72 });

    const envPath = new Konva.Path({
      data: blob(ENV_X, y, 43, 86, i + 3, 0.6),
      fill: COLORS.envBlob,
    });
    envBlobGroup.add(envPath);

    const envFill = COLORS.envBlob;
    const envFillHover = lightenHex(envFill, 30);

    envBlobGroup.on('mouseenter', () => {
      envPath.fill(envFillHover);
      layer.batchDraw();
      const stage = layer.getStage();
      if (stage?.container()?.style) stage.container()!.style.cursor = 'pointer';
    });
    envBlobGroup.on('mouseleave', () => {
      envPath.fill(envFill);
      layer.batchDraw();
      const stage = layer.getStage();
      if (stage?.container()?.style) stage.container()!.style.cursor = 'grab';
    });
    envBlobGroup.on('click', createEnvClickHandler(emit, i, envBlob));

    envGroup.add(envBlobGroup);
  }
  layer.add(envGroup);

  // --- Eye-loops: amplifier/attenuator arcs for each S1 unit ---
  // Cubic-bezier ovals between the env blob edge and the operation circle
  const eyeGroup = new Konva.Group({ opacity: 0.85 });
  for (let i = 0; i < n; i++) {
    const y = rowY(i);

    // Upper arc: circle → env blob (input / attenuator)
    eyeGroup.add(
      new Konva.Path({
        data:
          `M ${EYE_CX} ${y - EYE_GAP} ` +
          `C ${EYE_CX - 36} ${y - 41} ` +
          `${ENV_BLOB_EX + 36} ${y - 41} ` +
          `${ENV_BLOB_EX} ${y - EYE_GAP}`,
        stroke: COLORS.navy,
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
        stroke: COLORS.navy,
        strokeWidth: 1.8,
        fill: null as unknown as string,
        listening: false,
      })
    );

    // Simple arrowhead at end of lower arc (pointing toward circle)
    const arrowSize = 5;
    eyeGroup.add(
      new Konva.Line({
        points: [
          EYE_CX,
          y + EYE_GAP - arrowSize,
          EYE_CX + arrowSize * 1.2,
          y + EYE_GAP,
          EYE_CX,
          y + EYE_GAP + arrowSize,
        ],
        closed: true,
        fill: COLORS.navy,
        listening: false,
      })
    );
  }
  layer.add(eyeGroup);
}
