#!/bin/bash
set -e

echo "🚀 Installing NEXUS IDE..."

# System dependencies
sudo apt update
sudo apt install -y curl git python3 python3-pip r-base xvfb \
  libgtk-3-0 libnss3 libxss1 libasound2t64 \
  libatk-bridge2.0-0t64 libatk1.0-0t64 \
  libdrm2 libgbm1 libxkbcommon0 \
  libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libxshmfence1

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone repo — update this URL if the repo name changes
git clone https://github.com/12ali26/nexus-ide.git
cd nexus-ide

# Install project dependencies
npm install

# Start virtual display for headless Linux servers
export DISPLAY=:99
Xvfb :99 -screen 0 1400x900x24 &

# Start NEXUS and expose on network
npm run dev -- --host

echo "✅ NEXUS IDE running at http://$(curl -s ifconfig.me):5173"
