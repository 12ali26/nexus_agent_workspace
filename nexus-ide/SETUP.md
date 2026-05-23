# NEXUS IDE Setup

## Browser Development

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Desktop App (Development)

```bash
npm install
npm run electron:dev
```

## Desktop App (Production Build)

```bash
npm run electron:build
```

The installer appears in the `/release` folder.

Platform-specific local builds are also available:

```bash
npm run electron:build:linux
npm run electron:build:win
npm run electron:build:mac
```

For reliable Windows, macOS, and Linux installers, use the GitHub Actions release workflow. Installer builds are most reliable when produced on their native operating system.

## Sharing With Friends

1. Push the repository to GitHub.
2. Open the `Build Installers` workflow in GitHub Actions.
3. Run the workflow manually, or push a version tag such as `v0.1.0`.
4. Download the generated artifacts from the workflow run or the GitHub Release.

Send friends the installer for their operating system:

- Windows: `.exe`
- macOS: `.dmg` or `.zip`
- Linux: `.AppImage` or `.deb`

These first builds are unsigned:

- Windows may show a SmartScreen warning.
- macOS may require right-clicking the app and choosing Open, or allowing it in Privacy & Security.
- Linux AppImage users may need to run `chmod +x NEXUS*.AppImage` before opening it.

## Runtime Dependencies

For full computation support install on your machine:

- Python 3: https://python.org
- R: https://r-project.org
- Node.js: already required for the app

## EC2 / Linux Server Setup

NEXUS IDE is a desktop Electron app. A normal EC2 instance has no screen, so
you have two practical options:

- Use EC2 only to test that the app starts with a virtual display.
- Use a remote desktop tool such as NICE DCV, VNC, or X11 forwarding if you
  want to interact with the GUI.

For Ubuntu EC2, install the desktop/runtime dependencies:

```bash
sudo apt update
sudo apt install -y \
  python3 python3-pip r-base nodejs npm \
  xvfb \
  libgtk-3-0 libnss3 libxss1 libasound2 \
  libatk-bridge2.0-0 libatk1.0-0 \
  libdrm2 libgbm1 libxkbcommon0 \
  libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libxshmfence1
```

### Option A: Run From Source On EC2

```bash
npm install
export DISPLAY=:99
Xvfb :99 -screen 0 1400x900x24 &
npm run electron:dev
```

### Option B: Install The Linux `.deb`

Upload `release/nexus-ide_0.1.0_amd64.deb` to the EC2 instance, then run:

```bash
sudo apt install ./nexus-ide_0.1.0_amd64.deb
export DISPLAY=:99
Xvfb :99 -screen 0 1400x900x24 &
nexus-ide
```

### Option C: Run The AppImage

Upload `release/NEXUS IDE-0.1.0.AppImage` to the EC2 instance, then run:

```bash
chmod +x "NEXUS IDE-0.1.0.AppImage"
export DISPLAY=:99
Xvfb :99 -screen 0 1400x900x24 &
./"NEXUS IDE-0.1.0.AppImage" --no-sandbox
```

If you need to actually use the app visually on EC2, install and connect with a
remote desktop service first. For AWS, NICE DCV is usually the cleanest option.
