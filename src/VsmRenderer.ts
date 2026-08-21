/**
 * VSM Renderer - Main Renderer Class
 *
 * Konva-based rendering library for Viable System Model diagrams
 * Implements the NOTATION.md specification precisely
 *
 * Integrates modular component renderers for maintainability
 */

import Konva from 'konva';
import { VsmSystem, VsmEvent, ChannelId, ChannelVisibility, VsmRendererOptions } from './types';
import { COLORS } from './utils/palette';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, MAX_ZOOM, MIN_ZOOM,
  rowY,
  S5, S4, S3, S3STAR, S2,
  CIRCLE_X, CIRCLE_R, SQ_CX, SQ_W, SQ_H, S1_MGMT_DY, ENV_X,
} from './layout';
import { renderEnvironmentLayer } from './renderers/EnvironmentRenderer';
import { renderChannelLayer } from './renderers/ChannelRenderer';
import { renderMetasystemLayer } from './renderers/MetasystemRenderer';
import { renderUnitsLayer } from './renderers/UnitsRenderer';
import { renderTopLayer } from './renderers/TopLayerRenderer';

// ============================================================================
// Controls widget icon SVGs
// ============================================================================

const ICON_ZOOM_IN = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="8.5" r="6.5"/><line x1="8.5" y1="5.5" x2="8.5" y2="11.5"/><line x1="5.5" y1="8.5" x2="11.5" y2="8.5"/><line x1="13.5" y1="13.5" x2="18" y2="18"/></svg>`;
const ICON_ZOOM_OUT = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="8.5" r="6.5"/><line x1="5.5" y1="8.5" x2="11.5" y2="8.5"/><line x1="13.5" y1="13.5" x2="18" y2="18"/></svg>`;
const ICON_FULLSCREEN = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,7 2,2 7,2"/><polyline points="13,2 18,2 18,7"/><polyline points="2,13 2,18 7,18"/><polyline points="18,13 18,18 13,18"/></svg>`;
const ICON_FULLSCREEN_EXIT = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="7,2 7,7 2,7"/><polyline points="13,7 18,7 18,2"/><polyline points="2,13 7,13 7,18"/><polyline points="18,13 13,13 13,18"/></svg>`;

/**
 * Konva-based renderer for Viable System Model (VSM) diagrams.
 *
 * Inject it into any DOM container, pass a {@link VsmSystem} data tree, and
 * listen for {@link VsmEvent} callbacks to drive navigation and UI.
 *
 * @example
 * ```typescript
 * const renderer = new VsmRenderer({
 *   container: document.getElementById('canvas')!,
 *   system: myVsmData,
 *   onEvent: (e) => { if (e.type === 'click:s1') navigate(e.unit); },
 * });
 * // later:
 * renderer.setSystem(drillDownTarget);
 * // cleanup:
 * renderer.destroy();
 * ```
 *
 * @see {@link https://github.com/arsenykrasikov/vsm-render/blob/main/docs/DEVELOPER.md Developer Guide}
 */
export class VsmRenderer {
  // Konva stage and layers
  private stage!: Konva.Stage;
  private layers: Record<string, Konva.Layer> = {};

  // Channel groups for toggling
  private channelGroups: Record<ChannelId, Konva.Group> = {
    a: new Konva.Group(),
    b: new Konva.Group(),
    c: new Konva.Group(),
    d: new Konva.Group(),
    e: new Konva.Group(),
    f: new Konva.Group(),
    g: new Konva.Group(),
  };

  // Current state
  private system!: VsmSystem;
  private channels!: ChannelVisibility;
  private onEvent?: (event: VsmEvent) => void;

  // Selection
  private selectionLayer!: Konva.Layer;
  private selectionItems: Konva.Shape[] = [];

  // Controls overlay
  private controlsEl: HTMLElement | null = null;
  private fsChangeListener: (() => void) | null = null;

  // System name label overlay
  private systemLabelEl: HTMLElement | null = null;
  private levelLabel: string | null = null;

  // Dimensions
  private width!: number;
  private height!: number;

  // Zoom/pan state
  private zoom: number = 1;
  private panX: number = 0;
  private panY: number = 0;

  constructor(
    options: VsmRendererOptions & {
      container: HTMLElement | string;
      system: VsmSystem;
      onEvent?: (event: VsmEvent) => void;
    }
  ) {
    // Set dimensions
    this.width = options.width || CANVAS_WIDTH;
    this.height = options.height || CANVAS_HEIGHT;

    // Set initial state
    this.system = options.system;
    this.levelLabel = options.levelLabel ?? null;
    this.channels = {
      a: true,
      b: true,
      c: true,
      d: true,
      e: true,
      f: true,
      g: false,
      ...options.channels,
    };
    this.onEvent = options.onEvent;

    // Create stage
    this.createStage(options.container);

    // Create layers
    this.createLayers();

    // Render initial system
    this.render();

    // Setup zoom/pan
    this.setupInteractions();

    // Emit ready event
    this.emitEvent({ type: 'ready' });
  }

  // ==========================================================================
  // Stage Setup
  // ==========================================================================

  /**
   * Create the Konva stage
   */
  private createStage(container: HTMLElement | string): void {
    const containerEl =
      typeof container === 'string'
        ? (document.querySelector(container) as HTMLElement)
        : container;

    if (!containerEl) {
      throw new Error(`Container not found: ${container}`);
    }

    this.stage = new Konva.Stage({
      container: containerEl as unknown as HTMLDivElement,
      width: this.width,
      height: this.height,
    });

    // Enable dragging for pan
    this.stage.draggable(true);

    // Inject controls overlay and system name label
    this.createControls(containerEl);
    this.createSystemLabel(containerEl);
  }

  /**
   * Create all Konva layers
   */
  private createLayers(): void {
    // Layer order (bottom to top): env, channels, meta, units, top, selection
    this.layers.env = new Konva.Layer();
    this.layers.channels = new Konva.Layer();
    this.layers.meta = new Konva.Layer();
    this.layers.units = new Konva.Layer();
    this.layers.top = new Konva.Layer();
    this.selectionLayer = new Konva.Layer();

    // Add layers to stage
    this.stage.add(
      this.layers.env,
      this.layers.channels,
      this.layers.meta,
      this.layers.units,
      this.layers.top,
      this.selectionLayer
    );

    // Add channel groups to channels layer
    for (const channel of ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as ChannelId[]) {
      this.layers.channels.add(this.channelGroups[channel]);
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Replace the rendered VSM with new system data and re-draw all layers.
   *
   * Use this when drilling down into a child VSM (`unit.children`) or
   * navigating back up to a parent. The selection highlight is cleared
   * automatically.
   *
   * @param system - New VSM data tree to render.
   */
  setSystem(system: VsmSystem): void {
    this.system = system;
    this.render();
  }

  /**
   * Toggle channel visibility without a full re-render.
   *
   * Only channels present in the partial map are changed; others keep their
   * current state. Channel IDs: `a` env overlaps, `b` S3* audit,
   * `c` op dependencies, `d` resource bargain, `e` command, `f` S2
   * coordination, `g` algedonic bypass.
   *
   * @param channels - Partial map of channel IDs to boolean visibility.
   *
   * @example
   * ```typescript
   * renderer.setChannels({ g: true });           // show algedonic bypass
   * renderer.setChannels({ b: false, c: false }); // hide audit + dependencies
   * ```
   */
  setChannels(channels: Partial<ChannelVisibility>): void {
    this.channels = { ...this.channels, ...channels };

    // Update channel group visibility
    for (const channel of ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as ChannelId[]) {
      this.channelGroups[channel].visible(this.channels[channel]);
    }

    this.stage.batchDraw();
  }

  /**
   * Reset zoom to 1× and pan to origin (top-left of the canvas aligns with
   * the container). Also bound to the canvas controls widget "1:1" button.
   */
  fitView(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
  }

  /**
   * Set the context label shown above the system name — typically the name of
   * the S1 unit that was drilled into. Pass `null` to revert to the single
   * system-name-only display (e.g. when navigating back to the root level).
   *
   * @param label - Unit name or other context string, or `null` to clear.
   *
   * @example
   * ```typescript
   * // drill down
   * renderer.setSystem(unit.children!);
   * renderer.setLevelLabel(unit.name); // e.g. "Operations Unit A"
   *
   * // navigate back up
   * renderer.setSystem(parentSystem);
   * renderer.setLevelLabel(null);
   * ```
   */
  setLevelLabel(label: string | null): void {
    this.levelLabel = label;
    this.refreshSystemLabel();
  }

  /** Alias for {@link fitView}. */
  resetView(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
  }

  /**
   * Scale the canvas up. Clamped to `MAX_ZOOM` (6×).
   *
   * @param factor - Zoom multiplier applied to the current scale. Default `1.4`.
   */
  zoomIn(factor: number = 1.4): void {
    this.zoom = Math.min(MAX_ZOOM, this.zoom * factor);
    this.updateTransform();
  }

  /**
   * Scale the canvas down. Clamped to `MIN_ZOOM` (0.1×).
   *
   * @param factor - Zoom divisor applied to the current scale. Default `1.4`.
   */
  zoomOut(factor: number = 1.4): void {
    this.zoom = Math.max(MIN_ZOOM, this.zoom / factor);
    this.updateTransform();
  }

  /**
   * Tear down the renderer: removes the controls overlay DOM element,
   * de-registers the `fullscreenchange` listener, and destroys the Konva
   * stage. Call this in framework cleanup hooks (React `useEffect` return,
   * Vue `onUnmounted`, etc.).
   */
  destroy(): void {
    if (this.fsChangeListener) {
      document.removeEventListener('fullscreenchange', this.fsChangeListener);
      this.fsChangeListener = null;
    }
    if (this.controlsEl) {
      this.controlsEl.remove();
      this.controlsEl = null;
    }
    if (this.systemLabelEl) {
      this.systemLabelEl.remove();
      this.systemLabelEl = null;
    }
    this.stage.destroy();
    this.stage = null as unknown as Konva.Stage;
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  /**
   * Main render method - rebuilds all layers using component renderers
   */
  private render(): void {
    // Clear selection and all layers
    this.clearSelection();
    this.clearLayers();

    // Update system name label
    this.refreshSystemLabel();

    // Get number of S1 units
    const n = this.system.s1.length;
    if (n === 0) return;

    // Render each layer using component renderers
    renderEnvironmentLayer(this.layers.env, this.system, (e) => this.emitEvent(e));
    this.renderChannelsLayer();
    renderMetasystemLayer(this.layers.meta, (e) => this.emitEvent(e));
    renderUnitsLayer(this.layers.units, this.system, (e) => this.emitEvent(e));
    renderTopLayer(this.layers.top);

    // Draw all layers
    this.stage.batchDraw();

    // Update transform
    this.updateTransform();
  }

  /**
   * Render channels layer with component renderer
   */
  private renderChannelsLayer(): void {
    // Clear channel groups
    for (const channel of ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as ChannelId[]) {
      this.channelGroups[channel].destroyChildren();
    }

    // Use the ChannelRenderer
    const groups = renderChannelLayer(this.layers.channels, this.system, this.channels);

    // Update our channel group references
    for (const channel of ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as ChannelId[]) {
      this.channelGroups[channel] = groups[channel];
    }
  }

  /**
   * Clear all layers
   */
  private clearLayers(): void {
    for (const layer of Object.values(this.layers)) {
      layer.destroyChildren();
    }
  }

  /**
   * Update stage transform based on zoom/pan
   */
  private updateTransform(): void {
    this.stage.scale({ x: this.zoom, y: this.zoom });
    this.stage.position({ x: this.panX, y: this.panY });
    this.stage.batchDraw();
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Emit an event to the host, updating the selection highlight first.
   */
  private emitEvent(event: VsmEvent): void {
    this.updateSelection(event);
    if (this.onEvent) {
      this.onEvent(event);
    }
  }

  // ==========================================================================
  // Selection highlighting
  // ==========================================================================

  private clearSelection(): void {
    this.selectionItems.forEach((s) => s.destroy());
    this.selectionItems = [];
    if (this.selectionLayer) this.selectionLayer.batchDraw();
  }

  private applySelection(shapes: Konva.Shape[]): void {
    this.clearSelection();
    shapes.forEach((s) => this.selectionLayer.add(s));
    this.selectionItems = shapes;
    this.selectionLayer.batchDraw();
  }

  private updateSelection(event: VsmEvent): void {
    const DASH = [6, 4];
    const STROKE = COLORS.navy;
    const SW = 2;
    const P = 3; // padding around the shape

    const selRect = (x: number, y: number, w: number, h: number, cr = 7) =>
      new Konva.Rect({
        x: x - P, y: y - P, width: w + P * 2, height: h + P * 2,
        cornerRadius: cr + P, stroke: STROKE, strokeWidth: SW,
        dash: DASH, listening: false,
      });

    const selCircle = (x: number, y: number, r: number) =>
      new Konva.Circle({
        x, y, radius: r + P,
        stroke: STROKE, strokeWidth: SW, dash: DASH, listening: false,
      });

    const selPoly = (points: number[]) =>
      new Konva.Line({
        points, closed: true,
        stroke: STROKE, strokeWidth: SW, dash: DASH, listening: false,
      });

    switch (event.type) {
      case 'click:s5':
        this.applySelection([selRect(S5.x, S5.y, S5.width, S5.height)]);
        break;
      case 'click:s4':
        this.applySelection([selRect(S4.x, S4.y, S4.width, S4.height)]);
        break;
      case 'click:s3':
        this.applySelection([selRect(S3.x, S3.y, S3.width, S3.height)]);
        break;
      case 'click:s3star':
        this.applySelection([
          selPoly([S3STAR.cx - 30, S3STAR.topY, S3STAR.cx + 30, S3STAR.topY, S3STAR.cx, S3STAR.botY]),
        ]);
        break;
      case 'click:s2':
        this.applySelection([
          selPoly([S2.cx - 30, S2.botY, S2.cx + 30, S2.botY, S2.cx, S2.topY]),
        ]);
        break;
      case 'click:s1': {
        const y = rowY(event.index);
        const my = y - S1_MGMT_DY;
        this.applySelection([
          selCircle(CIRCLE_X, y, CIRCLE_R),
          selRect(SQ_CX - SQ_W / 2, my - SQ_H / 2, SQ_W, SQ_H),
        ]);
        break;
      }
      case 'click:env': {
        const y = rowY(event.index);
        this.applySelection([
          new Konva.Ellipse({
            x: ENV_X, y, radiusX: 43 + P, radiusY: 86 + P,
            stroke: STROKE, strokeWidth: SW, dash: DASH, listening: false,
          }),
        ]);
        break;
      }
      case 'click:futureEnv':
        this.applySelection([
          new Konva.Ellipse({
            x: ENV_X, y: 150, radiusX: 46 + P, radiusY: 40 + P,
            stroke: STROKE, strokeWidth: SW, dash: DASH, listening: false,
          }),
        ]);
        break;
      case 'drillDown':
      case 'drillUp':
      case 'ready':
        this.clearSelection();
        break;
      // channel click: no selection shape
    }
  }

  // ==========================================================================
  // Controls overlay
  // ==========================================================================

  private createSystemLabel(container: HTMLElement): void {
    const el = document.createElement('div');
    el.style.cssText =
      'position:absolute;top:12px;left:12px;pointer-events:none;z-index:99;' +
      'font-family:-apple-system,system-ui,sans-serif;line-height:1.35;';
    container.appendChild(el);
    this.systemLabelEl = el;
    this.refreshSystemLabel();
  }

  private refreshSystemLabel(): void {
    const el = this.systemLabelEl;
    if (!el) return;

    const lineStyle =
      'white-space:nowrap;max-width:440px;overflow:hidden;text-overflow:ellipsis;';

    const mkLine = (text: string, size: string, weight: string, color: string): HTMLDivElement => {
      const d = document.createElement('div');
      d.style.cssText = `${lineStyle}font-size:${size};font-weight:${weight};color:${color};`;
      d.textContent = text;
      return d;
    };

    while (el.firstChild) el.removeChild(el.firstChild);

    if (this.levelLabel) {
      el.appendChild(mkLine(this.levelLabel, '14px', '700', '#1D3880'));
      el.appendChild(mkLine(this.system.name, '11px', '400', '#888'));
    } else {
      el.appendChild(mkLine(this.system.name, '14px', '700', '#1D3880'));
    }
  }

  private createControls(container: HTMLElement): void {
    container.style.position = 'relative';

    const panel = document.createElement('div');
    panel.style.cssText =
      'position:absolute;top:16px;right:16px;display:flex;flex-direction:column;gap:4px;z-index:100;';

    const btnBase =
      'width:32px;height:32px;border:1px solid #d0d0d0;border-radius:6px;background:white;' +
      'color:#444;cursor:pointer;display:flex;align-items:center;justify-content:center;' +
      'padding:0;box-shadow:0 1px 4px rgba(0,0,0,0.15);font-size:12px;font-weight:600;line-height:1;';

    const makeBtn = (title: string, icon: string, onClick: () => void): HTMLButtonElement => {
      const btn = document.createElement('button');
      btn.title = title;
      btn.innerHTML = icon;
      btn.style.cssText = btnBase;
      btn.addEventListener('mouseenter', () => { btn.style.background = '#f0f4f8'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'white'; });
      btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
      return btn;
    };

    panel.appendChild(makeBtn('Zoom in', ICON_ZOOM_IN, () => this.zoomIn()));
    panel.appendChild(makeBtn('Zoom out', ICON_ZOOM_OUT, () => this.zoomOut()));
    panel.appendChild(makeBtn('Reset zoom (1:1)', '1:1', () => this.resetView()));

    const fsBtn = makeBtn('Toggle fullscreen', ICON_FULLSCREEN, () => this.toggleFullscreen());
    const onFsChange = () => {
      fsBtn.innerHTML = document.fullscreenElement ? ICON_FULLSCREEN_EXIT : ICON_FULLSCREEN;
    };
    document.addEventListener('fullscreenchange', onFsChange);
    this.fsChangeListener = onFsChange;
    panel.appendChild(fsBtn);

    container.appendChild(panel);
    this.controlsEl = panel;
  }

  private toggleFullscreen(): void {
    const container = this.stage.container();
    if (!document.fullscreenElement) {
      void container.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }

  // ==========================================================================
  // Interaction Setup
  // ==========================================================================

  /**
   * Setup zoom and pan interactions
   */
  private setupInteractions(): void {
    const stage = this.stage;

    // Wheel zoom
    stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      if (!pointer) return;

      // Calculate new scale
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = oldScale * (1 + direction * 0.1);

      // Clamp scale
      if (newScale < MIN_ZOOM || newScale > MAX_ZOOM) return;

      // Zoom around pointer
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      stage.position(newPos);
      stage.batchDraw();
    });

    stage.on('dragstart', () => {
      stage.container().style.cursor = 'grabbing';
    });

    stage.on('dragend', () => {
      stage.container().style.cursor = 'grab';
    });

    // Double-click to reset view
    stage.on('dblclick', () => {
      this.fitView();
    });
  }
}
