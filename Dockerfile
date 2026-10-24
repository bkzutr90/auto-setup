FROM node:22-bookworm-slim
WORKDIR /app
# toolchain cadangan kalau binary prebuilt better-sqlite3 tidak tersedia
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production DB_PATH=/data/bot.db
CMD ["node", "index.js"]
