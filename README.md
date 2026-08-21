# VSM Renderer

A Konva-based TypeScript library for rendering [Viable System Model](https://en.wikipedia.org/wiki/Viable_system_model) (VSM) diagrams. Implements Beer's VSM notation with full recursion, channel toggling, zoom/pan, and click interaction.

## Installation

```bash
pnpm add vsm-render konva
```

Konva is a peer dependency and must be installed separately.

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

## Documentation

| Document | Description |
| -------- | ----------- |
| [docs/DEVELOPER.md](docs/DEVELOPER.md) | Full API reference, event system, Konva internals |
| [docs/NOTATION.md](docs/NOTATION.md) | Implementation-independent VSM notation specification |

## Features

- Full Beer VSM notation: S1–S5, S3\*, all 7 channels (a–g), environment column
- Recursive holons: S1 units can contain nested VSMs; thicker border signals drillability
- Channel toggling: each channel independently shown/hidden at O(1) cost
- Zoom / pan / fullscreen controls (DOM overlay, unaffected by canvas transforms)
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
