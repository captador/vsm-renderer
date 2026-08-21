# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Complete modular VSM renderer implementation
- Component-based renderers (Channel, Environment, Metasystem, TopLayer, Units)
- Main VsmRenderer class with zoom/pan, channel toggling
- Type definitions for VsmSystem, S1Unit, metasystem components
- Layout constants and geometry utilities
- Color palette from NOTATION.md specification
- Demo application with sample data and navigation
- Test suite for geometry, layout, palette
- README.md documentation
- CHANGELOG.md for tracking releases

### Changed

- Refactored from monolithic to modular architecture
- Replaced single renderer.ts with component renderers
- Restructured layout/ into constants.ts and index.ts
- Restructured utils/ with geometry.ts and palette.ts

### Fixed

- TypeScript compilation errors
- Test import paths
- ShapeD precision formatting

---

## [0.1.0] - 2026-08-17

### Added

- Initial project setup with NOTATION.md and config files
- Package.json with pnpm configuration
- Vite, TypeScript, Vitest setup
- GitHub configuration

---

[Unreleased]: https://github.com/arsenykrasikov/vsm_render/compare/0.1.0...HEAD
[0.1.0]: https://github.com/arsenykrasikov/vsm_render/releases/tag/0.1.0
