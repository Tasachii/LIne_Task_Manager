# build จาก root ของ repo: docker build -f backend/Dockerfile .
# (ต้องใช้ context เป็น root เพราะ image ต้องมีโฟลเดอร์ migrations/ ด้วย)

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json backend/nest-cli.json ./
COPY backend/src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/backend/dist ./dist
# migrate.js หา migrations ที่ ../../../migrations (เทียบจาก dist/database) = /app/migrations
COPY migrations /app/migrations
EXPOSE 3000
# รัน migration ให้เสร็จก่อน แล้วค่อยเปิด server
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/main.js"]
