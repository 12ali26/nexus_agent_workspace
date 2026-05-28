# NEXUS IDE Product Notes

NEXUS IDE is a computational workspace for people who need code, data, notes, visuals, and reports in one place. It is designed around a canvas of reusable primitive blocks rather than a single notebook, spreadsheet, or terminal.

## Product Goal

Give analysts, researchers, engineers, students, and quantitative teams a local-first workspace where they can:

- Load and inspect datasets.
- Build visual and statistical analysis blocks.
- Run JavaScript, Python, and R code.
- Keep notes, equations, and assumptions beside the work.
- Use a real terminal without leaving the workspace.
- Export the final canvas or notebook into a shareable PDF.

## Current Product Shape

The workspace has four main surfaces:

1. **Canvas**
   - Freeform Float mode for spatial analysis.
   - Grid mode for organized dashboards.
   - Focus mode for working on one block at a time.

2. **Primitive Blocks**
   - Tables, charts, statistics, regression, equations, prose, notebooks, parameters, assumptions, progress steps, time series, Monte Carlo simulation, code editor, and 3D viewer.
   - Blocks are draggable/resizable in Float mode and persist with project state.

3. **Native Terminal Panel**
   - xterm.js frontend.
   - Server-side pseudo-terminal backend.
   - Multiple persistent sessions.
   - `nex` CLI for creating canvas blocks from terminal commands.

4. **Output and Export**
   - Code execution output is routed into the native Output tab.
   - Canvas export creates a PDF report.
   - Notebook export creates a notebook PDF.

## Architecture

```text
React renderer
  Canvas, primitive blocks, panels, notebooks, terminal UI

Express server
  Runtime APIs, SQLite persistence, code execution, terminal WebSocket

SQLite database
  Local project, dataset, and canvas state

Electron shell
  Desktop packaging, bundled server startup, update bridge
```

## Persistence Model

When running through the Express server or packaged desktop app, NEXUS stores local data in:

```text
~/.nexus/nexus.db
```

The database stores:

- Projects
- Uploaded datasets
- Canvas state

The Vite-only development mode keeps fallback behavior so frontend development remains fast.

## Runtime Model

NEXUS supports:

- JavaScript through Node.js.
- Python through `python3`.
- R through `Rscript`.
- Shell sessions through `/terminal`.

The first-launch screen checks for Python and R.

## Packaging Model

NEXUS is packaged with Electron Builder:

- Windows: NSIS `.exe`
- macOS: `.dmg`
- Linux: `.AppImage` and `.deb`

GitHub Actions builds installers when a version tag is pushed.

## Design Principles

- The canvas is the primary workspace.
- Controls should stay compact and get out of the way.
- Analysis should remain visible and inspectable.
- Local-first behavior is preferred.
- Server-backed features should still have development fallbacks where practical.

## Near-Term Product Priorities

- Keep primitives stable and exportable.
- Improve documentation and installer reliability.
- Make data loading, persistence, and PDF export predictable.
- Keep terminal, code execution, and notebook workflows dependable.
