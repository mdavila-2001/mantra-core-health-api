# syntax=docker/dockerfile:1
# =========================================================================
# Mantra Core Technologies · REDESA Health Ecosystem
# Imagen única para la API (`dist/src/main.js`) y los 20 procesos worker
# (`dist/src/worker-<dominio>.js`). Todos comparten el mismo código y las mismas
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
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
# Cache mount sobre `.yarn/cache` (donde Yarn Berry descarga los .zip de cada
# paquete): persiste entre builds de BuildKit aunque cambie package.json, así
# un rebuild no vuelve a bajar de la red lo que ya se descargó una vez.
RUN --mount=type=cache,target=/app/.yarn/cache,sharing=locked \
  yarn install --immutable

# ---- build: compila TS -> dist (incluye main.js y los 20 worker-*.js) ----
FROM deps AS build
COPY . .
RUN yarn build

# ---- deps de producción only (para la imagen final, sin devDependencies) ----
FROM node:24-bookworm-slim AS prod-deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
# Yarn Berry no tiene `--production=true` (eso es sintaxis de Yarn clásico):
# se instala todo el grafo con el lockfile y luego `workspaces focus
# --production` poda las devDependencies (eslint, jest, typescript, ts-node,
# @asyncapi/cli, @redocly/cli, ...) del node_modules resultante. Sin este
# segundo paso, la imagen final terminaba cargando ~1750 paquetes de más.
RUN --mount=type=cache,target=/app/.yarn/cache,sharing=locked \
  yarn install --immutable \
  && yarn workspaces focus --production \
  && yarn cache clean

# ---- runtime: imagen final, sin toolchain de compilación ----
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Sin usuario root: la imagen corre tanto la API como cualquiera de los 20
# workers con el mismo principio de mínimo privilegio. Se crea antes de las
# copias para poder usar `--chown`: sin él, node_modules/dist quedan de root
# y MikroORM no puede escribir su cache (node_modules/.cache) como nodeapp.
RUN groupadd --gid 1001 nodeapp \
  && useradd --uid 1001 --gid nodeapp --shell /bin/bash --create-home nodeapp

COPY --chown=nodeapp:nodeapp package.json ./
COPY --chown=nodeapp:nodeapp --from=prod-deps /app/node_modules ./node_modules
COPY --chown=nodeapp:nodeapp --from=build /app/dist ./dist

# `FILE_STORAGE_LOCAL_DIR` (default ./storage/uploads) y la cache de MikroORM
# (node_modules/.cache) se escriben en tiempo de ejecución: sin este mkdir
# previo, nodeapp no puede crear directorios nuevos bajo /app (queda root:root).
RUN mkdir -p storage/uploads node_modules/.cache \
  && chown -R nodeapp:nodeapp storage node_modules/.cache

# Identidad del artefacto. Sin esto no hay forma de saber qué código tiene un
# contenedor sin inspeccionarle el `dist/`, y una imagen que quedó atrás de la
# rama se ve idéntica a una al día. Los defaults dejan la construcción sin
# argumentos funcionando: informan "desconocido", que es honesto.
ARG GIT_COMMIT=desconocido
ARG BUILD_TIME=desconocido
ARG APP_VERSION=desconocido
ENV GIT_COMMIT=${GIT_COMMIT}     BUILD_TIME=${BUILD_TIME}     npm_package_version=${APP_VERSION}

USER nodeapp

# Por defecto arranca la API; docker-compose sobreescribe `command` para cada
# uno de los 20 workers (`node dist/src/worker-<dominio>.js`).
CMD ["node", "dist/src/main.js"]
