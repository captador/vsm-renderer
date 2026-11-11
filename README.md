# VSM Renderer

A Konva-based TypeScript library for rendering [Viable System Model](https://en.wikipedia.org/wiki/Viable_system_model) (VSM) diagrams. Implements Beer's VSM notation with full recursion, channel toggling, zoom/pan, and click interaction.

Published as [`@captador/vsm-renderer`](https://www.npmjs.com/package/@captador/vsm-renderer) on the public [npm registry](https://www.npmjs.com/package/@captador/vsm-renderer) and on [GitHub Packages](https://github.com/captador/vsm-renderer/pkgs/npm/vsm-renderer).

## Demo

You can try it at [github pages](https://captador.github.io/vsm-renderer/) of this repo. Also sign up to https://viablesystemmodel.design for persisted storage of your models.

## Installation

From the public npm registry (no auth needed):

```bash
npm install @captador/vsm-renderer konva
```

Or from GitHub Packages — point the `@captador` scope at the GitHub registry and authenticate with a token that has `read:packages` (put this in your `~/.npmrc` or project `.npmrc`):

```
@captador:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

```bash
npm install @captador/vsm-renderer@latest konva
```

Konva is a peer dependency and must be installed separately.

## Quick start

```typescript
import { VsmRenderer } from '@captador/vsm-renderer';
import type { VsmSystem, VsmEvent } from '@captador/vsm-renderer';

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

## Documentation

| Document                               | Description                                                    |
| -------------------------------------- | -------------------------------------------------------------- |
| [docs/DEVELOPER.md](docs/DEVELOPER.md) | Full API reference, event system, Konva internals              |
| [docs/NOTATION.md](docs/NOTATION.md)   | Opinionated rendering guide: shapes, colours, layout, channels |

## Features

- Full Beer-style VSM layout: S1–S5, S3\*, all 7 channels (a–g), environment column
- Recursive holons: S1 units can contain nested VSMs; thicker border signals drillability
- Internal drill-down stack: double-clicking a holon drills in; double-clicking the background drills up; `drillDown` / `drillUp` events keep the host in sync
- Channel toggling: each channel independently shown/hidden at O(1) cost
- Click and double-click events on every diagram element (metasystem bars, triangles, S1 units, env blobs, background)
- Level label overlay: shows the current system name and, when drilled in, the parent unit name
- Zoom / pan / fullscreen controls (DOM overlay, unaffected by canvas transforms)
- Responsive sizing: `renderer.resize(width?, height?)` re-sizes the stage and re-centers the diagram (defaults to the container's `clientWidth`/`clientHeight`); pass `autoResize: true` to have the renderer observe the container with its own `ResizeObserver`, and the built-in fullscreen toggle re-fits automatically
- Click selection: dashed-border highlight on the active element
- Hover tooltips on S1 units showing full name

## Development

```bash
pnpm run dev          # Demo dev server
pnpm run build        # Build library + declarations
pnpm run pack:local   # Build + pack tarball for local testing
pnpm run typecheck    # Type check
pnpm run test         # Run tests
```

## License

EUPL-1.2
