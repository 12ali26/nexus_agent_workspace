FROM node:24-bookworm-slim

ENV PORT=8080 \
    HOME=/home/nexus

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    g++ \
    git \
    make \
    pkg-config \
    python3 \
    python3-pip \
    r-base \
    r-cran-jsonlite \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build \
  && npm rebuild better-sqlite3 node-pty \
  && npm prune --omit=dev \
  && chmod +x cli/nex.js \
  && ln -sf /app/cli/nex.js /usr/local/bin/nex

RUN useradd --create-home --home-dir /home/nexus --shell /bin/bash nexus \
  && mkdir -p /home/nexus/.nexus \
  && chown -R nexus:nexus /home/nexus /app

USER nexus

ENV NODE_ENV=production

VOLUME ["/home/nexus/.nexus"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 8080) + '/api/health', (res) => process.exit(res.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server/index.js"]
