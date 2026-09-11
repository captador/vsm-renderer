# Contributing to vsm-renderer

Thank you for your interest in contributing to vsm-renderer! We welcome contributions from everyone.

## Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

- Use the [GitHub Issues](https://github.com/arsenykrasikov/vsm-renderer/issues) to report bugs
- Include a clear description of the issue
- Provide steps to reproduce
- Include relevant code snippets or screenshots

### Suggesting Features

- Open an issue to discuss the feature before implementing
- Explain the use case and benefits
- We'll discuss feasibility and design before you start coding

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the tests (`pnpm test`)
5. Run the type check (`pnpm typecheck`)
6. Run the linter (`pnpm lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Development Setup

```bash
# Install dependencies
pnpm install

# Run the demo
pnpm run dev

# Run tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Type check
pnpm run typecheck

# Lint
pnpm run lint

# Format code
pnpm run format
```

### Commit Messages

- Use [Conventional Commits](https://www.conventionalcommits.org/) format
- Examples:
  - `feat: add drill-down navigation`
  - `fix: cursor not changing on hover`
  - `docs: update README with recursive example`
  - `chore: update dependencies`

### Code Style

- Use TypeScript
- Follow the existing code style
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Prefer pure functions where possible

## Project Structure

```
vsm-renderer/
├── src/
│   ├── VsmRenderer.ts           # Main renderer class
│   ├── index.ts                # Public API exports
│   ├── types.ts               # Type definitions
│   ├── layout/
│   │   └── constants.ts        # Layout constants
│   └── renderers/
│       ├── ChannelRenderer.ts  # Channels a-g
│       ├── EnvironmentRenderer.ts # Environment + eye-loops
│       ├── MetasystemRenderer.ts # S2-S5, triangles, connectors
│       ├── TopLayerRenderer.ts  # S5 arms, homeostat
│       └── UnitsRenderer.ts     # S1 units (circles + squares)
│   └── utils/
│       ├── geometry.ts         # Shape generators
│       └── palette.ts          # Color definitions
├── demo/
│   ├── App.tsx                # Demo application
│   ├── main.tsx               # Demo entry point
│   └── index.html             # Demo HTML
├── tests/
│   └── ...                    # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Testing

- Tests are written with Vitest
- Aim for high test coverage
- Test both happy paths and edge cases
- Mock external dependencies when needed

## License

By contributing, you agree that your contributions will be licensed under the [EUPL-1.2 License](LICENSE).
