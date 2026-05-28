# NEXUS IDE

NEXUS IDE is a desktop and browser-based computational workspace for analysis, modeling, notes, code, and reports. It gives you a canvas where tables, charts, notebooks, equations, simulations, terminal sessions, and exports can live together in one project.

The application source is in [`nexus-ide/`](nexus-ide/).

## Download and Install

Installers are published on the GitHub Releases page:

https://github.com/12ali26/nexus_agent_workspace/releases/latest

| Platform | What to download | How to install |
| --- | --- | --- |
| Windows | `.exe` installer | Download and run the installer. Windows may show a SmartScreen warning for unsigned early builds. |
| macOS 11+ | `.dmg` installer | Open the DMG and drag NEXUS IDE into Applications. macOS may require right-clicking and choosing Open for unsigned early builds. |
| Linux | `.deb` or `.AppImage` | Use the `.deb` on Debian/Ubuntu systems, or the AppImage for a portable install. |

### Linux `.deb`

```bash
sudo apt install ./nexus-ide_0.1.8_amd64.deb
```

Then launch NEXUS IDE from your app menu, or run:

```bash
nexus-ide
```

### Linux AppImage

```bash
chmod +x "NEXUS IDE-0.1.8.AppImage"
./"NEXUS IDE-0.1.8.AppImage"
```

If your Linux environment blocks sandboxing, run:

```bash
./"NEXUS IDE-0.1.8.AppImage" --no-sandbox
```

## Requirements

For normal desktop use, install the application for your operating system.

For computation features:

- macOS desktop builds require macOS 11 Big Sur or newer. macOS 10.15 Catalina and earlier are not supported by the current Electron runtime.
- Python 3 is required for Python code execution.
- R is optional and enables R/statistical workflows.
- Node.js 20 is required only if you run NEXUS from source.

The app checks for Python and R on first launch.

## Quick Install from Source on Ubuntu or EC2

This installs system dependencies, clones the repo, builds the web app, installs the `nex` CLI, and starts the server on port `8080`.

```bash
curl -fsSL https://raw.githubusercontent.com/12ali26/nexus_agent_workspace/main/nexus-ide/install.sh | bash
```

Then open:

```text
http://localhost:8080
```

On a remote EC2 instance, use the instance public URL with port `8080` open in the security group.

## Run from Source

Clone the repository and enter the application directory:

```bash
git clone https://github.com/12ali26/nexus_agent_workspace.git
cd nexus_agent_workspace/nexus-ide
npm install
```

### Browser Development

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

### Server Mode

```bash
npm run deploy
```

Open:

```text
http://localhost:8080
```

Server mode enables the Express APIs, SQLite persistence, `/terminal`, `/api/run`, and the `nex` CLI bridge.

### Desktop Development

```bash
npm run electron:dev
```

### Build Desktop Installers

```bash
npm run build:icon
npm run electron:build
```

Platform-specific builds:

```bash
npm run electron:build:linux
npm run electron:build:win
npm run electron:build:mac
```

The generated installers appear in `nexus-ide/release/`.

## Main Capabilities

- Canvas workspace with float, grid, and focus modes.
- Primitive blocks for tables, charts, statistics, regression, equations, prose, notebooks, parameters, assumptions, progress tracking, time series analysis, and Monte Carlo simulation.
- Native bottom terminal powered by xterm.js and server-side pseudo-terminals.
- Code execution for JavaScript, Python, and R through the server execution pipeline.
- SQLite-backed project, canvas, and dataset persistence in server mode.
- PDF export for canvas reports and notebook content.
- `nex` command line bridge for creating blocks from the native terminal.
- Electron desktop packaging for Windows, macOS, and Linux.

## Repository Layout

```text
nexus_agent_workspace/
  README.md              Repo landing page
  .github/workflows/     Release builds for installers
  nexus-ide/             NEXUS IDE application
    src/                 React UI and primitives
    server/              Express APIs, terminal bridge, SQLite
    electron/            Desktop shell and update integration
    cli/                 nex command line tool
    assets/              App icon sources and generated icons
    docs/                Product notes
```

## Release Process

Releases are built by GitHub Actions when a version tag is pushed:

```bash
cd nexus_agent_workspace/nexus-ide
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "Release vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

GitHub Actions builds:

- Windows `.exe`
- macOS `.dmg`
- Linux `.AppImage`
- Linux `.deb`

The completed installers are attached to:

https://github.com/12ali26/nexus_agent_workspace/releases/latest

## More Documentation

For detailed development, setup, troubleshooting, and packaging notes, see:

- [`nexus-ide/README.md`](nexus-ide/README.md)
- [`nexus-ide/SETUP.md`](nexus-ide/SETUP.md)
