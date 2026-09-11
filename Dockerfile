FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .

ENV NODE_ENV=production
EXPOSE 3003

CMD ["bun", "run", "src/server.ts"]
