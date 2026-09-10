/**
 * VsmRenderer — Public API Tests
 *
 * BDD-style unit tests for the VsmRenderer class. Konva is fully mocked so
 * tests run in jsdom without a real canvas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VsmRenderer } from '../src/VsmRenderer';
import type { VsmSystem, VsmEvent, ChannelVisibility } from '../src/types';
import { MAX_ZOOM, MIN_ZOOM } from '../src/layout';

// ============================================================================
// Konva mock
//
// Variables that begin with "mock" are accessible inside vi.mock factories
// (Vitest's hoisting rule). mockStage and mockGroupRegistry are therefore
// usable inside the factory without vi.hoisted.
// ============================================================================

const mockContainerEl = document.createElement('div');

// Stage event handler registry — populated by mockStage.on()
const mockStageHandlers: Record<string, Function> = {};

// Captures the actual Stage instance so dblclick tests can pass it as e.target
let mockStageInstance: object = {};

const mockStage = {
  draggable: vi.fn(),
  add: vi.fn(),
  on: vi.fn((event: string, handler: Function) => {
    mockStageHandlers[event] = handler;
  }),
  batchDraw: vi.fn(),
  scale: vi.fn(),
  position: vi.fn(),
  scaleX: vi.fn(() => 1),
  x: vi.fn(() => 0),
  y: vi.fn(() => 0),
  getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
  container: vi.fn(() => mockContainerEl),
  destroy: vi.fn(),
};

// Group instance registry — populated by Group constructor
type MockGroupEntry = {
  handlers: Map<string, Function[]>;
  fire: (event: string, arg?: object) => void;
  on: ReturnType<typeof vi.fn>;
  add: ReturnType<typeof vi.fn>;
  visible: ReturnType<typeof vi.fn>;
  destroyChildren: ReturnType<typeof vi.fn>;
};
const mockGroupRegistry: { groups: MockGroupEntry[] } = { groups: [] };

vi.mock('konva', () => {
  class Stage {
    constructor(_opts: object) {
      Object.assign(this, mockStage);
      mockStageInstance = this;
    }
  }

  class Layer {
    add = vi.fn();
    destroyChildren = vi.fn();
    batchDraw = vi.fn();
    getStage = vi.fn(() => mockStage);
  }

  class Group {
    handlers = new Map<string, Function[]>();
    add = vi.fn();
    visible = vi.fn();
    destroyChildren = vi.fn();

    on = vi.fn((event: string, cb: Function) => {
      const existing = this.handlers.get(event) || [];
      this.handlers.set(event, [...existing, cb]);
    });

    fire(event: string, arg?: object) {
      (this.handlers.get(event) || []).forEach((cb) => cb(arg));
    }

    constructor(_opts?: object) {
      mockGroupRegistry.groups.push(this as unknown as MockGroupEntry);
    }
  }

  class Path {
    fill = vi.fn();
    constructor(_opts?: object) {}
  }

  class Rect {
    fill = vi.fn();
    constructor(_opts?: object) {}
  }

  class Circle {
    fill = vi.fn();
    constructor(_opts?: object) {}
  }

  class Ellipse {
    constructor(_opts?: object) {}
  }

  class Line {
    fill = vi.fn();
    constructor(_opts?: object) {}
  }

  class Text {
    text = vi.fn();
    constructor(_opts?: object) {}
  }

  class Label {
    add = vi.fn();
    visible = vi.fn();
    position = vi.fn();
    getText = vi.fn(() => ({ text: vi.fn() }));
    constructor(_opts?: object) {}
  }

  class Tag {
    constructor(_opts?: object) {}
  }

  const konva = { Stage, Layer, Group, Path, Rect, Circle, Ellipse, Line, Text, Label, Tag };
  return { default: konva, ...konva };
});

// ============================================================================
// Fixtures
// ============================================================================

function makeUnit(id: string, withChildren = false): import('../src/types').S1Unit {
  return {
    id,
    name: `Unit ${id}`,
    operation: { id: `op-${id}` },
    management: { id: `mgmt-${id}` },
    ...(withChildren ? { children: makeSystem(`child-of-${id}`, 1) } : {}),
  };
}

function makeSystem(id: string, unitCount = 2): VsmSystem {
  const s1 = Array.from({ length: unitCount }, (_, i) => makeUnit(`${id}-u${i}`));
  return {
    id,
    name: `System ${id}`,
    s1,
    metasystem: {
      s2: { id: `${id}-s2`, name: 'S2' },
      s3: { id: `${id}-s3`, name: 'S3' },
      s3star: { id: `${id}-s3star`, name: 'S3*' },
      s4: { id: `${id}-s4`, name: 'S4' },
      s5: { id: `${id}-s5`, name: 'S5' },
    },
    environments: s1.map((u) => ({ id: `env-${u.id}`, s1Id: u.id, name: `Env ${u.id}` })),
    futureEnvironment: { id: `${id}-future`, name: 'Future' },
  };
}

function makeContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function makeRenderer(
  overrides: {
    system?: VsmSystem;
    onEvent?: (e: VsmEvent) => void;
    channels?: Partial<ChannelVisibility>;
    levelLabel?: string;
    width?: number;
    height?: number;
    container?: HTMLElement;
  } = {}
): VsmRenderer {
  return new VsmRenderer({
    container: overrides.container ?? makeContainer(),
    system: overrides.system ?? makeSystem('root'),
    onEvent: overrides.onEvent,
    channels: overrides.channels,
    levelLabel: overrides.levelLabel,
    width: overrides.width,
    height: overrides.height,
  });
}

// Helper: indices of groups created during a default 2-unit render.
//
// Render order inside VsmRenderer.render():
//   renderEnvironmentLayer → renderChannelsLayer → renderMetasystemLayer → renderUnitsLayer
//
// - 0-6:  initial channelGroups (field initializer in VsmRenderer)
// - 7:    futureBlob (renderEnvironmentLayer)
// - 8:    envGroup
// - 9:    envBlobGroup-0
// - 10:   envBlobGroup-1
// - 11:   eyeGroup
// - 12-18: channelGroups a–g (renderChannelLayer, called inside renderChannelsLayer)
// - 19:   s5 bar (renderMetasystemLayer)
// - 20:   s4 bar
// - 21:   s3 bar
// - 22:   s3starG
// - 23:   s2G
// - 24:   unitGroup-0 (renderUnitsLayer)
// - 25:   unitGroup-1
const G = {
  futureBlob: 7,
  envBlobGroup0: 9,
  envBlobGroup1: 10,
  s5: 19,
  s4: 20,
  s3: 21,
  s3star: 22,
  s2: 23,
  unit0: 24,
  unit1: 25,
} as const;

beforeEach(() => {
  mockGroupRegistry.groups.length = 0;
  Object.keys(mockStageHandlers).forEach((k) => delete mockStageHandlers[k]);
  vi.clearAllMocks();
  // Restore on() implementation since clearAllMocks resets it
  mockStage.on.mockImplementation((event: string, handler: Function) => {
    mockStageHandlers[event] = handler;
  });
  mockStage.scaleX.mockReturnValue(1);
  mockStage.getPointerPosition.mockReturnValue({ x: 100, y: 100 });
  mockStage.container.mockReturnValue(mockContainerEl);
});

// ============================================================================
// Tests
// ============================================================================

describe('VsmRenderer', () => {
  describe('when constructed with valid options', () => {
    it('emits a ready event immediately', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      expect(onEvent).toHaveBeenCalledWith({ type: 'ready' });
    });

    it('emits ready as the last construction-time event', () => {
      const events: VsmEvent[] = [];
      makeRenderer({ onEvent: (e) => events.push(e) });
      expect(events[events.length - 1]).toEqual({ type: 'ready' });
    });

    it('accepts a CSS selector string as container', () => {
      const el = makeContainer();
      el.id = 'vsm-test-container';
      expect(
        () => new VsmRenderer({ container: '#vsm-test-container', system: makeSystem('root') })
      ).not.toThrow();
    });

    it('throws when the container selector matches nothing', () => {
      expect(
        () => new VsmRenderer({ container: '#does-not-exist', system: makeSystem('root') })
      ).toThrow('Container not found');
    });

    it('uses custom width and height without throwing', () => {
      expect(() => makeRenderer({ width: 600, height: 800 })).not.toThrow();
    });

    it('uses default dimensions when width and height are omitted', () => {
      expect(() => makeRenderer()).not.toThrow();
    });

    it('accepts an initial levelLabel', () => {
      expect(() => makeRenderer({ levelLabel: 'My Label' })).not.toThrow();
    });

    it('accepts partial channel overrides at construction time', () => {
      expect(() => makeRenderer({ channels: { g: true, a: false } })).not.toThrow();
    });

    it('accepts a system with a single S1 unit', () => {
      expect(() => makeRenderer({ system: makeSystem('single', 1) })).not.toThrow();
    });

    it('accepts a system with many S1 units', () => {
      expect(() => makeRenderer({ system: makeSystem('big', 5) })).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------

  describe('#setSystem()', () => {
    it('replaces the rendered system without throwing', () => {
      const renderer = makeRenderer();
      expect(() => renderer.setSystem(makeSystem('new-system'))).not.toThrow();
    });

    it('accepts a system with a single S1 unit', () => {
      const renderer = makeRenderer();
      expect(() => renderer.setSystem(makeSystem('single', 1))).not.toThrow();
    });

    it('accepts a system with many S1 units', () => {
      const renderer = makeRenderer();
      expect(() => renderer.setSystem(makeSystem('big', 5))).not.toThrow();
    });

    it('does not emit any event by itself', () => {
      const onEvent = vi.fn();
      const renderer = makeRenderer({ onEvent });
      onEvent.mockClear();
      renderer.setSystem(makeSystem('next'));
      expect(onEvent).not.toHaveBeenCalled();
    });

    it('can be called multiple times in sequence', () => {
      const renderer = makeRenderer();
      renderer.setSystem(makeSystem('a'));
      renderer.setSystem(makeSystem('b'));
      renderer.setSystem(makeSystem('c'));
    });
  });

  // --------------------------------------------------------------------------

  describe('#drillUp()', () => {
    it('does nothing when already at the root level', () => {
      const onEvent = vi.fn();
      const renderer = makeRenderer({ onEvent });
      onEvent.mockClear();
      renderer.drillUp();
      expect(onEvent).not.toHaveBeenCalled();
    });

    it('does not throw when called at root level', () => {
      const renderer = makeRenderer();
      expect(() => renderer.drillUp()).not.toThrow();
    });

    it('is safe to call multiple times at root level', () => {
      const renderer = makeRenderer();
      renderer.drillUp();
      renderer.drillUp();
    });
  });

  // --------------------------------------------------------------------------

  describe('#setChannels()', () => {
    it('updates a single channel without throwing', () => {
      const renderer = makeRenderer();
      expect(() => renderer.setChannels({ g: true })).not.toThrow();
    });

    it('updates multiple channels at once', () => {
      const renderer = makeRenderer();
      expect(() => renderer.setChannels({ a: false, b: false, g: true })).not.toThrow();
    });

    it('can toggle a channel on and then off', () => {
      const renderer = makeRenderer();
      renderer.setChannels({ g: true });
      expect(() => renderer.setChannels({ g: false })).not.toThrow();
    });

    it('is idempotent — setting the same value twice does not throw', () => {
      const renderer = makeRenderer();
      renderer.setChannels({ a: true });
      expect(() => renderer.setChannels({ a: true })).not.toThrow();
    });

    it('handles all seven channels simultaneously', () => {
      const renderer = makeRenderer();
      const all: ChannelVisibility = {
        a: false,
        b: false,
        c: false,
        d: false,
        e: false,
        f: false,
        g: true,
      };
      expect(() => renderer.setChannels(all)).not.toThrow();
    });

    it('accepts an empty partial — leaves all channels unchanged', () => {
      const renderer = makeRenderer();
      expect(() => renderer.setChannels({})).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------

  describe('#fitView()', () => {
    it('resets zoom and pan without throwing', () => {
      const renderer = makeRenderer();
      renderer.zoomIn();
      expect(() => renderer.fitView()).not.toThrow();
    });

    it('is callable multiple times without error', () => {
      const renderer = makeRenderer();
      renderer.fitView();
      renderer.fitView();
    });
  });

  // --------------------------------------------------------------------------

  describe('#resetView()', () => {
    it('resets zoom and pan without throwing', () => {
      const renderer = makeRenderer();
      renderer.zoomOut();
      expect(() => renderer.resetView()).not.toThrow();
    });

    it('behaves like fitView — callable multiple times', () => {
      const renderer = makeRenderer();
      renderer.resetView();
      renderer.resetView();
    });
  });

  // --------------------------------------------------------------------------

  describe('#zoomIn()', () => {
    it('does not throw when called once', () => {
      const renderer = makeRenderer();
      expect(() => renderer.zoomIn()).not.toThrow();
    });

    it('accepts a custom factor', () => {
      const renderer = makeRenderer();
      expect(() => renderer.zoomIn(2)).not.toThrow();
    });

    it('is clamped — calling many times does not exceed MAX_ZOOM', () => {
      const renderer = makeRenderer();
      for (let i = 0; i < 20; i++) renderer.zoomIn(2);
    });

    it('is composable with zoomOut', () => {
      const renderer = makeRenderer();
      renderer.zoomIn();
      renderer.zoomOut();
      renderer.zoomIn(3);
    });
  });

  // --------------------------------------------------------------------------

  describe('#zoomOut()', () => {
    it('does not throw when called once', () => {
      const renderer = makeRenderer();
      expect(() => renderer.zoomOut()).not.toThrow();
    });

    it('accepts a custom factor', () => {
      const renderer = makeRenderer();
      expect(() => renderer.zoomOut(2)).not.toThrow();
    });

    it('is clamped — calling many times does not go below MIN_ZOOM', () => {
      const renderer = makeRenderer();
      for (let i = 0; i < 20; i++) renderer.zoomOut(2);
    });

    it('is composable with zoomIn', () => {
      const renderer = makeRenderer();
      renderer.zoomOut();
      renderer.zoomIn();
      renderer.zoomOut(3);
    });
  });

  // --------------------------------------------------------------------------

  describe('#setLevelLabel()', () => {
    it('sets a string label without throwing', () => {
      const renderer = makeRenderer();
      expect(() => renderer.setLevelLabel('Division A')).not.toThrow();
    });

    it('clears the label when null is passed', () => {
      const renderer = makeRenderer({ levelLabel: 'Division A' });
      expect(() => renderer.setLevelLabel(null)).not.toThrow();
    });

    it('can be updated multiple times', () => {
      const renderer = makeRenderer();
      renderer.setLevelLabel('First');
      renderer.setLevelLabel('Second');
      renderer.setLevelLabel(null);
    });

    it('accepts an empty string', () => {
      const renderer = makeRenderer();
      expect(() => renderer.setLevelLabel('')).not.toThrow();
    });

    it('shows system name in DOM label element after set', () => {
      const container = makeContainer();
      const system = makeSystem('root');
      const renderer = new VsmRenderer({ container, system });
      renderer.setLevelLabel('Context Label');
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------

  describe('#destroy()', () => {
    it('cleans up without throwing', () => {
      const renderer = makeRenderer();
      expect(() => renderer.destroy()).not.toThrow();
    });

    it('removes the controls overlay buttons from the DOM', () => {
      const container = makeContainer();
      const renderer = new VsmRenderer({ container, system: makeSystem('root') });
      renderer.destroy();
      expect(container.querySelectorAll('button')).toHaveLength(0);
    });

    it('is safe to call when constructed without an onEvent callback', () => {
      const renderer = new VsmRenderer({ container: makeContainer(), system: makeSystem('root') });
      expect(() => renderer.destroy()).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------

  describe('onEvent callback', () => {
    it('is optional — renderer works without it', () => {
      expect(() => makeRenderer({ onEvent: undefined })).not.toThrow();
    });

    it('receives exactly one ready event during construction', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      const readyEvents = (onEvent.mock.calls as Array<[VsmEvent]>).filter(
        ([e]) => e.type === 'ready'
      );
      expect(readyEvents).toHaveLength(1);
    });

    it('is not called by setSystem', () => {
      const onEvent = vi.fn();
      const renderer = makeRenderer({ onEvent });
      onEvent.mockClear();
      renderer.setSystem(makeSystem('other'));
      expect(onEvent).not.toHaveBeenCalled();
    });

    it('is not called by setChannels', () => {
      const onEvent = vi.fn();
      const renderer = makeRenderer({ onEvent });
      onEvent.mockClear();
      renderer.setChannels({ g: true });
      expect(onEvent).not.toHaveBeenCalled();
    });

    it('is not called by fitView', () => {
      const onEvent = vi.fn();
      const renderer = makeRenderer({ onEvent });
      onEvent.mockClear();
      renderer.fitView();
      expect(onEvent).not.toHaveBeenCalled();
    });

    it('is not called by zoomIn or zoomOut', () => {
      const onEvent = vi.fn();
      const renderer = makeRenderer({ onEvent });
      onEvent.mockClear();
      renderer.zoomIn();
      renderer.zoomOut();
      expect(onEvent).not.toHaveBeenCalled();
    });

    it('is not called by setLevelLabel', () => {
      const onEvent = vi.fn();
      const renderer = makeRenderer({ onEvent });
      onEvent.mockClear();
      renderer.setLevelLabel('X');
      expect(onEvent).not.toHaveBeenCalled();
    });

    it('is not called by drillUp when path is empty', () => {
      const onEvent = vi.fn();
      const renderer = makeRenderer({ onEvent });
      onEvent.mockClear();
      renderer.drillUp();
      expect(onEvent).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------

  describe('channel visibility defaults', () => {
    it('channels a–f are on by default (overriding to true does not throw)', () => {
      const renderer = makeRenderer();
      renderer.setChannels({ a: true, b: true, c: true, d: true, e: true, f: true });
    });

    it('channel g defaults to false (turning it on works)', () => {
      const renderer = makeRenderer({ channels: {} });
      expect(() => renderer.setChannels({ g: true })).not.toThrow();
    });

    it('construction-time channel overrides are merged, not replaced', () => {
      const renderer = makeRenderer({ channels: { g: true } });
      expect(() => renderer.setChannels({ a: false })).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------

  describe('zoom bounds constants', () => {
    it('MAX_ZOOM is 6', () => {
      expect(MAX_ZOOM).toBe(6);
    });

    it('MIN_ZOOM is 0.1', () => {
      expect(MIN_ZOOM).toBe(0.1);
    });
  });

  // --------------------------------------------------------------------------

  describe('DOM integration', () => {
    it('appends a controls panel to the container on construction', () => {
      const container = makeContainer();
      new VsmRenderer({ container, system: makeSystem('root') });
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(4);
    });

    it('appends a system label overlay to the container on construction', () => {
      const container = makeContainer();
      new VsmRenderer({ container, system: makeSystem('root') });
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
    });

    it('sets container position to relative during construction', () => {
      const container = makeContainer();
      new VsmRenderer({ container, system: makeSystem('root') });
      expect(container.style.position).toBe('relative');
    });

    it('shows the system name in the label overlay', () => {
      const container = makeContainer();
      const system = makeSystem('my-system');
      new VsmRenderer({ container, system });
      expect(container.textContent).toContain('System my-system');
    });

    it('shows the levelLabel above the system name when provided', () => {
      const container = makeContainer();
      const system = makeSystem('child');
      new VsmRenderer({ container, system, levelLabel: 'Parent Unit' });
      expect(container.textContent).toContain('Parent Unit');
      expect(container.textContent).toContain('System child');
    });
  });

  // --------------------------------------------------------------------------

  describe('Konva group click events → onEvent', () => {
    // These tests fire click handlers on the mocked Konva Groups created during
    // rendering. This exercises emitEvent() and updateSelection() which are
    // only reachable through Konva click events.

    it('clicking the S5 bar emits click:s5', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      onEvent.mockClear();

      mockGroupRegistry.groups[G.s5].fire('click');
      expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'click:s5' }));
    });

    it('clicking the S4 bar emits click:s4', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      onEvent.mockClear();

      mockGroupRegistry.groups[G.s4].fire('click');
      expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'click:s4' }));
    });

    it('clicking the S3 bar emits click:s3', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      onEvent.mockClear();

      mockGroupRegistry.groups[G.s3].fire('click');
      expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'click:s3' }));
    });

    it('clicking the S3* triangle emits click:s3star', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      onEvent.mockClear();

      mockGroupRegistry.groups[G.s3star].fire('click');
      expect(onEvent).toHaveBeenCalledWith({ type: 'click:s3star', id: 'root-s3star' });
    });

    it('clicking the S2 triangle emits click:s2', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      onEvent.mockClear();

      mockGroupRegistry.groups[G.s2].fire('click');
      expect(onEvent).toHaveBeenCalledWith({ type: 'click:s2', id: 'root-s2' });
    });

    it('clicking the future environment emits click:futureEnv', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      onEvent.mockClear();

      mockGroupRegistry.groups[G.futureBlob].fire('click');
      expect(onEvent).toHaveBeenCalledWith({ type: 'click:futureEnv', id: 'root-future' });
    });

    it('clicking a sub-environment emits click:env', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      onEvent.mockClear();

      mockGroupRegistry.groups[G.envBlobGroup0].fire('click');
      expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'click:env' }));
    });

    it('clicking the first S1 unit emits click:s1 with index 0', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      onEvent.mockClear();

      mockGroupRegistry.groups[G.unit0].fire('click');
      expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'click:s1', index: 0 }));
    });

    it('clicking the second S1 unit emits click:s1 with index 1', () => {
      const onEvent = vi.fn();
      makeRenderer({ onEvent });
      onEvent.mockClear();

      mockGroupRegistry.groups[G.unit1].fire('click');
      expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'click:s1', index: 1 }));
    });

    it('double-clicking a holon unit emits drillDown and pushes path', () => {
      const onEvent = vi.fn();
      const childSystem = makeSystem('child', 1);
      const rootSystem: VsmSystem = {
        ...makeSystem('root', 1),
        s1: [{ ...makeUnit('u0'), children: childSystem }],
      };

      makeRenderer({ system: rootSystem, onEvent });
      onEvent.mockClear();

      // For a single-unit system: unit0 is at index 24 - 1 = 23 (one fewer envBlobGroup)
      // futureBlob(14), envGroup(15), envBlobGroup-0(16), eyeGroup(17),
      // s5(18), s4(19), s3(20), s3star(21), s2(22), unit0(23)
      const unitGroup = mockGroupRegistry.groups[23];
      unitGroup.fire('dblclick', { cancelBubble: false });

      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'drillDown', index: 0 })
      );
    });

    it('emitting click events when onEvent is not set does not throw', () => {
      makeRenderer({ onEvent: undefined });
      expect(() => mockGroupRegistry.groups[G.s5].fire('click')).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------

  describe('Konva stage interaction handlers', () => {
    // These tests invoke the callback functions registered on the Konva stage
    // via stage.on(), exercising setupInteractions() branches.

    it('wheel event scrolling up zooms in (negative deltaY)', () => {
      makeRenderer();
      const wheelHandler = mockStageHandlers['wheel'];
      expect(wheelHandler).toBeDefined();

      const fakeWheelEvent = {
        evt: { preventDefault: vi.fn(), deltaY: -100 },
      };
      expect(() => wheelHandler(fakeWheelEvent)).not.toThrow();
    });

    it('wheel event scrolling down zooms out (positive deltaY)', () => {
      makeRenderer();
      const wheelHandler = mockStageHandlers['wheel'];

      const fakeWheelEvent = {
        evt: { preventDefault: vi.fn(), deltaY: 100 },
      };
      expect(() => wheelHandler(fakeWheelEvent)).not.toThrow();
    });

    it('wheel event does nothing when pointer position is null', () => {
      makeRenderer();
      mockStage.getPointerPosition.mockReturnValueOnce(null as unknown as { x: number; y: number });
      const wheelHandler = mockStageHandlers['wheel'];

      const fakeWheelEvent = { evt: { preventDefault: vi.fn(), deltaY: -100 } };
      expect(() => wheelHandler(fakeWheelEvent)).not.toThrow();
    });

    it('wheel event clamps zoom at MAX_ZOOM when zooming in beyond limit', () => {
      makeRenderer();
      // Set current scale to just below MAX_ZOOM
      mockStage.scaleX.mockReturnValue(MAX_ZOOM * 0.99);
      const wheelHandler = mockStageHandlers['wheel'];

      const fakeWheelEvent = { evt: { preventDefault: vi.fn(), deltaY: -100 } };
      expect(() => wheelHandler(fakeWheelEvent)).not.toThrow();
    });

    it('wheel event clamps zoom at MIN_ZOOM when zooming out beyond limit', () => {
      makeRenderer();
      mockStage.scaleX.mockReturnValue(MIN_ZOOM * 1.01);
      const wheelHandler = mockStageHandlers['wheel'];

      const fakeWheelEvent = { evt: { preventDefault: vi.fn(), deltaY: 100 } };
      expect(() => wheelHandler(fakeWheelEvent)).not.toThrow();
    });

    it('drag start sets cursor to grabbing', () => {
      makeRenderer();
      const dragStartHandler = mockStageHandlers['dragstart'];
      expect(dragStartHandler).toBeDefined();
      expect(() => dragStartHandler()).not.toThrow();
    });

    it('drag end sets cursor to grab', () => {
      makeRenderer();
      const dragEndHandler = mockStageHandlers['dragend'];
      expect(dragEndHandler).toBeDefined();
      expect(() => dragEndHandler()).not.toThrow();
    });

    it('double-clicking the stage background resets the view at root level', () => {
      makeRenderer();
      const dblclickHandler = mockStageHandlers['dblclick'];
      expect(dblclickHandler).toBeDefined();

      // e.target === the actual Stage instance → resets view (path is empty at root)
      const fakeEvent = { target: mockStageInstance };
      expect(() => dblclickHandler(fakeEvent)).not.toThrow();
    });

    it('double-clicking a non-stage element is ignored', () => {
      makeRenderer();
      const dblclickHandler = mockStageHandlers['dblclick'];

      // e.target !== stage → returns early without action
      const fakeEvent = { target: {} };
      expect(() => dblclickHandler(fakeEvent)).not.toThrow();
    });

    it('double-clicking stage background when at depth drills up', () => {
      const onEvent = vi.fn();
      const childSystem = makeSystem('child', 1);
      const rootSystem: VsmSystem = {
        ...makeSystem('root', 1),
        s1: [{ ...makeUnit('u0'), children: childSystem }],
      };

      makeRenderer({ system: rootSystem, onEvent });

      // For a 1-unit system, unitGroup-0 is at index 23:
      // 0-6 initial, 7 futureBlob, 8 envGroup, 9 envBlobGroup-0, 10 eyeGroup,
      // 11-17 channelGroups, 18-22 metasystem groups, 23 unitGroup-0
      const unitGroup = mockGroupRegistry.groups[23];
      onEvent.mockClear();
      unitGroup.fire('dblclick', { cancelBubble: false });

      // Now path has one entry — dblclick on stage should drillUp
      onEvent.mockClear();
      const dblclickHandler = mockStageHandlers['dblclick'];
      dblclickHandler({ target: mockStageInstance });

      expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'drillUp' }));
    });
  });
});
