# NEXUS IDE

The universal computational workspace. What VSCode is to code — NEXUS is to knowledge work.

## Download

| Platform | Download |
|----------|----------|
| Windows | [NEXUS-IDE-Setup.exe](https://github.com/12ali26/nexus_agent_workspace/releases/latest) |
| macOS | [NEXUS-IDE.dmg](https://github.com/12ali26/nexus_agent_workspace/releases/latest) |
| Linux | [NEXUS-IDE.AppImage](https://github.com/12ali26/nexus_agent_workspace/releases/latest) |

### Requirements

- Python 3.x for computation
- R, optional for statistical computing

## Quick Install (Ubuntu / EC2)

```bash
curl -fsSL https://raw.githubusercontent.com/12ali26/nexus_agent_workspace/main/install.sh | bash
```

## Manual Setup

### Browser Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Desktop App

```bash
npm install
npm run electron:dev
```

### Production Build

```bash
npm run electron:build
```

Installer appears in `/release` folder.

### Release

To create a release:

```bash
git tag v0.1.1
git push origin v0.1.1
```

GitHub Actions will build installers for Windows, macOS, and Linux, create a GitHub Release, and attach the installers.

## Runtime Dependencies

For full computation support:

- Python 3: https://python.org
- R: https://r-project.org
- Node.js: required

## Stack

Electron · React · Vite · Monaco Editor · Three.js · TanStack Table · Recharts · KaTeX · MCP
