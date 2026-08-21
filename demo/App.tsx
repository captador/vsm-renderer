/**
 * VSM Renderer Demo - App Component
 *
 * Main application component that manages VSM state and renders the diagram
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VsmRenderer } from '../src/index';
import type { VsmSystem, S1Unit, ChannelId, ChannelVisibility, VsmEvent } from '../src/index';

// ============================================================================
// Constants
// ============================================================================

const CHANNELS: ChannelId[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const ALL_CHANNELS_ON = {
  a: true,
  b: true,
  c: true,
  d: true,
  e: true,
  f: true,
  g: false,
};

// ============================================================================
// Sample Data
// ============================================================================

function createS1Unit(id: string, name: string, children?: VsmSystem): S1Unit {
  return {
    id,
    name,
    operation: { id: `${id}-op` },
    management: { id: `${id}-mgmt` },
    children,
  };
}

function createSystem(name: string, s1Units: S1Unit[]): VsmSystem {
  return {
    id: name,
    name: name,
    s1: s1Units,
    metasystem: {
      s2: { id: `${name}-s2`, name: 'Coordination' },
      s3: { id: `${name}-s3`, name: 'Control' },
      s3star: { id: `${name}-s3star`, name: 'Audit' },
      s4: { id: `${name}-s4`, name: 'Intelligence' },
      s5: { id: `${name}-s5`, name: 'Policy/Identity' },
    },
    environments: s1Units.map((u, i) => ({
      id: `${u.id}-env`,
      s1Id: u.id,
      name: `Env ${String.fromCharCode(97 + i)}`,
    })),
    futureEnvironment: { id: `${name}-future`, name: 'Future Environment' },
  };
}

function createNestedVSM(depth: number = 0, unitCount: number = 3): VsmSystem {
  const units: S1Unit[] = [];
  for (let i = 0; i < unitCount; i++) {
    const letter = String.fromCharCode(97 + i);
    const unitName =
      depth === 0 ? `Operations Unit ${letter.toUpperCase()}` : `Sub-Unit ${letter.toUpperCase()}`;
    const nestedVSM = depth < 2 ? createNestedVSM(depth + 1, 2) : undefined;
    units.push(createS1Unit(`${letter}-${depth}`, unitName, nestedVSM));
  }
  return createSystem(`Level-${depth}`, units);
}

const initialSystem: VsmSystem = createNestedVSM(0, 3);

// ============================================================================
// Info Panel Copy
// ============================================================================

const INFO_COPY: Record<string, { title: string; description: string }> = {
  s5: {
    title: 'System 5 — Policy & Identity',
    description:
      'The ultimate authority and identity. Sets policy, holds the ethos, and balances the present (System 3) against the future (System 4).',
  },
  s4: {
    title: 'System 4 — Intelligence',
    description:
      'Looks outside and ahead: scans the environment, models possible futures, and adapts.',
  },
  s3: {
    title: 'System 3 — Control',
    description:
      'Runs the whole System 1 complex here and now. Allocates resources, sets targets, drives synergy.',
  },
  s3star: {
    title: 'System 3* — Audit',
    description:
      'A sporadic, direct probe into operations that BYPASSES the command line to verify ground truth.',
  },
  s2: {
    title: 'System 2 — Coordination',
    description:
      'Damps oscillation and conflict between System 1 units via shared standards and anti-interference rules.',
  },
  s1: {
    title: 'System 1 — Operational Unit',
    description:
      'A primary, value-producing unit. Each System 1 is a complete viable system with operation and management.',
  },
  env: {
    title: 'Local Environment',
    description:
      'The specific environment of one operational unit — customers, suppliers, local constraints.',
  },
  futureEnv: {
    title: 'Future Environment',
    description:
      'The wider, future-facing environment that System 4 scans — markets, technology, regulation.',
  },
  a: {
    title: 'Channel a',
    description: 'Environmental overlaps between units.',
  },
  b: { title: 'Channel b', description: 'System 3* audit lines.' },
  c: {
    title: 'Channel c',
    description: 'Operational dependencies (wavy lines).',
  },
  d: { title: 'Channel d', description: 'Resource bargain (right red line).' },
  e: { title: 'Channel e', description: 'Command (left red line).' },
  f: { title: 'Channel f', description: 'System 2 coordination (amber line).' },
  g: { title: 'Channel g', description: 'Algedonic bypass (dashed magenta).' },
};

// ============================================================================
// App Component
// ============================================================================

const App: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VsmRenderer | null>(null);
  const [navStack, setNavStack] = useState<VsmSystem[]>([initialSystem]);
  const [channels, setChannels] = useState<ChannelVisibility>(ALL_CHANNELS_ON);
  const [selectedElement, setSelectedElement] = useState<{
    type: string;
    id: string;
    name?: string;
    index?: number;
  } | null>(null);

  const currentSystem = navStack[navStack.length - 1];
  const hasParent = navStack.length > 1;
  const metasystem = currentSystem.metasystem;

  const handleVsmEvent = useCallback(
    (event: VsmEvent) => {
      switch (event.type) {
        case 'ready':
          // Ready event - no action needed for demo
          break;
        case 'click:s5':
          setSelectedElement({
            type: 's5',
            id: metasystem.s5.id,
            name: metasystem.s5.name,
          });
          break;
        case 'click:s4':
          setSelectedElement({
            type: 's4',
            id: metasystem.s4.id,
            name: metasystem.s4.name,
          });
          break;
        case 'click:s3':
          setSelectedElement({
            type: 's3',
            id: metasystem.s3.id,
            name: metasystem.s3.name,
          });
          break;
        case 'click:s3star':
          setSelectedElement({
            type: 's3star',
            id: metasystem.s3star.id,
            name: metasystem.s3star.name,
          });
          break;
        case 'click:s2':
          setSelectedElement({
            type: 's2',
            id: metasystem.s2.id,
            name: metasystem.s2.name,
          });
          break;
        case 'select':
          break;
        case 'click:futureEnv':
          setSelectedElement({
            type: 'futureEnv',
            id: currentSystem.futureEnvironment.id,
            name: currentSystem.futureEnvironment.name,
          });
          break;
        case 'click:s1':
          setSelectedElement({
            type: 's1',
            id: event.unit.id,
            name: event.unit.name,
            index: event.index,
          });
          break;
        case 'click:env':
          setSelectedElement({
            type: 'env',
            id: event.env.id,
            name: event.env.name,
            index: event.index,
          });
          break;
        case 'click:channel':
          setChannels((prev) => ({
            ...prev,
            [event.channel]: !prev[event.channel],
          }));
          break;
        case 'drillDown':
          if (event.unit.children) {
            setNavStack([...navStack, event.unit.children]);
          }
          break;
        case 'drillUp':
          if (hasParent) {
            setNavStack(navStack.slice(0, -1));
          }
          break;
      }
    },
    [currentSystem, navStack, hasParent, metasystem]
  );

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new VsmRenderer({
      container: canvasRef.current,
      system: currentSystem,
      channels,
      onEvent: handleVsmEvent,
      width: 900,
      height: 1100,
    });
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [handleVsmEvent]);

  // Update renderer when system or navigation depth changes
  useEffect(() => {
    rendererRef.current?.setSystem(currentSystem);
    // The level label is the name of the S1 unit we drilled into (second-to-last
    // nav stack entry's S1 unit name). At root depth there is no parent unit.
    if (navStack.length > 1) {
      const parentSystem = navStack[navStack.length - 2];
      const parentUnit = parentSystem.s1.find((u) => u.children?.id === currentSystem.id);
      rendererRef.current?.setLevelLabel(parentUnit?.name ?? currentSystem.name);
    } else {
      rendererRef.current?.setLevelLabel(null);
    }
  }, [currentSystem, navStack]);

  // Update renderer when channels change
  useEffect(() => {
    rendererRef.current?.setChannels(channels);
  }, [channels]);

  const handleReset = useCallback(() => {
    setNavStack([initialSystem]);
    setSelectedElement(null);
  }, []);

  const handleUp = useCallback(() => {
    if (hasParent) {
      setNavStack(navStack.slice(0, -1));
      setSelectedElement(null);
    }
  }, [hasParent, navStack]);

  const handleNavigateTo = useCallback(
    (index: number) => {
      setNavStack(navStack.slice(0, index + 1));
      setSelectedElement(null);
    },
    [navStack]
  );

  const handleToggleChannel = useCallback((channel: ChannelId) => {
    setChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  }, []);

  const handleToggleAllChannels = useCallback(() => {
    const allOn = Object.values(channels).every((v) => v);
    const newState = !allOn;
    setChannels({
      a: newState,
      b: newState,
      c: newState,
      d: newState,
      e: newState,
      f: newState,
      g: newState,
    });
  }, [channels]);

  const renderBreadcrumb = () => {
    const items = navStack.map((system, index) => (
      <React.Fragment key={system.metasystem.s5.id || index}>
        {index > 0 && <span className="breadcrumb-sep">▸</span>}
        <div
          className={`breadcrumb-chip ${index === navStack.length - 1 ? 'current' : ''}`}
          onClick={() => handleNavigateTo(index)}
        >
          {system.name || `Level ${index}`}
        </div>
      </React.Fragment>
    ));

    if (hasParent) {
      items.push(
        <React.Fragment key="parent-link">
          <span className="breadcrumb-sep">▸</span>
          <div className="breadcrumb-chip" onClick={handleUp}>
            {currentSystem.s1.length} S1 Units
          </div>
        </React.Fragment>
      );
    }

    return <>{items}</>;
  };

  const renderChannelButtons = () => (
    <>
      {CHANNELS.map((channel) => (
        <button
          key={channel}
          className={`channel-btn ${channels[channel] ? 'on' : ''}`}
          onClick={() => handleToggleChannel(channel)}
        >
          Channel {channel.toUpperCase()}
        </button>
      ))}
    </>
  );

  const renderInfoPanel = () => {
    if (!selectedElement) {
      return <p>Click on any element in the diagram to see its details.</p>;
    }

    const info = INFO_COPY[selectedElement.type] || {
      title: selectedElement.name || selectedElement.type,
      description: `Element: ${selectedElement.type}`,
    };

    return (
      <>
        <h4>{info.title}</h4>
        <p>{info.description}</p>
        <p>
          <small>
            ID: {selectedElement.id}
            {selectedElement.name && (
              <>
                <br />
                Name: {selectedElement.name}
              </>
            )}
          </small>
        </p>
        {selectedElement.type === 's1' &&
          selectedElement.index !== undefined &&
          renderS1DrillDown(selectedElement.index)}
      </>
    );
  };

  const renderS1DrillDown = (index: number) => {
    const unit = currentSystem.s1[index];
    if (!unit?.children) return null;

    return (
      <div className="actions">
        <button
          className="btn primary"
          onClick={() => setNavStack([...navStack, unit.children!])}
          disabled={!unit.children}
        >
          Drill Down
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="header">
        <h1>VSM Renderer Demo</h1>
        <div>Konva Canvas Implementation</div>
      </div>
      <div className="main">
        <div className="canvas-container">
          <div ref={canvasRef} />
        </div>
        <aside className="sidebar">
          <div className="section">
            <h3>Navigation</h3>
            <div className="breadcrumb">{renderBreadcrumb()}</div>
            <div className="actions">
              <button className="btn primary" onClick={handleReset}>
                Reset to Root
              </button>
              <button className="btn" onClick={handleUp} disabled={!hasParent}>
                Up
              </button>
            </div>
          </div>
          <div className="section">
            <h3>Channels</h3>
            <div className="channel-buttons">{renderChannelButtons()}</div>
            <button className="btn" onClick={handleToggleAllChannels}>
              {Object.values(channels).every((v) => v) ? 'Hide All' : 'Show All'}
            </button>
          </div>
          <div className="section">
            <h3>Selected Element</h3>
            <div className="info-panel">{renderInfoPanel()}</div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default App;
