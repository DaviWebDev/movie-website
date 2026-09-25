FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4321


FROM base AS dev
CMD ["npm", "run", "dev", "--", "--host"]


FROM base AS build
RUN npm run build
FROM node:22-alpine AS prod
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]