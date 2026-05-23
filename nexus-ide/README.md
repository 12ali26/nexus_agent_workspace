# NEXUS IDE

The universal computational workspace. What VSCode is to code — NEXUS is to knowledge work.

## Quick Install (Ubuntu / EC2)

```bash
curl -fsSL https://raw.githubusercontent.com/12ali26/nexus-ide/main/install.sh | bash
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

## Runtime Dependencies

For full computation support:

- Python 3: https://python.org
- R: https://r-project.org
- Node.js: required

## Stack

Electron · React · Vite · Monaco Editor · Three.js · TanStack Table · Recharts · KaTeX · MCP
