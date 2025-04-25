# STAGE 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# STAGE 2: Runtime
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3978

CMD ["node", "index.js"]
