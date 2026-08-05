# =========================================================================
# mock-provider-server · emulador standalone de proveedores externos
# Imagen independiente de la del backend principal (`../Dockerfile`): no
# comparte código, dependencias ni contexto de build. No necesita toolchain
# de compilación nativa (no hay `argon2` aquí), así que alpine alcanza.
# =========================================================================

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM deps AS build
COPY . .
RUN yarn build

FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true \
  && yarn cache clean

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN addgroup -g 1001 mockapp \
  && adduser -D -u 1001 -G mockapp mockapp
USER mockapp

EXPOSE 4100
CMD ["node", "dist/main.js"]
