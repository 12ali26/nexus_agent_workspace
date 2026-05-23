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

## Runtime Dependencies

For full computation support install on your machine:

- Python 3: https://python.org
- R: https://r-project.org
- Node.js: already required for the app

## EC2 / Linux Server Setup

```bash
sudo apt update
sudo apt install -y python3 python3-pip r-base nodejs npm
sudo apt install -y xvfb
export DISPLAY=:99
Xvfb :99 -screen 0 1400x900x24 &
npm run electron:dev
```
