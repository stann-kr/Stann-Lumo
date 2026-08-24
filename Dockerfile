# syntax=docker/dockerfile:1
# Cloudflare workerd ships a glibc binary that cannot start on Alpine/musl.
FROM node:22-bookworm-slim

WORKDIR /app

# 의존성 파일 복사 후 설치 (캐시 최적화)
COPY package*.json ./
RUN npm ci

# 소스 복사
COPY . .

EXPOSE 3004

CMD ["npm", "run", "dev:docker"]
