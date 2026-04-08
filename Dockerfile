# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
# -------- Build stage --------
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /app

RUN bun add serve

COPY --from=builder /app/dist ./dist

USER bun

EXPOSE 3000

CMD ["bunx", "serve", "dist", "-l", "3000"]
