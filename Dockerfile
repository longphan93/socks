# Một image chứa cả backend (NestJS, cổng 4000) và frontend (Next.js, cổng 4001).
# Entrypoint chạy migration trước; migrate hỏng là container không start.

# ---------------------------------------------------------------- dependencies
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY vendor/ vendor/

RUN npm ci

# ---------------------------------------------------------------------- build
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/apps/frontend/node_modules apps/frontend/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ------------------------------------------------------- dependencies runtime
# Backend chạy từ dist nên vẫn cần node_modules production; frontend thì không,
# vì output standalone của Next đã gói sẵn thứ nó cần.
FROM node:22-alpine AS prod-deps
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY vendor/ vendor/

RUN npm ci --omit=dev

# -------------------------------------------------------------------- runtime
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4000
ENV FRONTEND_PORT=4001

RUN addgroup -S socks && adduser -S socks -G socks

# Standalone của Next giữ nguyên cấu trúc monorepo và mang theo node_modules
# rút gọn của riêng nó, nên phải đổ xuống TRƯỚC rồi mới chồng node_modules đầy
# đủ của backend lên — ngược lại backend sẽ thiếu package.
COPY --from=build /app/apps/frontend/.next/standalone ./
COPY --from=build /app/apps/frontend/.next/static apps/frontend/.next/static
COPY --from=build /app/apps/frontend/public apps/frontend/public

COPY --from=prod-deps /app/node_modules node_modules
COPY --from=build /app/apps/backend/dist apps/backend/dist

COPY docker/start.mjs docker/start.mjs

USER socks

EXPOSE 4000 4001

# Migration chạy ở lớp riêng: lỗi thì thoát khác 0 và container không khởi động.
ENTRYPOINT ["sh", "-c", "node apps/backend/dist/migrate.js && exec node docker/start.mjs"]
