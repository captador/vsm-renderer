/**
 * VSM Renderer — Type Definitions
 *
 * All types are exported from the package root so consumers can import them
 * directly:
 * ```typescript
 * import type { VsmSystem, VsmEvent, VsmRendererOptions } from 'vsm-render';
 * ```
 */

// ============================================================================
// Core data types
// ============================================================================

/** Operational process node of an S1 unit. */
export interface S1Operation {
  id: string;
}

/** Management function node of an S1 unit. */
export interface S1Management {
  id: string;
}

/**
 * A System 1 (operational) unit in the VSM.
 *
 * Each unit has an `operation` (the value-producing process) and a
 * `management` (the local governor). When `children` is present the unit is
 * a _holon_ — it contains its own complete VSM that can be navigated into.
 * Holons are rendered with a thicker border to signal drillability.
 */
export interface S1Unit {
  id: string;
  /** Display name shown inside the management square (truncated with "…" if too long). */
  name: string;
  operation: S1Operation;
  management: S1Management;
  /** Nested VSM — present when this unit is itself a viable system (holon). */
  children?: VsmSystem;
}

/**
 * The five metasystem functions. All five are required at every recursion level.
 * `name` is optional and used only for display in the host UI info panel.
 */
export interface Metasystem {
  s2: { id: string; name?: string };
  s3: { id: string; name?: string };
  s3star: { id: string; name?: string };
  s4: { id: string; name?: string };
  s5: { id: string; name?: string };
}

/**
 * A sub-environment blob — the local context of a single S1 unit.
 * The `environments` array in `VsmSystem` must be parallel to `s1[]`.
 */
export interface EnvBlob {
  id: string;
  /** ID of the S1 unit this environment belongs to. */
  s1Id: string;
  name?: string;
}

/** The future environment blob scanned by System 4. */
export interface FutureEnvironment {
  id: string;
  name?: string;
}

/**
 * A complete Viable System at one recursion level.
 *
 * Construct a recursive VSM by setting `S1Unit.children` to another
 * `VsmSystem`. Every level must have at least one S1 unit.
 *
 * @example
 * ```typescript
 * const system: VsmSystem = {
 *   id: 'org',
 *   name: 'My Organisation',
 *   s1: [
 *     { id: 'unit-a', name: 'Division A', operation: { id: 'op-a' }, management: { id: 'mgmt-a' } },
 *   ],
 *   metasystem: {
 *     s2: { id: 's2', name: 'Coordination' },
 *     s3: { id: 's3', name: 'Control' },
 *     s3star: { id: 's3star', name: 'Audit' },
 *     s4: { id: 's4', name: 'Intelligence' },
 *     s5: { id: 's5', name: 'Policy' },
 *   },
 *   environments: [{ id: 'env-a', s1Id: 'unit-a', name: 'Market A' }],
 *   futureEnvironment: { id: 'future', name: 'Future Environment' },
 * };
 * ```
 */
export interface VsmSystem {
  id: string;
  name: string;
  /** One or more operational units. Length N determines diagram height. */
  s1: S1Unit[];
  metasystem: Metasystem;
  /** Exactly one per S1 unit, in the same order as `s1[]`. */
  environments: EnvBlob[];
  futureEnvironment: FutureEnvironment;
}

// ============================================================================
// Channels
// ============================================================================

/**
 * Channel identifiers:
 * - `a` Environmental overlaps (amber lenses between sub-env blobs)
 * - `b` S3\* audit lines (red, to S1 ops only)
 * - `c` Operational dependencies (wavy lines between adjacent S1 ops)
 * - `d` Resource bargain (right red vertical + rungs to S1 mgmt)
 * - `e` Command / intervention (left red vertical)
 * - `f` S2 coordination (amber vertical + rungs to both S1 mgmt and ops)
 * - `g` Algedonic bypass (dashed magenta, S1 ops → S5; default hidden)
 */
export type ChannelId = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

/** Map of channel ID → visibility flag. */
export type ChannelVisibility = Record<ChannelId, boolean>;

// ============================================================================
// Events
// ============================================================================

/**
 * Discriminated union of all events emitted by the renderer via `onEvent`.
 *
 * Switch on `event.type` to handle each case:
 * ```typescript
 * onEvent={(event) => {
 *   switch (event.type) {
 *     case 'click:s1':
 *       if (event.unit.children) renderer.setSystem(event.unit.children);
 *       break;
 *     case 'click:s5':
 *       showPanel('s5');
 *       break;
 *     case 'ready':
 *       console.log('Renderer ready');
 *       break;
 *   }
 * }}
 * ```
 */
export type VsmEvent =
  // Metasystem clicks
  | { type: 'click:s5' }
  | { type: 'click:s4' }
  | { type: 'click:s3' }
  | { type: 'click:s3star' }
  | { type: 'click:s2' }
  // Environment clicks
  | { type: 'click:futureEnv' }
  /** Fired when an S1 unit (op circle or mgmt square) is clicked. */
  | { type: 'click:s1'; index: number; unit: S1Unit }
  /** Fired when a sub-environment blob is clicked. */
  | { type: 'click:env'; index: number; env: EnvBlob }
  | { type: 'click:channel'; channel: ChannelId }
  // Navigation (managed by host; renderer responds to setSystem calls)
  | { type: 'drillDown'; index: number; unit: S1Unit; path: VsmSystem[] }
  | { type: 'drillUp'; path: VsmSystem[] }
  // Lifecycle
  /** Fired once after the renderer is fully initialised. */
  | { type: 'ready' }
  // Internal
  | {
      type: 'select';
      elementType: 's5' | 's4' | 's3' | 's3star' | 's2' | 'futureEnv';
    }
  | { type: 'select'; elementType: 's1'; index: number; unit: S1Unit }
  | { type: 'select'; elementType: 'env'; index: number };

// ============================================================================
// Renderer options
// ============================================================================

/**
 * Options passed to `new VsmRenderer(options)`.
 *
 * `container`, `system`, and `onEvent` are required at construction time even
 * though they are typed as optional here (the constructor intersection type
 * enforces them).
 */
export interface VsmRendererOptions {
  /** DOM element or CSS selector string for the canvas container. */
  container?: HTMLElement | string;
  /** Initial VSM data tree to render. */
  system?: VsmSystem;
  /**
   * Initial channel visibility. Omitted channels default to `true` except `g`
   * (algedonic bypass) which defaults to `false`.
   */
  channels?: Partial<ChannelVisibility>;
  /**
   * Event callback fired for every user interaction and lifecycle event.
   * See {@link VsmEvent} for the full discriminated union.
   */
  onEvent?: (event: VsmEvent) => void;
  /** Canvas width in pixels. Default: `900`. */
  width?: number;
  /** Canvas height in pixels. Default: `1100`. */
  height?: number;
  /**
   * Optional context label shown above the system name — typically the name
   * of the S1 unit that was drilled into. Update it with
   * {@link VsmRenderer.setLevelLabel} on every navigation step.
   *
   * When provided the overlay shows two lines:
   * - primary (bold navy): this label
   * - secondary (small grey): `system.name`
   *
   * When omitted only `system.name` is shown.
   */
  levelLabel?: string;
}
