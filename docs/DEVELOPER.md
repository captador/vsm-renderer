# VSM Renderer — Developer Guide

This guide covers the public API, event system, and internal Konva implementation for contributors and library consumers who want to integrate vsm-render at a deeper level.

---

## Installation

```bash
pnpm add vsm-render konva
# or
npm install vsm-render konva
```

Konva is a peer dependency and must be installed separately.

---

## Quick start

```typescript
import { VsmRenderer } from 'vsm-render';
import type { VsmSystem, VsmEvent } from 'vsm-render';

const renderer = new VsmRenderer({
  container: document.getElementById('canvas')!,
  system: myVsmData,
  onEvent: (event: VsmEvent) => {
    if (event.type === 'click:s1') {
      console.log('Unit clicked:', event.unit.name);
    }
  },
});
```

---

## Constructor options

All options are passed as a single object to `new VsmRenderer(options)`.

| Option      | Type                         | Required | Default         | Description                                                        |
| ----------- | ---------------------------- | -------- | --------------- | ------------------------------------------------------------------ |
| `container` | `HTMLElement \| string`      | yes      | —               | DOM element or CSS selector (`'#my-div'`) that receives the canvas |
| `system`    | `VsmSystem`                  | yes      | —               | Initial VSM data tree to render                                    |
| `onEvent`   | `(event: VsmEvent) => void`  | yes      | —               | Callback fired for every user interaction and lifecycle event      |
| `channels`  | `Partial<ChannelVisibility>` | no       | all on except g | Initial channel visibility; omitted channels keep their defaults   |
| `width`     | `number`                     | no       | `900`           | Canvas width in pixels                                             |
| `height`    | `number`                     | no       | `1100`          | Canvas height in pixels                                            |

The container element will have `position: relative` set on it and will receive two injected children: the Konva `div.konvajs-content` wrapper and the controls overlay `div`.

---

## Public API

### `setSystem(system: VsmSystem): void`

Replace the rendered VSM with a new system and re-draw all layers. Use this when drilling down or up in the recursion hierarchy.

```typescript
renderer.setSystem(unit.children!); // drill into sub-VSM
renderer.setSystem(parentSystem); // drill back up
```

The selection highlight is cleared automatically on each `setSystem` call.

### `setChannels(channels: Partial<ChannelVisibility>): void`

Toggle channel visibility without a full re-render. Only the changed channels are updated.

```typescript
renderer.setChannels({ g: true }); // show algedonic bypass
renderer.setChannels({ b: false, c: false }); // hide audit + deps
```

Channel IDs: `a` environmental overlaps, `b` S3\* audit, `c` op dependencies, `d` resource bargain, `e` command, `f` S2 coordination, `g` algedonic bypass.

### `zoomIn(factor?: number): void`

Scale the canvas up by `factor` (default `1.4`). Clamped to `MAX_ZOOM = 6`.

### `zoomOut(factor?: number): void`

Scale the canvas down by `factor` (default `1.4`). Clamped to `MIN_ZOOM = 0.1`.

### `fitView(): void`

Reset zoom to 1× and pan to origin (top-left of canvas aligns with container).

### `resetView(): void`

Alias for `fitView()`.

### `destroy(): void`

Tear down the Konva stage, remove the controls overlay DOM element, and de-register all event listeners. Call this in framework cleanup hooks (React `useEffect` return, Vue `onUnmounted`, etc.).

```typescript
useEffect(() => {
  const renderer = new VsmRenderer({ ... });
  return () => renderer.destroy();
}, []);
```

---

## Event system

All events are delivered via the `onEvent` callback. The `VsmEvent` union type is exported and fully discriminated by `type`.

### Interaction events

| `event.type`      | Extra fields                    | Fired when                                     |
| ----------------- | ------------------------------- | ---------------------------------------------- |
| `click:s5`        | —                               | User clicks the S5 bar                         |
| `click:s4`        | —                               | User clicks the S4 bar                         |
| `click:s3`        | —                               | User clicks the S3 bar                         |
| `click:s3star`    | —                               | User clicks the S3\* triangle                  |
| `click:s2`        | —                               | User clicks the S2 triangle                    |
| `click:s1`        | `index: number`, `unit: S1Unit` | User clicks an S1 unit (op circle or mgmt box) |
| `click:env`       | `index: number`, `env: EnvBlob` | User clicks an S1 sub-environment blob         |
| `click:futureEnv` | —                               | User clicks the future-environment blob        |
| `click:channel`   | `channel: ChannelId`            | Reserved; not currently emitted                |

### Lifecycle events

| `event.type` | Fired when                                    |
| ------------ | --------------------------------------------- |
| `ready`      | Renderer fully initialised after construction |

### Navigation pattern

The renderer does **not** manage the recursion stack internally. The host application owns navigation state:

```typescript
const [stack, setStack] = useState([rootSystem]);

onEvent={(event) => {
  if (event.type === 'click:s1' && event.unit.children) {
    setStack(prev => [...prev, event.unit.children!]);
  }
}}

// When stack changes, push the new system to the renderer:
useEffect(() => {
  renderer.setSystem(stack[stack.length - 1]);
}, [stack]);
```

---

## Data types

### `VsmSystem`

```typescript
interface VsmSystem {
  id: string;
  name: string;
  s1: S1Unit[]; // ≥ 1 operational units
  metasystem: Metasystem; // exactly one S2, S3, S3*, S4, S5
  environments: EnvBlob[]; // parallel to s1[], one per unit
  futureEnvironment: FutureEnvironment;
}
```

### `S1Unit`

```typescript
interface S1Unit {
  id: string;
  name: string;
  operation: { id: string };
  management: { id: string };
  children?: VsmSystem; // present → unit is a holon (drillable)
}
```

Units with `children` are rendered with a thicker border (stroke ~3.5 px vs ~2 px) to signal drillability without an explicit icon.

### `ChannelVisibility`

```typescript
type ChannelId = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
type ChannelVisibility = Record<ChannelId, boolean>;
```

Default: `{ a: true, b: true, c: true, d: true, e: true, f: true, g: false }`.

---

## Konva layer architecture

The renderer uses **six Konva layers** stacked bottom-to-top:

| Layer       | Renderer module      | Contents                                                        |
| ----------- | -------------------- | --------------------------------------------------------------- |
| `env`       | EnvironmentRenderer  | Outer silhouette, future-env blob, sub-env blobs, eye-loops     |
| `channels`  | ChannelRenderer      | Seven channel groups (a–g), each a `Konva.Group`                |
| `meta`      | MetasystemRenderer   | S5/S4/S3 bars, S3\*/S2 triangles, spine connectors, elbow feeds |
| `units`     | UnitsRenderer        | S1 op circles, mgmt rects, diagonal connectors, label tooltip   |
| `top`       | TopLayerRenderer     | S5 dampening arms, S3↔S4 homeostat arrows                       |
| `selection` | VsmRenderer (inline) | Dashed-border highlight shapes for the selected element         |

All six layers are added to a single `Konva.Stage`. The selection layer is the topmost so highlights are never obscured.

### Key Konva patterns

**Hit detection opt-out.** Decorative shapes (connector lines, labels, info text) use `listening: false` so they do not consume pointer events. Only the interactive group or shape receives events.

**Group-level events.** Each interactive element is wrapped in a `Konva.Group`. Event handlers are attached to the group rather than individual shapes, so click and hover events fire regardless of which child shape the cursor is over.

**batchDraw for hover.** Hover handlers call `layer.batchDraw()` after changing a fill, which coalesces redraws within a single frame — avoiding multiple canvas flushes per event.

**Konva.Label tooltip.** `UnitsRenderer` creates one shared `Konva.Label` per render (added last to the units layer so it renders above all unit groups). On `mouseenter` the label's text and position are updated and it is made visible; on `mouseleave` it is hidden. This avoids DOM manipulation inside a canvas renderer.

**Selection layer pattern.** Rather than tracking and restoring the previous fill of selected shapes, the renderer draws fresh overlay shapes (dashed `Konva.Rect`, `Konva.Circle`, `Konva.Line`) on the dedicated `selectionLayer`. Clearing selection destroys those overlay shapes — the underlying elements are untouched.

**Channel groups.** Each channel (a–g) is a `Konva.Group` stored in `channelGroups`. `setChannels()` toggles `group.visible()` without re-rendering, keeping channel show/hide at O(1).

**Controls overlay.** Zoom/pan controls are plain DOM `<button>` elements appended to the container element (not Konva shapes), positioned `position: absolute; top: 16px; right: 16px` so they remain fixed in the container viewport regardless of canvas pan/zoom transforms. Fullscreen uses the browser Fullscreen API; the `fullscreenchange` event listener is cleaned up in `destroy()`.

---

## Layout constants (`src/layout/constants.ts`)

Key values driving the coordinate system:

| Constant        | Value | Description                                  |
| --------------- | ----- | -------------------------------------------- |
| `CANVAS_WIDTH`  | 900   | Default stage width                          |
| `CANVAS_HEIGHT` | 1100  | Default stage height                         |
| `CIRCLE_X`      | 490   | X centre of S1 operation circles             |
| `CIRCLE_R`      | 25    | Radius of S1 operation circles               |
| `SQ_CX`         | 568   | X centre of S1 management squares            |
| `SQ_W`          | 102   | Width of S1 management squares               |
| `SQ_H`          | 48    | Height of S1 management squares              |
| `S1_MGMT_DY`    | 48    | Vertical offset: mgmt square above op circle |
| `ROW_0`         | 380   | Y of the first S1 row (index 0)              |
| `ROW_H`         | 112   | Vertical step between consecutive S1 rows    |
| `ENV_X`         | 200   | X centre of the environment column           |
| `CMD_L`         | 561   | Left command line X (channel e spine)        |
| `CMD_R`         | 575   | Right resource line X (channel d spine)      |
| `MAX_ZOOM`      | 6     | Maximum zoom factor                          |
| `MIN_ZOOM`      | 0.1   | Minimum zoom factor                          |

Row Y coordinates are computed by `rowY(i) = ROW_0 + i * ROW_H`. Management square Y centre is `rowY(i) - S1_MGMT_DY`.

---

## Source tree

```
src/
├── VsmRenderer.ts           # Public class; stage, layers, zoom/pan, selection, controls
├── index.ts                 # Public API exports
├── types.ts                 # VsmSystem, VsmEvent, VsmRendererOptions and related types
├── layout/
│   ├── constants.ts         # All numeric layout constants
│   └── index.ts             # Re-exports constants + rowY() helper
├── renderers/
│   ├── ChannelRenderer.ts   # Channels a–g as Konva.Groups
│   ├── EnvironmentRenderer.ts # Environment blobs, eye-loops
│   ├── MetasystemRenderer.ts  # S2–S5 bars, triangles, spine connectors
│   ├── TopLayerRenderer.ts    # S5 arms, homeostat arrows
│   └── UnitsRenderer.ts       # S1 circles, squares, diagonal lines, tooltip
└── utils/
    ├── geometry.ts          # blob(), wave(), envSilhouette() shape generators
    └── palette.ts           # COLORS map and lightenHex() utility
```
