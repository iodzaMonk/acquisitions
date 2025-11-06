# syntax=docker/dockerfile:1
FROM node:20-slim AS base

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

FROM base AS development
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS production
ENV NODE_ENV=production
EXPOSE 3000
RUN npm prune --omit=dev
CMD ["npm", "start"]
