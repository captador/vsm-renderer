# VSM Renderer — Developer Guide

This guide covers the public API, event system, and internal Konva implementation for contributors and library consumers who want to integrate vsm-renderer at a deeper level.

---

## Installation

```bash
pnpm add vsm-renderer konva
# or
npm install vsm-renderer konva
```

Konva is a peer dependency and must be installed separately.

---

## Quick start

```typescript
import { VsmRenderer } from 'vsm-renderer';
import type { VsmSystem, VsmEvent } from 'vsm-renderer';

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

| Option       | Type                         | Required | Default         | Description                                                                 |
| ------------ | ---------------------------- | -------- | --------------- | --------------------------------------------------------------------------- |
| `container`  | `HTMLElement \| string`      | yes      | —               | DOM element or CSS selector (`'#my-div'`) that receives the canvas          |
| `system`     | `VsmSystem`                  | yes      | —               | Initial VSM data tree to render                                             |
| `onEvent`    | `(event: VsmEvent) => void`  | no       | —               | Callback fired for every user interaction and lifecycle event               |
| `channels`   | `Partial<ChannelVisibility>` | no       | all on except g | Initial channel visibility; omitted channels keep their defaults            |
| `width`      | `number`                     | no       | `900`           | Canvas width in pixels                                                      |
| `height`     | `number`                     | no       | `1100`          | Canvas height in pixels                                                     |
| `levelLabel` | `string`                     | no       | —               | Context label shown above the system name (e.g. the drilled-into unit name) |

The container element will have `position: relative` set on it and will receive three injected children: the Konva `div.konvajs-content` wrapper, the controls overlay `div` (top-right), and the system label overlay `div` (top-left).

---

## Public API

### `setSystem(system: VsmSystem): void`

Replace the rendered VSM with a new system and re-draw all layers.

```typescript
renderer.setSystem(unit.children!); // drill into sub-VSM
renderer.setSystem(parentSystem); // drill back up
```

The selection highlight is cleared automatically on each `setSystem` call. Note that `setSystem` does **not** update the internal breadcrumb stack — use `drillUp()` or respond to `drillDown` / `drillUp` events for stack-aware navigation.

### `drillUp(): void`

Navigate up one level in the internal breadcrumb stack. Pops the most recent ancestor, re-renders it, and emits `{ type: 'drillUp', path }` with the remaining stack. Does nothing if already at the root level.

```typescript
renderer.drillUp(); // go back to parent VSM
```

Double-clicking the canvas background also triggers `drillUp()` automatically when a stack is present, or resets the view when at root.

### `setLevelLabel(label: string | null): void`

Update the context label shown above the system name in the top-left overlay. Pass `null` to revert to the single system-name-only display.

```typescript
// drill down
renderer.setSystem(unit.children!);
renderer.setLevelLabel(unit.name); // e.g. "Operations Unit A"

// navigate back up
renderer.setSystem(parentSystem);
renderer.setLevelLabel(null);
```

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

Tear down the Konva stage, remove the controls and system-label overlay DOM elements, and de-register all event listeners. Call this in framework cleanup hooks (React `useEffect` return, Vue `onUnmounted`, etc.).

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

| `event.type`          | Extra fields                    | Fired when                                     |
| --------------------- | ------------------------------- | ---------------------------------------------- |
| `click:s5`            | `id: string`                    | User clicks the S5 bar                         |
| `click:s4`            | `id: string`                    | User clicks the S4 bar                         |
| `click:s3`            | `id: string`                    | User clicks the S3 bar                         |
| `click:s3star`        | `id: string`                    | User clicks the S3\* triangle                  |
| `click:s2`            | `id: string`                    | User clicks the S2 triangle                    |
| `click:s1`            | `index: number`, `unit: S1Unit` | User clicks an S1 unit (op circle or mgmt box) |
| `click:env`           | `index: number`, `env: EnvBlob` | User clicks an S1 sub-environment blob         |
| `click:futureEnv`     | `id: string`                    | User clicks the future-environment blob        |
| `click:background`    | —                               | User clicks empty canvas space                 |
| `click:channel`       | `channel: ChannelId`            | Reserved; not currently emitted                |
| `dblclick:s5`         | `id: string`                    | User double-clicks the S5 bar                  |
| `dblclick:s4`         | `id: string`                    | User double-clicks the S4 bar                  |
| `dblclick:s3`         | `id: string`                    | User double-clicks the S3 bar                  |
| `dblclick:s3star`     | `id: string`                    | User double-clicks the S3\* triangle           |
| `dblclick:s2`         | `id: string`                    | User double-clicks the S2 triangle             |
| `dblclick:s1`         | `index: number`, `unit: S1Unit` | User double-clicks an S1 unit                  |
| `dblclick:env`        | `index: number`, `env: EnvBlob` | User double-clicks a sub-environment blob      |
| `dblclick:futureEnv`  | `id: string`                    | User double-clicks the future-environment blob |
| `dblclick:background` | —                               | User double-clicks empty canvas space          |

### Navigation events

The renderer manages its own internal breadcrumb stack. Navigation events are emitted after the renderer has already transitioned to the new system.

| `event.type` | Extra fields                                         | Fired when                                                                |
| ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| `drillDown`  | `index: number`, `unit: S1Unit`, `path: VsmSystem[]` | A holon S1 unit was double-clicked; renderer drilled into `unit.children` |
| `drillUp`    | `path: VsmSystem[]`                                  | `drillUp()` was called (or canvas was double-clicked at non-root level)   |

`path` is the breadcrumb stack **after** the transition — an empty array means the root is now active.

### Lifecycle events

| `event.type` | Fired when                                    |
| ------------ | --------------------------------------------- |
| `ready`      | Renderer fully initialised after construction |

### Navigation pattern

The renderer maintains its own breadcrumb stack internally. The host application can listen to `drillDown` and `drillUp` events to mirror that state (e.g. for a breadcrumb UI), but does not need to call `setSystem` in response — the renderer has already transitioned.

```typescript
const renderer = new VsmRenderer({
  container,
  system: rootSystem,
  onEvent(event) {
    if (event.type === 'drillDown') {
      // event.path reflects the updated stack after drilling in
      setBreadcrumbs(event.path);
      renderer.setLevelLabel(event.unit.name);
    }
    if (event.type === 'drillUp') {
      setBreadcrumbs(event.path);
      renderer.setLevelLabel(event.path.at(-1)?.name ?? null);
    }
  },
});
```

To drill down programmatically (without a double-click):

```typescript
// renderer handles the stack and re-render internally
renderer.setSystem(unit.children!);
renderer.setLevelLabel(unit.name);
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
  /**
   * Parallel to s1[] for mapped units. Extra entries (index ≥ s1.length)
   * render as not-mapped complexity slices — distinct style, no eye-loops.
   * Minimum length: s1.length.
   */
  environments: EnvBlob[];
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

### `Metasystem`

```typescript
interface Metasystem {
  s2: { id: string; name?: string };
  s3: { id: string; name?: string };
  s3star: { id: string; name?: string };
  s4: { id: string; name?: string };
  s5: { id: string; name?: string };
}
```

`name` is optional on every sub-system and is used only for display in a host UI info panel.

### `EnvBlob`

```typescript
interface EnvBlob {
  id: string;
  s1Id?: string; // ID of the mapped S1 unit; omit for not-mapped slices
  name?: string;
}
```

### `FutureEnvironment`

```typescript
interface FutureEnvironment {
  id: string;
  name?: string;
}
```

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

**System label overlay.** A `<div>` injected at `top: 12px; left: 12px` displays the current system name. When `levelLabel` is set it shows two lines: the label (bold navy, 14 px) and `system.name` (grey, 11 px). Updated on every `setSystem` / `setLevelLabel` call without touching the Konva stage.

---

## Layout constants (`src/layout/constants.ts`)

Key values driving the coordinate system:

| Constant        | Value                                    | Description                                      |
| --------------- | ---------------------------------------- | ------------------------------------------------ |
| `CANVAS_WIDTH`  | `900`                                    | Default stage width                              |
| `CANVAS_HEIGHT` | `1100`                                   | Default stage height                             |
| `S5`            | `{ x:493, y:42, width:150, height:46 }`  | S5 bar bounding box (top-left corner)            |
| `S4`            | `{ x:493, y:112, width:150, height:38 }` | S4 bar bounding box                              |
| `S3`            | `{ x:493, y:194, width:150, height:48 }` | S3 bar bounding box                              |
| `S3STAR`        | `{ cx:360, topY:230, botY:285 }`         | S3\* inverted triangle geometry                  |
| `S2`            | `{ cx:748, topY:230, botY:285 }`         | S2 upward triangle geometry                      |
| `CIRCLE_X`      | `490`                                    | X centre of S1 operation circles                 |
| `CIRCLE_R`      | `25`                                     | Radius of S1 operation circles                   |
| `SQ_CX`         | `568`                                    | X centre of S1 management squares                |
| `SQ_W`          | `102`                                    | Width of S1 management squares                   |
| `SQ_H`          | `48`                                     | Height of S1 management squares                  |
| `S1_MGMT_DY`    | `48`                                     | Vertical offset: mgmt square above op circle     |
| `SPINE_X`       | `568`                                    | Metasystem spine X (S5/S4/S3 bars centred on)    |
| `CMD_L`         | `561`                                    | Left command line X (channel e spine)            |
| `CMD_R`         | `575`                                    | Right resource line X (channel d spine)          |
| `AUDIT_X`       | `458`                                    | S3\* audit drop line X (channel b)               |
| `LADDER_L`      | `680`                                    | Left edge of S2 coordination ladder (channel f)  |
| `LADDER_R`      | `702`                                    | Right edge of S2 coordination ladder (channel f) |
| `ROW_0`         | `380`                                    | Y of the first S1 row (index 0)                  |
| `ROW_H`         | `112`                                    | Vertical step between consecutive S1 rows        |
| `ENV_X`         | `200`                                    | X centre of the environment column               |
| `MAX_ZOOM`      | `6`                                      | Maximum zoom factor                              |
| `MIN_ZOOM`      | `0.1`                                    | Minimum zoom factor                              |

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
