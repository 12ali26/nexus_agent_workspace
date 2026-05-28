# NEXUS IDE Setup Guide

This guide is for installing, running, developing, and packaging NEXUS IDE.

The app lives in the `nexus-ide/` subdirectory of the repository. After cloning, always enter that directory before running npm commands:

```bash
git clone https://github.com/12ali26/nexus_agent_workspace.git
cd nexus_agent_workspace/nexus-ide
```

## 1. Install the Desktop App

Download installers from:

https://github.com/12ali26/nexus_agent_workspace/releases/latest

### Windows

Download the `.exe` installer and run it.

Early builds are unsigned, so Windows may show a SmartScreen warning. Choose the option to run the app only if you trust the release source.

### macOS

Download the `.dmg`, open it, and drag NEXUS IDE into Applications.

Early builds are unsigned, so macOS may require right-clicking the app and choosing Open, or allowing it in System Settings.

### Linux `.deb`

```bash
sudo apt install ./nexus-ide_0.1.7_amd64.deb
```

Then launch from the app menu or run:

```bash
nexus-ide
```

### Linux AppImage

```bash
chmod +x "NEXUS IDE-0.1.7.AppImage"
./"NEXUS IDE-0.1.7.AppImage"
```

If your environment blocks sandboxing:

```bash
./"NEXUS IDE-0.1.7.AppImage" --no-sandbox
```

## 2. Runtime Requirements

For installed desktop builds:

- Python 3 is required for Python code execution.
- R is optional and enables R workflows.

For development from source:

- Node.js 20
- npm
- Python 3
- R, optional

## 3. Ubuntu or EC2 Source Install

Use the install script:

```bash
curl -fsSL https://raw.githubusercontent.com/12ali26/nexus_agent_workspace/main/nexus-ide/install.sh | bash
```

The script:

1. Installs Linux system dependencies.
2. Installs Node.js 20.
3. Clones `12ali26/nexus_agent_workspace`.
4. Enters `nexus_agent_workspace/nexus-ide`.
5. Runs `npm install`.
6. Installs the `nex` CLI to `/usr/local/bin/nex`.
7. Builds the renderer.
8. Starts the server on port `8080`.

Open:

```text
http://localhost:8080
```

On EC2, open port `8080` in the security group and use the instance public URL.

## 4. Local Browser Development

```bash
cd nexus_agent_workspace/nexus-ide
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Use this for frontend work. Server-backed features such as the live terminal, SQLite persistence, and code execution require server mode.

## 5. Server Mode

```bash
cd nexus_agent_workspace/nexus-ide
npm run deploy
```

Open:

```text
http://localhost:8080
```

This is the best mode for testing the full browser app because it enables:

- Express APIs
- SQLite persistence
- Terminal WebSocket
- Code execution
- `nex` CLI bridge

## 6. Electron Development

```bash
cd nexus_agent_workspace/nexus-ide
npm install
npm run electron:dev
```

This starts Vite and launches Electron against the development server.

## 7. Production Build

Build only the web renderer:

```bash
cd nexus_agent_workspace/nexus-ide
npm run build
```

Build app icons:

```bash
npm run build:icon
```

Build desktop installers:

```bash
npm run electron:build
```

Platform-specific commands:

```bash
npm run electron:build:linux
npm run electron:build:win
npm run electron:build:mac
```

Output appears in:

```text
nexus-ide/release/
```

For the most reliable Windows, macOS, and Linux installers, use GitHub Actions so each installer is built on its native operating system.

## 8. Release Build

To publish a new release:

```bash
cd nexus_agent_workspace/nexus-ide
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "Release vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

The `Build Installers` GitHub Actions workflow will build:

- Windows `.exe`
- macOS `.dmg`
- Linux `.AppImage`
- Linux `.deb`

The installers are attached to:

https://github.com/12ali26/nexus_agent_workspace/releases/latest

## 9. EC2 and Headless Linux Notes

NEXUS IDE can run as a browser app on EC2 through the Express server on port `8080`.

For the Electron GUI on a headless server, you need a virtual display or remote desktop. Browser/server mode is usually easier.

Install useful Linux dependencies:

```bash
sudo apt update
sudo apt install -y \
  curl git python3 python3-pip r-base xvfb \
  libgtk-3-0 libnss3 libxss1 libasound2t64 \
  libatk-bridge2.0-0t64 libatk1.0-0t64 \
  libdrm2 libgbm1 libxkbcommon0 \
  libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libxshmfence1
```

Run Electron with a virtual display:

```bash
export DISPLAY=:99
Xvfb :99 -screen 0 1400x900x24 &
npm run electron:dev
```

For real visual use on AWS, a remote desktop service such as NICE DCV is usually cleaner.

## 10. Troubleshooting

### `npm install` fails

Use Node.js 20:

```bash
node --version
```

If needed on Ubuntu:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### `nex` is not installed

```bash
cd nexus_agent_workspace/nexus-ide
sudo cp cli/nex.js /usr/local/bin/nex
sudo chmod +x /usr/local/bin/nex
```

### Terminal connection fails

Run the server mode:

```bash
npm run deploy
```

Then open `http://localhost:8080`.

### Native module ABI error

If `better-sqlite3` or `node-pty` reports a `NODE_MODULE_VERSION` mismatch after building Electron installers, rebuild native modules for the Node.js runtime:

```bash
npm run rebuild:native
```

`npm run start` and `npm run deploy` already run this rebuild step before launching the server.

### Linux AppImage fails because libraries are missing

Install the Linux desktop dependencies listed above, then try again.
