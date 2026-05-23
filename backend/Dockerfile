FROM node:20-bookworm-slim AS build

WORKDIR /app/backend

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app/backend

ENV NODE_ENV=development
ENV PORT=3333

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/backend/dist ./dist

RUN mkdir -p uploads

EXPOSE 3333

CMD ["node", "dist/server.js"]
