# =========================================================================
# Mantra Core Technologies · REDESA Health Ecosystem
# Imagen única para la API (`dist/main.js`) y los 20 procesos worker
# (`dist/worker-<dominio>.js`). Todos comparten el mismo código y las mismas
# dependencias — lo que cambia entre servicios de docker-compose es el
# `command`, no la imagen. Construir 20 imágenes idénticas sería desperdiciar
# tiempo de build y espacio; un solo artefacto + comando distinto por
# contenedor es el patrón estándar para un monorepo con múltiples entrypoints.
#
# `node:24-bookworm-slim` (Debian) en vez de Alpine: `argon2` (IAM) compila un
# binding nativo, y Alpine (musl) exige toolchain propio y a veces no tiene
# binario prebuilt — Debian slim reduce ese riesgo sin pagar el peso de la
# imagen completa de Debian.
# =========================================================================

# ---- deps: todas las dependencias (dev incluidas, hacen falta para el build) ----
FROM node:24-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ---- build: compila TS -> dist (incluye main.js y los 20 worker-*.js) ----
FROM deps AS build
COPY . .
RUN yarn build

# ---- deps de producción only (para la imagen final, sin devDependencies) ----
FROM node:24-bookworm-slim AS prod-deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true \
  && yarn cache clean

# ---- runtime: imagen final, sin toolchain de compilación ----
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Sin usuario root: la imagen corre tanto la API como cualquiera de los 20
# workers con el mismo principio de mínimo privilegio.
RUN groupadd --gid 1001 nodeapp \
  && useradd --uid 1001 --gid nodeapp --shell /bin/bash --create-home nodeapp
USER nodeapp

# Por defecto arranca la API; docker-compose sobreescribe `command` para cada
# uno de los 20 workers (`node dist/worker-<dominio>.js`).
CMD ["node", "dist/main.js"]
