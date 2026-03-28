FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV APP_ENV=production
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY scripts/start.prod.sh ./scripts/start.prod.sh
RUN chmod +x ./scripts/start.prod.sh

EXPOSE 3000

CMD ["./scripts/start.prod.sh"]
