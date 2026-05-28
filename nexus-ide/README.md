# NEXUS IDE

NEXUS IDE is a computational workspace for analysis, modeling, code, notes, terminal work, and report export. It can run as a browser app backed by an Express server, or as a packaged Electron desktop application.

This directory contains the actual application code. If you cloned the full repository, run commands from here:

```bash
cd nexus_agent_workspace/nexus-ide
```

## What NEXUS Includes

- **Canvas workspace** with Float, Grid, and Focus modes.
- **Primitive picker** for adding analysis blocks to the canvas.
- **Data tools** for tables, charts, statistics, regression, and uploaded datasets.
- **Math and writing tools** for equations, formulas, prose, notebooks, assumptions, and progress blocks.
- **Advanced analysis blocks** for time series analysis and Monte Carlo simulation.
- **Native terminal panel** with multiple persistent sessions and the `nex` CLI.
- **Code execution** for JavaScript, Python, and R.
- **SQLite persistence** for projects, datasets, and canvas state when running through the Express server.
- **PDF export** for canvas reports and notebook content.
- **Desktop packaging** for Windows, macOS, and Linux.

## Download Installers

Latest release:

https://github.com/12ali26/nexus_agent_workspace/releases/latest

| Platform | Download | Notes |
| --- | --- | --- |
| Windows | `.exe` | Run the installer. Unsigned early builds may trigger SmartScreen. |
| macOS | `.dmg` | Drag NEXUS IDE into Applications. Unsigned early builds may need right-click -> Open. |
| Linux | `.deb` or `.AppImage` | `.deb` is best for Ubuntu/Debian; AppImage is portable. |

### Linux `.deb`

```bash
sudo apt install ./nexus-ide_0.1.6_amd64.deb
```

### Linux AppImage

```bash
chmod +x "NEXUS IDE-0.1.6.AppImage"
./"NEXUS IDE-0.1.6.AppImage"
```

If needed:

```bash
./"NEXUS IDE-0.1.6.AppImage" --no-sandbox
```

## Requirements

Desktop users only need the installer for their operating system.

For computation:

- Python 3 is required for Python execution.
- R is optional for R/statistical workflows.
- Node.js 20 is required for source development and server installs.

NEXUS checks for Python and R on first launch.

## Quick Install on Ubuntu or EC2

This script installs system dependencies, installs Node.js 20, clones the repo, builds the web app, installs the `nex` CLI, and starts NEXUS on port `8080`.

```bash
curl -fsSL https://raw.githubusercontent.com/12ali26/nexus_agent_workspace/main/nexus-ide/install.sh | bash
```

Open:

```text
http://localhost:8080
```

On EC2, open port `8080` in the security group and use the instance public URL.

## Run from Source

```bash
git clone https://github.com/12ali26/nexus_agent_workspace.git
cd nexus_agent_workspace/nexus-ide
npm install
```

### Browser Development

```bash
npm run dev
```

Open `http://localhost:5173`.

This mode is useful for frontend work. Some server-backed features fall back or are unavailable unless the Express server is running.

### Server Mode

```bash
npm run deploy
```

Open `http://localhost:8080`.

Server mode enables:

- `/api/run` code execution
- `/terminal` WebSocket terminal sessions
- `/api/nex` CLI-to-canvas bridge
- SQLite project, canvas, and dataset persistence
- Static production frontend serving

### Electron Development

```bash
npm run electron:dev
```

This starts Vite and opens the Electron shell against the development server.

### Build for Production

```bash
npm run build
```

### Build Desktop Installers

```bash
npm run build:icon
npm run electron:build
```

Platform-specific commands:

```bash
npm run electron:build:linux
npm run electron:build:win
npm run electron:build:mac
```

Installers are written to:

```text
release/
```

## Architecture Overview

```text
React/Vite renderer
  -> Workspace canvas and primitive blocks
  -> Notebook, terminal panel, output panel, export UI

Express server
  -> /api/run for Python/R/JavaScript execution
  -> /api/datasets, /api/canvas, /api/project for persistence
  -> /terminal WebSocket for live shell sessions
  -> /api/nex for terminal-to-canvas render instructions

SQLite
  -> ~/.nexus/nexus.db
  -> stores projects, datasets, and canvas state

Electron
  -> starts bundled Express server in production
  -> loads http://localhost:8080
  -> packages app installers through electron-builder
```

## Important Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Vite browser development server on port `5173`. |
| `npm run start` | Start the Express server on port `8080`. |
| `npm run deploy` | Build the renderer and start the Express server. |
| `npm run electron:dev` | Start Electron against the Vite dev server. |
| `npm run build` | Build the production renderer into `dist/`. |
| `npm run build:icon` | Generate Windows, macOS, and Linux icons from `assets/icon.svg`. |
| `npm run electron:build` | Build desktop installers for the current platform. |
| `npm run lint` | Run ESLint. |

## The `nex` CLI

The `nex` command is installed by `install.sh` and by the Express server when permissions allow. It is intended for use inside the native terminal panel.

Examples:

```bash
nex help
nex add table
nex add notebook --title "My Analysis"
nex timeseries --col price --date date
nex montecarlo --type portfolio --return 8 --vol 15 --years 20
nex export pdf
```

The CLI posts render instructions to the local NEXUS server, which broadcasts them to the open workspace.

## Data and Persistence

In server mode and packaged desktop mode, NEXUS stores local data in SQLite:

```text
~/.nexus/nexus.db
```

Stored data includes:

- Project metadata
- Uploaded datasets
- Canvas block state

Plain Vite browser development keeps fallback behavior so frontend work can continue without the Express server.

## Export

Canvas export creates a PDF report from the current canvas blocks. Supported data-oriented blocks render as native PDF content where possible, with readable text and tables.

Notebook export captures notebook content as a PDF document.

## Release Process

Use a version tag to trigger installer builds:

```bash
cd nexus_agent_workspace/nexus-ide
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "Release vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

GitHub Actions builds and attaches installers to the GitHub Release:

- Windows `.exe`
- macOS `.dmg`
- Linux `.AppImage`
- Linux `.deb`

Release page:

https://github.com/12ali26/nexus_agent_workspace/releases/latest

## Troubleshooting

### `nex` command not found

Install it manually:

```bash
cd nexus_agent_workspace/nexus-ide
sudo cp cli/nex.js /usr/local/bin/nex
sudo chmod +x /usr/local/bin/nex
```

### Terminal shows connection error

Make sure you are running the Express server mode:

```bash
npm run deploy
```

Then open `http://localhost:8080`.

### Native module ABI error after building Electron installers

Electron packaging rebuilds native modules for Electron. If you later run the server with Node.js and see a `NODE_MODULE_VERSION` or `ERR_DLOPEN_FAILED` error, rebuild the native modules for your current Node runtime:

```bash
npm run rebuild:native
```

`npm run start` and `npm run deploy` do this automatically.

### Python code does not run

Install Python 3:

```bash
sudo apt install python3 python3-pip
```

On Windows or macOS, install Python from https://python.org and make sure it is available on your PATH.

### R code does not run

Install R:

```bash
sudo apt install r-base
```

On Windows or macOS, install R from https://r-project.org.

### AppImage will not start on Linux

Make it executable:

```bash
chmod +x "NEXUS IDE-0.1.6.AppImage"
```

If sandboxing fails:

```bash
./"NEXUS IDE-0.1.6.AppImage" --no-sandbox
```

### EC2 or headless Linux has no screen

Use the browser/server mode at port `8080`, or install a remote desktop tool if you need to run the Electron GUI on the server.

## Project Structure

```text
nexus-ide/
  src/                 React UI, canvas, primitives, panels, export code
  server/              Express API, SQLite database, terminal WebSocket
  electron/            Electron main process, preload, update bridge
  cli/                 nex command
  assets/              App icon source and generated icons
  scripts/             Build helper scripts
  docs/                Product and design notes
  dist/                Production renderer build output
  release/             Local installer output
```
