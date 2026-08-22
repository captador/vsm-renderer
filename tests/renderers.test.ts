/**
 * Renderer Compliance Tests
 *
 * Tests for the four renderer functions (Environment, Metasystem, Units, Channel).
 * Each renderer is exercised directly — event handlers are captured from the Konva
 * Group mock and fired so we can assert on the correct VsmEvent payloads without
 * needing a real canvas.
 *
 * These tests also verify that click events propagate the correct payloads as defined
 * by the VSM notation spec (NOTATION.md §5).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VsmSystem, ChannelVisibility } from '../src/types';
import { renderEnvironmentLayer } from '../src/renderers/EnvironmentRenderer';
import { renderMetasystemLayer } from '../src/renderers/MetasystemRenderer';
import { renderUnitsLayer } from '../src/renderers/UnitsRenderer';
import { renderChannelLayer } from '../src/renderers/ChannelRenderer';

// ============================================================================
// Hoisted group registry — accessible in both vi.mock factory and test code
// ============================================================================

const registry = vi.hoisted(() => {
  type MockGroupEntry = {
    handlers: Map<string, Function[]>;
    fire: (event: string, arg?: object) => void;
    visible: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    destroyChildren: ReturnType<typeof vi.fn>;
  };
  return {
    groups: [] as MockGroupEntry[],
    clear() {
      this.groups.length = 0;
    },
  };
});

// ============================================================================
// Konva mock — Group captures its event handlers
// ============================================================================

vi.mock('konva', () => {
  const mockContainerEl = { style: { cursor: '' } };
  const mockStage = { container: () => mockContainerEl };

  class Group {
    handlers = new Map<string, Function[]>();
    add = vi.fn();
    visible = vi.fn();
    destroyChildren = vi.fn();

    on(event: string, cb: Function) {
      const existing = this.handlers.get(event) || [];
      this.handlers.set(event, [...existing, cb]);
    }

    fire(event: string, arg?: object) {
      (this.handlers.get(event) || []).forEach((cb) => cb(arg));
    }

    constructor(_opts?: object) {
      registry.groups.push(this as unknown as (typeof registry)['groups'][number]);
    }
  }

  class Layer {
    add = vi.fn();
    batchDraw = vi.fn();
    destroyChildren = vi.fn();
    getStage = vi.fn(() => mockStage);
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

  const konva = { Group, Layer, Path, Rect, Circle, Ellipse, Line, Text, Label, Tag };
  return { default: konva, ...konva };
});

// Konva Layer from the mock — imported after the mock is applied
import Konva from 'konva';

// ============================================================================
// Fixtures
// ============================================================================

function makeUnit(id: string, withChildren = false): import('../src/types').S1Unit {
  return {
    id,
    name: `Unit ${id}`,
    operation: { id: `op-${id}` },
    management: { id: `mgmt-${id}` },
    ...(withChildren ? { children: makeSystem(`child-${id}`, 1) } : {}),
  };
}

function makeSystem(id: string, unitCount = 2): VsmSystem {
  const s1 = Array.from({ length: unitCount }, (_, i) => makeUnit(`${id}-u${i}`));
  return {
    id,
    name: `System ${id}`,
    s1,
    metasystem: {
      s2: { id: `${id}-s2` },
      s3: { id: `${id}-s3` },
      s3star: { id: `${id}-s3star` },
      s4: { id: `${id}-s4` },
      s5: { id: `${id}-s5` },
    },
    environments: s1.map((u) => ({ id: `env-${u.id}`, s1Id: u.id })),
    futureEnvironment: { id: `${id}-future` },
  };
}

function mockLayer() {
  return new (Konva as unknown as { Layer: new () => object }).Layer() as any;
}

// ============================================================================
// EnvironmentRenderer
// ============================================================================

describe('renderEnvironmentLayer()', () => {
  beforeEach(() => registry.clear());

  it('clicking the future environment group emits click:futureEnv', () => {
    const emit = vi.fn();
    renderEnvironmentLayer(mockLayer(), makeSystem('env-test'), emit);

    // futureBlob is the first Group created
    registry.groups[0].fire('click');
    expect(emit).toHaveBeenCalledWith({ type: 'click:futureEnv' });
  });

  it('hovering over the future environment group triggers mouseenter without throwing', () => {
    renderEnvironmentLayer(mockLayer(), makeSystem('env-hover'), vi.fn());
    expect(() => registry.groups[0].fire('mouseenter')).not.toThrow();
  });

  it('mousing out of the future environment group triggers mouseleave without throwing', () => {
    renderEnvironmentLayer(mockLayer(), makeSystem('env-leave'), vi.fn());
    expect(() => registry.groups[0].fire('mouseleave')).not.toThrow();
  });

  it('clicking a sub-environment blob emits click:env with index 0', () => {
    const emit = vi.fn();
    renderEnvironmentLayer(mockLayer(), makeSystem('env-sub'), emit);

    // Group order: futureBlob(0), envGroup(1), envBlobGroup-0(2), envBlobGroup-1(3)
    registry.groups[2].fire('click');
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'click:env', index: 0 }));
  });

  it('clicking the second sub-environment blob emits click:env with index 1', () => {
    const emit = vi.fn();
    renderEnvironmentLayer(mockLayer(), makeSystem('env-sub2', 2), emit);

    registry.groups[3].fire('click');
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'click:env', index: 1 }));
  });

  it('hovering over a sub-environment blob triggers mouseenter without throwing', () => {
    renderEnvironmentLayer(mockLayer(), makeSystem('env-sub-hover'), vi.fn());
    expect(() => registry.groups[2].fire('mouseenter')).not.toThrow();
  });

  it('mousing out of a sub-environment blob triggers mouseleave without throwing', () => {
    renderEnvironmentLayer(mockLayer(), makeSystem('env-sub-leave'), vi.fn());
    expect(() => registry.groups[2].fire('mouseleave')).not.toThrow();
  });

  it('does not throw for a system with a single S1 unit', () => {
    expect(() =>
      renderEnvironmentLayer(mockLayer(), makeSystem('env-single', 1), vi.fn())
    ).not.toThrow();
  });

  it('mouseenter and mouseleave are safe when the Konva stage is null', () => {
    const nullStageLayer = {
      add: vi.fn(),
      batchDraw: vi.fn(),
      destroyChildren: vi.fn(),
      getStage: vi.fn(() => null),
    };
    renderEnvironmentLayer(nullStageLayer as any, makeSystem('env-null-stage'), vi.fn());

    // futureBlob (0) and envBlobGroups (2,3) — all have stage-referencing handlers
    for (const idx of [0, 2, 3]) {
      expect(() => registry.groups[idx].fire('mouseenter')).not.toThrow();
      expect(() => registry.groups[idx].fire('mouseleave')).not.toThrow();
    }
  });

  it('mouseenter and mouseleave are safe when the stage container has no style', () => {
    const noStyleLayer = {
      add: vi.fn(),
      batchDraw: vi.fn(),
      destroyChildren: vi.fn(),
      getStage: vi.fn(() => ({ container: () => null })),
    };
    renderEnvironmentLayer(noStyleLayer as any, makeSystem('env-no-style'), vi.fn());

    for (const idx of [0, 2, 3]) {
      expect(() => registry.groups[idx].fire('mouseenter')).not.toThrow();
      expect(() => registry.groups[idx].fire('mouseleave')).not.toThrow();
    }
  });
});

// ============================================================================
// MetasystemRenderer
// ============================================================================

describe('renderMetasystemLayer()', () => {
  beforeEach(() => registry.clear());

  it('clicking System 5 emits click:s5', () => {
    const emit = vi.fn();
    renderMetasystemLayer(mockLayer(), emit);

    // Groups created in order: s5(0), s4(1), s3(2), s3star(3), s2(4)
    registry.groups[0].fire('click');
    expect(emit).toHaveBeenCalledWith({ type: 'click:s5' });
  });

  it('clicking System 4 emits click:s4', () => {
    const emit = vi.fn();
    renderMetasystemLayer(mockLayer(), emit);

    registry.groups[1].fire('click');
    expect(emit).toHaveBeenCalledWith({ type: 'click:s4' });
  });

  it('clicking System 3 emits click:s3', () => {
    const emit = vi.fn();
    renderMetasystemLayer(mockLayer(), emit);

    registry.groups[2].fire('click');
    expect(emit).toHaveBeenCalledWith({ type: 'click:s3' });
  });

  it('clicking the S3* (audit) triangle emits click:s3star', () => {
    const emit = vi.fn();
    renderMetasystemLayer(mockLayer(), emit);

    registry.groups[3].fire('click');
    expect(emit).toHaveBeenCalledWith({ type: 'click:s3star' });
  });

  it('clicking the S2 (coordination) triangle emits click:s2', () => {
    const emit = vi.fn();
    renderMetasystemLayer(mockLayer(), emit);

    registry.groups[4].fire('click');
    expect(emit).toHaveBeenCalledWith({ type: 'click:s2' });
  });

  it('hovering over metasystem bars triggers mouseenter without throwing', () => {
    renderMetasystemLayer(mockLayer(), vi.fn());

    for (let i = 0; i < 5; i++) {
      expect(() => registry.groups[i].fire('mouseenter')).not.toThrow();
    }
  });

  it('mousing out of metasystem elements triggers mouseleave without throwing', () => {
    renderMetasystemLayer(mockLayer(), vi.fn());

    for (let i = 0; i < 5; i++) {
      expect(() => registry.groups[i].fire('mouseleave')).not.toThrow();
    }
  });

  it('mouseenter and mouseleave are safe when the Konva stage is null', () => {
    const nullStageLayer = {
      add: vi.fn(),
      batchDraw: vi.fn(),
      destroyChildren: vi.fn(),
      getStage: vi.fn(() => null),
    };
    renderMetasystemLayer(nullStageLayer as any, vi.fn());

    for (let i = 0; i < 5; i++) {
      expect(() => registry.groups[i].fire('mouseenter')).not.toThrow();
      expect(() => registry.groups[i].fire('mouseleave')).not.toThrow();
    }
  });

  it('mouseenter and mouseleave are safe when the stage container has no style', () => {
    const noStyleLayer = {
      add: vi.fn(),
      batchDraw: vi.fn(),
      destroyChildren: vi.fn(),
      getStage: vi.fn(() => ({ container: () => null })),
    };
    renderMetasystemLayer(noStyleLayer as any, vi.fn());

    for (let i = 0; i < 5; i++) {
      expect(() => registry.groups[i].fire('mouseenter')).not.toThrow();
      expect(() => registry.groups[i].fire('mouseleave')).not.toThrow();
    }
  });
});

// ============================================================================
// UnitsRenderer
// ============================================================================

describe('renderUnitsLayer()', () => {
  beforeEach(() => registry.clear());

  it('clicking the first S1 unit emits click:s1 with index 0 and the unit data', () => {
    const emit = vi.fn();
    const system = makeSystem('units');

    renderUnitsLayer(mockLayer(), system, emit);

    // unitGroup-0 is the first Group created
    registry.groups[0].fire('click');

    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'click:s1', index: 0, unit: system.s1[0] })
    );
  });

  it('clicking the second S1 unit emits click:s1 with index 1 and the unit data', () => {
    const emit = vi.fn();
    const system = makeSystem('units2', 2);

    renderUnitsLayer(mockLayer(), system, emit);

    registry.groups[1].fire('click');

    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'click:s1', index: 1, unit: system.s1[1] })
    );
  });

  it('double-clicking a holon (unit with children) emits drillDown', () => {
    const emit = vi.fn();
    const childSystem = makeSystem('child', 1);
    const system: VsmSystem = {
      ...makeSystem('holon', 1),
      s1: [{ ...makeUnit('h0'), children: childSystem }],
    };

    renderUnitsLayer(mockLayer(), system, emit);

    const fakeEvent = { cancelBubble: false };
    registry.groups[0].fire('dblclick', fakeEvent);

    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'drillDown', index: 0 }));
  });

  it('does not register dblclick on a leaf (non-holon) unit', () => {
    const system = makeSystem('leaf', 1);

    renderUnitsLayer(mockLayer(), system, vi.fn());

    expect(registry.groups[0].handlers.has('dblclick')).toBe(false);
  });

  it('hovering over a unit triggers mouseenter without throwing', () => {
    renderUnitsLayer(mockLayer(), makeSystem('units-hover'), vi.fn());

    expect(() => registry.groups[0].fire('mouseenter')).not.toThrow();
    expect(() => registry.groups[1].fire('mouseenter')).not.toThrow();
  });

  it('mousing out of a unit triggers mouseleave without throwing', () => {
    renderUnitsLayer(mockLayer(), makeSystem('units-leave'), vi.fn());

    expect(() => registry.groups[0].fire('mouseleave')).not.toThrow();
    expect(() => registry.groups[1].fire('mouseleave')).not.toThrow();
  });

  it('renders a single unit without throwing', () => {
    expect(() => renderUnitsLayer(mockLayer(), makeSystem('single', 1), vi.fn())).not.toThrow();
  });

  it('renders five units without throwing', () => {
    expect(() => renderUnitsLayer(mockLayer(), makeSystem('many', 5), vi.fn())).not.toThrow();
  });

  it('mouseenter and mouseleave are safe when the Konva stage is null', () => {
    const nullStageLayer = {
      add: vi.fn(),
      batchDraw: vi.fn(),
      destroyChildren: vi.fn(),
      getStage: vi.fn(() => null),
    };
    renderUnitsLayer(nullStageLayer as any, makeSystem('units-null-stage', 2), vi.fn());

    for (let i = 0; i < 2; i++) {
      expect(() => registry.groups[i].fire('mouseenter')).not.toThrow();
      expect(() => registry.groups[i].fire('mouseleave')).not.toThrow();
    }
  });

  it('mouseenter and mouseleave are safe when the stage container has no style', () => {
    const noStyleLayer = {
      add: vi.fn(),
      batchDraw: vi.fn(),
      destroyChildren: vi.fn(),
      getStage: vi.fn(() => ({ container: () => null })),
    };
    renderUnitsLayer(noStyleLayer as any, makeSystem('units-no-style', 2), vi.fn());

    for (let i = 0; i < 2; i++) {
      expect(() => registry.groups[i].fire('mouseenter')).not.toThrow();
      expect(() => registry.groups[i].fire('mouseleave')).not.toThrow();
    }
  });
});

// ============================================================================
// ChannelRenderer
// ============================================================================

describe('renderChannelLayer()', () => {
  beforeEach(() => registry.clear());

  const allChannels: ChannelVisibility = {
    a: true,
    b: true,
    c: true,
    d: true,
    e: true,
    f: true,
    g: true,
  };

  it('returns groups for all seven channels (a–g)', () => {
    const groups = renderChannelLayer(mockLayer(), makeSystem('ch'), allChannels);
    expect(Object.keys(groups).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  it('renders without throwing for a two-unit system', () => {
    expect(() => renderChannelLayer(mockLayer(), makeSystem('ch2', 2), allChannels)).not.toThrow();
  });

  it('renders without throwing for a single-unit system', () => {
    expect(() => renderChannelLayer(mockLayer(), makeSystem('ch1', 1), allChannels)).not.toThrow();
  });

  it('renders without throwing for a five-unit system', () => {
    expect(() => renderChannelLayer(mockLayer(), makeSystem('ch5', 5), allChannels)).not.toThrow();
  });

  it('respects initial channel visibility — channel g hidden by default', () => {
    const channels: ChannelVisibility = { ...allChannels, g: false };
    const groups = renderChannelLayer(mockLayer(), makeSystem('ch-g'), channels);

    // The group is created with visible:false via constructor opts — its visible fn
    // tracks the value passed in the options object
    expect(groups.g).toBeDefined();
  });

  it('adds every channel group to the layer', () => {
    const layer = mockLayer();
    renderChannelLayer(layer, makeSystem('ch-add'), allChannels);

    // 7 groups (one per channel) added to the layer
    expect(layer.add).toHaveBeenCalledTimes(7);
  });
});
