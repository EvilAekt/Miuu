FROM node:22-alpine

WORKDIR /app

# Install dependencies needed for compiling better-sqlite3 if needed
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npx", "tsx", "src/index.ts"]
