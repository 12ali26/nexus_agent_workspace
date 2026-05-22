# NEXUS IDE

NEXUS IDE is a universal AI workspace shell built around primitive packs: installable visual and computational building blocks such as tables, charts, equations, 3D objects, audit steps, code editors, and terminal output. The shell stays domain-agnostic; users compose the workspace they need, and agents will drive the same primitives through structured render instructions.

The current app is a React + Vite browser shell that is designed to be wrapped in Electron later. The product direction, architecture, primitive pack model, and current build status are captured in [docs/PRD.md](docs/PRD.md).

## Current Status

- React + Vite web app shell
- Dark/light IDE-style layout with collapsible activity sidebar
- Local primitive pack registry with a remote registry seam
- Draggable, resizable, z-managed primitive blocks
- File loading for CSV and JSON
- Canvas persistence via localStorage
- Primitive implementations for data, math, audit, 3D, and code workflows
- Pack-based toolbar composition from installed primitive packs

## Quick Start

```bash
npm install
npm run dev
```

## Checks

```bash
npm run build
npm run lint
```
