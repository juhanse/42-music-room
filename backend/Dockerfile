FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

COPY backend/package*.json ./backend/
COPY packages/shared/package*.json ./packages/shared/

RUN npm install

COPY backend/ ./backend/
COPY packages/shared/ ./packages/shared/

WORKDIR /app/backend

EXPOSE 3000

CMD ["sh", "-c", "npm run db:push && npm run dev"]